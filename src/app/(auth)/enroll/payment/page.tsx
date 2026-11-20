import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { PaymentPending } from "@/components/enrollment/payment-pending";
import { Accent } from "@/components/layout/section";
import { Skeleton } from "@/components/ui/feedback";
import { isPaymentsConfigured } from "@/lib/integrations";
import { yearOfStudyOptions } from "@/lib/validations/common";
import { requireUser } from "@/services/auth/session";
import { getEnrollmentForPayment } from "@/services/enrollment/queries";
import { formatPaise } from "@/shared/money";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

async function Payment({ searchParams }: { searchParams: PageProps<"/enroll/payment">["searchParams"] }) {
  const id = (await searchParams).id;
  const user = await requireUser("/enroll");
  const e = typeof id === "string" ? await getEnrollmentForPayment(user.uid, id) : null;
  if (!e) {
    return (
      <p className="rounded-sm border border-line bg-canvas-2 p-5 text-ink-soft">
        We couldn&apos;t find this application. <Link href="/enroll" className="font-medium text-moss-text underline">Start enrollment</Link>
      </p>
    );
  }
  if (e.status === "active" || e.status === "completed") redirect(`/dashboard/courses/${e.courseId}`);
  const year = yearOfStudyOptions.find((o) => o.value === e.applicant.yearOfStudy)?.label ?? e.applicant.yearOfStudy;
  const rows = [
    ["Internship course", e.courseTitle],
    ["Name", e.applicant.fullName],
    ["Email", e.email],
    ["Phone", e.applicant.phone],
    ["Current course", e.applicant.degree],
    ["Year of study", year],
  ];
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 bg-surface px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">{k}</dt>
            <dd className="text-[15px] font-medium break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <PaymentPending enrollmentId={e.id} previewMode={!isPaymentsConfigured()} fee={e.pricePaise > 0 ? formatPaise(e.pricePaise) : "Fee to be announced"} />
    </div>
  );
}

export default function PaymentPage({ searchParams }: PageProps<"/enroll/payment">) {
  return (
    <>
      <AuthHeading eyebrow="Enrollment" title={<>Almost <Accent className="text-moss">there</Accent>.</>}>
        Review your application. Payment completes your enrollment and unlocks the course.
      </AuthHeading>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Payment searchParams={searchParams} />
      </Suspense>
    </>
  );
}
