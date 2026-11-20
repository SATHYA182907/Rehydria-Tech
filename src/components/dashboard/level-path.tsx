"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Lock,
  PlayCircle,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { completeLesson } from "@/services/student/actions";

export interface LevelLesson {
  id: string;
  title: string;
  kind: "video" | "pdf";
  durationMinutes: number | null;
  url: string | null;
  completed: boolean;
}

export interface Level {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  lessons: LevelLesson[];
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The 4-level learning path. Levels unlock in order: a level opens once every lesson in
 * the previous level is complete. Completion is optimistic and confirmed by the server
 * action, which recomputes course progress in a transaction.
 */
export function LevelPath({
  courseId,
  levels,
}: {
  courseId: string;
  levels: Level[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, addDone] = useOptimistic(
    new Set(
      levels.flatMap((l) =>
        l.lessons.filter((x) => x.completed).map((x) => x.id),
      ),
    ),
    (state: Set<string>, id: string) => new Set(state).add(id),
  );

  const levelDone = levels.map(
    (l) => l.lessons.length > 0 && l.lessons.every((x) => done.has(x.id)),
  );
  const unlocked = levels.map((_, i) => i === 0 || levelDone[i - 1] === true);
  const firstOpen = levels.findIndex((_, i) => unlocked[i] && !levelDone[i]);
  const [open, setOpen] = useState<number>(firstOpen === -1 ? -1 : firstOpen);
  const [viewing, setViewing] = useState<LevelLesson | null>(null);

  function markComplete(lessonId: string) {
    setBusy(lessonId);
    start(async () => {
      addDone(lessonId);
      const res = await completeLesson({ courseId, lessonId });
      setBusy(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Nice work!", {
        description: "Your progress has been saved.",
      });
      router.refresh();
    });
  }

  return (
    <>
      <ol className="relative flex flex-col gap-4">
        {/* Connecting rail */}
        <span
          aria-hidden="true"
          className="absolute top-8 bottom-8 left-[27px] w-px bg-line md:left-[31px]"
        />
        {levels.map((level, i) => {
          const isDone = levelDone[i];
          const isUnlocked = unlocked[i];
          const isOpen = open === i && isUnlocked;
          const completedCount = level.lessons.filter((x) =>
            done.has(x.id),
          ).length;
          return (
            <motion.li
              key={level.id}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
              className="relative"
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-md border bg-surface transition-[border-color,box-shadow] duration-500",
                  isOpen
                    ? "border-moss/40 shadow-float"
                    : "border-line shadow-card",
                  !isUnlocked && "bg-canvas-2",
                )}
              >
                <button
                  type="button"
                  disabled={!isUnlocked}
                  aria-expanded={isUnlocked ? isOpen : undefined}
                  aria-controls={`${level.id}-panel`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-4 p-4 text-left disabled:cursor-not-allowed md:gap-5 md:p-5"
                >
                  <span
                    className={cn(
                      "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-medium transition-colors duration-500 md:size-14",
                      isDone
                        ? "border-moss bg-moss text-white"
                        : isUnlocked
                          ? "border-moss bg-surface text-forest"
                          : "border-line-strong bg-canvas-2 text-ink-soft",
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isDone ? (
                        <motion.span
                          key="done"
                          initial={reduce ? false : { scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 18,
                          }}
                        >
                          <Check
                            aria-hidden="true"
                            className="size-6"
                            strokeWidth={3}
                          />
                        </motion.span>
                      ) : isUnlocked ? (
                        <motion.span key="num">
                          {String(i + 1).padStart(2, "0")}
                        </motion.span>
                      ) : (
                        <Lock
                          key="lock"
                          aria-hidden="true"
                          className="size-5"
                        />
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-medium tracking-tight md:text-lg">
                      {level.title}
                    </span>
                    <span className="line-clamp-2 text-sm text-ink-soft">
                      {isUnlocked
                        ? level.summary
                        : `Complete level ${i} to unlock.`}
                    </span>
                  </span>
                  <span className="hidden shrink-0 font-mono text-xs text-ink-soft sm:block">
                    {completedCount}/{level.lessons.length}
                  </span>
                  {isUnlocked && (
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "size-5 shrink-0 text-ink-soft transition-transform duration-500",
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                </button>
                {/* Per-level progress hairline */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent"
                >
                  <span
                    className="block h-full origin-left bg-moss transition-transform duration-1000 ease-[var(--ease-out-expo)]"
                    style={{
                      transform: `scaleX(${level.lessons.length ? completedCount / level.lessons.length : 0})`,
                    }}
                  />
                </span>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`${level.id}-panel`}
                      key="panel"
                      initial={
                        reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
                      }
                      animate={
                        reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }
                      }
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="overflow-hidden"
                    >
                      {level.topics.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-line px-4 pt-4 md:pr-5 md:pl-[5.5rem]">
                          <p className="font-mono text-[11px] tracking-[0.14em] text-moss-text uppercase">
                            Topics in this level · {level.topics.length}
                          </p>
                          <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                            {level.topics.map((topic, t) => (
                              <motion.li
                                key={topic}
                                initial={reduce ? false : { opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.05 + t * 0.03, ease: EASE }}
                                className="flex items-start gap-2.5 text-sm"
                              >
                                <span className="mt-0.5 font-mono text-[11px] text-ink-soft tabular-nums">{String(t + 1).padStart(2, "0")}</span>
                                <span>{topic}</span>
                              </motion.li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <ul className="flex flex-col gap-3 p-4 md:pr-5 md:pb-5 md:pl-[5.5rem]">
                        {level.lessons.map((lesson, k) => {
                          const isComplete = done.has(lesson.id);
                          const Icon =
                            lesson.kind === "video" ? PlayCircle : FileText;
                          return (
                            <motion.li
                              key={lesson.id}
                              initial={reduce ? false : { opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: 0.1 + k * 0.08,
                                ease: EASE,
                              }}
                              className={cn(
                                "flex flex-col gap-3 rounded-sm border p-4 transition-colors duration-500 sm:flex-row sm:items-center",
                                isComplete
                                  ? "border-moss/30 bg-mint-soft/60"
                                  : "border-line bg-canvas",
                              )}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <span
                                  className={cn(
                                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                                    isComplete
                                      ? "bg-moss text-white"
                                      : "bg-surface text-moss",
                                  )}
                                >
                                  <Icon aria-hidden="true" className="size-5" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                  <span className="text-sm font-medium">
                                    {lesson.title}
                                  </span>
                                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                                    {lesson.kind === "video"
                                      ? "Video"
                                      : "PDF notes"}
                                    {lesson.durationMinutes
                                      ? ` · ${lesson.durationMinutes} min`
                                      : ""}
                                  </span>
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {lesson.url && lesson.url.startsWith("/") ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewing(lesson)}
                                    className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:border-moss hover:text-forest"
                                  >
                                    {lesson.kind === "video" ? (
                                      <PlayCircle
                                        aria-hidden="true"
                                        className="size-4"
                                      />
                                    ) : (
                                      <FileText
                                        aria-hidden="true"
                                        className="size-4"
                                      />
                                    )}
                                    {lesson.kind === "video"
                                      ? "Watch video"
                                      : "Read notes"}
                                  </button>
                                ) : lesson.url ? (
                                  <a
                                    href={lesson.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:border-moss hover:text-forest"
                                  >
                                    {lesson.kind === "video"
                                      ? "Watch video"
                                      : "Open PDF"}{" "}
                                    <ExternalLink
                                      aria-hidden="true"
                                      className="size-3.5"
                                    />
                                  </a>
                                ) : (
                                  <span className="inline-flex h-10 items-center rounded-pill bg-surface px-4 text-sm text-ink-soft">
                                    {lesson.kind === "video"
                                      ? "Video coming soon"
                                      : "PDF coming soon"}
                                  </span>
                                )}
                                {isComplete ? (
                                  <span className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-moss px-4 text-sm font-medium text-white">
                                    <CheckCircle2
                                      aria-hidden="true"
                                      className="size-4"
                                    />{" "}
                                    Done
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busy !== null}
                                    onClick={() => markComplete(lesson.id)}
                                    className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-forest px-4 text-sm font-medium text-on-forest transition-[background-color,transform] hover:bg-forest-deep active:scale-95 disabled:opacity-60"
                                  >
                                    <Check
                                      aria-hidden="true"
                                      className="size-4"
                                    />{" "}
                                    Mark complete
                                  </button>
                                )}
                              </div>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          );
        })}
      </ol>
      <LessonViewer
        lesson={viewing}
        completed={viewing ? done.has(viewing.id) : false}
        busy={busy !== null}
        onClose={() => setViewing(null)}
        onComplete={(id) => markComplete(id)}
      />
    </>
  );
}

/** In-page player for lesson files hosted by the site: HTML5 video or the browser's PDF viewer. */
function LessonViewer({
  lesson,
  completed,
  busy,
  onClose,
  onComplete,
}: {
  lesson: LevelLesson | null;
  completed: boolean;
  busy: boolean;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
}) {
  return (
    <Dialog open={Boolean(lesson)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl p-4 sm:p-6">
        {lesson && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 pr-10">
              <DialogTitle className="text-lg font-medium tracking-tight">
                {lesson.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-ink-soft">
                {lesson.kind === "video"
                  ? "Watch the lesson, then mark it complete."
                  : "Read the notes, then mark the lesson complete."}
              </DialogDescription>
            </div>
            {lesson.kind === "video" ? (
              <video
                key={lesson.url}
                src={lesson.url ?? undefined}
                controls
                autoPlay
                playsInline
                onEnded={() => !completed && onComplete(lesson.id)}
                className="aspect-video w-full rounded-sm bg-forest-deep"
              />
            ) : (
              <>
                <iframe
                  key={lesson.url}
                  src={lesson.url ?? undefined}
                  title={lesson.title}
                  className="hidden h-[70dvh] w-full rounded-sm border border-line bg-canvas md:block"
                />
                {/* Phone browsers can't show PDFs inside a page: open the file instead. */}
                <a
                  href={lesson.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-sm border border-line bg-canvas p-5 md:hidden"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-mint">
                    <FileText aria-hidden="true" className="size-6" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium">
                      Open the study notes (PDF)
                    </span>
                    <span className="text-sm text-ink-soft">
                      Opens in your phone&apos;s PDF viewer
                    </span>
                  </span>
                </a>
              </>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={lesson.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm text-moss-text hover:underline"
              >
                Open in new tab{" "}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
              {completed ? (
                <span className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-moss px-4 text-sm font-medium text-white">
                  <CheckCircle2 aria-hidden="true" className="size-4" />{" "}
                  Completed
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onComplete(lesson.id)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-forest px-4 text-sm font-medium text-on-forest transition-colors hover:bg-forest-deep disabled:opacity-60"
                >
                  <Check aria-hidden="true" className="size-4" /> Mark complete
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
