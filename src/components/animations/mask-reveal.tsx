"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";
import { cn } from "@/lib/utils/cn";

interface MaskRevealProps {
  children: ReactNode;
  className?: string;
  /** Direction the mask opens toward. */
  from?: "bottom" | "top" | "left" | "right";
  /** Adds a scrubbed parallax drift to the inner content. */
  parallax?: boolean;
}

const START_INSET: Record<NonNullable<MaskRevealProps["from"]>, string> = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
};

/**
 * Clip-path mask reveal with an inner scale-down (1.15 → 1), used for images and
 * illustration panels. Children should fill the frame (e.g. next/image with `fill`).
 */
export function MaskReveal({ children, className, from = "bottom", parallax = false }: MaskRevealProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const frame = frameRef.current;
      const inner = innerRef.current;
      if (!frame || !inner) return;
      return whenNear(frame, () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: frame, start: "top 85%", once: true } })
          .fromTo(
            frame,
            { clipPath: START_INSET[from] },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" },
          )
          .fromTo(inner, { scale: 1.15 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0.1);

        if (parallax) {
          gsap.fromTo(
            inner,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });
      return () => mm.revert();
      });
    },
    { scope: frameRef, dependencies: [from, parallax] },
  );

  return (
    <div ref={frameRef} className={cn("relative overflow-hidden", className)}>
      <div ref={innerRef} className={cn("absolute will-change-transform", parallax ? "-inset-y-[8%] inset-x-0" : "inset-0")}>
        {children}
      </div>
    </div>
  );
}
