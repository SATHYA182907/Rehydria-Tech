import "server-only";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME } from "@/config/routes";
import { appEnv } from "@/lib/env/server";
import { adminApp, isFirebaseConfigured } from "@/lib/firebase/admin";
import { fullNameSchema, indianMobileSchema, toE164India } from "@/lib/validations/common";
import { ensureUserProfile } from "@/services/auth/profile";
import { getLandingPath } from "@/services/student";
import { getSessionUser, SIGNED_IN_HINT_COOKIE } from "@/services/auth/session";
import { clientIp, rateLimit } from "@/services/security/rate-limit";

/**
 * POST: exchange a fresh Firebase ID token for an httpOnly session cookie.
 * DELETE: sign out (clear cookies, revoke refresh tokens).
 * See docs/ARCHITECTURE.md §5 and docs/SECURITY_PLAN.md §6.
 */

const bodySchema = z.object({
  idToken: z.string().min(20).max(4096),
  profile: z.object({ fullName: fullNameSchema, phone: indianMobileSchema }).optional(),
});

const RECENT_SIGN_IN_SECONDS = 5 * 60;

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return origin === req.nextUrl.origin || origin === appEnv().siteUrl;
}

function unavailable() {
  return NextResponse.json(
    { error: "Sign-in is not available yet: server credentials are not configured." },
    { status: 503 },
  );
}

/** Logged server-side; the browser only gets a friendly message (never secrets or stacks). */
function serverFailure(stage: string, err: unknown) {
  console.error(`[auth/session] ${stage} failed:`, err instanceof Error ? err.message : err);
  return NextResponse.json(
    { error: "Sign-in is temporarily unavailable because of a server configuration problem. Please try again later.", stage },
    { status: 500 },
  );
}

export async function handlePost(req: NextRequest) {
  try {
    return await createSession(req);
  } catch (err) {
    return serverFailure("unexpected", err);
  }
}

async function createSession(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (!isFirebaseConfigured()) return unavailable();
  // Rate limit and body parsing are independent: run them together.
  const [limit, body] = await Promise.all([
    rateLimit("session", await clientIp(), 10, 600).then(
      (ok) => ({ ok }),
      (err: unknown) => ({ err }),
    ),
    req.json().catch(() => null),
  ]);
  // Firestore unreachable usually means the service-account credentials are wrong.
  if ("err" in limit) return serverFailure("firestore", limit.err);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const auth = getAuth(adminApp());
  let decoded;
  try {
    decoded = await auth.verifyIdToken(parsed.data.idToken, true);
  } catch (err) {
    console.warn("[auth/session] token rejected:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Your sign-in could not be verified. Please try again." }, { status: 401 });
  }
  if (Date.now() / 1000 - decoded.auth_time > RECENT_SIGN_IN_SECONDS) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const days = appEnv().sessionCookieDays;
  const expiresIn = days * 24 * 60 * 60 * 1000;
  const isAdmin = decoded.admin === true;
  // Cookie, profile and the student's landing page are independent: one parallel round.
  const [sessionCookie, , landing] = await Promise.all([
    auth.createSessionCookie(parsed.data.idToken, { expiresIn }),
    ensureUserProfile({
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      fullName: parsed.data.profile?.fullName,
      phone: parsed.data.profile ? toE164India(parsed.data.profile.phone) : null,
    }),
    isAdmin ? Promise.resolve("/admin") : getLandingPath(decoded.uid).catch(() => "/dashboard/courses"),
  ]);

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE_NAME, sessionCookie, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: expiresIn / 1000 });
  jar.set(SIGNED_IN_HINT_COOKIE, isAdmin ? "admin" : "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: expiresIn / 1000 });
  return NextResponse.json({ ok: true, isAdmin, landing });
}

export async function handleDelete(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE_NAME)?.value;
  jar.delete(SESSION_COOKIE_NAME);
  jar.delete(SIGNED_IN_HINT_COOKIE);
  if (cookie && isFirebaseConfigured()) {
    try {
      const auth = getAuth(adminApp());
      const decoded = await auth.verifySessionCookie(cookie);
      await auth.revokeRefreshTokens(decoded.sub);
    } catch {
      // Already invalid: clearing the cookie is enough.
    }
  }
  return NextResponse.json({ ok: true });
}

/** GET: is the session cookie still valid? Clears the UI hint cookie when it is not. */
export async function handleGet() {
  const user = await getSessionUser();
  if (!user) {
    const jar = await cookies();
    if (jar.get(SIGNED_IN_HINT_COOKIE)) jar.delete(SIGNED_IN_HINT_COOKIE);
  }
  return NextResponse.json({ signedIn: Boolean(user), isAdmin: user?.isAdmin === true }, { headers: { "Cache-Control": "no-store" } });
}
