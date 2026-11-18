"use client";

import { signOut, type UserCredential } from "firebase/auth";
import { useSyncExternalStore } from "react";
import { clientAuth } from "@/lib/firebase/client";

export interface RegistrationProfile {
  fullName: string;
  phone: string;
}

/**
 * Exchanges the signed-in user's fresh ID token for the server session cookie, then signs the
 * browser SDK out (the httpOnly cookie is the only session). Throws a user-facing message.
 */
export async function createServerSession(credential: UserCredential, profile?: RegistrationProfile): Promise<{ isAdmin: boolean }> {
  const idToken = await credential.user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, profile }),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string; isAdmin?: boolean };
  await signOut(await clientAuth());
  if (!res.ok) throw new Error(body.error ?? "Sign-in failed. Please try again.");
  notify();
  return { isAdmin: body.isAdmin === true };
}

export async function destroyServerSession(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  notify();
}

/** Only allows same-site relative redirects after sign-in (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/* Signed-in hint (non-httpOnly cookie set by the session route; contains no secret). */
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function readHint(): "admin" | "student" | null {
  const match = document.cookie.match(/(?:^|;\s*)rh_signed_in=([^;]+)/);
  if (!match) return null;
  return match[1] === "admin" ? "admin" : "student";
}

/** UI-only signed-in state for navigation. Never used for authorization. */
export function useSignedInHint(): "admin" | "student" | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readHint,
    () => null,
  );
}

/** Maps Firebase Auth error codes to friendly messages. */
export function authErrorMessage(err: unknown): string {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The sign-in window was closed before finishing.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled yet.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "This link is invalid or has expired. Please request a new one.";
    default:
      return err instanceof Error && !code ? err.message : "Something went wrong. Please try again.";
  }
}
