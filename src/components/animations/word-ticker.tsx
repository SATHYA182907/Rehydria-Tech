"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";
import { cn } from "@/lib/utils/cn";

/**
 * Kinetic word ticker: letters of the current word roll up and out while the next word's
 * letters roll in from below, staggered. Loops only while on screen. All words are
 * stacked in one grid cell (no layout shift); screen readers get the full list once.
 * Reduced motion: the first word is shown statically.
 */
export function WordTicker({ words, className }: { words: readonly string[]; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      return whenNear(root, () => {
        const mm = gsap.matchMedia();
        mm.add(MOTION_QUERIES.motion, () => {
          const items = gsap.utils.toArray<HTMLElement>("[data-word]", root);
          const splits = items.map((el) => SplitText.create(el, { type: "chars", aria: "none" }));
          gsap.set(items, { autoAlpha: 1 });
          splits.forEach((s, i) => gsap.set(s.chars, { yPercent: i === 0 ? 0 : 110, opacity: i === 0 ? 1 : 0 }));

          const tl = gsap.timeline({ repeat: -1, paused: true });
          splits.forEach((current, i) => {
            const next = splits[(i + 1) % splits.length]!;
            tl.to(current.chars, { yPercent: -110, opacity: 0, rotateX: 60, duration: 0.55, stagger: 0.03, ease: "power3.in" }, "+=1.6")
              .fromTo(
                next.chars,
                { yPercent: 110, opacity: 0, rotateX: -60 },
                // immediateRender:false: the loop's last tween targets the FIRST word; rendering its
                // start state at build time would hide the word that should be visible on load.
                { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.75, stagger: 0.035, ease: "expo.out", immediateRender: false },
                "-=0.25",
              );
          });

          const st = ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
          });
          return () => {
            st.kill();
            tl.kill();
            splits.forEach((s) => s.revert());
          };
        });
        return () => mm.revert();
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={cn("relative inline-grid align-bottom [perspective:600px]", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      {words.map((w, i) => (
        <span
          key={w}
          data-word
          aria-hidden="true"
          className={cn("col-start-1 row-start-1 whitespace-nowrap [transform-style:preserve-3d]", i > 0 && "invisible")}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
