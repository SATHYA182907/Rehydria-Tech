import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, param, searchRows } from "@/components/admin/data-table";
import { QuestionActiveToggle } from "@/components/admin/question-active-toggle";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Question bank" };

export default async function AdminQuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q);
  const status = param(sp.status);
  let rows = await listCollection(COLLECTIONS.questions);
  rows = searchRows(rows, q, ["text", "courseId"]);
  if (status) rows = rows.filter((r) => r.difficulty === status);

  return (
    <>
      <DashboardHeader eyebrow="Learning" title="Question bank" description="Multiple-choice questions. Answer keys are visible only here, to admins, and never sent to students."
        actions={
          <Button asChild>
            <Link href="/admin/questions/new">Add questions</Link>
          </Button>
        }
      />
      <DataTable
        basePath="/admin/questions"
        rows={rows}
        q={q}
        status={status}
        statusOptions={["easy", "medium", "hard"]}
        searchPlaceholder="Search question text or course"
        emptyTitle="No questions yet"
        emptyDescription="Use “Add questions” to paste the question bank for each course."
        columns={[
          { key: "text", label: "Question", className: "max-w-md", render: (r) => <span className="line-clamp-2">{String(r.text)}</span> },
          { key: "courseId", label: "Course", render: (r) => <span className="font-mono text-xs">{String(r.courseId)}</span> },
          { key: "correctOptionId", label: "Answer", render: (r) => <span className="font-mono uppercase">{String(r.correctOptionId ?? "-")}</span> },
          { key: "difficulty", label: "Difficulty", render: (r) => String(r.difficulty ?? "-") },
          { key: "active", label: "Active", render: (r) => (r.active ? "Yes" : "No") },
          { key: "actions", label: "", render: (r) => <QuestionActiveToggle questionId={r.id} active={r.active === true} /> },
        ]}
      />
    </>
  );
}
