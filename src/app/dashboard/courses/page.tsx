import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { Reveal } from "@/components/animations/reveal";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ProgressRing } from "@/components/ui/feedback";
import { routes } from "@/config/routes";
import { getProfile } from "@/services/auth/profile";
import { requireUser } from "@/services/auth/session";
import { getPublishedCourses } from "@/services/catalog";
import { getStudentApplications, getStudentEnrollments } from "@/services/student";

export const metadata: Metadata = { title: "My courses" };

export default async function MyCoursesPage() {
  const user = await requireUser("/dashboard/courses");
  const [profile, enrollments, applications, catalog] = await Promise.all([
    getProfile(user.uid),
    getStudentEnrollments(user.uid),
    getStudentApplications(user.uid),
    getPublishedCourses(),
  ]);
  const firstName = (profile?.fullName || user.name || "").split(" ")[0];
  const taken = new Set([...enrollments.map((e) => e.courseId), ...applications.map((a) => a.courseId)]);
  const available = catalog.filter((c) => c.enrollmentOpen && !taken.has(c.id));

  return (
    <>
      <DashboardHeader eyebrow="My learning" title={firstName ? `Welcome, ${firstName}.` : "My courses"} description="Continue your internship courses, track your progress and unlock your certificate." />

      <div className="flex flex-col gap-12">
        {enrollments.length > 0 && (
          <section aria-labelledby="enrolled" className="flex flex-col gap-4">
            <h2 id="enrolled" className="text-xl font-medium">Enrolled courses</h2>
            <Reveal className="grid gap-5 lg:grid-cols-2">
              {enrollments.map((e) => (
                <Link
                  key={e.id}
                  href={routes.dashboard.course(e.courseId)}
                  className="group relative flex items-center gap-6 overflow-hidden rounded-md border border-line bg-surface p-6 shadow-card transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-moss/40 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                >
                  <div aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-10 w-48 text-forest opacity-[0.07] transition-transform duration-700 group-hover:scale-110">
                    <CourseIllustration motif={e.illustration} />
                  </div>
                  <ProgressRing value={e.progress.percent} size={88} stroke={7} label={`${e.title} completion`} />
                  <div className="relative flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-soft">{e.code}</span>
                      {e.assessmentPassed ? (
                        <Badge variant="success">Certified</Badge>
                      ) : e.progress.percent >= 100 ? (
                        <Badge variant="mint">Assessment unlocked</Badge>
                      ) : (
                        <Badge variant="neutral">In progress</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-medium tracking-tight">{e.title}</h3>
                    <p className="text-sm text-ink-soft">
                      {e.progress.completedLessons} of {e.progress.requiredLessons} lessons complete
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-moss-text">
                      {e.progress.percent > 0 ? "Continue learning" : "Start learning"}
                      <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </Reveal>
          </section>
        )}

        {applications.length > 0 && (
          <section aria-labelledby="pending" className="flex flex-col gap-4">
            <h2 id="pending" className="text-xl font-medium">Awaiting payment</h2>
            <ul className="grid gap-4 lg:grid-cols-2">
              {applications.map((a) => (
                <li key={a.id} className="flex flex-col justify-between gap-4 rounded-md border border-dashed border-line-strong bg-canvas-2 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <Clock aria-hidden="true" className="mt-0.5 size-5 text-warning" />
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-ink-soft">Your application is saved. The course unlocks after payment.</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="shrink-0">
                    <Link href={`/enroll/payment?id=${encodeURIComponent(a.id)}`}>View application</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {enrollments.length === 0 && applications.length === 0 && available.length === 0 && (
          <EmptyState icon={<Sparkles aria-hidden="true" />} title="Programs are opening soon" description="New internship courses will appear here as soon as enrollment opens." />
        )}

        {available.length > 0 && (
          <section aria-labelledby="explore" className="flex flex-col gap-4">
            <h2 id="explore" className="text-xl font-medium">{enrollments.length || applications.length ? "Explore more courses" : "Choose your internship"}</h2>
            <Reveal className="grid gap-5 md:grid-cols-2">
              {available.map((c) => (
                <article key={c.id} className="flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-card">
                  <div className="engineering-grid flex h-36 items-center justify-center border-b border-line bg-canvas text-forest">
                    <CourseIllustration motif={c.illustration} className="w-40" />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <span className="font-mono text-xs text-moss-text">{c.code} · {c.durationLabel}</span>
                    <h3 className="text-lg font-medium tracking-tight">{c.title}</h3>
                    <p className="line-clamp-2 text-sm text-ink-soft">{c.shortDescription}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Button asChild size="sm">
                        <Link href={routes.enroll(c.slug)}>Enroll</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost" className="rounded-pill">
                        <Link href={routes.internship(c.slug)}>Course overview</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </Reveal>
          </section>
        )}
      </div>
    </>
  );
}
