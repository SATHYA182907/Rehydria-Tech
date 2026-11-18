"use client";

import { useSyncExternalStore } from "react";
import { INTRO_SESSION_KEY } from "./intro-boot";

/**
 * Homepage intro state (once per browser session):
 *
 *  - The preloader plays on the first desktop visit, then calls `markIntroDone({ played: true })`.
 *  - The hero runs its choreographed entrance only if `consumeEntrance()` returns true,
 *    i.e. right after the preloader played. Repeat visits, client-side navigation back to
 *    "/", phones/tablets and reduced motion render the hero immediately.
 *
 * State lives in this module and sessionStorage rather than only on <html> attributes,
 * because the root element's attributes are not guaranteed to survive client navigation.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let done = false;
let entrancePending = false;

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
  } catch {
    return true; // storage unavailable: never block content behind an intro
  }
}

/** True when the intro should not play (boot script decision or already seen). */
export function isIntroSkipped(): boolean {
  if (typeof document === "undefined") return false;
  return done || document.documentElement.dataset.intro === "skip" || seenThisSession();
}

export function markIntroDone({ played }: { played: boolean }): void {
  if (done) return;
  done = true;
  entrancePending = played;
  document.documentElement.dataset.intro = played ? "played" : "skip";
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); nothing else depends on it.
  }
  listeners.forEach((l) => l());
}

/** Returns true exactly once, after the preloader has played. */
export function consumeEntrance(): boolean {
  const pending = entrancePending;
  entrancePending = false;
  return pending;
}

export function useIntroDone(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => done || isIntroSkipped(),
    () => false,
  );
}
