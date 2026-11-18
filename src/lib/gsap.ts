"use client";

/**
 * Single registration point for GSAP plugins. Import gsap and plugins from here, never
 * directly, so plugins are registered exactly once and only in client bundles that animate.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1 });
  // Phones fire resize events when the address bar shows/hides while scrolling. Ignoring
  // them avoids re-measuring every trigger mid-scroll (a common source of mobile jank).
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Media queries used with gsap.matchMedia(); keep in sync with docs/DESIGN_SYSTEM.md §6. */
export const MOTION_QUERIES = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  desktopPointer: "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
