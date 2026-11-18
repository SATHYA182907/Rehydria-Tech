import "server-only";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE_NAME } from "@/config/routes";
import { adminApp, isFirebaseConfigured } from "@/lib/firebase/admin";

/**
 * Data Access Layer: the only place that turns the session cookie into an identity.
 * Every protected page, Server Action and Route Handler calls these helpers; the optimistic
 * check in proxy.ts is never trusted (docs/SECURITY_PLAN.md §6).
 */

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
}

/** Non-httpOnly hint cookie so client UI can show "Dashboard" vs "Log in". Contains no secret. */
export const SIGNED_IN_HINT_COOKIE = "rh_signed_in";

function toSessionUser(decoded: DecodedIdToken): SessionUser {
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: (decoded.name as string | undefined) ?? null,
    isAdmin: decoded.admin === true,
    emailVerified: decoded.email_verified === true,
  };
}

/**
 * Verified current user or null. Memoised per request. `checkRevoked` makes sign-out and
 * admin-claim changes take effect immediately.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookie || !isFirebaseConfigured()) return null;
  try {
    const decoded = await getAuth(adminApp()).verifySessionCookie(cookie, true);
    return toSessionUser(decoded);
  } catch {
    return null;
  }
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Admin-only. Non-admins get a 404 so the admin area is not discoverable. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!user.isAdmin) notFound();
  return user;
}
