import "server-only";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { connection } from "next/server";
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

/** Verified current user or null, memoised per request. */
const verify = cache(async (checkRevoked: boolean): Promise<SessionUser | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookie || !isFirebaseConfigured()) return null;
  // Verification reads the clock (token expiry), so it must run at request time.
  await connection();
  try {
    const decoded = await getAuth(adminApp()).verifySessionCookie(cookie, checkRevoked);
    return toSessionUser(decoded);
  } catch {
    return null;
  }
});

/**
 * Students: the cookie's signature and expiry are verified locally (Google's public keys are
 * cached in memory), so page navigation needs no extra network round trip. Sign-out clears the
 * cookie and revokes refresh tokens.
 */
export const getSessionUser = () => verify(false);

/** Strict check including revocation (an extra call to Firebase Auth). Used for admins. */
export const getVerifiedSessionUser = () => verify(true);

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Admin-only. Non-admins get a 404 so the admin area is not discoverable. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getVerifiedSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/admin")}`);
  if (!user.isAdmin) notFound();
  return user;
}
