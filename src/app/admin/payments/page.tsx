import type { Metadata } from "next";
import { DataTable, fmtDate, fmtMoney, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.payments, { orderBy: "createdAt" });
  rows = searchRows(rows, q, ["id", "email", "razorpayPaymentId", "receipt"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Business" title="Payments" description="Razorpay orders and their verified status. Amounts are server-computed; nothing is trusted from the browser." />
      <DataTable
        basePath="/admin/payments"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["paid", "created", "attempted", "failed", "refunded", "abandoned"]}
        searchPlaceholder="Search order, payment, email, receipt"
        emptyTitle="No payments yet"
        emptyDescription="Payments appear here once Razorpay is connected and students check out."
        columns={[
          { key: "id", label: "Order", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "kind", label: "Type", render: (r) => String(r.kind ?? "-").replace("_", " ") },
          { key: "email", label: "Customer" },
          { key: "amountPaise", label: "Amount", render: (r) => <span className="font-medium">{fmtMoney(r.amountPaise)}</span> },
          { key: "method", label: "Method", render: (r) => String(r.method ?? "-") },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
          { key: "createdAt", label: "Created", render: (r) => fmtDate(r.createdAt) },
        ]}
      />
    </>
  );
}
