import { connection, NextResponse } from "next/server";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS, SETTINGS_DOCS } from "@/shared/collections";

/**
 * Deployment self-check: reports whether the server can reach Firebase with its
 * service-account credentials. Returns only coarse status words, never values or errors.
 *   GET /api/health  →  { "firebaseAdmin": "ok" | "not_configured" | "credentials_rejected" }
 */
export async function GET() {
  await connection();
  let firebaseAdmin: "ok" | "not_configured" | "credentials_rejected" = "not_configured";
  if (isFirebaseConfigured()) {
    try {
      await adminDb().collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.company).get();
      firebaseAdmin = "ok";
    } catch (err) {
      console.error("[health] Firebase Admin check failed:", err instanceof Error ? err.message : err);
      firebaseAdmin = "credentials_rejected";
    }
  }
  return NextResponse.json({ firebaseAdmin }, { status: firebaseAdmin === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
