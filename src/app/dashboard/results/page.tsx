import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/services/auth/session";
import { getStudentResults } from "@/services/student";

export const metadata: Metadata = { title: "Results" };

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function ResultsPage() {
  const user = await requireUser("/dashboard/results");
  const results = await getStudentResults(user.uid);
  return (
    <>
      <DashboardHeader eyebrow="Progress" title="Results" description="Your assessment history, scores and grades." />
      {results.length === 0 ? (
        <EmptyState icon={<BarChart3 aria-hidden="true" />} title="No results yet" description="After you submit an assessment, your score and grade appear here." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-canvas-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
              <tr>
                <th scope="col" className="px-5 py-3 font-normal">Course</th>
                <th scope="col" className="px-5 py-3 font-normal">Score</th>
                <th scope="col" className="px-5 py-3 font-normal">Percent</th>
                <th scope="col" className="px-5 py-3 font-normal">Grade</th>
                <th scope="col" className="px-5 py-3 font-normal">Result</th>
                <th scope="col" className="px-5 py-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-4 font-medium">{r.courseTitle}</td>
                  <td className="px-5 py-4 font-mono">{r.correct}/{r.total}</td>
                  <td className="px-5 py-4 font-mono">{r.percent}%</td>
                  <td className="px-5 py-4 text-lg font-medium">{r.grade}</td>
                  <td className="px-5 py-4">{r.passed ? <Badge variant="success">Passed</Badge> : <Badge variant="danger">Not passed</Badge>}</td>
                  <td className="px-5 py-4 text-ink-soft">{r.submittedAt ? date.format(new Date(r.submittedAt)) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
