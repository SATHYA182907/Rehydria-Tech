"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** CSS selector (within this element) for items to stagger. Defaults to direct children. */
  items?: string;
  stagger?: number;
  y?: number;
  delay?: number;
}

/**
 * Staggered fade-and-rise entrance for groups of cards, list items or blocks, played once
 * when the group scrolls into view. Uses ScrollTrigger.batch so long grids animate row by row.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  items = ":scope > *",
  stagger = 0.08,
  y = 32,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = Array.from(el.querySelectorAll<HTMLElement>(items));
      if (targets.length === 0) return;
      return whenNear(el, () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.set(targets, { opacity: 0, y });
        const triggers = ScrollTrigger.batch(targets, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger, delay, ease: "expo.out", overwrite: true }),
        });
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
      });
    },
    { scope: ref, dependencies: [items, stagger, y, delay] },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

