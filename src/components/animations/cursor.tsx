"use client";

import { useRef } from "react";
import { gsap, MOTION_QUERIES, useGSAP } from "@/lib/gsap";

/**
 * Desktop follower cursor. Additive only: the system cursor stays visible.
 * Elements opt in with `data-cursor="View"` (label) or `data-cursor=""` (grow only).
 * Hidden over form fields. Not rendered for touch or reduced-motion users.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!dot || !label) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERIES.desktopPointer, () => {
      gsap.set(dot, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 1 });
      const xTo = gsap.quickTo(dot, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(dot, "y", { duration: 0.45, ease: "power3.out" });
      let state: "hidden" | "dot" | "active" = "hidden";

      const setState = (next: typeof state, text = "") => {
        if (next === state && !text) return;
        state = next;
        label.textContent = text;
        gsap.to(dot, {
          scale: next === "hidden" ? 0 : next === "active" ? (text ? 1 : 0.6) : 0.18,
          duration: 0.4,
          ease: "expo.out",
          overwrite: "auto",
        });
        gsap.to(label, { autoAlpha: next === "active" && text ? 1 : 0, duration: 0.2 });
      };

      const onMove = (event: PointerEvent) => {
        xTo(event.clientX);
        yTo(event.clientY);
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) {
          setState("hidden");
          return;
        }
        const hit = target?.closest<HTMLElement>("[data-cursor]");
        if (hit) setState("active", hit.dataset.cursor ?? "");
        else if (state !== "dot") setState("dot");
      };
      const onLeave = () => setState("hidden");

      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      return () => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        gsap.set(dot, { autoAlpha: 0 });
      };
    });
    return () => mm.revert();
  });

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none invisible fixed top-0 left-0 z-[100] flex size-20 items-center justify-center rounded-full bg-forest text-on-forest"
    >
      <span ref={labelRef} className="invisible font-mono text-[11px] uppercase tracking-[0.14em]" />
    </div>
  );
}
