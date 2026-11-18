"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, inMemoryPersistence, setPersistence, type Auth } from "firebase/auth";
import { publicEnv } from "@/lib/env/client";

/**
 * Browser Firebase SDK, used ONLY for signing in (docs/ARCHITECTURE.md §5). After sign-in the
 * ID token is exchanged for an httpOnly session cookie and the client signs out again, so the
 * server session is the single source of truth. Browsers never read or write Firestore.
 */

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function firebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(publicEnv().firebase);
  return app;
}

export async function clientAuth(): Promise<Auth> {
  if (auth) return auth;
  const instance = getAuth(firebaseApp());
  if (publicEnv().useEmulators) {
    connectAuthEmulator(instance, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  await setPersistence(instance, inMemoryPersistence);
  auth = instance;
  return auth;
}
