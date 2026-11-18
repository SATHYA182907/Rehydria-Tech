import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/feedback";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentForm } from "@/components/enrollment/enrollment-form";
import { Accent, Container, Eyebrow } from "@/components/layout/section";
import { Price } from "@/components/ui/price";
import { routes } from "@/config/routes";
import { isPaymentsConfigured } from "@/lib/integrations";
import { getCourseBySlug, getPublishedCourses } from "@/services/catalog";

const PLACEHOLDER = "__none__";

export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  return courses.length ? courses.map((c) => ({ slug: c.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/internships/[slug]/enroll">): Promise<Metadata> {
  const { slug } = await params;
  const course = slug === PLACEHOLDER ? null : await getCourseBySlug(slug);
  return { title: course ? `Enroll: ${course.title}` : "Enroll", robots: { index: false } };
}

async function EnrollContent({ params }: { params: PageProps<"/internships/[slug]/enroll">["params"] }) {
  const { slug } = await params;
  const [course, courses] = await Promise.all([slug === PLACEHOLDER ? null : getCourseBySlug(slug), getPublishedCourses()]);
  if (!course) notFound();
  const options = courses.filter((c) => c.enrollmentOpen).map((c) => ({ id: c.id, title: c.title, durationLabel: c.durationLabel, pricePaise: c.pricePaise }));

  return (
    <main className="pt-32 pb-24 md:pt-40">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-ink-soft">
            <Link href={routes.internship(course.slug)} className="hover:text-ink">
              ← {course.title}
            </Link>
          </nav>
          <Eyebrow>Enrollment</Eyebrow>
          <h1 className="text-display-md font-medium">
            Reserve your <Accent className="text-moss">place</Accent>.
          </h1>
          <p className="leading-relaxed text-ink-soft">
            Tell us a little about yourself. After secure payment, your course activates instantly and you receive a confirmation email.
          </p>
          <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{course.code}</p>
            <p className="text-lg font-medium">{course.title}</p>
            <Price amountPaise={course.pricePaise} compareAtPaise={course.compareAtPricePaise} />
          </div>
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <ShieldCheck aria-hidden="true" className="size-4 text-moss" /> Secured by Razorpay
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-6 shadow-card md:p-10 lg:col-span-7 lg:col-start-6">
          <EnrollmentForm courses={options.length ? options : [{ id: course.id, title: course.title, durationLabel: course.durationLabel, pricePaise: course.pricePaise }]} defaultCourseId={course.id} paymentsEnabled={isPaymentsConfigured()} />
        </div>
      </Container>
    </main>
  );
}

/**
 * Params are awaited inside <Suspense> so pages for slugs published after the build render on
 * demand (and are then cached), while build-time slugs stay fully prerendered.
 */
export default function EnrollPage({ params }: PageProps<"/internships/[slug]/enroll">) {
  return (
    <Suspense fallback={<main className="pt-40 pb-24"><div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-10"><Skeleton className="h-96 w-full" /></div></main>}>
      <EnrollContent params={params} />
    </Suspense>
  );
}
