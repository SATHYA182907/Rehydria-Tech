"use client";

import { BadgeCheck, Check, CreditCard, ListChecks, Sparkles } from "lucide-react";
import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils/cn";

export interface ShowcaseProgram {
  title: string;
  code: string;
}

const STEPS = [
  { label: "Learn the fundamentals", state: "done" },
  { label: "Build hands-on projects", state: "done" },
  { label: "Take the final assessment", state: "current" },
  { label: "Earn your certificate", state: "todo" },
] as const;

/** Simple QR-like glyph (decorative; the real QR is generated per certificate). */
function QrGlyph({ className }: { className?: string }) {
  const cells = [
    "1110111", "1010101", "1110111", "0001000", "1101011", "0110110", "1011101",
  ];
  return (
    <svg viewBox="0 0 7 7" aria-hidden="true" className={className} shapeRendering="crispEdges">
      {cells.flatMap((row, y) => [...row].map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)))}
    </svg>
  );
}

/**
 * Hero visual: a layered "learning journey" composition built from the platform's own UI
 * (program progress, assessment, verified certificate). Pure DOM/CSS, so it is light on
 * phones (two layers below 640px). Desktop (fine pointer, motion allowed) adds pointer
 * parallax and idle float.
 * The program title/code come from the first published course; nothing else is data.
 */
export function HeroShowcase({ program, className }: { program: ShowcaseProgram | null; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.desktopPointer, () => {
        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", root);
        const movers = layers.map((el) => ({
          depth: Number(el.dataset.depth ?? 1),
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
        }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(nx * 28 * m.depth);
            m.y(ny * 22 * m.depth);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        // Idle float on inner wrappers so it composes with the parallax transform.
        gsap.utils.toArray<HTMLElement>("[data-float]", root).forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 8 : -8, duration: 3.2 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        });
        // Progress bar fills; assessment dots answer one by one, then loop.
        gsap.fromTo("[data-progress]", { scaleX: 0.08 }, { scaleX: 0.68, duration: 2.2, ease: "expo.out", delay: 0.8 });
        gsap.fromTo(
          "[data-dot]",
          { backgroundColor: "rgba(54,122,101,0.12)" },
          { backgroundColor: "#367a65", duration: 0.25, stagger: { each: 0.12, repeat: -1, repeatDelay: 2.4 }, delay: 1.2 },
        );
        return () => window.removeEventListener("pointermove", onMove);
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} aria-hidden="true" className={cn("relative mx-auto aspect-[6/5] w-full max-w-[600px] select-none sm:aspect-[10/9]", className)}>
      {/* Backdrop: soft glow + concentric rings */}
      <div className="absolute inset-[6%] rounded-full bg-mint/40 blur-3xl max-sm:blur-2xl" />
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full text-moss/20" fill="none" stroke="currentColor">
        <circle cx="200" cy="200" r="190" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="140" />
        <circle cx="200" cy="200" r="90" strokeDasharray="2 6" />
      </svg>

      {/* Program progress (main card) */}
      <div data-depth="1" className="absolute top-[24%] left-0 z-10 w-[88%] sm:top-[14%] sm:z-auto sm:w-[66%]">
        <div data-float className="showcase-float rounded-md border border-line bg-surface p-4 shadow-float sm:p-5">
          <span className="rounded-xs bg-canvas-2 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-moss-text sm:text-[11px]">{program?.code ?? "PROGRAM"}</span>
          <p className="mt-3 text-[15px] leading-snug font-medium tracking-tight text-ink sm:text-lg">{program?.title ?? "Your internship"}</p>
          <ul className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-2.5">
            {STEPS.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-[12px] sm:text-sm">
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full sm:size-5",
                    s.state === "done" && "bg-moss text-white",
                    s.state === "current" && "border-2 border-moss",
                    s.state === "todo" && "border border-line-strong",
                  )}
                >
                  {s.state === "done" && <Check className="size-2.5 sm:size-3" strokeWidth={3} />}
                </span>
                <span className={s.state === "todo" ? "text-ink-soft" : "text-ink"}>{s.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <span className="rounded-pill bg-mint-soft px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-forest sm:text-xs">In progress</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line">
              <div data-progress className="h-full origin-left scale-x-[0.68] rounded-pill bg-moss" />
            </div>
          </div>
        </div>
      </div>

      {/* Verified certificate */}
      <div data-depth="1.8" className="absolute top-0 right-0 w-[56%] sm:w-[48%]">
        <div data-float className="showcase-float showcase-float--slow rotate-[4deg] rounded-md bg-gradient-to-br from-forest to-forest-deep p-4 text-on-forest shadow-float sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mint sm:text-[10px]">Certificate</p>
            <QrGlyph className="size-8 fill-mint/90 sm:size-10" />
          </div>
          <p className="mt-2 text-[13px] leading-snug font-medium sm:text-base">Certificate of completion</p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-mint sm:text-xs">
            <BadgeCheck className="size-3.5 sm:size-4" /> Verified online
          </p>
          <p className="mt-1 font-mono text-[9px] tracking-wider text-on-forest-soft sm:text-[10px]">RHT-XXXX-XXXX-XXXX</p>
        </div>
      </div>

      {/* Assessment */}
      <div data-depth="2.4" className="absolute right-[2%] bottom-[4%] hidden w-[44%] sm:block">
        <div data-float className="showcase-float rounded-md border border-line bg-surface p-4 shadow-float sm:p-5">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink sm:text-sm">
            <ListChecks className="size-3.5 text-moss sm:size-4" /> Final assessment
          </p>
          <div className="mt-3 grid grid-cols-5 gap-1 sm:gap-1.5">
            {Array.from({ length: 15 }, (_, i) => (
              <span key={i} data-dot className={cn("aspect-square rounded-[3px]", i < 9 ? "bg-moss" : "bg-moss/12")} />
            ))}
          </div>
          <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft sm:text-[10px]">Timed · auto-graded</p>
        </div>
      </div>

      {/* Chips (hidden on the smallest screens to keep it uncluttered) */}
      <div data-depth="3" className="absolute bottom-[8%] left-[4%] hidden sm:block">
        <div data-float className="showcase-float showcase-float--slow flex items-center gap-2 rounded-pill border border-white/80 bg-canvas/85 px-3.5 py-2 text-xs font-medium text-ink shadow-card backdrop-blur-md">
          <CreditCard className="size-3.5 text-moss" /> Secured by Razorpay
        </div>
      </div>
      <div data-depth="2" className="absolute top-[4%] left-[8%] hidden sm:block">
        <div data-float className="showcase-float flex items-center gap-2 rounded-pill border border-white/80 bg-canvas/85 px-3.5 py-2 text-xs font-medium text-ink shadow-card backdrop-blur-md">
          <Sparkles className="size-3.5 text-moss" /> Progress saved
        </div>
      </div>
    </div>
  );
}
