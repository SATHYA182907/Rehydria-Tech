/**
 * Grant (or revoke) the administrator custom claim.
 *
 *   pnpm admin:grant someone@example.com
 *   pnpm admin:grant someone@example.com --revoke
 *
 * Uses FIREBASE_ADMIN_* credentials from .env.local (or the Auth emulator when
 * FIREBASE_AUTH_EMULATOR_HOST is set). The person must have registered first. Refresh tokens
 * are revoked so the change applies at their next sign-in, and an audit log entry is written.
 */
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "../src/shared/collections";

const email = process.argv[2];
const revoke = process.argv.includes("--revoke");
if (!email) {
  console.error("Usage: pnpm admin:grant <email> [--revoke]");
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.");
  process.exit(1);
}

const app = initializeApp(
  process.env.FIREBASE_AUTH_EMULATOR_HOST
    ? { projectId }
    : {
        projectId,
        credential:
          process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY
            ? cert({
                projectId,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
              })
            : applicationDefault(),
      },
);

async function main() {
  const auth = getAuth(app);
  const user = await auth.getUserByEmail(email!.trim().toLowerCase());
  const claims = { ...(user.customClaims ?? {}) };
  if (revoke) delete claims.admin;
  else claims.admin = true;
  await auth.setCustomUserClaims(user.uid, claims);
  await auth.revokeRefreshTokens(user.uid);

  const db = getFirestore(app);
  await db.collection(COLLECTIONS.users).doc(user.uid).set({ role: revoke ? "student" : "admin", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await db.collection(COLLECTIONS.auditLogs).add({
    actorUid: "cli",
    action: revoke ? "user.revokeAdmin" : "user.grantAdmin",
    targetType: "user",
    targetId: user.uid,
    before: null,
    after: { admin: !revoke },
    ip: null,
    userAgent: "scripts/admin-grant.ts",
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`${revoke ? "Revoked" : "Granted"} admin for ${user.email} (${user.uid}). They must sign in again.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
