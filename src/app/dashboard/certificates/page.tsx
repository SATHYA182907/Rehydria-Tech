import { Award, Check, ExternalLink, Lock, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requestTime } from "@/lib/utils/time";
import { CertificateDocument } from "@/components/certificates/certificate-document";
import { CertificateReveal } from "@/components/certificates/certificate-reveal";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/feedback";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { requireUser } from "@/services/auth/session";
import { getStudentCertificates, getStudentEnrollments } from "@/services/student";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const user = await requireUser("/dashboard/certificates");
  const [certificates, enrollments] = await Promise.all([getStudentCertificates(user.uid), getStudentEnrollments(user.uid)]);
  const now = requestTime();
  const DAY = 86_400_000;
  const isAvailable = (c: (typeof certificates)[number]) => !c.availableAt || Date.parse(c.availableAt) <= now;
  const earned = certificates.filter((c) => (c.status === "valid" || c.status === "revoked") && isAvailable(c));
  const earnedCourses = new Set(earned.map((c) => c.courseId));
  const waitingCert = new Map(certificates.filter((c) => c.status === "valid" && !isAvailable(c)).map((c) => [c.courseId, c]));
  const locked = enrollments.filter((e) => !earnedCourses.has(e.courseId));
  const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <>
      <DashboardHeader eyebrow="Achievements" title="Certificates" description="Complete every level, pass the final assessment and finish the 2-week internship period to unlock your verifiable certificate." />

      {earned.length === 0 && locked.length === 0 ? (
        <EmptyState
          icon={<Award aria-hidden="true" />}
          title="No certificates yet"
          description="Enroll in an internship course to start working towards your certificate."
          action={
            <Button asChild>
              <Link href={routes.dashboard.courses}>Go to my courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          {earned.length > 0 && (
            <section aria-labelledby="earned" className="flex flex-col gap-5">
              <h2 id="earned" className="text-xl font-medium">
                Unlocked
              </h2>
              <ul className={cn("grid gap-10", earned.length === 1 ? "max-w-4xl" : "xl:grid-cols-2")}>
                {earned.map((c, i) => (
                  <li key={c.id} className="flex flex-col gap-4">
                    <CertificateReveal index={i}>
                      <CertificateDocument cert={c} />
                    </CertificateReveal>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {c.status === "valid" ? <Badge variant="success">Valid</Badge> : <Badge variant="danger">Revoked</Badge>}
                        <span className="font-mono text-xs text-ink-soft">{c.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/verify/${c.id}`} target="_blank">
                            Verify <ExternalLink aria-hidden="true" />
                          </Link>
                        </Button>
                        {c.status === "valid" && (
                          <Button asChild size="sm">
                            <Link href={`/certificate/${c.id}`} target="_blank">
                              <Printer aria-hidden="true" /> Download / print
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {locked.length > 0 && (
            <section aria-labelledby="locked" className="flex flex-col gap-5">
              <h2 id="locked" className="text-xl font-medium">
                Locked
              </h2>
              <ul className="grid gap-5 md:grid-cols-2">
                {locked.map((e) => {
                  const levelsDone = e.progress.percent >= 100;
                  const startedMs = e.activatedAt ? Date.parse(e.activatedAt) : now;
                  const endMs = startedMs + e.periodDays * DAY;
                  const waiting = waitingCert.get(e.courseId);
                  const unlockMs = waiting?.availableAt ? Date.parse(waiting.availableAt) : endMs;
                  const day = Math.min(e.periodDays, Math.max(1, Math.floor((now - startedMs) / DAY) + 1));
                  const daysLeft = Math.max(0, Math.ceil((unlockMs - now) / DAY));
                  const steps = [
                    { label: "Complete all levels", done: levelsDone, detail: `${e.progress.percent}%` },
                    { label: "Pass the final assessment", done: e.assessmentPassed, detail: levelsDone ? "Unlocked" : "Locked" },
                    ...(e.periodDays > 0
                      ? [{ label: `Complete the ${e.periodDays}-day internship`, done: now >= unlockMs, detail: `Day ${day} of ${e.periodDays}` }]
                      : []),
                  ];
                  return (
                    <li key={e.id} className="relative overflow-hidden rounded-md border border-dashed border-line-strong bg-canvas-2 p-6">
                      {/* Blurred certificate silhouette */}
                      <div aria-hidden="true" className="pointer-events-none absolute -top-6 -right-10 w-64 rotate-6 opacity-40 blur-[2px] grayscale">
                        <div className="aspect-[297/210] rounded-sm border-4 border-line-strong bg-surface" />
                      </div>
                      <div className="relative flex flex-col gap-5">
                        <span className="flex size-12 items-center justify-center rounded-full bg-surface text-ink-soft shadow-card">
                          <Lock aria-hidden="true" className="size-5" />
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-ink-soft">{e.code}</span>
                          <h3 className="text-lg font-medium tracking-tight">{e.title}</h3>
                        </div>
                        <Progress value={e.progress.percent} showValue label={`${e.title} progress`} />
                        {waiting && (
                          <p className="rounded-sm bg-mint-soft px-4 py-3 text-sm text-forest">
                            Assessment passed with grade <strong className="font-medium">{waiting.grade}</strong>. Your certificate unlocks on{" "}
                            <strong className="font-medium">{longDate.format(new Date(unlockMs))}</strong> ({daysLeft} day{daysLeft === 1 ? "" : "s"} to go).
                          </p>
                        )}
                        <ol className="flex flex-col gap-2">
                          {steps.map((s) => (
                            <li key={s.label} className="flex items-center gap-3 text-sm">
                              <span className={cn("flex size-6 items-center justify-center rounded-full", s.done ? "bg-moss text-white" : "bg-surface text-ink-soft ring-1 ring-line")}>
                                {s.done ? <Check aria-hidden="true" className="size-3.5" /> : <Lock aria-hidden="true" className="size-3" />}
                              </span>
                              <span className={cn("flex-1", s.done && "text-ink-soft line-through")}>{s.label}</span>
                              <span className="font-mono text-xs text-ink-soft">{s.done ? "Done" : s.detail}</span>
                            </li>
                          ))}
                        </ol>
                        {!waiting && (
                          <Button asChild size="sm" className="w-fit">
                            <Link href={levelsDone ? routes.dashboard.assessment(e.courseId) : routes.dashboard.course(e.courseId)}>
                              {levelsDone ? "Take the assessment" : "Continue course"}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
