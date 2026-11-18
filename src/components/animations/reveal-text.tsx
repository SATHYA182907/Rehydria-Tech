"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, SplitText, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";

type RevealMode = "lines" | "words" | "scrub";

interface RevealTextProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /**
   * lines: masked line slide-up (headings) · words: staggered word rise
   * scrub: words brighten from a muted tone to full colour as you scroll (statements)
   */
  mode?: RevealMode;
  delay?: number;
  /** Play immediately instead of on scroll (above-the-fold use). */
  immediate?: boolean;
}

/** Large-text-safe start colour for scrub mode (3.8:1 on canvas, passes AA for ≥ 24px). */
const SCRUB_FROM = "#758078";

/**
 * Split-text reveal. Text is server-rendered and readable without JavaScript; animation is
 * progressive. Setup is deferred until the element nears the viewport (keeps hydration
 * light). `aria: "none"` keeps the split text as ordinary readable text, so no ARIA
 * attributes are added to non-interactive elements. Children must be static text.
 */
export function RevealText({
  children,
  as: Tag = "div",
  className,
  mode = "lines",
  delay = 0,
  immediate = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const setup = () => {
        const mm = gsap.matchMedia();
        mm.add(MOTION_QUERIES.motion, () => {
          const finalColor = getComputedStyle(el).color;
          const split = SplitText.create(el, {
            type: mode === "lines" ? "lines" : "words",
            mask: mode === "lines" ? "lines" : undefined,
            linesClass: "reveal-line",
            aria: "none",
            autoSplit: true,
            onSplit(self) {
              if (mode === "scrub") {
                return gsap.fromTo(
                  self.words,
                  { color: SCRUB_FROM },
                  {
                    color: finalColor,
                    ease: "none",
                    stagger: 0.05,
                    scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
                  },
                );
              }
              const targets = mode === "lines" ? self.lines : self.words;
              return gsap.from(targets, {
                yPercent: mode === "lines" ? 110 : 60,
                opacity: mode === "lines" ? 1 : 0,
                duration: mode === "lines" ? 1.1 : 0.9,
                stagger: mode === "lines" ? 0.09 : 0.035,
                delay,
                scrollTrigger: immediate ? undefined : { trigger: el, start: "top 85%", once: true },
              });
            },
          });
          return () => split.revert();
        });
        return () => mm.revert();
      };

      return immediate ? setup() : whenNear(el, setup);
    },
    { scope: ref, dependencies: [mode, delay, immediate] },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
