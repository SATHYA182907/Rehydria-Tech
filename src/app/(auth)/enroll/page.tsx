import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { EnrollForm } from "@/components/enrollment/enroll-form";
import { Accent } from "@/components/layout/section";
import { Skeleton } from "@/components/ui/feedback";
import { getPublishedCourses } from "@/services/catalog";

export const metadata: Metadata = { title: "Enroll", robots: { index: false } };

export default async function EnrollPage() {
  const courses = (await getPublishedCourses()).filter((c) => c.enrollmentOpen);
  return (
    <>
      <AuthHeading eyebrow="Create account" title={<>Start your <Accent className="text-moss">internship</Accent>.</>}>
        Two quick steps: your account, then your details.
      </AuthHeading>
      {courses.length === 0 ? (
        <p className="rounded-sm border border-line bg-canvas-2 p-5 text-ink-soft">Enrollment opens soon. Please check back shortly.</p>
      ) : (
        <Suspense fallback={<Skeleton className="h-[440px] w-full" />}>
          <EnrollForm courses={courses.map((c) => ({ id: c.id, slug: c.slug, title: c.title, durationLabel: c.durationLabel }))} />
        </Suspense>
      )}
    </>
  );
}
