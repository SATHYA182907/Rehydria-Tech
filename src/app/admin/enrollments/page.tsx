import type { Metadata } from "next";
import { DataTable, fmtDate, fmtMoney, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Enrollments" };

export default async function AdminEnrollmentsPage({ searchParams }: PageProps<"/admin/enrollments">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.enrollments, { orderBy: "createdAt" });
  rows = searchRows(rows, q, ["email", "courseId", "uid"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Learning" title="Enrollments" description="Every enrollment and its payment state. Access is granted only to active or completed enrollments." />
      <DataTable
        basePath="/admin/enrollments"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["active", "completed", "pending_payment", "abandoned", "refunded", "revoked"]}
        searchPlaceholder="Search email, course, uid"
        emptyTitle="No enrollments yet"
        emptyDescription="Enrollments appear here once students enroll."
        columns={[
          { key: "email", label: "Student", render: (r) => <span className="flex flex-col"><span className="font-medium">{String((r.applicant as { fullName?: string } | undefined)?.fullName ?? "-")}</span><span className="text-ink-soft">{String(r.email ?? "")}</span></span> },
          { key: "courseId", label: "Course", render: (r) => String((r.courseSnapshot as { title?: string } | undefined)?.title ?? r.courseId) },
          { key: "progress", label: "Progress", render: (r) => `${String((r.progress as { percent?: number } | undefined)?.percent ?? 0)}%` },
          { key: "amountPaidPaise", label: "Paid", render: (r) => fmtMoney(r.amountPaidPaise) },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
          { key: "createdAt", label: "Created", render: (r) => fmtDate(r.createdAt) },
        ]}
      />
    </>
  );
}
