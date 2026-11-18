import type { Metadata } from "next";
import { DataTable, fmtMoney, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.guideProducts);
  rows = searchRows(rows, q, ["title", "slug"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Catalog" title="Products" description="Digital products such as the Hackathon Guide." />
      <DataTable
        basePath="/admin/products"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["published", "draft", "archived"]}
        searchPlaceholder="Search products"
        emptyTitle="No products yet"
        emptyDescription="Products appear here once created."
        columns={[
          { key: "title", label: "Product", render: (r) => <span className="font-medium">{String(r.title)}</span> },
          { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-xs">{String(r.slug)}</span> },
          { key: "pricePaise", label: "Price", render: (r) => fmtMoney(r.pricePaise) },
          { key: "filePath", label: "PDF", render: (r) => (r.filePath ? "Uploaded" : "Not uploaded") },
          { key: "available", label: "Available", render: (r) => (r.available ? "Yes" : "No") },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  );
}
