import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExamRunner } from "@/components/assessment/exam-runner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { routes } from "@/config/routes";
import { getLiveAttempt, settleExpiredAttempts } from "@/services/assessments/engine";
import { requireUser } from "@/services/auth/session";
import { getCourseAssessmentState, getCoursePlayer } from "@/services/student";

export const metadata: Metadata = { title: "Final assessment" };

const ID = /^[A-Za-z0-9_-]{1,64}$/;

export default async function AssessmentPage({ params }: PageProps<"/dashboard/courses/[courseId]/assessment">) {
  const { courseId } = await params;
  const user = await requireUser(`/dashboard/courses/${courseId}/assessment`);
  // Course player recomputes progress from the live curriculum.
  const enrollment = ID.test(courseId) ? (await getCoursePlayer(user.uid, courseId))?.enrollment : undefined;
  const back = (
    <Button asChild>
      <Link href={enrollment ? routes.dashboard.course(courseId) : routes.dashboard.courses}>Back to course</Link>
    </Button>
  );
  if (!enrollment) {
    return <EmptyState icon={<Lock aria-hidden="true" />} title="You don't have access to this assessment" description="It opens for students enrolled in the course." action={back} />;
  }

  let state = await getCourseAssessmentState(user.uid, courseId);
  if (state.assessmentId) {
    // Lazily auto-submit an attempt whose time ran out while the student was away.
    await settleExpiredAttempts(user.uid, state.assessmentId);
    state = await getCourseAssessmentState(user.uid, courseId);
  }
  const live = state.assessmentId ? await getLiveAttempt(user.uid, state.assessmentId) : null;
  const attemptsLeft = Math.max(0, state.maxAttempts - state.attemptsUsed);

  if (enrollment.progress.percent < 100 && !state.passed) {
    return <EmptyState icon={<Lock aria-hidden="true" />} title="Assessment locked" description={`Complete all levels first. You are ${enrollment.progress.percent}% through the course.`} action={back} />;
  }
  if (!state.published) {
    return <EmptyState icon={<Lock aria-hidden="true" />} title="The assessment opens soon" description="We'll let you know as soon as it is available." action={back} />;
  }
  // Passed, or out of attempts: show the result screen (same component, so a just-submitted
  // attempt keeps its animated result when the page revalidates).
  const best = state.bestResult;
  const showResult = !live && best && (state.passed || attemptsLeft === 0);

  return (
    <ExamRunner
      initialAttempt={live}
      initialOutcome={
        showResult
          ? { resultId: "", correct: best.correct, total: best.total, percent: best.percent, grade: best.grade, passed: state.passed, certificateId: state.certificateId, certificateAvailableAt: state.certificateAvailableAt, submissionType: "manual" }
          : null
      }
      info={{
        courseId,
        courseTitle: enrollment.title,
        title: state.title,
        questionCount: state.questionCount,
        durationMinutes: state.durationMinutes,
        passingPercent: state.passingPercent,
        attemptsLeft,
        maxAttempts: state.maxAttempts,
      }}
    />
  );
}
