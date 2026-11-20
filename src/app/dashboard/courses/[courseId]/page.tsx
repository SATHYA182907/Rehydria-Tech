import { ArrowLeft, ArrowRight, Award, BookOpen, CalendarDays, Clock, FileQuestion, Lock, RotateCcw, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requestTime } from "@/lib/utils/time";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { LevelPath, type Level } from "@/components/dashboard/level-path";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ProgressRing } from "@/components/ui/feedback";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { requireUser } from "@/services/auth/session";
import { getCourseAssessmentState, getCoursePlayer, getLessonLinks } from "@/services/student";

export const metadata: Metadata = { title: "Course" };

const ID = /^[A-Za-z0-9_-]{1,64}$/;

export default async function CoursePage({ params }: PageProps<"/dashboard/courses/[courseId]">) {
  const { courseId } = await params;
  const user = await requireUser(`/dashboard/courses/${courseId}`);
  const player = ID.test(courseId) ? await getCoursePlayer(user.uid, courseId) : null;

  if (!player) {
    return (
      <EmptyState
        icon={<Lock aria-hidden="true" />}
        title="You don't have access to this course"
        description="This course isn't part of your active enrollments yet. It unlocks once your enrollment is activated."
        action={
          <Button asChild>
            <Link href={routes.dashboard.courses}>Go to my courses</Link>
          </Button>
        }
      />
    );
  }

  const allLessons = player.modules.flatMap((m) => m.lessons);
  const [links, exam] = await Promise.all([
    getLessonLinks(
      courseId,
      allLessons.map((l) => l.id),
    ),
    getCourseAssessmentState(user.uid, courseId),
  ]);

  const levels: Level[] = player.modules.map((m) => ({
    id: m.id,
    title: m.title,
    summary: m.summary,
    topics: m.topics,
    lessons: m.lessons.map((l) => {
      const kind = l.type === "video" ? "video" : "pdf";
      const link = links[l.id];
      return {
        id: l.id,
        title: l.title,
        kind,
        durationMinutes: l.durationMinutes,
        url: (kind === "video" ? link?.videoUrl : link?.pdfUrl) ?? null,
        completed: l.completed,
      };
    }),
  }));

  const { enrollment } = player;
  const percent = enrollment.progress.percent;
  const levelsDone = levels.filter((l) => l.lessons.length > 0 && l.lessons.every((x) => x.completed)).length;
  const examUnlocked = percent >= 100;
  const attemptsLeft = Math.max(0, exam.maxAttempts - exam.attemptsUsed);

  // Internship period: "Day X of N" since activation; the certificate unlocks after it.
  const DAY = 86_400_000;
  const now = requestTime();
  const startedMs = enrollment.activatedAt ? Date.parse(enrollment.activatedAt) : now;
  const period = enrollment.periodDays;
  const dayNumber = Math.min(period, Math.max(1, Math.floor((now - startedMs) / DAY) + 1));
  const periodOver = period === 0 || now >= startedMs + period * DAY;
  const certAvailableMs = exam.certificateAvailableAt ? Date.parse(exam.certificateAvailableAt) : null;
  const certLocked = exam.passed && certAvailableMs !== null && certAvailableMs > now;
  const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <div className="flex flex-col gap-8">
      <Link href={routes.dashboard.courses} className="flex min-h-11 w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" /> My courses
      </Link>

      {/* Course header with the completion circle */}
      <header className="relative overflow-hidden rounded-md bg-forest p-6 text-on-forest shadow-float md:p-10">
        <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.14)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-8 -right-8 w-72 text-mint opacity-20 md:w-96">
          <CourseIllustration motif={enrollment.illustration} />
        </div>
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-xl flex-col gap-3">
            <span className="font-mono text-xs tracking-[0.16em] text-mint">{enrollment.code}</span>
            <h1 className="text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.03em]">{enrollment.title}</h1>
            <p className="text-on-forest-soft">
              Complete all {levels.length} levels to unlock the final assessment. Pass it, and your certificate unlocks at the end of the{" "}
              {period ? `${period / 7 === Math.round(period / 7) ? `${period / 7}-week` : `${period}-day`} internship` : "course"}.
            </p>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {period > 0 && (
                <div className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4 text-mint" />
                  <dt className="sr-only">Internship period</dt>
                  <dd>{periodOver ? `${period}-day internship complete` : `Day ${dayNumber} of ${period}`}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookOpen aria-hidden="true" className="size-4 text-mint" />
                <dt className="sr-only">Levels</dt>
                <dd>
                  {levelsDone} of {levels.length} levels
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <Target aria-hidden="true" className="size-4 text-mint" />
                <dt className="sr-only">Lessons</dt>
                <dd>
                  {enrollment.progress.completedLessons} of {enrollment.progress.requiredLessons} lessons
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex shrink-0 items-center gap-4 self-start rounded-md bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur md:self-auto">
            <ProgressRing value={percent} size={128} stroke={10} label="Total course completion" className="[&_circle:first-child]:stroke-white/15 [&_circle:last-child]:stroke-mint">
              <span className="flex flex-col items-center leading-none">
                <span className="text-3xl font-medium text-white">{percent}%</span>
                <span className="mt-1 text-[10px] tracking-[0.14em] text-on-forest-soft uppercase">complete</span>
              </span>
            </ProgressRing>
          </div>
        </div>
      </header>

      {levels.length === 0 ? (
        <EmptyState icon={<BookOpen aria-hidden="true" />} title="Levels are being published" description="The course levels will appear here soon." />
      ) : (
        <section aria-labelledby="levels-title" className="flex flex-col gap-4">
          <h2 id="levels-title" className="text-xl font-medium">
            Course content
          </h2>
          <LevelPath courseId={courseId} levels={levels} />
        </section>
      )}

      {/* Final assessment */}
      <section
        aria-labelledby="exam-title"
        className={cn(
          "relative overflow-hidden rounded-md border p-6 md:p-8",
          exam.passed ? "border-moss/40 bg-mint-soft" : examUnlocked ? "border-moss/40 bg-surface shadow-float" : "border-dashed border-line-strong bg-canvas-2",
        )}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full", examUnlocked ? "bg-forest text-mint" : "bg-surface text-ink-soft")}>
              {exam.passed ? <Award aria-hidden="true" className="size-6" /> : examUnlocked ? <FileQuestion aria-hidden="true" className="size-6" /> : <Lock aria-hidden="true" className="size-6" />}
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="exam-title" className="text-xl font-medium tracking-tight">
                  Final assessment
                </h2>
                {exam.passed ? <Badge variant="success">Passed</Badge> : !examUnlocked ? <Badge variant="neutral">Locked</Badge> : null}
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                <li className="flex items-center gap-1.5">
                  <FileQuestion aria-hidden="true" className="size-4" /> {exam.questionCount} MCQs
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="size-4" /> {exam.durationMinutes} minutes
                </li>
                <li className="flex items-center gap-1.5">
                  <Target aria-hidden="true" className="size-4" /> Pass mark {exam.passingPercent}%
                </li>
                <li className="flex items-center gap-1.5">
                  <RotateCcw aria-hidden="true" className="size-4" /> {attemptsLeft} of {exam.maxAttempts} attempts left
                </li>
              </ul>
              {exam.bestResult && (
                <p className="text-sm">
                  Best result: <strong className="font-medium">{exam.bestResult.correct}/{exam.bestResult.total}</strong> ({exam.bestResult.percent}%), grade{" "}
                  <strong className="font-medium">{exam.bestResult.grade}</strong>
                </p>
              )}
              {!examUnlocked && <p className="text-sm text-ink-soft">Complete every level to unlock the assessment ({percent}% done).</p>}
              {certLocked && certAvailableMs && (
                <p className="text-sm">
                  Your certificate unlocks on <strong className="font-medium">{longDate.format(new Date(certAvailableMs))}</strong>, at the end of your internship period.
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {exam.passed ? (
              <Button asChild variant={certLocked ? "secondary" : "primary"}>
                <Link href={routes.dashboard.certificates}>
                  {certLocked ? "Certificate status" : "View certificate"} <Award aria-hidden="true" />
                </Link>
              </Button>
            ) : examUnlocked && exam.published && (attemptsLeft > 0 || exam.inProgressAttemptId) ? (
              <Button asChild>
                <Link href={routes.dashboard.assessment(courseId)}>
                  {exam.inProgressAttemptId ? "Resume assessment" : "Start assessment"} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : examUnlocked && attemptsLeft === 0 ? (
              <p className="max-w-xs text-sm text-ink-soft">You have used all attempts. Contact Rehydria support for a re-attempt.</p>
            ) : examUnlocked ? (
              <p className="max-w-xs text-sm text-ink-soft">The assessment opens soon.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
