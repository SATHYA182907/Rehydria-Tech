"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { toE164India } from "@/lib/validations/common";
import { enrollmentDetailsSchema } from "@/lib/validations/enrollment";
import { requireUser } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";
import { isPaymentsConfigured } from "@/lib/integrations";
import { courseMemberId, enrollmentId } from "@/shared/ids";
import { revalidatePath } from "next/cache";

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

const ENROLLMENT_ID = /^[A-Za-z0-9_-]{1,140}$/;

/**
 * Preview mode: while no payment gateway is configured, a student can start their own
 * pending course without paying. The enrollment is marked `source: "payment_bypass"` so it can
 * be found later. As soon as Razorpay credentials exist this action refuses to run.
 */
export async function continueWithoutPayment(input: unknown): Promise<ApplicationResult> {
  if (isPaymentsConfigured()) return { ok: false, error: "Please complete payment to start the course." };
  const user = await requireUser("/enroll");
  const id = typeof input === "string" ? input : "";
  if (!ENROLLMENT_ID.test(id)) return { ok: false, error: "Invalid application." };
  const db = adminDb();
  const ref = db.collection(COLLECTIONS.enrollments).doc(id);
  try {
    const result = await db.runTransaction(async (tx) => {
      const d = (await tx.get(ref)).data();
      if (!d || d.uid !== user.uid) throw new Error("Application not found.");
      const courseId = String(d.courseId);
      if (d.status === "active" || d.status === "completed") return { courseId, status: d.status as "active" | "completed" };
      if (d.status !== "pending_payment") throw new Error("This application cannot be activated.");
      const now = FieldValue.serverTimestamp();
      tx.update(ref, { status: "active", source: "payment_bypass", activatedAt: now, updatedAt: now });
      tx.set(db.collection(COLLECTIONS.courseMembers).doc(courseMemberId(courseId, user.uid)), { active: true });
      tx.set(db.collection(COLLECTIONS.auditLogs).doc(), {
        actorUid: user.uid,
        action: "enrollment.payment_bypass",
        targetType: "enrollment",
        targetId: id,
        before: { status: "pending_payment" },
        after: { status: "active", source: "payment_bypass" },
        ip: null,
        userAgent: null,
        createdAt: now,
      });
      return { courseId, status: "active" as const };
    });
    revalidatePath("/dashboard", "layout");
    return { ok: true, enrollmentId: id, status: result.status, courseId: result.courseId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start the course." };
  }
}
