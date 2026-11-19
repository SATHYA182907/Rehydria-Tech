import type { Metadata } from "next";
import { DataTable, param, searchRows, StatusBadge } from "@/components/admin/data-table";
import { LessonLinksButton } from "@/components/admin/lesson-links-button";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { getLessonLinks } from "@/services/student";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Lessons" };

export default async function AdminLessonsPage({ searchParams }: PageProps<"/admin/lessons">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.lessons);
  rows.sort((a, b) => String(a.courseId).localeCompare(String(b.courseId)) || Number(a.order) - Number(b.order));
  rows = searchRows(rows, q, ["title", "courseId", "moduleId"]);
  if (status) rows = rows.filter((r) => r.status === status);
  const links = await getLessonLinks("", rows.map((r) => r.id));

  return (
    <>
      <DashboardHeader eyebrow="Catalog" title="Lessons" description="Lessons for each level. Add the video and PDF links here; they are stored server-side and shown only to enrolled students." />
      <DataTable
        basePath="/admin/lessons"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["published", "draft"]}
        searchPlaceholder="Search title, course or module"
        emptyTitle="No lessons yet"
        emptyDescription="Lessons appear here once course content is added."
        columns={[
          { key: "courseId", label: "Course", render: (r) => <span className="font-mono text-xs">{String(r.courseId)}</span> },
          { key: "moduleId", label: "Module", render: (r) => <span className="font-mono text-xs">{String(r.moduleId)}</span> },
          { key: "title", label: "Lesson", render: (r) => <span className="font-medium">{String(r.title)}</span> },
          { key: "type", label: "Type", render: (r) => String(r.type ?? "-") },
          { key: "durationMinutes", label: "Minutes", render: (r) => String(r.durationMinutes ?? "-") },
          { key: "isPreview", label: "Preview", render: (r) => (r.isPreview ? "Yes" : "-") },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
          {
            key: "links",
            label: "Video / PDF",
            render: (r) => <LessonLinksButton lessonId={r.id} title={String(r.title)} videoUrl={links[r.id]?.videoUrl ?? null} pdfUrl={links[r.id]?.pdfUrl ?? null} />,
          },
        ]}
      />
    </>
  );
}
