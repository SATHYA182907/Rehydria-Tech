import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME } from "@/config/routes";
import { appEnv } from "@/lib/env/server";
import { adminApp, isFirebaseConfigured } from "@/lib/firebase/admin";
import { fullNameSchema, indianMobileSchema, toE164India } from "@/lib/validations/common";
import { ensureUserProfile } from "@/services/auth/profile";
import { SIGNED_IN_HINT_COOKIE } from "@/services/auth/session";
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

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (!isFirebaseConfigured()) return unavailable();
  if (!(await rateLimit("session", await clientIp(), 10, 600))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const auth = getAuth(adminApp());
  try {
    const decoded = await auth.verifyIdToken(parsed.data.idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > RECENT_SIGN_IN_SECONDS) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const days = appEnv().sessionCookieDays;
    const expiresIn = days * 24 * 60 * 60 * 1000;
    const sessionCookie = await auth.createSessionCookie(parsed.data.idToken, { expiresIn });

    await ensureUserProfile({
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      fullName: parsed.data.profile?.fullName,
      phone: parsed.data.profile ? toE164India(parsed.data.profile.phone) : null,
    });

    const jar = await cookies();
    const secure = process.env.NODE_ENV === "production";
    jar.set(SESSION_COOKIE_NAME, sessionCookie, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: expiresIn / 1000 });
    jar.set(SIGNED_IN_HINT_COOKIE, decoded.admin === true ? "admin" : "1", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: expiresIn / 1000 });
    return NextResponse.json({ ok: true, isAdmin: decoded.admin === true });
  } catch {
    return NextResponse.json({ error: "Your sign-in could not be verified. Please try again." }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
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
