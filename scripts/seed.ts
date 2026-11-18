/**
 * DEVELOPMENT SEED: never run against production.
 *
 * Writes the two launch programs (IoT, Arduino), their modules and lesson outlines, the
 * Hackathon Guide product and the public company settings, so the marketing site and LMS
 * can be developed against real Firestore reads.
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
import { COLLECTIONS, SETTINGS_DOCS } from "../src/shared/collections";
import { DEFAULT_DURATION_MINUTES, DEFAULT_GRADING_SCALE, DEFAULT_PASSING_PERCENT, DEFAULT_QUESTION_COUNT } from "../src/shared/grading";

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

interface SeedLesson {
  title: string;
  type: "video" | "reading" | "assignment" | "resource";
  minutes: number;
}
interface SeedModule {
  title: string;
  summary: string;
  lessons: SeedLesson[];
}
interface SeedCourse {
  id: string;
  code: string;
  slug: string;
  title: string;
  illustration: "network" | "board";
  shortDescription: string;
  description: string;
  durationLabel: string;
  durationWeeks: number;
  pricePaise: number;
  level: "beginner" | "intermediate";
  objectives: string[];
  prerequisites: string[];
  highlights: { icon: string; label: string }[];
  tags: string[];
  sortOrder: number;
  modules: SeedModule[];
}

const v = (title: string, minutes = 15): SeedLesson => ({ title, type: "video", minutes });
const r = (title: string, minutes = 10): SeedLesson => ({ title, type: "reading", minutes });
const a = (title: string, minutes = 45): SeedLesson => ({ title, type: "assignment", minutes });

const courses: SeedCourse[] = [
  {
    id: "iot",
    code: "IOT-101",
    slug: "iot",
    title: "Internet of Things (IoT)",
    illustration: "network",
    shortDescription:
      "Design connected devices end to end: sensors, microcontrollers, wireless protocols and cloud dashboards.",
    description:
      "A hands-on internship that takes you from reading a single sensor to shipping a connected system that streams data to the cloud.",
    durationLabel: "6 weeks",
    durationWeeks: 6,
    pricePaise: 199900, // SAMPLE price
    level: "beginner",
    objectives: [
      "Explain IoT system architecture from device to cloud",
      "Interface sensors and actuators with a Wi-Fi microcontroller",
      "Publish and subscribe to device data over MQTT",
      "Build a live dashboard for a working prototype",
    ],
    prerequisites: ["Basic programming in any language", "A laptop with USB"],
    highlights: [
      { icon: "Cpu", label: "Real hardware projects" },
      { icon: "Wifi", label: "MQTT & cloud dashboards" },
      { icon: "Award", label: "Verifiable certificate" },
    ],
    tags: ["ESP32", "MQTT", "Sensors", "Cloud"],
    sortOrder: 1,
    modules: [
      { title: "Module 01: IoT Foundations", summary: "Architecture, use cases and the device-to-cloud pipeline.", lessons: [v("What makes a thing \"smart\""), v("IoT architecture layers"), r("Case studies: agriculture, health, industry")] },
      { title: "Module 02: Microcontrollers & ESP32", summary: "Set up the toolchain and program a Wi-Fi capable board.", lessons: [v("Meet the ESP32"), v("Toolchain setup"), a("Blink, then connect to Wi-Fi")] },
      { title: "Module 03: Sensors & Actuators", summary: "Read the physical world and act on it.", lessons: [v("Digital vs analog sensors"), v("Driving relays and motors"), a("Build a climate monitor")] },
      { title: "Module 04: Communication Protocols", summary: "HTTP, MQTT and when to use each.", lessons: [v("HTTP and REST for devices"), v("MQTT publish/subscribe"), a("Stream sensor data over MQTT")] },
      { title: "Module 05: Cloud & Dashboards", summary: "Store, visualise and alert on device data.", lessons: [v("Cloud data pipelines"), v("Building a live dashboard"), a("Dashboard for your monitor")] },
      { title: "Module 06: Capstone Project", summary: "Design, build and document a complete IoT system.", lessons: [r("Capstone brief"), a("Build and demo your system", 120), r("Final revision")] },
    ],
  },
  {
    id: "arduino",
    code: "ARD-101",
    slug: "arduino",
    title: "Arduino Programming",
    illustration: "board",
    shortDescription:
      "Learn electronics and embedded programming by building circuits and projects with Arduino from day one.",
    description:
      "A practical internship covering the Arduino IDE, digital and analog electronics, sensors, actuators and interfacing, finishing with real projects.",
    durationLabel: "4 weeks",
    durationWeeks: 4,
    pricePaise: 149900, // SAMPLE price
    level: "beginner",
    objectives: [
      "Write, upload and debug Arduino sketches",
      "Read digital and analog inputs reliably",
      "Interface sensors, displays and actuators",
      "Complete practical projects end to end",
    ],
    prerequisites: ["No prior electronics experience needed"],
    highlights: [
      { icon: "CircuitBoard", label: "Build from day one" },
      { icon: "Gauge", label: "Sensors & actuators" },
      { icon: "Award", label: "Verifiable certificate" },
    ],
    tags: ["Arduino", "C/C++", "Electronics", "Sensors"],
    sortOrder: 2,
    // Module titles from the project brief.
    modules: [
      { title: "Module 01: Introduction to Arduino", summary: "Boards, pins and what you can build.", lessons: [v("What is Arduino?"), v("Anatomy of the Uno board")] },
      { title: "Module 02: Arduino IDE Setup", summary: "Install, configure and upload your first sketch.", lessons: [v("Installing the IDE"), a("Your first sketch")] },
      { title: "Module 03: Digital Electronics", summary: "Logic levels, LEDs, buttons and debouncing.", lessons: [v("Digital I/O"), v("Buttons and debouncing"), a("Traffic light controller")] },
      { title: "Module 04: Analog Electronics", summary: "ADC, PWM and working with real-world signals.", lessons: [v("Reading analog inputs"), v("PWM output"), a("Dimmer with a potentiometer")] },
      { title: "Module 05: Sensors and Actuators", summary: "Temperature, distance, motion; servos and motors.", lessons: [v("Common sensors"), v("Servos and DC motors"), a("Obstacle-aware rover logic")] },
      { title: "Module 06: Interfacing Components", summary: "Displays, serial, I2C and SPI.", lessons: [v("Serial communication"), v("I2C and SPI devices"), a("LCD sensor readout")] },
      { title: "Module 07: Practical Projects", summary: "Combine everything into complete builds.", lessons: [r("Project briefs"), a("Smart home mini-project", 120)] },
      { title: "Module 08: Final Revision", summary: "Review, practice questions and assessment readiness.", lessons: [r("Course recap"), r("Assessment guidelines")] },
    ],
  },
];

async function commitInChunks(writes: ((batch: WriteBatch) => void)[]) {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach((w) => w(batch));
    await batch.commit();
  }
}

async function main() {
  const writes: ((b: WriteBatch) => void)[] = [];

  for (const course of courses) {
    const { modules, id, ...fields } = course;
    const lessonTotal = modules.reduce((n, m) => n + m.lessons.length, 0);
    const assessmentId = `${id}-final`;

    writes.push((b) =>
      b.set(db.collection(COLLECTIONS.courses).doc(id), {
        ...SEED,
        ...fields,
        thumbnailPath: null,
        bannerPath: null,
        compareAtPricePaise: null,
        status: "published",
        enrollmentOpen: true,
        moduleCount: modules.length,
        lessonCount: lessonTotal,
        completion: { requireAllLessons: true, minProgressPercent: 100, requireAssessmentPass: true },
        finalAssessmentId: assessmentId,
        certificate: { enabled: true, templateId: "classic", titleOverride: null },
        seo: { title: null, description: null, ogImagePath: null },
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      }),
    );
    writes.push((b) => b.set(db.collection(COLLECTIONS.slugs).doc(course.slug), { ...SEED, courseId: id }));

    modules.forEach((mod, mi) => {
      const moduleId = `${id}-m${String(mi + 1).padStart(2, "0")}`;
      writes.push((b) =>
        b.set(db.collection(COLLECTIONS.courseModules).doc(moduleId), {
          ...SEED,
          courseId: id,
          title: mod.title,
          summary: mod.summary,
          order: mi + 1,
          status: "published",
          lessonCount: mod.lessons.length,
          createdAt: now,
          updatedAt: now,
        }),
      );
      mod.lessons.forEach((lesson, li) => {
        const lessonId = `${moduleId}-l${String(li + 1).padStart(2, "0")}`;
        const ref = db.collection(COLLECTIONS.lessons).doc(lessonId);
        writes.push((b) =>
          b.set(ref, {
            ...SEED,
            courseId: id,
            moduleId,
            title: lesson.title,
            type: lesson.type,
            order: mi * 100 + li + 1,
            durationMinutes: lesson.minutes,
            isPreview: mi === 0 && li === 0,
            required: lesson.type !== "resource",
            status: "published",
            createdAt: now,
            updatedAt: now,
          }),
        );
        writes.push((b) =>
          b.set(ref.collection("private").doc("content"), {
            ...SEED,
            video: null, // attach Bunny Stream video ids via the admin dashboard
            bodyMarkdown: null,
            resources: [],
            assignment: lesson.type === "assignment" ? { instructions: "Sample assignment brief.", submissionType: "none" } : null,
          }),
        );
      });
    });

    writes.push((b) =>
      b.set(db.collection(COLLECTIONS.assessments).doc(assessmentId), {
        ...SEED,
        courseId: id,
        title: `${course.title} — Final Assessment`,
        instructions: "Answer every question. The exam submits automatically when the timer ends.",
        questionCount: DEFAULT_QUESTION_COUNT,
        durationMinutes: DEFAULT_DURATION_MINUTES,
        passingPercent: DEFAULT_PASSING_PERCENT,
        shuffleQuestions: true,
        shuffleOptions: true,
        maxAttempts: 2,
        cooldownHours: 24,
        unlockRule: { minCourseProgressPercent: 100 },
        gradingScale: DEFAULT_GRADING_SCALE,
        revealAnswers: false,
        status: "draft", // published once real questions exist
        createdAt: now,
        updatedAt: now,
      }),
    );
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
