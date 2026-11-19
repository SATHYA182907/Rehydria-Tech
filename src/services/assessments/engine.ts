import "server-only";
import { randomInt } from "node:crypto";
import { FieldValue, Timestamp, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, SETTINGS_DOCS } from "@/shared/collections";
import { DEFAULT_GRADING_SCALE, DEFAULT_PASSING_PERCENT, gradeScore, type GradeBand } from "@/shared/grading";
import { generateCertificateId } from "@/shared/ids";
import type { OptionId, ServedQuestion } from "@/shared/types/domain";

/** Answers arriving this long after expiry are still accepted (network latency). */
export const SUBMIT_GRACE_MS = 30_000;
const OPTION_IDS: readonly OptionId[] = ["a", "b", "c", "d"];

export class AssessmentError extends Error {}

export interface LiveAttempt {
  id: string;
  attemptNumber: number;
  questions: ServedQuestion[];
  answers: Record<string, OptionId>;
  expiresAt: string;
}

export interface AttemptOutcome {
  resultId: string;
  correct: number;
  total: number;
  percent: number;
  grade: string;
  passed: boolean;
  certificateId: string | null;
  submissionType: "manual" | "auto_timeout";
}

const ms = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : 0);

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** The student's enrollment for a course, if it grants access (active or completed). */
async function findEnrollment(db: Firestore, uid: string, courseId: string) {
  const snap = await db.collection(COLLECTIONS.enrollments).where("uid", "==", uid).get();
  return snap.docs.find((d) => d.data().courseId === courseId && ["active", "completed"].includes(d.data().status)) ?? null;
}

async function attemptsFor(db: Firestore, uid: string, assessmentId: string) {
  const snap = await db.collection(COLLECTIONS.assessmentAttempts).where("uid", "==", uid).get();
  return snap.docs.filter((d) => d.data().assessmentId === assessmentId);
}

function toLive(id: string, d: FirebaseFirestore.DocumentData): LiveAttempt {
  return {
    id,
    attemptNumber: Number(d.attemptNumber),
    questions: (d.questions as ServedQuestion[]) ?? [],
    answers: (d.answers as Record<string, OptionId>) ?? {},
    expiresAt: new Date(ms(d.expiresAt)).toISOString(),
  };
}

/**
 * Grades an in-progress attempt and records the result in one transaction. Idempotent:
 * an attempt that is already graded returns its stored result. On a pass, a verifiable
 * certificate is issued once per enrollment.
 */
export async function finalizeAttempt(attemptRef: DocumentReference, submissionType: "manual" | "auto_timeout", lateAnswers: Record<string, OptionId> = {}): Promise<AttemptOutcome> {
  const db = attemptRef.firestore;
  const pre = (await attemptRef.get()).data();
  if (!pre) throw new AssessmentError("Attempt not found.");
  const enrollmentDoc = await findEnrollment(db, String(pre.uid), String(pre.courseId));

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(attemptRef);
    const a = snap.data();
    if (!a) throw new AssessmentError("Attempt not found.");
    const resultRef = db.collection(COLLECTIONS.assessmentResults).doc(attemptRef.id);

    if (a.status !== "in_progress") {
      const r = (await tx.get(resultRef)).data();
      if (!r) throw new AssessmentError("This attempt has already been closed.");
      return {
        resultId: resultRef.id,
        correct: Number(r.correct),
        total: Number(r.total),
        percent: Number(r.percent),
        grade: String(r.grade),
        passed: r.passed === true,
        certificateId: (r.certificateId as string | null) ?? null,
        submissionType: r.submissionType,
      };
    }

    const served = (a.questions as ServedQuestion[]) ?? [];
    const answers: Record<string, OptionId> = { ...(a.answers as Record<string, OptionId>), ...lateAnswers };
    const keyRefs = served.map((q) => db.collection(COLLECTIONS.questions).doc(q.questionId));
    const [keys, assessmentSnap, userSnap, companySnap, enrollSnap] = await Promise.all([
      keyRefs.length ? tx.getAll(...keyRefs) : Promise.resolve([]),
      tx.get(db.collection(COLLECTIONS.assessments).doc(String(a.assessmentId))),
      tx.get(db.collection(COLLECTIONS.users).doc(String(a.uid))),
      tx.get(db.collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.company)),
      enrollmentDoc ? tx.get(enrollmentDoc.ref) : Promise.resolve(null),
    ]);
    const correct = keys.filter((k) => {
      const key = k.data()?.correctOptionId;
      return typeof key === "string" && answers[k.id] === key;
    }).length;
    const total = Math.max(served.length, 1);
    const assessment = assessmentSnap.data() ?? {};
    const graded = gradeScore(correct, total, {
      scale: (assessment.gradingScale as GradeBand[] | undefined) ?? DEFAULT_GRADING_SCALE,
      passingPercent: Number(assessment.passingPercent ?? DEFAULT_PASSING_PERCENT),
    });
    const studentName = String(userSnap.data()?.fullName || userSnap.data()?.displayName || enrollSnap?.data()?.applicant?.fullName || "Student");
    const enrollment = enrollSnap?.data();
    const now = FieldValue.serverTimestamp();
    const timeTakenSeconds = Math.max(0, Math.round((Math.min(Date.now(), ms(a.expiresAt)) - ms(a.startedAt)) / 1000));

    let certificateId: string | null = (enrollment?.certificateId as string | null) ?? null;
    if (graded.passed && !certificateId && enrollSnap) {
      certificateId = generateCertificateId();
      const course = enrollment?.courseSnapshot as { title?: string } | undefined;
      tx.create(db.collection(COLLECTIONS.certificates).doc(certificateId), {
        uid: a.uid,
        courseId: a.courseId,
        enrollmentId: enrollSnap.id,
        resultId: resultRef.id,
        studentName,
        courseTitle: String(course?.title ?? "Rehydria Technology course"),
        grade: graded.grade,
        percent: graded.percent,
        completionDate: now,
        issuedAt: now,
        status: "valid",
        pdfPath: null,
        directorName: String(companySnap.data()?.directorName ?? ""),
        revokedAt: null,
        revokedReason: null,
        revokedBy: null,
        replacedBy: null,
        replaces: null,
      });
    }

    tx.set(resultRef, {
      uid: a.uid,
      courseId: a.courseId,
      assessmentId: a.assessmentId,
      attemptId: attemptRef.id,
      studentName,
      correct: graded.correct,
      total: graded.total,
      percent: graded.percent,
      grade: graded.grade,
      passed: graded.passed,
      timeTakenSeconds,
      submittedAt: now,
      submissionType,
      certificateId: graded.passed ? certificateId : null,
    });
    tx.update(attemptRef, { status: submissionType === "manual" ? "submitted" : "auto_submitted", answers, submittedAt: now, resultId: resultRef.id });

    if (enrollSnap && enrollment) {
      const prev = (enrollment.assessment as { bestResultId?: string | null; passed?: boolean; attemptsUsed?: number; bestPercent?: number } | undefined) ?? {};
      const better = graded.percent >= Number(prev.bestPercent ?? -1);
      tx.update(enrollSnap.ref, {
        assessment: {
          bestResultId: better ? resultRef.id : (prev.bestResultId ?? null),
          bestPercent: better ? graded.percent : Number(prev.bestPercent ?? 0),
          passed: prev.passed === true || graded.passed,
          attemptsUsed: Number(prev.attemptsUsed ?? 0) + 1,
        },
        ...(certificateId ? { certificateId } : {}),
        updatedAt: now,
      });
    }

    return { resultId: resultRef.id, ...graded, certificateId: graded.passed ? certificateId : null, submissionType };
  });
}

/** Auto-submits any of the student's attempts whose time has run out (lazy expiry). */
export async function settleExpiredAttempts(uid: string, assessmentId: string): Promise<void> {
  const db = adminDb();
  const now = Date.now();
  const expired = (await attemptsFor(db, uid, assessmentId)).filter((d) => d.data().status === "in_progress" && ms(d.data().expiresAt) + SUBMIT_GRACE_MS < now);
  for (const d of expired) await finalizeAttempt(d.ref, "auto_timeout");
}

/** The student's unexpired attempt, if any. */
export async function getLiveAttempt(uid: string, assessmentId: string): Promise<LiveAttempt | null> {
  const db = adminDb();
  const live = (await attemptsFor(db, uid, assessmentId)).find((d) => d.data().status === "in_progress" && ms(d.data().expiresAt) > Date.now());
  return live ? toLive(live.id, live.data()) : null;
}

/**
 * Starts (or resumes) an attempt: verifies enrollment, 100% course progress, attempt
 * limits and the question bank, then draws a random set of questions with shuffled
 * options. The answer key never leaves the server.
 */
export async function startAttempt(uid: string, courseId: string): Promise<LiveAttempt> {
  const db = adminDb();
  const enrollment = await findEnrollment(db, uid, courseId);
  if (!enrollment) throw new AssessmentError("You are not enrolled in this course.");
  const e = enrollment.data();
  if (Number(e.progress?.percent ?? 0) < 100) throw new AssessmentError("Complete every level to unlock the assessment.");
  if (e.assessment?.passed === true) throw new AssessmentError("You have already passed this assessment.");

  const course = (await db.collection(COLLECTIONS.courses).doc(courseId).get()).data();
  const assessmentId = course?.finalAssessmentId as string | undefined;
  const assessment = assessmentId ? (await db.collection(COLLECTIONS.assessments).doc(assessmentId).get()).data() : undefined;
  if (!assessmentId || !assessment || assessment.status !== "published") throw new AssessmentError("The assessment is not open yet.");

  await settleExpiredAttempts(uid, assessmentId);
  const existing = await attemptsFor(db, uid, assessmentId);
  const live = existing.find((d) => d.data().status === "in_progress");
  if (live) return toLive(live.id, live.data());

  const maxAttempts = Number(assessment.maxAttempts ?? 2);
  if (existing.length >= maxAttempts) throw new AssessmentError("You have used all your attempts. Contact Rehydria support for a re-attempt.");
  const count = Number(assessment.questionCount ?? 25);

  const bank = (await db.collection(COLLECTIONS.questions).where("courseId", "==", courseId).get()).docs.filter((d) => {
    const q = d.data();
    return q.active === true && Array.isArray(q.assessmentIds) && q.assessmentIds.includes(assessmentId);
  });
  if (bank.length < count) throw new AssessmentError("The question bank for this assessment is still being prepared. Please try again later.");

  const questions: ServedQuestion[] = shuffle(bank)
    .slice(0, count)
    .map((d) => {
      const q = d.data();
      const options = ((q.options as { id: OptionId; text: string }[]) ?? []).filter((o) => OPTION_IDS.includes(o.id));
      return { questionId: d.id, text: String(q.text), options: assessment.shuffleOptions === false ? options : shuffle(options) };
    });

  const attemptNumber = existing.length + 1;
  // Deterministic id: two concurrent starts collide on create() instead of both succeeding.
  const ref = db.collection(COLLECTIONS.assessmentAttempts).doc(`${uid}_${assessmentId}_${attemptNumber}`);
  const startedAt = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(startedAt.toMillis() + Number(assessment.durationMinutes ?? 30) * 60_000);
  try {
    await ref.create({ uid, courseId, assessmentId, attemptNumber, status: "in_progress", questions, answers: {}, startedAt, expiresAt, submittedAt: null, resultId: null });
  } catch {
    const again = (await ref.get()).data();
    if (again?.status === "in_progress") return toLive(ref.id, again);
    throw new AssessmentError("Could not start the assessment. Please try again.");
  }
  return { id: ref.id, attemptNumber, questions, answers: {}, expiresAt: expiresAt.toDate().toISOString() };
}

/** Loads an attempt owned by `uid` (throws otherwise). */
export async function ownedAttempt(uid: string, attemptId: string) {
  const ref = adminDb().collection(COLLECTIONS.assessmentAttempts).doc(attemptId);
  const snap = await ref.get();
  const d = snap.data();
  if (!d || d.uid !== uid) throw new AssessmentError("Attempt not found.");
  return { ref, data: d, expiresMs: ms(d.expiresAt) };
}
