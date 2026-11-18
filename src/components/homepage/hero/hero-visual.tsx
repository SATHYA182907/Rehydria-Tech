"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useIntroDone } from "../intro-store";
import { CircuitArt } from "./circuit-art";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

const CAPABLE_QUERY = "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Hero visual. Always renders the SVG board (server-rendered, LCP-safe). On capable
 * desktops it lazily swaps in the WebGL scene after the intro finishes and the browser is
 * idle, cross-fading once the first frame is ready. Rendering pauses when offscreen.
 */
export function HeroVisual({ className }: { className?: string }) {
  const introDone = useIntroDone();
  const containerRef = useRef<HTMLDivElement>(null);
  const [want3D, setWant3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!introDone) return;
    const mql = window.matchMedia(CAPABLE_QUERY);
    if (!mql.matches || !supportsWebGL()) return;
    const schedule = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = schedule(() => setWant3D(true), { timeout: 2000 });
    return () => cancel(id);
  }, [introDone]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !want3D) return;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, [want3D]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "transition-opacity duration-700 [perspective:1600px]",
          ready ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="[transform:rotateX(52deg)_rotateZ(-32deg)] drop-shadow-[0_40px_40px_rgb(15_46_38/0.25)] [transform-style:preserve-3d]">
          <CircuitArt />
        </div>
      </div>
      {want3D && (
        <div className={cn("absolute inset-[-12%] transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
          <HeroScene active={inView} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
