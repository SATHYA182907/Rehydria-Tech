import type { Metadata } from "next";
import { DataTable, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Assessments" };

export default async function AdminAssessmentsPage({ searchParams }: PageProps<"/admin/assessments">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.assessments);
  rows = searchRows(rows, q, ["title", "courseId"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Learning" title="Assessments" description="Final assessments per course: question count, timer, pass mark and attempts." />
      <DataTable
        basePath="/admin/assessments"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["published", "draft", "archived"]}
        searchPlaceholder="Search title or course"
        emptyTitle="No assessments yet"
        emptyDescription="Each course's final assessment appears here."
        columns={[
          { key: "title", label: "Assessment", render: (r) => <span className="font-medium">{String(r.title)}</span> },
          { key: "courseId", label: "Course", render: (r) => <span className="font-mono text-xs">{String(r.courseId)}</span> },
          { key: "questionCount", label: "Questions", render: (r) => String(r.questionCount ?? "-") },
          { key: "durationMinutes", label: "Timer", render: (r) => `${String(r.durationMinutes ?? "-")} min` },
          { key: "passingPercent", label: "Pass mark", render: (r) => `${String(r.passingPercent ?? "-")}%` },
          { key: "maxAttempts", label: "Attempts", render: (r) => String(r.maxAttempts ?? "-") },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  );
}
