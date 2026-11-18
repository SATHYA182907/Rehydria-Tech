"use client";

import { ScrollTrigger } from "@/lib/gsap";

type Cleanup = void | (() => void);

let refreshQueued = false;

/** Coalesces refreshes when several sections initialise in the same frame. */
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
}

/**
 * Runs `init` once `el` comes within `margin` of the viewport, instead of during
 * hydration. Splits animation setup (SplitText, ScrollTriggers) out of the main hydration
 * task, which keeps Total Blocking Time low. Returns a cleanup that disconnects the
 * observer and runs init's cleanup if it already ran.
 *
 * Elements are still fully visible and server-rendered before init; any initial
 * "from" states are applied while they are offscreen, so there is no flash.
 */
export function whenNear(el: Element, init: () => Cleanup, { margin = "60% 0px", refresh = false } = {}): () => void {
  let cleanup: Cleanup;
  let done = false;
  const io = new IntersectionObserver(
    (entries) => {
      if (done || !entries.some((e) => e.isIntersecting)) return;
      done = true;
      io.disconnect();
      cleanup = init();
      if (refresh) queueRefresh();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  return () => {
    io.disconnect();
    if (typeof cleanup === "function") cleanup();
  };
}
