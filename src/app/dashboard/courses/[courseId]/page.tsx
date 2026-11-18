import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, ExternalLink, FileText, Lock, PenTool, PlayCircle, Video } from "lucide-react";
import Link from "next/link";
import { CompleteLessonButton } from "@/components/dashboard/complete-lesson-button";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { isVideoConfigured } from "@/lib/integrations";
import { cn } from "@/lib/utils/cn";
import { requireUser } from "@/services/auth/session";
import { getCoursePlayer, getLessonView } from "@/services/student";

const TYPE_ICON = { video: PlayCircle, reading: FileText, assignment: PenTool, resource: BookOpen } as const;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export default async function CoursePlayerPage({ params, searchParams }: PageProps<"/dashboard/courses/[courseId]">) {
  const { courseId } = await params;
  const user = await requireUser(`/dashboard/courses/${courseId}`);
  const player = ID.test(courseId) ? await getCoursePlayer(user.uid, courseId) : null;

  if (!player) {
    return (
      <EmptyState
        icon={<Lock aria-hidden="true" />}
        title="You don't have access to this course"
        description="This course isn't part of your active enrollments. If you've just paid, it can take a moment to activate."
        action={<Button asChild><Link href="/dashboard/courses">Go to my courses</Link></Button>}
      />
    );
  }

  const lessons = player.modules.flatMap((m) => m.lessons);
  const requested = (await searchParams).lesson;
  const requestedId = typeof requested === "string" && ID.test(requested) ? requested : null;
  const current =
    lessons.find((l) => l.id === requestedId) ??
    lessons.find((l) => l.id === player.enrollment.progress.lastLessonId && !l.completed) ??
    lessons.find((l) => !l.completed) ??
    lessons[0];
  const index = current ? lessons.indexOf(current) : -1;
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const view = current ? await getLessonView(courseId, current.id) : null;
  const href = (id: string) => `/dashboard/courses/${courseId}?lesson=${id}`;
  const Icon = current ? TYPE_ICON[current.type] : PlayCircle;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link href="/dashboard/courses" className="flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft aria-hidden="true" className="size-4" /> My courses
        </Link>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h1 className="text-3xl font-medium tracking-[-0.03em]">{player.enrollment.title}</h1>
          <div className="w-full md:w-72">
            <Progress value={player.enrollment.progress.percent} showValue label="Course progress" />
          </div>
        </div>
      </div>

      {lessons.length === 0 ? (
        <EmptyState icon={<BookOpen aria-hidden="true" />} title="Lessons are being published" description="The lessons for this course will appear here soon." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="flex min-w-0 flex-col gap-6">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-forest-deep text-on-forest">
              <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative flex max-w-sm flex-col items-center gap-3 px-6 text-center">
                {current?.type === "video" ? <Video aria-hidden="true" className="size-10 text-mint" /> : <Icon aria-hidden="true" className="size-10 text-mint" />}
                <p className="text-lg font-medium">
                  {current?.type !== "video"
                    ? "This lesson is a reading / activity"
                    : view?.hasVideo && isVideoConfigured()
                      ? "Secure video player"
                      : "The video for this lesson is being uploaded"}
                </p>
                <p className="text-sm text-on-forest-soft">
                  {current?.type === "video" && !(view?.hasVideo && isVideoConfigured())
                    ? "You can still read the notes below and mark the lesson complete when you're done."
                    : "Notes and resources are below."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5 rounded-md border border-line bg-surface p-6 md:p-8">
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-moss-text">
                  Lesson {index + 1} of {lessons.length}
                </p>
                <h2 className="text-2xl font-medium tracking-tight">{current?.title}</h2>
              </div>
              {view?.bodyMarkdown ? <Markdown source={view.bodyMarkdown} /> : <p className="text-ink-soft">Lesson notes will appear here.</p>}
              {view?.assignment && (
                <div className="flex flex-col gap-2 rounded-sm bg-canvas-2 p-5">
                  <p className="flex items-center gap-2 font-medium"><PenTool aria-hidden="true" className="size-4 text-moss" /> Assignment</p>
                  <p className="text-ink-soft">{view.assignment.instructions}</p>
                </div>
              )}
              {view && view.resources.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-medium">Resources</p>
                  <ul className="flex flex-col divide-y divide-line rounded-sm border border-line">
                    {view.resources.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 text-moss" /> {r.title}</span>
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-moss-text hover:underline">
                            Open <ExternalLink aria-hidden="true" className="size-3.5" />
                          </a>
                        ) : (
                          <span className="text-sm text-ink-soft">Download available soon</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <div className="flex gap-2">
                  {prev && (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={href(prev.id)}><ArrowLeft aria-hidden="true" /> Previous</Link>
                    </Button>
                  )}
                  {next && (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={href(next.id)}>Next <ArrowRight aria-hidden="true" /></Link>
                    </Button>
                  )}
                </div>
                {current && <CompleteLessonButton courseId={courseId} lessonId={current.id} completed={current.completed} nextHref={next ? href(next.id) : null} />}
              </div>
            </div>
          </article>

          <aside aria-label="Course contents" className="flex flex-col gap-4 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
            {player.modules.map((m) => (
              <div key={m.id} className="rounded-md border border-line bg-surface">
                <p className="border-b border-line px-4 py-3 text-sm font-medium">{m.title}</p>
                <ol>
                  {m.lessons.map((l) => {
                    const active = l.id === current?.id;
                    return (
                      <li key={l.id}>
                        <Link
                          href={href(l.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn("flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-canvas-2", active && "bg-mint-soft text-forest")}
                        >
                          {l.completed ? <CheckCircle2 aria-label="Completed" className="size-4 shrink-0 text-moss" /> : <Circle aria-hidden="true" className="size-4 shrink-0 text-line-strong" />}
                          <span className="flex-1">{l.title}</span>
                          {l.durationMinutes ? <span className="font-mono text-[11px] text-ink-soft">{l.durationMinutes}m</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
