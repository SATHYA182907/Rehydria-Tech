import type { Metadata } from "next";
import { DataTable, fmtDate, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Students" };

export default async function AdminStudentsPage({ searchParams }: PageProps<"/admin/students">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.users, { orderBy: "createdAt" });
  rows = searchRows(rows, q, ["fullName", "email", "phone", "college"]);
  if (status) rows = rows.filter((r) => r.role === status);

  return (
    <>
      <DashboardHeader eyebrow="People" title="Students" description="Everyone with an account. Admin rights come from the admin claim, not this list." />
      <DataTable
        basePath="/admin/students"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["student", "admin"]}
        searchPlaceholder="Search name, email, phone, college"
        emptyTitle="No students yet"
        emptyDescription="Accounts appear here when people register."
        columns={[
          { key: "fullName", label: "Name", render: (r) => <span className="font-medium">{String(r.fullName || "-")}</span> },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone", render: (r) => String(r.phone ?? "-") },
          { key: "college", label: "College", render: (r) => String(r.college ?? "-") },
          { key: "yearOfStudy", label: "Year", render: (r) => String(r.yearOfStudy ?? "-") },
          { key: "role", label: "Role", render: (r) => <StatusBadge value={r.role} /> },
          { key: "createdAt", label: "Joined", render: (r) => fmtDate(r.createdAt) },
        ]}
      />
    </>
  );
}
