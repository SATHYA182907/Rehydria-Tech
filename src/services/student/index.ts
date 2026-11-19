import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, LESSON_PRIVATE_CONTENT } from "@/shared/collections";
import type { CourseIllustration, EnrollmentStatus, LessonResource, LessonType } from "@/shared/types/domain";

/**
 * Student Data Access Layer. Every function takes the VERIFIED uid from requireUser() and
 * only ever reads that student's documents. Queries use single-field equality and are
 * sorted in memory (per-student result sets are small), so they need no composite indexes.
 */

export function toIso(value: unknown): string | null {
  if (value && typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate().toISOString();
  return null;
}

const ACCESS: EnrollmentStatus[] = ["active", "completed"];

type Row = { id: string } & Record<string, unknown>;
function rows(snap: FirebaseFirestore.QuerySnapshot): Row[] {
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
}

export interface StudentEnrollment {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  status: EnrollmentStatus;
  progress: { completedLessons: number; requiredLessons: number; percent: number; lastLessonId: string | null };
  assessmentPassed: boolean;
  certificateId: string | null;
  activatedAt: string | null;
  illustration: CourseIllustration;
  code: string;
}

export async function getStudentEnrollments(uid: string): Promise<StudentEnrollment[]> {
  const db = adminDb();
  const snap = await db.collection(COLLECTIONS.enrollments).where("uid", "==", uid).get();
  const withAccess = rows(snap).filter((r) => ACCESS.includes(r.status as EnrollmentStatus));
  const courseIds = [...new Set(withAccess.map((r) => String(r.courseId)))];
  const courses = courseIds.length ? await db.getAll(...courseIds.map((id) => db.collection(COLLECTIONS.courses).doc(id))) : [];
  const courseMap = new Map(courses.map((c) => [c.id, c.data() ?? {}]));

  return withAccess
    .map((r) => {
      const snapshot = (r.courseSnapshot ?? {}) as { title?: string; slug?: string };
      const course = courseMap.get(String(r.courseId)) ?? {};
      const progress = (r.progress ?? {}) as Partial<StudentEnrollment["progress"]>;
      return {
        id: r.id,
        courseId: String(r.courseId),
        title: String(course.title ?? snapshot.title ?? "Course"),
        slug: String(course.slug ?? snapshot.slug ?? ""),
        status: r.status as EnrollmentStatus,
        progress: {
          completedLessons: progress.completedLessons ?? 0,
          requiredLessons: progress.requiredLessons ?? Number(course.lessonCount ?? 0),
          percent: progress.percent ?? 0,
          lastLessonId: progress.lastLessonId ?? null,
        },
        assessmentPassed: Boolean((r.assessment as { passed?: boolean } | undefined)?.passed),
        certificateId: (r.certificateId as string | null) ?? null,
        activatedAt: toIso(r.activatedAt),
        illustration: (course.illustration as CourseIllustration) ?? "chip",
        code: String(course.code ?? ""),
      };
    })
    .sort((a, b) => (b.activatedAt ?? "").localeCompare(a.activatedAt ?? ""));
}

/* ── Course player ───────────────────────────────────────────────────────── */

export interface PlayerLesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
  required: boolean;
  completed: boolean;
}

export interface PlayerModule {
  id: string;
  title: string;
  summary: string;
  lessons: PlayerLesson[];
}

export interface CoursePlayer {
  enrollment: StudentEnrollment;
  modules: PlayerModule[];
}

/** Returns null when the student has no active enrollment for this course (access denied). */
export async function getCoursePlayer(uid: string, courseId: string): Promise<CoursePlayer | null> {
  const enrollment = (await getStudentEnrollments(uid)).find((e) => e.courseId === courseId);
  if (!enrollment) return null;
  const db = adminDb();
  const [modulesSnap, lessonsSnap, progressSnap] = await Promise.all([
    db.collection(COLLECTIONS.courseModules).where("courseId", "==", courseId).get(),
    db.collection(COLLECTIONS.lessons).where("courseId", "==", courseId).get(),
    db.collection(COLLECTIONS.lessonProgress).where("uid", "==", uid).get(),
  ]);
  const completed = new Set(progressSnap.docs.filter((d) => d.data().courseId === courseId && d.data().status === "completed").map((d) => String(d.data().lessonId)));
  const lessons = rows(lessonsSnap)
    .filter((l) => l.status === "published")
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map<PlayerLesson>((l) => ({
      id: l.id,
      moduleId: String(l.moduleId),
      title: String(l.title ?? ""),
      type: (l.type as LessonType) ?? "video",
      durationMinutes: (l.durationMinutes as number | null) ?? null,
      required: l.required !== false,
      completed: completed.has(l.id),
    }));
  const modules = rows(modulesSnap)
    .filter((m) => m.status === "published")
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((m) => ({ id: m.id, title: String(m.title ?? ""), summary: String(m.summary ?? ""), lessons: lessons.filter((l) => l.moduleId === m.id) }));
  return { enrollment, modules };
}

export interface LessonView {
  id: string;
  title: string;
  type: LessonType;
  hasVideo: boolean;
  bodyMarkdown: string | null;
  resources: Pick<LessonResource, "id" | "title" | "kind" | "url">[];
  assignment: { instructions: string } | null;
}

/** Lesson content (server-only sub-document). Caller must have verified enrollment first. */
export async function getLessonView(courseId: string, lessonId: string): Promise<LessonView | null> {
  const ref = adminDb().collection(COLLECTIONS.lessons).doc(lessonId);
  const [lesson, content] = await Promise.all([ref.get(), ref.collection(LESSON_PRIVATE_CONTENT.collection).doc(LESSON_PRIVATE_CONTENT.doc).get()]);
  const l = lesson.data();
  if (!lesson.exists || !l || l.courseId !== courseId || l.status !== "published") return null;
  const c = content.data() ?? {};
  const resources = ((c.resources as LessonResource[] | undefined) ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    // External links are shown directly; stored files are served through signed URLs (Phase 8).
    url: r.kind === "link" ? r.url : undefined,
  }));
  return {
    id: lesson.id,
    title: String(l.title ?? ""),
    type: (l.type as LessonType) ?? "video",
    hasVideo: Boolean((c.video as { videoId?: string } | null)?.videoId),
    bodyMarkdown: (c.bodyMarkdown as string | null) ?? null,
    resources,
    assignment: c.assignment ? { instructions: String((c.assignment as { instructions?: string }).instructions ?? "") } : null,
  };
}

/* ── Assessments, results, certificates, purchases ───────────────────────── */

export interface StudentAssessment {
  courseId: string;
  courseTitle: string;
  assessmentId: string | null;
  title: string;
  published: boolean;
  questionCount: number;
  durationMinutes: number;
  unlockPercent: number;
  progressPercent: number;
  unlocked: boolean;
  passed: boolean;
  attemptsUsed: number;
  maxAttempts: number;
}

export async function getStudentAssessments(uid: string): Promise<StudentAssessment[]> {
  const db = adminDb();
  const enrollments = await getStudentEnrollments(uid);
  const out: StudentAssessment[] = [];
  for (const e of enrollments) {
    const course = (await db.collection(COLLECTIONS.courses).doc(e.courseId).get()).data() ?? {};
    const assessmentId = (course.finalAssessmentId as string | null) ?? null;
    const a = assessmentId ? (await db.collection(COLLECTIONS.assessments).doc(assessmentId).get()).data() : undefined;
    const unlockPercent = Number((a?.unlockRule as { minCourseProgressPercent?: number } | undefined)?.minCourseProgressPercent ?? 100);
    const attempts = assessmentId
      ? (await db.collection(COLLECTIONS.assessmentAttempts).where("uid", "==", uid).get()).docs.filter((d) => d.data().assessmentId === assessmentId).length
      : 0;
    out.push({
      courseId: e.courseId,
      courseTitle: e.title,
      assessmentId,
      title: String(a?.title ?? `${e.title}: Final assessment`),
      published: a?.status === "published",
      questionCount: Number(a?.questionCount ?? 25),
      durationMinutes: Number(a?.durationMinutes ?? 30),
      unlockPercent,
      progressPercent: e.progress.percent,
      unlocked: a?.status === "published" && e.progress.percent >= unlockPercent,
      passed: e.assessmentPassed,
      attemptsUsed: attempts,
      maxAttempts: Number(a?.maxAttempts ?? 2),
    });
  }
  return out;
}

export interface StudentResult {
  id: string;
  courseId: string;
  courseTitle: string;
  correct: number;
  total: number;
  percent: number;
  grade: string;
  passed: boolean;
  submittedAt: string | null;
  timeTakenSeconds: number;
}

export async function getStudentResults(uid: string): Promise<StudentResult[]> {
  const db = adminDb();
  const [snap, enrollments] = await Promise.all([db.collection(COLLECTIONS.assessmentResults).where("uid", "==", uid).get(), getStudentEnrollments(uid)]);
  const titles = new Map(enrollments.map((e) => [e.courseId, e.title]));
  return snap.docs
    .map((d) => {
      const r = d.data();
      return {
        id: d.id,
        courseId: String(r.courseId),
        courseTitle: titles.get(String(r.courseId)) ?? "Course",
        correct: Number(r.correct ?? 0),
        total: Number(r.total ?? 0),
        percent: Number(r.percent ?? 0),
        grade: String(r.grade ?? "-"),
        passed: Boolean(r.passed),
        submittedAt: toIso(r.submittedAt),
        timeTakenSeconds: Number(r.timeTakenSeconds ?? 0),
      };
    })
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export interface StudentCertificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  directorName: string;
  grade: string;
  status: "pending" | "valid" | "revoked" | "failed";
  issuedAt: string | null;
}

export async function getStudentCertificates(uid: string): Promise<StudentCertificate[]> {
  const snap = await adminDb().collection(COLLECTIONS.certificates).where("uid", "==", uid).get();
  return snap.docs
    .map((d) => {
      const c = d.data();
      return {
        id: d.id,
        courseId: String(c.courseId ?? ""),
        courseTitle: String(c.courseTitle ?? ""),
        studentName: String(c.studentName ?? ""),
        directorName: String(c.directorName ?? ""),
        grade: String(c.grade ?? ""),
        status: c.status,
        issuedAt: toIso(c.issuedAt),
      } as StudentCertificate;
    })
    .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));
}

export interface StudentPurchase {
  id: string;
  productId: string;
  title: string;
  status: string;
  activatedAt: string | null;
  downloadCount: number;
}

export async function getStudentPurchases(uid: string): Promise<StudentPurchase[]> {
  const snap = await adminDb().collection(COLLECTIONS.purchases).where("uid", "==", uid).get();
  return snap.docs
    .map((d) => {
      const p = d.data();
      return {
        id: d.id,
        productId: String(p.productId),
        title: String((p.productSnapshot as { title?: string } | undefined)?.title ?? "Guide"),
        status: String(p.status),
        activatedAt: toIso(p.activatedAt),
        downloadCount: Number(p.downloadCount ?? 0),
      };
    })
    .filter((p) => p.status === "active");
}

/* ── Applications awaiting payment ───────────────────────────────────────── */

export interface StudentApplication {
  id: string;
  courseId: string;
  title: string;
  createdAt: string | null;
}

export async function getStudentApplications(uid: string): Promise<StudentApplication[]> {
  const snap = await adminDb().collection(COLLECTIONS.enrollments).where("uid", "==", uid).get();
  return rows(snap)
    .filter((r) => r.status === "pending_payment")
    .map((r) => ({
      id: r.id,
      courseId: String(r.courseId),
      title: String((r.courseSnapshot as { title?: string } | undefined)?.title ?? "Course"),
      createdAt: toIso(r.createdAt),
    }));
}

/* ── Course learning view (levels, lesson links, assessment state) ───────── */

export interface LessonLinks {
  videoUrl: string | null;
  pdfUrl: string | null;
}

const SAFE_URL = /^https:\/\/[^\s]+$/;

/**
 * Video / PDF links for a course's lessons. Caller must have verified an active enrollment.
 * Only https URLs are returned. (Interim: Bunny Stream signed playback + private PDF
 * downloads replace raw links once video hosting and Storage are configured.)
 */
export async function getLessonLinks(courseId: string, lessonIds: string[]): Promise<Record<string, LessonLinks>> {
  if (lessonIds.length === 0) return {};
  const db = adminDb();
  const snaps = await db.getAll(...lessonIds.map((id) => db.collection(COLLECTIONS.lessons).doc(id).collection(LESSON_PRIVATE_CONTENT.collection).doc(LESSON_PRIVATE_CONTENT.doc)));
  const out: Record<string, LessonLinks> = {};
  snaps.forEach((s, i) => {
    const d = s.data() ?? {};
    const pick = (v: unknown) => (typeof v === "string" && SAFE_URL.test(v) ? v : null);
    out[lessonIds[i]!] = { videoUrl: pick(d.videoUrl), pdfUrl: pick(d.pdfUrl) };
  });
  return out;
}

export interface CourseAssessmentState {
  assessmentId: string | null;
  title: string;
  published: boolean;
  questionCount: number;
  durationMinutes: number;
  passingPercent: number;
  maxAttempts: number;
  attemptsUsed: number;
  inProgressAttemptId: string | null;
  passed: boolean;
  bestResult: { grade: string; percent: number; correct: number; total: number } | null;
  certificateId: string | null;
}

export async function getCourseAssessmentState(uid: string, courseId: string): Promise<CourseAssessmentState> {
  const db = adminDb();
  const course = (await db.collection(COLLECTIONS.courses).doc(courseId).get()).data() ?? {};
  const assessmentId = (course.finalAssessmentId as string | null) ?? null;
  const a = assessmentId ? (await db.collection(COLLECTIONS.assessments).doc(assessmentId).get()).data() : undefined;
  const [attemptsSnap, resultsSnap, enrollSnap] = await Promise.all([
    db.collection(COLLECTIONS.assessmentAttempts).where("uid", "==", uid).get(),
    db.collection(COLLECTIONS.assessmentResults).where("uid", "==", uid).get(),
    db.collection(COLLECTIONS.enrollments).where("uid", "==", uid).get(),
  ]);
  const attempts = rows(attemptsSnap).filter((r) => r.assessmentId === assessmentId);
  const nowMs = Date.now();
  const live = attempts.find((r) => r.status === "in_progress" && Date.parse(toIso(r.expiresAt) ?? "") > nowMs);
  const results = rows(resultsSnap)
    .filter((r) => r.courseId === courseId)
    .sort((x, y) => Number(y.percent ?? 0) - Number(x.percent ?? 0));
  const best = results[0];
  const enrollment = rows(enrollSnap).find((r) => r.courseId === courseId);
  return {
    assessmentId,
    title: String(a?.title ?? "Final assessment"),
    published: a?.status === "published",
    questionCount: Number(a?.questionCount ?? 25),
    durationMinutes: Number(a?.durationMinutes ?? 30),
    passingPercent: Number(a?.passingPercent ?? 40),
    maxAttempts: Number(a?.maxAttempts ?? 2),
    attemptsUsed: attempts.filter((r) => r.status !== "in_progress").length,
    inProgressAttemptId: live?.id ?? null,
    passed: results.some((r) => r.passed === true),
    bestResult: best ? { grade: String(best.grade), percent: Number(best.percent), correct: Number(best.correct), total: Number(best.total) } : null,
    certificateId: (enrollment?.certificateId as string | null) ?? null,
  };
}
