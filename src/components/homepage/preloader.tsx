"use client";

import { useRef, useState } from "react";
import { useLenisLock } from "@/components/animations/smooth-scroll-provider";
import { LogoMark } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { isIntroSkipped, markIntroDone, useIntroDone } from "./intro-store";

/**
 * First-visit preloader (≤ 1.7 s): the logo's circuit traces draw, a counter runs to 100,
 * then the panel lifts away to reveal the hero. Skipped for repeat visits in the same session
 * and for reduced motion (see INTRO_BOOT_SCRIPT). A CSS failsafe hides it after 3 s even if
 * JavaScript fails, so content can never be blocked.
 */
export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(true);
  const introDone = useIntroDone();
  useLenisLock(playing && !introDone);

  useGSAP(
    () => {
      const root = rootRef.current;
      const counter = counterRef.current;
      if (!root || !counter) return;

      if (isIntroSkipped()) {
        root.style.display = "none";
        markIntroDone({ played: false });
        setPlaying(false);
        return;
      }

      document.documentElement.style.overflow = "hidden";
      const traces = root.querySelectorAll<SVGPathElement>("[data-trace]");
      const count = { v: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          root.style.display = "none";
          document.documentElement.style.overflow = "";
          setPlaying(false);
        },
      });

      tl.set(traces, { strokeDasharray: 60, strokeDashoffset: 60 })
        .to(traces, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: "power2.inOut" }, 0)
        .from("[data-preloader-fade]", { opacity: 0, y: 12, duration: 0.6, stagger: 0.08, ease: "expo.out" }, 0.1)
        .to(
          count,
          {
            v: 100,
            duration: 1.05,
            ease: "power2.inOut",
            onUpdate: () => {
              counter.textContent = String(Math.round(count.v)).padStart(3, "0");
            },
          },
          0,
        )
        .to("[data-preloader-content]", { yPercent: -40, opacity: 0, duration: 0.5, ease: "power3.in" }, 1.1)
        // Hero starts while the panel is lifting, so the reveal feels continuous.
        .add(() => markIntroDone({ played: true }), 1.25)
        .to(root, { yPercent: -100, duration: 0.75, ease: "expo.inOut" }, 1.15)
        .to("[data-preloader-edge]", { scaleY: 0, duration: 0.6, ease: "expo.inOut" }, 1.2);

      return () => {
        document.documentElement.style.overflow = "";
      };
    },
    { scope: rootRef },
  );

  // Client-side navigation back to "/" after the intro: render nothing at all (no flash).
  if (introDone && !playing) return null;

  return (
    <div ref={rootRef} aria-hidden="true" className="preloader fixed inset-0 z-[90] flex flex-col bg-forest-deep text-on-forest">
      <div data-preloader-content className="flex flex-1 flex-col items-center justify-center gap-6">
        <LogoMark onDark className="size-20" />
        <p data-preloader-fade className="font-mono text-[11px] uppercase tracking-[0.3em] text-on-forest-soft">
          {siteConfig.legalName}
        </p>
      </div>
      <div data-preloader-content className="flex items-end justify-between px-5 pb-6 font-mono text-xs sm:px-10 sm:pb-10">
        <span data-preloader-fade className="uppercase tracking-[0.2em] text-on-forest-soft">
          {siteConfig.tagline}
        </span>
        <span ref={counterRef} className="text-5xl font-medium tabular-nums tracking-tight text-mint sm:text-7xl">
          000
        </span>
      </div>
      <div data-preloader-edge className="absolute inset-x-0 top-full h-24 origin-top rounded-b-[50%] bg-forest-deep" />
    </div>
  );
}
