import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseTile } from "@/components/dashboard/course-tile";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/services/auth/session";
import { getStudentEnrollments } from "@/services/student";

export const metadata: Metadata = { title: "My courses" };

export default async function MyCoursesPage() {
  const user = await requireUser("/dashboard/courses");
  const enrollments = await getStudentEnrollments(user.uid);
  return (
    <>
      <DashboardHeader eyebrow="Learning" title="My courses" description="Every program you're enrolled in, with your progress." />
      {enrollments.length === 0 ? (
        <EmptyState
          icon={<Sparkles aria-hidden="true" />}
          title="No courses yet"
          description="When you enroll in a program it will appear here."
          action={<Button asChild><Link href="/internships">Explore internships</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <CourseTile key={e.id} e={e} />
          ))}
        </div>
      )}
    </>
  );
}
