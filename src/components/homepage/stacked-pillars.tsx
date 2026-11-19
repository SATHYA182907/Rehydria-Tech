"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { CourseIllustration } from "@/components/courses/course-illustration";
import { pillars } from "@/content/home";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";
import { cn } from "@/lib/utils/cn";

const TONES = [
  { card: "bg-surface text-ink border-line", art: "bg-canvas text-forest", soft: "text-ink-soft", accent: "text-moss", chip: "bg-mint-soft text-forest" },
  { card: "bg-canvas-2 text-ink border-line-strong", art: "bg-surface text-forest", soft: "text-ink-soft", accent: "text-moss", chip: "bg-surface text-forest" },
  { card: "bg-forest text-on-forest border-forest", art: "bg-forest-deep text-mint", soft: "text-on-forest-soft", accent: "text-mint", chip: "bg-white/10 text-mint" },
] as const;

/**
 * The three services as sticky cards that stack on scroll. Each card pins a little lower
 * than the previous one (CSS sticky, so it works on phones without JavaScript). On
 * desktop with motion allowed, cards underneath scale down and dim as the next card
 * slides over, and each card's line art draws itself in.
 */
export function StackedPillars() {
  const ref = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      return whenNear(root, () => {
        const mm = gsap.matchMedia();
        const items = gsap.utils.toArray<HTMLElement>("[data-pillar]", root);

        // Line art draws in for everyone with motion allowed (cheap SVG stroke animation).
        mm.add(MOTION_QUERIES.motion, () => {
          items.forEach((item) => {
            const shapes = item.querySelectorAll<SVGGeometryElement>("[data-art] path, [data-art] circle, [data-art] rect");
            shapes.forEach((s) => {
              const len = typeof s.getTotalLength === "function" ? s.getTotalLength() : 200;
              gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
            });
            gsap.to(shapes, {
              strokeDashoffset: 0,
              duration: 1.6,
              stagger: 0.03,
              ease: "power2.inOut",
              scrollTrigger: { trigger: item, start: "top 75%", once: true },
            });
            gsap.from(item.querySelectorAll("[data-pillar-in]"), {
              y: 28,
              opacity: 0,
              duration: 1,
              stagger: 0.08,
              ease: "expo.out",
              scrollTrigger: { trigger: item, start: "top 75%", once: true },
            });
          });
        });

        // Stack effect: the card underneath recedes while the next slides over it.
        mm.add(MOTION_QUERIES.desktopPointer, () => {
          items.forEach((item, i) => {
            const next = items[i + 1];
            if (!next) return;
            const card = item.querySelector("[data-card]");
            const shade = item.querySelector("[data-shade]");
            const tl = gsap.timeline({ scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=180", scrub: true } });
            tl.to(card, { scale: 0.92 - (items.length - 2 - i) * 0.02, ease: "none" }, 0).to(shade, { opacity: 0.22, ease: "none" }, 0);
          });
        });
        return () => mm.revert();
      });
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className="relative flex flex-col gap-6 md:gap-10">
      {pillars.map((p, i) => {
        const t = TONES[i % TONES.length]!;
        return (
          <li key={p.title} data-pillar className="sticky" style={{ top: `calc(5.5rem + ${i * 1.25}rem)` }}>
            <article
              data-card
              className={cn(
                "relative grid origin-top overflow-hidden rounded-md border shadow-float will-change-transform md:min-h-[440px] md:grid-cols-12",
                t.card,
              )}
            >
              <div data-shade aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-forest-deep opacity-0" />
              <div className="flex flex-col gap-5 p-6 sm:p-8 md:col-span-7 md:justify-between md:p-10 lg:p-12">
                <div className="flex items-center justify-between">
                  <span data-pillar-in className={cn("font-mono text-xs tracking-[0.16em]", t.accent)}>
                    {String(i + 1).padStart(2, "0")} / {String(pillars.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  <h3 data-pillar-in className="text-[clamp(1.75rem,1.2rem+2.2vw,3.25rem)] leading-[1.02] font-medium tracking-[-0.035em]">
                    {p.title}
                  </h3>
                  <p data-pillar-in className={cn("max-w-[46ch] text-base leading-relaxed md:text-lg", t.soft)}>
                    {p.body}
                  </p>
                </div>
                <ul data-pillar-in className="flex flex-wrap gap-2">
                  {p.points.map((pt) => (
                    <li key={pt} className={cn("flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm", t.chip)}>
                      <Check aria-hidden="true" className="size-3.5" /> {pt}
                    </li>
                  ))}
                </ul>
                <Link
                  data-pillar-in
                  href={p.href}
                  className={cn("group inline-flex min-h-11 w-fit items-center gap-2 font-medium hover:underline", t.accent)}
                >
                  {p.cta}
                  <ArrowUpRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
              <div
                aria-hidden="true"
                className={cn("relative hidden items-center justify-center p-10 md:col-span-5 md:flex", t.art)}
              >
                <div className="absolute inset-0 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]" />
                <div data-art className="relative w-full max-w-[320px]">
                  <CourseIllustration motif={p.motif} />
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
