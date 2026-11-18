import { ArrowRight, Award, BookOpen, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";
import { CourseTile } from "@/components/dashboard/course-tile";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ProgressRing } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";
import { getProfile } from "@/services/auth/profile";
import { requireUser } from "@/services/auth/session";
import { getStudentCertificates, getStudentEnrollments, getStudentResults } from "@/services/student";

export default async function DashboardOverview() {
  const user = await requireUser();
  const [profile, enrollments, results, certificates] = await Promise.all([
    getProfile(user.uid),
    getStudentEnrollments(user.uid),
    getStudentResults(user.uid),
    getStudentCertificates(user.uid),
  ]);
  const firstName = (profile?.fullName || user.name || "there").split(" ")[0];
  const totalLessons = enrollments.reduce((n, e) => n + e.progress.requiredLessons, 0);
  const doneLessons = enrollments.reduce((n, e) => n + e.progress.completedLessons, 0);
  const overall = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const resume = enrollments.find((e) => e.status === "active") ?? enrollments[0];

  return (
    <>
      <DashboardHeader eyebrow="Overview" title={`Welcome, ${firstName}.`} description="Pick up where you left off and track everything you've achieved." />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<Sparkles aria-hidden="true" />}
          title="You're not enrolled in a program yet"
          description="Explore our internship programs to start learning. Your courses, progress and certificates will appear here."
          action={
            <Button asChild>
              <Link href="/internships">Explore internships</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card variant="feature" padding="lg" className="flex flex-col justify-between gap-8 lg:col-span-2">
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-eyebrow uppercase text-mint">Continue learning</p>
                  <p className="text-2xl font-medium tracking-tight">{resume?.title}</p>
                  <p className="text-on-forest-soft">
                    {resume?.progress.completedLessons} of {resume?.progress.requiredLessons} lessons complete
                  </p>
                </div>
                <ProgressRing value={resume?.progress.percent ?? 0} className="text-on-forest" label="Course progress" />
              </div>
              <Button asChild variant="on-forest" className="w-fit">
                <Link href={`/dashboard/courses/${resume?.courseId}`}>
                  Resume course <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Card>
            <Card className="flex flex-col items-center justify-center gap-3 text-center">
              <ProgressRing value={overall} size={96} stroke={8} label="Overall progress" />
              <p className="font-medium">Overall progress</p>
              <p className="text-sm text-ink-soft">
                {doneLessons} of {totalLessons} lessons across all courses
              </p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card><Stat label="Enrolled courses" value={enrollments.length} icon={<BookOpen aria-hidden="true" />} /></Card>
            <Card><Stat label="Assessments passed" value={results.filter((r) => r.passed).length} icon={<ListChecks aria-hidden="true" />} /></Card>
            <Card><Stat label="Certificates" value={certificates.filter((c) => c.status === "valid").length} icon={<Award aria-hidden="true" />} /></Card>
          </div>

          <section aria-labelledby="my-courses" className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <h2 id="my-courses" className="text-xl font-medium">My courses</h2>
              <Link href="/dashboard/courses" className="text-sm text-moss-text hover:underline">View all</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.slice(0, 3).map((e) => (
                <CourseTile key={e.id} e={e} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
