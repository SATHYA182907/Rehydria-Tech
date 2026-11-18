"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { toE164India } from "@/lib/validations/common";
import { profileSchema } from "@/lib/validations/profile";
import { requireUser } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";
import { lessonProgressId } from "@/shared/ids";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Updates the student's own profile. Only whitelisted fields; role/email are never writable. */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const user = await requireUser("/dashboard/profile");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  await adminDb()
    .collection(COLLECTIONS.users)
    .doc(user.uid)
    .set(
      {
        fullName: parsed.data.fullName,
        phone: toE164India(parsed.data.phone),
        college: parsed.data.college,
        yearOfStudy: parsed.data.yearOfStudy,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved." };
}

const completeSchema = z.object({
  courseId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  lessonId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
});

/**
 * Marks a lesson complete and recomputes enrollment progress in one transaction.
 * Idempotent (deterministic progress doc id). When every required lesson is done the
 * enrollment moves to "completed", which unlocks the final assessment.
 */
export async function completeLesson(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid lesson." };
  const { courseId, lessonId } = parsed.data;
  const db = adminDb();

  const enrollSnap = await db.collection(COLLECTIONS.enrollments).where("uid", "==", user.uid).get();
  const enrollDoc = enrollSnap.docs.find((d) => d.data().courseId === courseId && ["active", "completed"].includes(d.data().status));
  if (!enrollDoc) return { ok: false, error: "You are not enrolled in this course." };

  const lessonSnap = await db.collection(COLLECTIONS.lessons).doc(lessonId).get();
  const lesson = lessonSnap.data();
  if (!lesson || lesson.courseId !== courseId || lesson.status !== "published") return { ok: false, error: "Lesson not found." };

  const required = (await db.collection(COLLECTIONS.lessons).where("courseId", "==", courseId).get()).docs
    .filter((d) => d.data().status === "published" && d.data().required !== false)
    .map((d) => d.id);

  await db.runTransaction(async (tx) => {
    const progressRef = db.collection(COLLECTIONS.lessonProgress).doc(lessonProgressId(user.uid, lessonId));
    const existing = await tx.get(progressRef);
    const doneSnap = await tx.get(db.collection(COLLECTIONS.lessonProgress).where("uid", "==", user.uid));
    const done = new Set(doneSnap.docs.filter((d) => d.data().courseId === courseId && d.data().status === "completed").map((d) => String(d.data().lessonId)));
    done.add(lessonId);
    const completedRequired = required.filter((id) => done.has(id)).length;
    const percent = required.length ? Math.round((completedRequired / required.length) * 100) : 100;

    if (!existing.exists || existing.data()?.status !== "completed") {
      tx.set(progressRef, {
        uid: user.uid,
        courseId,
        moduleId: lesson.moduleId,
        lessonId,
        status: "completed",
        watchedSeconds: existing.data()?.watchedSeconds ?? 0,
        lastPositionSeconds: existing.data()?.lastPositionSeconds ?? 0,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const enrollment = enrollDoc.data();
    tx.update(enrollDoc.ref, {
      progress: { completedLessons: completedRequired, requiredLessons: required.length, percent, lastLessonId: lessonId },
      ...(percent >= 100 && enrollment.status === "active" ? { status: "completed", completedAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection(COLLECTIONS.users).doc(user.uid), { lastActiveCourseId: courseId, lastActiveLessonId: lessonId }, { merge: true });
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
