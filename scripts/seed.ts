/**
 * DEVELOPMENT SEED: never run against production.
 *
 * Writes the two launch programs (IoT, Arduino: 6 levels + final assessment, from
 * scripts/lib/course-catalog.ts) with DEMO lesson files and the DEMO question bank
 * (scripts/lib/demo-content.ts), the Hackathon Guide product and the public company settings.
 *
 * Content status:
 *   - Arduino module titles: from the Rehydria project brief.
 *   - Hackathon Guide price ₹200: from the brief.
 *   - Everything else (IoT curriculum, lesson titles, course prices, durations, guide
 *     contents) is SAMPLE content for development. Rehydria must supply the real values
 *     through the admin dashboard. Every seeded document carries `_seed: true`.
 *
 * Usage:
 *   pnpm seed                                    # against the Firestore emulator (default)
 *   SEED_ALLOW_DEV_PROJECT=true pnpm seed        # against a non-production project (ADC/key)
 */
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type WriteBatch } from "firebase-admin/firestore";
import { COURSE_DEFS, courseWrites, demoQuestionWrites } from "./lib/course-catalog";
import { COLLECTIONS, SETTINGS_DOCS } from "../src/shared/collections";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-rehydria";
const emulator = process.env.FIRESTORE_EMULATOR_HOST;

if (!emulator) {
  if (process.env.SEED_ALLOW_DEV_PROJECT !== "true") {
    console.error("Refusing to seed: FIRESTORE_EMULATOR_HOST is not set. Set SEED_ALLOW_DEV_PROJECT=true to seed a dev project.");
    process.exit(1);
  }
  if (/prod/i.test(projectId)) {
    console.error(`Refusing to seed project "${projectId}": it looks like production.`);
    process.exit(1);
  }
}

const app = initializeApp(
  emulator
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
const db = getFirestore(app);
const now = FieldValue.serverTimestamp();
const SEED = { _seed: true } as const;
const SYSTEM = "seed-script";

async function commitInChunks(writes: ((batch: WriteBatch) => void)[]) {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach((w) => w(batch));
    await batch.commit();
  }
}

async function main() {
  const writes: ((b: WriteBatch) => void)[] = [];
  for (const c of COURSE_DEFS) {
    writes.push(...courseWrites(db, c, SEED, { demoContent: true }));
    writes.push(...demoQuestionWrites(db, c.id, SEED));
  }

  writes.push((b) =>
    b.set(db.collection(COLLECTIONS.guideProducts).doc("hackathon-guide"), {
      ...SEED,
      slug: "hackathon-guide",
      title: "The Hackathon Guide",
      subtitle: "A practical playbook for ideating, building and pitching under a deadline.",
      description: "SAMPLE description: replace with the real guide copy in /admin/products.",
      pricePaise: 20000, // ₹200, from the brief
      compareAtPricePaise: null,
      contents: [
        { title: "Choosing the right problem", description: "SAMPLE: framing problem statements judges care about." },
        { title: "Team roles & planning", description: "SAMPLE: splitting work across a 24–48 hour sprint." },
        { title: "Building the prototype", description: "SAMPLE: scoping an MVP that actually demos." },
        { title: "Pitch & presentation", description: "SAMPLE: structuring a 3-minute pitch." },
      ],
      benefits: ["SAMPLE: step-by-step checklists", "SAMPLE: pitch deck structure", "SAMPLE: common mistakes to avoid"],
      previewImagePaths: [],
      coverImagePath: null,
      filePath: null, // upload the PDF via /admin/products
      fileVersion: 0,
      pageCount: null,
      status: "published",
      available: true,
      createdAt: now,
      updatedAt: now,
      createdBy: SYSTEM,
      updatedBy: SYSTEM,
    }),
  );

  writes.push((b) =>
    b.set(
      db.collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.company),
      {
        ...SEED,
        name: "Rehydria Technology",
        legalName: "Rehydria Technology Pvt Ltd",
        tagline: "Learn. Innovate. Build the Future.",
        logoPath: null,
        email: null,
        phone: null,
        address: null,
        directorName: null,
        socials: {},
      },
      { merge: true },
    ),
  );

  await commitInChunks(writes);
  console.log(`Seeded ${writes.length} documents into "${projectId}"${emulator ? ` (emulator ${emulator})` : ""}.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
