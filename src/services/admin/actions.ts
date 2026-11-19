"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { companyFormSchema, courseFormSchema } from "@/lib/validations/admin";
import { requireAdmin } from "@/services/auth/session";
import { CATALOG_TAGS, COMPANY_TAG } from "@/services/catalog";
import { COLLECTIONS, LESSON_PRIVATE_CONTENT, SETTINGS_DOCS } from "@/shared/collections";
import { parseQuestionText } from "@/shared/question-import";
import { courseMemberId, DOC_ID_PATTERN } from "@/shared/ids";

export type AdminActionResult = { ok: true; id?: string; message: string } | { ok: false; error: string };

/** Builds an audit log entry; written in the same transaction/batch as the change it records. */
async function auditEntry(actorUid: string, action: string, targetType: string, targetId: string, after: unknown) {
  const h = await headers();
  return {
    actorUid,
    action,
    targetType,
    targetId,
    before: null,
    after,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent")?.slice(0, 200) ?? null,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Create or update a course. Slug uniqueness is enforced with `slugs/{slug}` lock documents in
 * the same transaction. Saving invalidates the cached public catalog immediately.
 */
export async function saveCourse(courseId: string | null, input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = courseFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  if (courseId && !DOC_ID_PATTERN.test(courseId)) return { ok: false, error: "Invalid course." };
  const v = parsed.data;
  if (v.compareAtPrice !== null && v.compareAtPrice <= v.price) return { ok: false, error: "Compare-at price must be higher than the price." };

  const db = adminDb();
  const ref = courseId ? db.collection(COLLECTIONS.courses).doc(courseId) : db.collection(COLLECTIONS.courses).doc();
  const data = {
    title: v.title,
    slug: v.slug,
    code: v.code,
    shortDescription: v.shortDescription,
    description: v.description,
    durationLabel: v.durationLabel,
    durationWeeks: v.durationWeeks,
    level: v.level,
    pricePaise: v.price,
    compareAtPricePaise: v.compareAtPrice,
    objectives: v.objectives,
    prerequisites: v.prerequisites,
    highlights: v.highlights.map((label) => ({ icon: "CheckCircle2", label })),
    tags: v.tags,
    illustration: v.illustration,
    status: v.status,
    enrollmentOpen: v.enrollmentOpen,
    sortOrder: v.sortOrder,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: admin.uid,
  };

  const log = await auditEntry(admin.uid, courseId ? "course.update" : "course.create", "course", ref.id, { title: v.title, slug: v.slug, status: v.status, pricePaise: v.price });
  try {
    await db.runTransaction(async (tx) => {
      const existing = courseId ? await tx.get(ref) : null;
      if (courseId && !existing?.exists) throw new Error("Course not found.");
      const slugRef = db.collection(COLLECTIONS.slugs).doc(v.slug);
      const slugDoc = await tx.get(slugRef);
      if (slugDoc.exists && slugDoc.data()?.courseId !== ref.id) throw new Error(`The slug "${v.slug}" is already used by another course.`);
      const oldSlug = existing?.data()?.slug as string | undefined;
      if (oldSlug && oldSlug !== v.slug) tx.delete(db.collection(COLLECTIONS.slugs).doc(oldSlug));
      tx.set(slugRef, { courseId: ref.id });

      if (existing) {
        const wasPublished = existing.data()?.status === "published";
        tx.update(ref, { ...data, ...(v.status === "published" && !wasPublished ? { publishedAt: FieldValue.serverTimestamp() } : {}) });
      } else {
        tx.set(ref, {
          ...data,
          thumbnailPath: null,
          bannerPath: null,
          moduleCount: 0,
          lessonCount: 0,
          completion: { requireAllLessons: true, minProgressPercent: 100, requireAssessmentPass: true },
          finalAssessmentId: null,
          certificate: { enabled: true, templateId: "classic", titleOverride: null },
          seo: { title: null, description: null, ogImagePath: null },
          publishedAt: v.status === "published" ? FieldValue.serverTimestamp() : null,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: admin.uid,
        });
      }
      tx.set(db.collection(COLLECTIONS.auditLogs).doc(), log);
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the course." };
  }

  updateTag(CATALOG_TAGS.catalog);
  updateTag(CATALOG_TAGS.course(ref.id));
  revalidatePath("/admin/courses");
  return { ok: true, id: ref.id, message: courseId ? "Course updated." : "Course created." };
}

export async function saveCompanySettings(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = companyFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { linkedin, instagram, youtube, x, github, ...rest } = parsed.data;
  const socials = Object.fromEntries(Object.entries({ linkedin, instagram, youtube, x, github }).filter(([, url]) => url));
  const db = adminDb();
  const batch = db.batch();
  batch.set(
    db.collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.company),
    { ...rest, socials, name: "Rehydria Technology", legalName: "Rehydria Technology Pvt Ltd", tagline: "Learn. Innovate. Build the Future.", updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid },
    { merge: true },
  );
  batch.set(db.collection(COLLECTIONS.auditLogs).doc(), await auditEntry(admin.uid, "settings.company.update", "settings", SETTINGS_DOCS.company, { ...rest, socials }));
  await batch.commit();
  updateTag(COMPANY_TAG);
  revalidatePath("/admin/settings");
  return { ok: true, message: "Company details saved." };
}

/**
 * Manually activates a pending enrollment (e.g. offline payment, or testing before the payment
 * gateway is live). Grants course access in one transaction and writes an audit log.
 */
export async function activateEnrollment(enrollmentIdInput: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const id = typeof enrollmentIdInput === "string" ? enrollmentIdInput : "";
  if (!/^[A-Za-z0-9_-]{1,140}$/.test(id)) return { ok: false, error: "Invalid enrollment." };
  const db = adminDb();
  const ref = db.collection(COLLECTIONS.enrollments).doc(id);
  const log = await auditEntry(admin.uid, "enrollment.activate", "enrollment", id, { status: "active", source: "admin_grant" });
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const d = snap.data();
      if (!d) throw new Error("Enrollment not found.");
      if (d.status === "active" || d.status === "completed") throw new Error("This enrollment is already active.");
      if (!d.uid) throw new Error("This application is not linked to an account yet.");
      tx.update(ref, { status: "active", source: "admin_grant", activatedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      tx.set(db.collection(COLLECTIONS.courseMembers).doc(courseMemberId(String(d.courseId), String(d.uid))), { active: true });
      tx.set(db.collection(COLLECTIONS.auditLogs).doc(), log);
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not activate the enrollment." };
  }
  revalidatePath("/admin/enrollments");
  return { ok: true, message: "Enrollment activated. The student now has course access." };
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Adds multiple-choice questions to a course's final-assessment bank. Input is the
 * plain-text format from `parseQuestionText`, re-parsed and validated here.
 */
export async function importQuestions(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ courseId: z.string().regex(ID_RE), source: z.string().max(200_000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a course and paste questions." };
  const { questions, errors } = parseQuestionText(parsed.data.source);
  if (errors.length) return { ok: false, error: errors[0]! };
  if (questions.length > 300) return { ok: false, error: "Import at most 300 questions at a time." };

  const db = adminDb();
  const course = (await db.collection(COLLECTIONS.courses).doc(parsed.data.courseId).get()).data();
  const assessmentId = course?.finalAssessmentId as string | undefined;
  if (!course || !assessmentId) return { ok: false, error: "This course has no final assessment." };

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const q of questions) {
    batch.set(db.collection(COLLECTIONS.questions).doc(), {
      courseId: parsed.data.courseId,
      assessmentIds: [assessmentId],
      text: q.text,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      difficulty: "medium",
      active: true,
      createdBy: admin.uid,
      createdAt: now,
      updatedAt: now,
    });
  }
  batch.set(db.collection(COLLECTIONS.auditLogs).doc(), await auditEntry(admin.uid, "questions.import", "course", parsed.data.courseId, { count: questions.length }));
  await batch.commit();
  revalidatePath("/admin/questions");
  return { ok: true, message: `${questions.length} question${questions.length === 1 ? "" : "s"} added.` };
}

/** Turns a question on or off for future attempts (graded attempts keep their snapshot). */
export async function setQuestionActive(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ questionId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/), active: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid question." };
  const db = adminDb();
  const ref = db.collection(COLLECTIONS.questions).doc(parsed.data.questionId);
  if (!(await ref.get()).exists) return { ok: false, error: "Question not found." };
  const batch = db.batch();
  batch.update(ref, { active: parsed.data.active, updatedAt: FieldValue.serverTimestamp() });
  batch.set(db.collection(COLLECTIONS.auditLogs).doc(), await auditEntry(admin.uid, "question.setActive", "question", ref.id, { active: parsed.data.active }));
  await batch.commit();
  revalidatePath("/admin/questions");
  return { ok: true, message: parsed.data.active ? "Question activated." : "Question deactivated." };
}

const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .pipe(z.url({ protocol: /^https$/, message: "Use a full https:// link." }).nullable());

/** Sets the video / PDF links for a lesson (stored in the server-only content document). */
export async function saveLessonLinks(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ lessonId: z.string().regex(ID_RE), videoUrl: httpsUrl, pdfUrl: httpsUrl }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the links." };
  const db = adminDb();
  const lessonRef = db.collection(COLLECTIONS.lessons).doc(parsed.data.lessonId);
  const lesson = (await lessonRef.get()).data();
  if (!lesson) return { ok: false, error: "Lesson not found." };
  const batch = db.batch();
  batch.set(
    lessonRef.collection(LESSON_PRIVATE_CONTENT.collection).doc(LESSON_PRIVATE_CONTENT.doc),
    { videoUrl: parsed.data.videoUrl, pdfUrl: parsed.data.pdfUrl },
    { merge: true },
  );
  batch.update(lessonRef, { updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid });
  batch.set(db.collection(COLLECTIONS.auditLogs).doc(), await auditEntry(admin.uid, "lesson.links", "lesson", lessonRef.id, { videoUrl: parsed.data.videoUrl, pdfUrl: parsed.data.pdfUrl }));
  await batch.commit();
  revalidatePath("/admin/lessons");
  revalidatePath(`/dashboard/courses/${String(lesson.courseId)}`);
  return { ok: true, message: "Lesson links saved." };
}
