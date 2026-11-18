import "server-only";
import { cert, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { firebaseAdminEnv } from "@/lib/env/server";

/**
 * Firebase Admin SDK singleton (server only). Credentials, in order of preference:
 *   1. Firestore emulator (FIRESTORE_EMULATOR_HOST): no credentials needed
 *   2. Service account key (FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY)
 *   3. Application Default Credentials (Vercel OIDC / GCP runtime)
 * See docs/FIREBASE_SETUP.md §3.
 */

const APP_NAME = "rehydria-admin";

/**
 * True when the server can use the Admin SDK: a project id plus credentials (the emulator,
 * a service account key, or FIREBASE_ADMIN_USE_ADC=true on a Google runtime / Vercel OIDC).
 * The public web config alone is NOT enough. When false, server reads return empty results
 * and server features show a setup state instead of failing, so the site builds before setup.
 */
export function isFirebaseConfigured(): boolean {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return false;
  return (
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
    Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) ||
    process.env.FIREBASE_ADMIN_USE_ADC === "true"
  );
}

export function isUsingEmulator(): boolean {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST);
}

function createApp(): App {
  const env = firebaseAdminEnv();
  if (isUsingEmulator()) {
    return initializeApp({ projectId: env.projectId, storageBucket: env.storageBucket }, APP_NAME);
  }
  const credential =
    env.clientEmail && env.privateKey
      ? cert({ projectId: env.projectId, clientEmail: env.clientEmail, privateKey: env.privateKey })
      : applicationDefault();
  return initializeApp({ credential, projectId: env.projectId, storageBucket: env.storageBucket }, APP_NAME);
}

export function adminApp(): App {
  return getApps().find((a) => a.name === APP_NAME) ?? createApp();
}

let firestore: Firestore | undefined;

export function adminDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(adminApp());
    firestore.settings({ ignoreUndefinedProperties: true });
  }
  return firestore;
}

/** Public download URL for an object under the world-readable `public/` Storage prefix. */
export function publicStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("public/")) {
    throw new Error(`Refusing to build a public URL for a private Storage path: ${path}`);
  }
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}
