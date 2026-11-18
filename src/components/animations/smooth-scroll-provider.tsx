"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { createContext, Suspense, use, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null (dashboards, reduced motion, SSR). */
export function useLenis(): Lenis | null {
  return use(LenisContext);
}

/**
 * Smooth scrolling for marketing pages. Lenis is driven by GSAP's ticker so Lenis and
 * ScrollTrigger share one requestAnimationFrame loop (docs/ARCHITECTURE.md §6).
 * Not started when the user prefers reduced motion.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Touch devices keep native scrolling: Lenis does not smooth touch input, so its
    // frame loop would only cost CPU there.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    const start = () => {
      instance = new Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 1, anchors: true });
      instance.on("scroll", ScrollTrigger.update);
      tick = (time: number) => instance?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(instance);
    };

    const stop = () => {
      if (tick) gsap.ticker.remove(tick);
      instance?.destroy();
      instance = null;
      tick = null;
      setLenis(null);
    };

    if (!reduce.matches) start();
    const onChange = () => (reduce.matches ? stop() : start());
    reduce.addEventListener("change", onChange);

    // Fonts change line breaks, so trigger positions must be recomputed once they load.
    void document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      reduce.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  return (
    <LenisContext value={lenis}>
      {children}
      {/* Reads the pathname (runtime data on dynamic routes), so it sits in its own boundary. */}
      <Suspense fallback={null}>
        <RouteChangeReset lenis={lenis} />
      </Suspense>
    </LenisContext>
  );
}

/**
 * Client-side navigation: jump to top and recompute triggers for the new DOM. Skipped on the
 * initial load, where ScrollTrigger's own load handling already measures; a forced refresh
 * there is a full-page layout pass that costs hundreds of ms on mid-range phones.
 */
function RouteChangeReset({ lenis }: { lenis: Lenis | null }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    lenis?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname, lenis]);
  return null;
}

/** Pauses smooth scrolling while an overlay (dialog, sheet, menu) is open. */
export function useLenisLock(locked: boolean): void {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis || !locked) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, locked]);
}
