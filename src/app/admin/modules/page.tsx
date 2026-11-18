import type { Metadata } from "next";
import { DataTable, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Modules" };

export default async function AdminModulesPage({ searchParams }: PageProps<"/admin/modules">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.courseModules);
  rows.sort((a, b) => String(a.courseId).localeCompare(String(b.courseId)) || Number(a.order) - Number(b.order));
  rows = searchRows(rows, q, ["title", "courseId"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Catalog" title="Modules" description="Course modules in order. Module and lesson editing arrives with course content entry." />
      <DataTable
        basePath="/admin/modules"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["published", "draft"]}
        searchPlaceholder="Search title or course id"
        emptyTitle="No modules yet"
        emptyDescription="Modules appear here once course content is added."
        columns={[
          { key: "courseId", label: "Course", render: (r) => <span className="font-mono text-xs">{String(r.courseId)}</span> },
          { key: "order", label: "#", render: (r) => String(r.order ?? "-") },
          { key: "title", label: "Module", render: (r) => <span className="font-medium">{String(r.title)}</span> },
          { key: "lessonCount", label: "Lessons", render: (r) => String(r.lessonCount ?? 0) },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  );
}
