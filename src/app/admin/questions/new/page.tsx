import type { Metadata } from "next";
import { QuestionImportForm } from "@/components/admin/question-import-form";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { listCollection } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { COLLECTIONS } from "@/shared/collections";

export const metadata: Metadata = { title: "Add questions" };

export default async function NewQuestionsPage() {
  await requireAdmin();
  const [courses, questions] = await Promise.all([listCollection(COLLECTIONS.courses), listCollection(COLLECTIONS.questions)]);
  const options = courses
    .filter((c) => c.finalAssessmentId)
    .map((c) => ({ id: c.id, title: String(c.title), count: questions.filter((q) => q.courseId === c.id && q.active === true).length }));
  return (
    <>
      <DashboardHeader
        eyebrow="Learning"
        title="Add questions"
        description="Paste multiple-choice questions for a course's final assessment. Each attempt draws 25 random active questions, so add at least 25 (more makes every attempt different)."
      />
      <div className="max-w-3xl rounded-md border border-line bg-surface p-6">
        <QuestionImportForm courses={options} />
      </div>
    </>
  );
}
