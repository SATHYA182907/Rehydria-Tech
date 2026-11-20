/**
 * Publish the launch courses (IoT, Arduino: 4 levels each + final assessment) to a REAL
 * Firebase project. Unlike the dev seed it writes no sample data and no `_seed` flag.
 *
 *   pnpm courses:publish                 # creates courses that do not exist yet
 *   pnpm courses:publish --force         # also overwrites existing course structure
 *   pnpm courses:publish --demo          # include DEMO lesson files + demo question bank
 *
 * Credentials: FIREBASE_ADMIN_* from .env.local, or Application Default Credentials.
 * Existing courses are skipped by default so edits made in /admin/courses are never lost.
 */
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "../src/shared/collections";
import { COURSE_DEFS, commitInChunks, courseWrites, demoQuestionWrites } from "./lib/course-catalog";

const projectId = process.env.PUBLISH_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const force = process.argv.includes("--force");
const demo = process.argv.includes("--demo");
if (!projectId) {
  console.error("Set PUBLISH_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID).");
  process.exit(1);
}
if (process.env.FIRESTORE_EMULATOR_HOST && !process.env.PUBLISH_PROJECT_ID) {
  console.error("FIRESTORE_EMULATOR_HOST is set; use `pnpm seed` for the emulator, or set PUBLISH_PROJECT_ID explicitly.");
  process.exit(1);
}

const app = initializeApp({
  projectId,
  credential:
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") })
      : applicationDefault(),
});
const db = getFirestore(app);

async function main() {
  for (const c of COURSE_DEFS) {
    const exists = (await db.collection(COLLECTIONS.courses).doc(c.id).get()).exists;
    if (exists && !force) {
      console.log(`- ${c.title}: already exists, skipped (use --force to overwrite).`);
      continue;
    }
    await commitInChunks(db, [...courseWrites(db, c, {}, { demoContent: demo }), ...(demo ? demoQuestionWrites(db, c.id) : [])]);
    console.log(`✓ ${c.title}: published (4 levels, 8 lessons, final assessment).`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
