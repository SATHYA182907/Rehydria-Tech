"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";

/** Giant outlined "REHYDRIA" that rises and fills as the footer scrolls into view. */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const letters = el.querySelectorAll<HTMLElement>("[data-letter]");
      return whenNear(el, () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        gsap.from(letters, {
          yPercent: 70,
          opacity: 0,
          stagger: 0.04,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: 0.8 },
        });
      });
      return () => mm.revert();
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none overflow-hidden select-none">
      <div className="mx-auto flex max-w-[1440px] justify-between px-4 text-[clamp(4rem,19vw,17.5rem)] leading-[0.78] font-semibold tracking-[-0.06em] sm:px-8 lg:px-10">
        {"REHYDRIA".split("").map((letter, i) => (
          <span
            key={i}
            data-letter
            className="inline-block text-transparent [-webkit-text-stroke:1px_rgb(184_228_201/0.35)]"
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
