import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/shared/collections";

export interface PaymentSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  pricePaise: number;
  status: string;
  applicant: { fullName: string; phone: string; degree: string; yearOfStudy: string };
  email: string;
}

/** Enrollment summary for the payment page; null unless it belongs to `uid`. */
export async function getEnrollmentForPayment(uid: string, enrollmentId: string): Promise<PaymentSummary | null> {
  if (!/^[A-Za-z0-9_-]{1,140}$/.test(enrollmentId)) return null;
  const snap = await adminDb().collection(COLLECTIONS.enrollments).doc(enrollmentId).get();
  const d = snap.data();
  if (!d || d.uid !== uid) return null;
  const course = (await adminDb().collection(COLLECTIONS.courses).doc(String(d.courseId)).get()).data() ?? {};
  const a = (d.applicant ?? {}) as Record<string, string>;
  return {
    id: snap.id,
    courseId: String(d.courseId),
    courseTitle: String(course.title ?? d.courseSnapshot?.title ?? "Course"),
    courseSlug: String(course.slug ?? d.courseSnapshot?.slug ?? ""),
    pricePaise: Number(course.pricePaise ?? d.courseSnapshot?.pricePaise ?? 0),
    status: String(d.status),
    applicant: { fullName: a.fullName ?? "", phone: a.phone ?? "", degree: a.degree ?? "", yearOfStudy: a.yearOfStudy ?? "" },
    email: String(d.email ?? ""),
  };
}
