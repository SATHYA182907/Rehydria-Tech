"use client";

import { ArrowLeft, ArrowRight, Award, CheckCircle2, Clock, FileQuestion, Flag, RotateCcw, ShieldCheck, Target, XCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { saveAnswer, startAssessment, submitAssessment } from "@/services/assessments/actions";
import type { AttemptOutcome, LiveAttempt } from "@/services/assessments/engine";
import type { OptionId } from "@/shared/types/domain";

const EASE = [0.16, 1, 0.3, 1] as const;

export interface ExamInfo {
  courseId: string;
  courseTitle: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  passingPercent: number;
  attemptsLeft: number;
  maxAttempts: number;
}

/**
 * Intro → timed session → result. The page re-renders this same component after a submit
 * (server revalidation), so client state, and the fresh result screen, survive.
 */
export function ExamRunner({ info, initialAttempt, initialOutcome = null }: { info: ExamInfo; initialAttempt: LiveAttempt | null; initialOutcome?: AttemptOutcome | null }) {
  const [attempt, setAttempt] = useState<LiveAttempt | null>(initialAttempt);
  const [startLeft] = useState(info.attemptsLeft);
  const [result, setResult] = useState<{ outcome: AttemptOutcome; attemptsLeft: number; fresh: boolean } | null>(
    initialOutcome ? { outcome: initialOutcome, attemptsLeft: info.attemptsLeft, fresh: false } : null,
  );

  if (result) return <ExamResult info={info} {...result} />;
  if (attempt) return <ExamSession info={info} attempt={attempt} onDone={(outcome) => setResult({ outcome, attemptsLeft: Math.max(0, startLeft - 1), fresh: true })} />;
  return <ExamIntro info={info} onStart={setAttempt} />;
}

/* ── Intro ─────────────────────────────────────────────────────────────── */

function ExamIntro({ info, onStart }: { info: ExamInfo; onStart: (a: LiveAttempt) => void }) {
  const [pending, start] = useTransition();
  const reduce = useReducedMotion();
  const rules = [
    { icon: FileQuestion, label: `${info.questionCount} multiple-choice questions`, hint: "One correct answer each" },
    { icon: Clock, label: `${info.durationMinutes} minutes`, hint: "Submits automatically at 0:00" },
    { icon: Target, label: `Pass mark ${info.passingPercent}%`, hint: "Pass to unlock your certificate" },
    { icon: RotateCcw, label: `${info.attemptsLeft} of ${info.maxAttempts} attempts left`, hint: "Starting uses an attempt" },
  ];
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 rounded-md border border-line bg-surface p-6 shadow-float md:p-10"
    >
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs tracking-[0.16em] text-moss-text uppercase">{info.courseTitle}</span>
        <h1 className="text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.03em]">{info.title}</h1>
        <p className="text-ink-soft">Find a quiet place with a stable connection. Your answers are saved as you go, so a page reload will not lose them.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rules.map((r, i) => (
          <motion.li
            key={r.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: EASE }}
            className="flex items-start gap-3 rounded-sm border border-line bg-canvas p-4"
          >
            <r.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-moss" />
            <span className="flex flex-col">
              <span className="font-medium">{r.label}</span>
              <span className="text-sm text-ink-soft">{r.hint}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost">
          <Link href={routes.dashboard.course(info.courseId)}>
            <ArrowLeft aria-hidden="true" /> Back to course
          </Link>
        </Button>
        <Button
          size="lg"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await startAssessment({ courseId: info.courseId });
              if (!res.ok) toast.error(res.error);
              else onStart(res.data);
            })
          }
        >
          <ShieldCheck aria-hidden="true" /> Start assessment
        </Button>
      </div>
    </motion.section>
  );
}

/* ── Session ───────────────────────────────────────────────────────────── */

function useCountdown(expiresAt: string) {
  const end = new Date(expiresAt).getTime();
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, end - Date.now())), 500);
    return () => clearInterval(t);
  }, [end]);
  return left;
}

function ExamSession({ info, attempt, onDone }: { info: ExamInfo; attempt: LiveAttempt; onDone: (o: AttemptOutcome) => void }) {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = useState<Record<string, OptionId>>(attempt.answers);
  const [index, setIndex] = useState(() => Math.max(0, attempt.questions.findIndex((q) => !attempt.answers[q.questionId])));
  const [dir, setDir] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const left = useCountdown(attempt.expiresAt);
  const total = attempt.questions.length;
  const q = attempt.questions[index]!;
  const answered = attempt.questions.filter((x) => answers[x.questionId]).length;
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(
    async (auto: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      setSubmitting(true);
      setConfirm(false);
      const res = await submitAssessment({ attemptId: attempt.id, answers: answersRef.current });
      if (!res.ok) {
        submitted.current = false;
        setSubmitting(false);
        toast.error(res.error);
        return;
      }
      if (auto) toast.info("Time is up. Your assessment was submitted automatically.");
      onDone(res.data);
    },
    [attempt.id, onDone],
  );

  useEffect(() => {
    if (left <= 0) void submit(true);
  }, [left, submit]);

  // Warn before leaving mid-exam.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  function choose(optionId: OptionId) {
    setAnswers((a) => ({ ...a, [q.questionId]: optionId }));
    void saveAnswer({ attemptId: attempt.id, questionId: q.questionId, optionId }).then((r) => {
      if (!r.ok) toast.error(r.error);
    });
  }

  function go(to: number) {
    if (to < 0 || to >= total) return;
    setDir(to > index ? 1 : -1);
    setIndex(to);
  }

  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  const urgent = left < 5 * 60_000;
  const critical = left < 60_000;

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky status bar */}
      <div className="sticky top-16 z-20 -mx-4 flex items-center gap-4 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur md:top-0 md:mx-0 md:rounded-md md:border md:px-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-sm font-medium">{info.title}</span>
          <div className="h-1.5 overflow-hidden rounded-pill bg-line" aria-hidden="true">
            <motion.div className="h-full origin-left rounded-pill bg-moss" animate={{ scaleX: answered / total }} transition={{ duration: 0.6, ease: EASE }} />
          </div>
          <span className="font-mono text-[11px] text-ink-soft">
            {answered}/{total} answered
          </span>
        </div>
        <div
          role="timer"
          aria-live={critical ? "assertive" : "off"}
          aria-label={`${mins} minutes ${secs} seconds left`}
          className={cn(
            "flex items-center gap-2 rounded-pill px-4 py-2 font-mono text-lg font-medium tabular-nums transition-colors",
            critical ? "animate-pulse bg-danger-soft text-danger" : urgent ? "bg-warning-soft text-warning" : "bg-surface text-forest ring-1 ring-line",
          )}
        >
          <Clock aria-hidden="true" className="size-4" />
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Question */}
        <div className="relative min-w-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.fieldset
              key={q.questionId}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -48 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col gap-6 rounded-md border border-line bg-surface p-5 shadow-card md:p-8"
            >
              <legend className="contents">
                <span className="font-mono text-xs tracking-[0.14em] text-moss-text uppercase">
                  Question {index + 1} of {total}
                </span>
                <span className="mt-3 block text-lg leading-snug font-medium md:text-xl">{q.text}</span>
              </legend>
              <div role="radiogroup" aria-label={`Answer for question ${index + 1}`} className="flex flex-col gap-3">
                {q.options.map((o, k) => {
                  const selected = answers[q.questionId] === o.id;
                  return (
                    <motion.button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => choose(o.id)}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      initial={reduce ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 + k * 0.05, ease: EASE }}
                      className={cn(
                        "group flex min-h-14 items-center gap-4 rounded-sm border px-4 py-3 text-left transition-[border-color,background-color] duration-300",
                        selected ? "border-moss bg-mint-soft" : "border-line bg-canvas hover:border-moss/50 hover:bg-surface",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm uppercase transition-colors duration-300",
                          selected ? "border-moss bg-moss text-white" : "border-line-strong text-ink-soft group-hover:border-moss",
                        )}
                      >
                        {String.fromCharCode(97 + k)}
                      </span>
                      <span className="flex-1">{o.text}</span>
                      {selected && <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-moss" />}
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
                <Button variant="secondary" size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
                  <ArrowLeft aria-hidden="true" /> Previous
                </Button>
                {index < total - 1 ? (
                  <Button size="sm" onClick={() => go(index + 1)}>
                    Next <ArrowRight aria-hidden="true" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setConfirm(true)}>
                    <Flag aria-hidden="true" /> Finish
                  </Button>
                )}
              </div>
            </motion.fieldset>
          </AnimatePresence>
        </div>

        {/* Navigator */}
        <aside aria-label="Question navigator" className="flex flex-col gap-4 rounded-md border border-line bg-surface p-5 lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-medium">Questions</p>
          <ol className="grid grid-cols-5 gap-2">
            {attempt.questions.map((x, i) => {
              const isAnswered = Boolean(answers[x.questionId]);
              return (
                <li key={x.questionId}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index ? "step" : undefined}
                    aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}`}
                    className={cn(
                      "flex aspect-square w-full items-center justify-center rounded-sm font-mono text-xs transition-all duration-300",
                      i === index && "ring-2 ring-forest ring-offset-2 ring-offset-surface",
                      isAnswered ? "bg-moss text-white" : "bg-canvas-2 text-ink-soft hover:bg-line",
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <Button onClick={() => setConfirm(true)} loading={submitting} className="w-full">
            Submit assessment
          </Button>
        </aside>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit your assessment?</DialogTitle>
            <DialogDescription>
              You have answered {answered} of {total} questions.
              {answered < total ? ` ${total - answered} unanswered question${total - answered === 1 ? "" : "s"} will be marked incorrect.` : ""} You cannot change answers after submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep reviewing
            </Button>
            <Button loading={submitting} onClick={() => void submit(false)}>
              Submit now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Result ────────────────────────────────────────────────────────────── */

function ExamResult({ info, outcome, attemptsLeft, fresh }: { info: ExamInfo; outcome: AttemptOutcome; attemptsLeft: number; fresh: boolean }) {
  const reduce = useReducedMotion();
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, outcome.percent));

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-6 overflow-hidden rounded-md border border-line bg-surface p-8 text-center shadow-float md:p-12"
      aria-live="polite"
    >
      {outcome.passed && fresh && !reduce && <Burst />}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={outcome.passed ? "var(--color-moss)" : "var(--color-danger)"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: reduce ? 0 : 1.6, ease: EASE, delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-medium tracking-tight">{outcome.grade}</span>
          <span className="font-mono text-sm text-ink-soft">
            {outcome.correct}/{outcome.total} · {Math.round(pct)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        {outcome.passed ? (
          <>
            <CheckCircle2 aria-hidden="true" className="size-7 text-moss" />
            <h1 className="text-2xl font-medium tracking-tight">{fresh ? "Congratulations, you passed!" : "You passed this assessment"}</h1>
            <p className="max-w-sm text-ink-soft">Your certificate for {info.courseTitle} is unlocked and ready to view, share and download.</p>
          </>
        ) : (
          <>
            <XCircle aria-hidden="true" className="size-7 text-danger" />
            <h1 className="text-2xl font-medium tracking-tight">{fresh ? "Not quite there yet" : "Your latest result"}</h1>
            <p className="max-w-sm text-ink-soft">
              You need {info.passingPercent}% to pass.{" "}
              {attemptsLeft > 0 ? `You have ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left; revise the levels and try again.` : "You have used all attempts. Contact Rehydria support for a re-attempt."}
            </p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {outcome.passed ? (
          <Button asChild size="lg">
            <Link href={routes.dashboard.certificates}>
              <Award aria-hidden="true" /> View my certificate
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary" size="lg">
          <Link href={routes.dashboard.course(info.courseId)}>Back to course</Link>
        </Button>
      </div>
    </motion.section>
  );
}

/** A short celebratory burst of particles (decorative). */
function Burst() {
  const pieces = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const dist = 140 + (i % 4) * 30;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rot: (i * 47) % 360, color: ["#367A65", "#B8E4C9", "#173F35", "#E9B949"][i % 4]!, delay: (i % 5) * 0.03 };
  });
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-[118px] left-1/2">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block h-2.5 w-1.5 rounded-[1px]"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: p.y + 60, opacity: 0, rotate: p.rot + 360, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.9 + p.delay, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
