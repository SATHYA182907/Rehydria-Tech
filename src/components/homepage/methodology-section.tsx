"use client";

import { useRef } from "react";
import { Accent, Container, Eyebrow } from "@/components/layout/section";
import { methodology } from "@/content/home";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";

/**
 * Learning methodology: a sticky heading beside a vertical timeline. A circuit trace
 * draws down the timeline in step with scroll, and each step's node "powers on" as the
 * trace reaches it. Reduced motion: the trace is fully drawn and all nodes are on.
 */
export function MethodologySection() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      return whenNear(root, () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const list = root.querySelector<HTMLElement>("[data-steps]");
        gsap.fromTo(
          root.querySelector("[data-trace-fill]"),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: true },
          },
        );
        gsap.utils.toArray<HTMLElement>("[data-step]", root).forEach((step) => {
          const node = step.querySelector("[data-node]");
          const body = step.querySelectorAll("[data-step-body]");
          gsap
            .timeline({ scrollTrigger: { trigger: step, start: "top 62%", toggleActions: "play none none reverse" } })
            .to(node, { backgroundColor: "#173f35", borderColor: "#173f35", color: "#b8e4c9", scale: 1.08, duration: 0.4, ease: "power2.out" })
            .from(body, { opacity: 0.25, x: 16, duration: 0.7, stagger: 0.06, ease: "expo.out" }, 0);
        });
      });
      return () => mm.revert();
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} aria-labelledby="method-title" className="relative bg-canvas py-[clamp(96px,12vw,200px)]">
      <Container className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex flex-col gap-6 lg:sticky lg:top-32">
            <Eyebrow>03 — How you learn</Eyebrow>
            <h2 id="method-title" className="text-display-md font-medium">
              From first lesson to <Accent className="text-moss">verified</Accent> skill.
            </h2>
            <p className="max-w-[44ch] text-lg leading-relaxed text-ink-soft">
              A clear path through every program, so you always know what comes next and what you have achieved.
            </p>
          </div>
        </div>

        <ol data-steps className="relative lg:col-span-6 lg:col-start-7">
          {/* Trace: static track + scroll-driven fill */}
          <span aria-hidden="true" className="absolute top-6 bottom-6 left-[23px] w-px bg-line-strong" />
          <span
            data-trace-fill
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-[22px] w-[3px] origin-top rounded-full bg-gradient-to-b from-moss to-forest motion-reduce:scale-y-100"
          />
          {methodology.map((item) => (
            <li key={item.step} data-step className="relative flex gap-6 pb-14 last:pb-0 md:gap-10">
              <span
                data-node
                className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-canvas font-mono text-xs text-ink-soft motion-reduce:border-forest motion-reduce:bg-forest motion-reduce:text-mint"
              >
                {item.step}
              </span>
              <div className="flex flex-col gap-3 pt-2.5">
                <h3 data-step-body className="text-2xl font-medium tracking-tight md:text-3xl">
                  {item.title}
                </h3>
                <p data-step-body className="max-w-[52ch] leading-relaxed text-ink-soft md:text-lg">
                  {item.body}
                </p>
                <p data-step-body className="font-mono text-[11px] uppercase tracking-[0.14em] text-moss">
                  {item.meta}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
