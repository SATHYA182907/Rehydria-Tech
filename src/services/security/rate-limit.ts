import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/shared/collections";

/**
 * Fixed-window rate limiter backed by Firestore (docs/SECURITY_PLAN.md §8).
 * Keys look like `{action}:{ip-or-uid}`; documents expire via a TTL policy on `expireAt`.
 */
export async function rateLimit(action: string, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const id = `${action}:${key}`.replace(/[^A-Za-z0-9:._-]/g, "_").slice(0, 300);
  const ref = adminDb().collection(COLLECTIONS.rateLimits).doc(id);
  const now = Date.now();
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { count: number; windowStart: number } | undefined;
    if (!data || now - data.windowStart >= windowSeconds * 1000) {
      tx.set(ref, { count: 1, windowStart: now, expireAt: Timestamp.fromMillis(now + windowSeconds * 2000) });
      return true;
    }
    if (data.count >= limit) return false;
    tx.update(ref, { count: data.count + 1 });
    return true;
  });
}

/** Client IP from Vercel's forwarding header (first hop), for anonymous rate-limit keys. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
