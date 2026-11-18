import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, fmtDate, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Certificates" };

export default async function AdminCertificatesPage({ searchParams }: PageProps<"/admin/certificates">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.certificates, { orderBy: "issuedAt" });
  rows = searchRows(rows, q, ["id", "studentName", "courseTitle"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Learning" title="Certificates" description="Issued certificates. Revoke and reissue actions arrive with certificate generation." />
      <DataTable
        basePath="/admin/certificates"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["valid", "pending", "revoked", "failed"]}
        searchPlaceholder="Search ID, student or course"
        emptyTitle="No certificates yet"
        emptyDescription="Certificates are issued automatically when students pass."
        columns={[
          { key: "id", label: "Certificate ID", render: (r) => <Link href={`/verify/${r.id}`} className="font-mono text-xs text-moss-text hover:underline">{r.id}</Link> },
          { key: "studentName", label: "Student", render: (r) => <span className="font-medium">{String(r.studentName ?? "-")}</span> },
          { key: "courseTitle", label: "Course" },
          { key: "grade", label: "Grade" },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
          { key: "issuedAt", label: "Issued", render: (r) => fmtDate(r.issuedAt) },
        ]}
      />
    </>
  );
}
