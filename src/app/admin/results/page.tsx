import type { Metadata } from "next";
import { DataTable, fmtDate, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Results" };

export default async function AdminResultsPage({ searchParams }: PageProps<"/admin/results">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.assessmentResults, { orderBy: "submittedAt" });
  rows = searchRows(rows, q, ["studentName", "courseId", "uid"]);
  if (status) rows = rows.filter((r) => r.grade === status);

  return (
    <>
      <DashboardHeader eyebrow="Learning" title="Results" description="Graded assessment submissions." />
      <DataTable
        basePath="/admin/results"
        rows={rows}
        q={q}
        status={status}
        searchPlaceholder="Search student or course"
        emptyTitle="No results yet"
        emptyDescription="Results appear after students submit assessments."
        columns={[
          { key: "studentName", label: "Student", render: (r) => <span className="font-medium">{String(r.studentName ?? "-")}</span> },
          { key: "courseId", label: "Course", render: (r) => <span className="font-mono text-xs">{String(r.courseId)}</span> },
          { key: "correct", label: "Score", render: (r) => `${String(r.correct)}/${String(r.total)}` },
          { key: "percent", label: "%", render: (r) => `${String(r.percent)}%` },
          { key: "grade", label: "Grade", render: (r) => <span className="font-medium">{String(r.grade)}</span> },
          { key: "passed", label: "Result", render: (r) => <StatusBadge value={r.passed ? "passed" : "failed"} /> },
          { key: "submittedAt", label: "Submitted", render: (r) => fmtDate(r.submittedAt) },
        ]}
      />
    </>
  );
}
