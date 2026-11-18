import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, fmtMoney, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Courses" };

export default async function AdminCoursesPage({ searchParams }: PageProps<"/admin/courses">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.courses);
  rows.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  rows = searchRows(rows, q, ["title", "slug", "code"]);
  if (status) rows = rows.filter((r) => r.status === status);

  return (
    <>
      <DashboardHeader eyebrow="Catalog" title="Courses" description="Create, edit, publish and archive internship programs." actions={<Button asChild><Link href="/admin/courses/new"><Plus aria-hidden="true" /> New course</Link></Button>} />
      <DataTable
        basePath="/admin/courses"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["published", "draft", "archived"]}
        searchPlaceholder="Search title, slug, code"
        emptyTitle="No courses yet"
        emptyDescription="Create your first course to publish it on the website."
        columns={[
          { key: "title", label: "Course", render: (r) => <Link href={`/admin/courses/${r.id}`} className="font-medium text-moss-text hover:underline">{String(r.title)}</Link> },
          { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs">{String(r.code ?? "-")}</span> },
          { key: "slug", label: "URL", render: (r) => <span className="font-mono text-xs">/internships/{String(r.slug)}</span> },
          { key: "pricePaise", label: "Price", render: (r) => fmtMoney(r.pricePaise) },
          { key: "moduleCount", label: "Modules / lessons", render: (r) => `${String(r.moduleCount ?? 0)} / ${String(r.lessonCount ?? 0)}` },
          { key: "enrollmentOpen", label: "Enrollment", render: (r) => (r.enrollmentOpen ? "Open" : "Closed") },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  );
}
