"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. Returns `serverFallback` during SSR and hydration so
 * markup is stable; the real value applies right after hydration.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

/** True when the user asked the OS to reduce motion. Defaults to true on the server (safest). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}

/** Desktop with a precise pointer: enables cursor, magnetic and tilt effects. */
export function useFinePointer(): boolean {
  return useMediaQuery("(min-width: 1024px) and (pointer: fine)", false);
}
