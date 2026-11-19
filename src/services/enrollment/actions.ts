"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { toE164India } from "@/lib/validations/common";
import { enrollmentDetailsSchema } from "@/lib/validations/enrollment";
import { requireUser } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";
import { enrollmentId } from "@/shared/ids";

export type ApplicationResult =
  | { ok: true; enrollmentId: string; status: "pending_payment" | "active" | "completed"; courseId: string }
  | { ok: false; error: string };

/**
 * Records an internship application for the signed-in student: saves the profile details
 * and creates (or reuses) a pending enrollment. Course access is NOT granted here; it is
 * granted only after verified payment (Razorpay, Phase 7) or by an administrator.
 */
export async function createEnrollmentApplication(input: unknown): Promise<ApplicationResult> {
  if (!isFirebaseConfigured()) return { ok: false, error: "Enrollment is not available yet. Please try again later." };
  const user = await requireUser("/enroll");
  if (!user.email) return { ok: false, error: "Your account has no email address. Please sign in with email." };
  const parsed = enrollmentDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const v = parsed.data;
  const db = adminDb();

  const courseSnap = await db.collection(COLLECTIONS.courses).doc(v.courseId).get();
  const course = courseSnap.data();
  if (!course || course.status !== "published" || !course.enrollmentOpen) return { ok: false, error: "This course is not open for enrollment." };

  const id = await enrollmentId(v.courseId, user.email);
  const ref = db.collection(COLLECTIONS.enrollments).doc(id);
  const phone = toE164India(v.phone);

  const status = await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    const current = existing.data()?.status as string | undefined;
    tx.set(
      db.collection(COLLECTIONS.users).doc(user.uid),
      { fullName: v.fullName, phone, degree: v.degree, yearOfStudy: v.yearOfStudy, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    if (current === "active" || current === "completed") return current;
    const applicant = { fullName: v.fullName, phone, degree: v.degree, yearOfStudy: v.yearOfStudy };
    if (existing.exists) {
      tx.update(ref, { uid: user.uid, applicant, status: "pending_payment", updatedAt: FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, {
        courseId: v.courseId,
        courseSnapshot: { title: course.title, slug: course.slug, pricePaise: course.pricePaise ?? 0 },
        uid: user.uid,
        email: user.email,
        applicant,
        status: "pending_payment",
        currentOrderId: null,
        paymentId: null,
        amountPaidPaise: null,
        progress: { completedLessons: 0, requiredLessons: Number(course.lessonCount ?? 0), percent: 0, lastLessonId: null },
        assessment: { bestResultId: null, passed: false, attemptsUsed: 0 },
        certificateId: null,
        source: "checkout",
        activatedAt: null,
        completedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return "pending_payment" as const;
  });

  return { ok: true, enrollmentId: id, status: status as "pending_payment" | "active" | "completed", courseId: v.courseId };
}
