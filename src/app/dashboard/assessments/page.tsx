import { CheckCircle2, Clock, ListChecks, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { requireUser } from "@/services/auth/session";
import { getStudentAssessments } from "@/services/student";

export const metadata: Metadata = { title: "Assessments" };

export default async function AssessmentsPage() {
  const user = await requireUser("/dashboard/assessments");
  const assessments = await getStudentAssessments(user.uid);
  return (
    <>
      <DashboardHeader eyebrow="Progress" title="Assessments" description="Each course ends with a timed multiple-choice assessment. It unlocks when you complete the required lessons." />
      {assessments.length === 0 ? (
        <EmptyState icon={<ListChecks aria-hidden="true" />} title="No assessments yet" description="Assessments appear here for each course you're enrolled in." />
      ) : (
        <ul className="flex flex-col gap-4">
          {assessments.map((a) => (
            <li key={a.courseId} className="flex flex-col gap-5 rounded-md border border-line bg-surface p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {a.passed ? (
                    <Badge variant="success"><CheckCircle2 aria-hidden="true" /> Passed</Badge>
                  ) : a.unlocked ? (
                    <Badge variant="mint">Available</Badge>
                  ) : (
                    <Badge><Lock aria-hidden="true" /> Locked</Badge>
                  )}
                  <span className="font-mono text-xs text-ink-soft">{a.courseTitle}</span>
                </div>
                <h2 className="text-xl font-medium">{a.title}</h2>
                <p className="flex flex-wrap gap-4 text-sm text-ink-soft">
                  <span>{a.questionCount} questions</span>
                  <span className="flex items-center gap-1"><Clock aria-hidden="true" className="size-3.5" /> {a.durationMinutes} min</span>
                  <span>Attempts {a.attemptsUsed}/{a.maxAttempts}</span>
                </p>
                {!a.unlocked && !a.passed && (
                  <div className="flex w-full max-w-sm flex-col gap-1">
                    <Progress value={(a.progressPercent / Math.max(a.unlockPercent, 1)) * 100} label="Progress toward unlocking" />
                    <p className="text-xs text-ink-soft">
                      {a.published ? `Complete ${a.unlockPercent}% of the course to unlock (you're at ${a.progressPercent}%).` : "This assessment is being prepared."}
                    </p>
                  </div>
                )}
              </div>
              {a.unlocked && !a.passed ? (
                <Button disabled title="The exam engine is enabled in the next release">Start assessment</Button>
              ) : (
                <Button asChild variant="secondary">
                  <Link href={`/dashboard/courses/${a.courseId}`}>Go to course</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
