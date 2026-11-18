import { BookOpenCheck, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/services/auth/session";
import { getStudentEnrollments, getStudentPurchases } from "@/services/student";

export const metadata: Metadata = { title: "Learning materials" };

export default async function MaterialsPage() {
  const user = await requireUser("/dashboard/materials");
  const [enrollments, purchases] = await Promise.all([getStudentEnrollments(user.uid), getStudentPurchases(user.uid)]);

  return (
    <>
      <DashboardHeader eyebrow="Library" title="Learning materials" description="Lesson notes and resources from your courses, and guides you've purchased." />
      <div className="flex flex-col gap-10">
        <section aria-labelledby="guides" className="flex flex-col gap-4">
          <h2 id="guides" className="text-xl font-medium">My guides</h2>
          {purchases.length === 0 ? (
            <EmptyState
              icon={<BookOpenCheck aria-hidden="true" />}
              title="No guides yet"
              description="Guides you purchase, such as the Hackathon Guide, appear here for secure download."
              action={<Button asChild variant="secondary" size="sm"><Link href="/hackathon-guide">View the Hackathon Guide</Link></Button>}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface p-5">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{p.title}</p>
                    <Badge variant="success" className="w-fit">Purchased</Badge>
                  </div>
                  <Button size="sm" disabled title="Secure downloads are enabled once file storage is configured">Download</Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="course-materials" className="flex flex-col gap-4">
          <h2 id="course-materials" className="text-xl font-medium">Course materials</h2>
          {enrollments.length === 0 ? (
            <EmptyState icon={<FolderOpen aria-hidden="true" />} title="No course materials yet" description="Enroll in a program to access its notes and resources." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {enrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface p-5">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-ink-soft">Notes and resources are attached to each lesson.</p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/dashboard/courses/${e.courseId}`}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
