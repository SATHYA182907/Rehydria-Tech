"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";
import { whenNear } from "@/lib/when-near";

interface CountUpProps {
  value: number;
  /** Decimal places shown. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

const formatters = new Map<number, Intl.NumberFormat>();
function format(value: number, decimals: number): string {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f.format(value);
}

/**
 * Animated number that counts up when scrolled into view. The final value is rendered on
 * the server (correct for SEO, no-JS and reduced motion); the animation starts from zero.
 */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1.8, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = `${prefix}${format(value, decimals)}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      return whenNear(el, () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.motion, () => {
        const counter = { n: 0 };
        el.textContent = `${prefix}${format(0, decimals)}${suffix}`;
        gsap.to(counter, {
          n: value,
          duration,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = `${prefix}${format(counter.n, decimals)}${suffix}`;
          },
        });
        return () => {
          el.textContent = final;
        };
      });
      return () => mm.revert();
      });
    },
    { scope: ref, dependencies: [value, decimals, prefix, suffix, duration] },
  );

  return (
    <span className={className}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {final}
      </span>
    </span>
  );
}
