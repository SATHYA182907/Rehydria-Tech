/**
 * Launch course structure: IoT and Arduino, each with 4 levels (a video lesson and a PDF
 * study-notes lesson per level) and a final MCQ assessment (25 questions, 30 minutes).
 *
 * Content sources: Arduino level groupings come from the 8 modules in the Rehydria brief;
 * IoT levels follow the same pattern. Fees are 0 = "Fee to be announced" until Rehydria sets
 * them in /admin/courses. Videos and PDFs are attached later (lesson content is empty).
 */
import { FieldValue, type Firestore, type WriteBatch } from "firebase-admin/firestore";
import { COLLECTIONS } from "../../src/shared/collections";
import { DEFAULT_GRADING_SCALE, DEFAULT_PASSING_PERCENT } from "../../src/shared/grading";

export interface LevelDef {
  title: string;
  summary: string;
  topic: string;
}

export interface CourseDef {
  id: string;
  code: string;
  slug: string;
  title: string;
  illustration: "network" | "board";
  shortDescription: string;
  description: string;
  durationLabel: string;
  durationWeeks: number;
  objectives: string[];
  prerequisites: string[];
  highlights: string[];
  tags: string[];
  sortOrder: number;
  levels: [LevelDef, LevelDef, LevelDef, LevelDef];
}

export const ASSESSMENT = { questionCount: 25, durationMinutes: 30, maxAttempts: 2 } as const;

export const COURSE_DEFS: CourseDef[] = [
  {
    id: "iot",
    code: "IOT-101",
    slug: "iot",
    title: "Internet of Things (IoT)",
    illustration: "network",
    shortDescription: "Design connected devices end to end: sensors, microcontrollers, wireless communication and cloud dashboards.",
    description:
      "A hands-on internship that takes you from reading a single sensor to building a connected system that sends data to the cloud.\n\nThe program is organised into **4 levels**. Each level has a video lesson and PDF study notes. After completing all levels you take a **25-question online assessment (30 minutes)**; pass it to earn your verifiable certificate.",
    durationLabel: "6 weeks",
    durationWeeks: 6,
    objectives: [
      "Explain how IoT systems connect devices to the cloud",
      "Program a Wi-Fi microcontroller and read sensors",
      "Send device data using common IoT protocols",
      "Build and document a complete IoT prototype",
    ],
    prerequisites: ["Basic programming in any language", "A laptop with a USB port"],
    highlights: ["4 levels with videos and PDF notes", "25-question final assessment", "Verifiable certificate"],
    tags: ["ESP32", "Sensors", "MQTT", "Cloud"],
    sortOrder: 1,
    levels: [
      { title: "Level 1: IoT Foundations", summary: "IoT architecture, real-world use cases and the device-to-cloud pipeline.", topic: "IoT foundations" },
      { title: "Level 2: Microcontrollers, Sensors & Actuators", summary: "Set up a Wi-Fi microcontroller, read sensors and drive actuators.", topic: "Microcontrollers, sensors and actuators" },
      { title: "Level 3: Connectivity & Cloud", summary: "Wi-Fi, HTTP and MQTT, sending data to the cloud and building dashboards.", topic: "Connectivity and cloud" },
      { title: "Level 4: Capstone Project", summary: "Design, build and document a complete IoT system.", topic: "Capstone project" },
    ],
  },
  {
    id: "arduino",
    code: "ARD-101",
    slug: "arduino",
    title: "Arduino Programming",
    illustration: "board",
    shortDescription: "Learn electronics and embedded programming by building circuits and projects with Arduino from day one.",
    description:
      "A practical internship covering the Arduino IDE, digital and analog electronics, sensors, actuators and interfacing, finishing with real projects.\n\nThe program is organised into **4 levels**. Each level has a video lesson and PDF study notes. After completing all levels you take a **25-question online assessment (30 minutes)**; pass it to earn your verifiable certificate.",
    durationLabel: "4 weeks",
    durationWeeks: 4,
    objectives: [
      "Write, upload and debug Arduino sketches",
      "Work with digital and analog inputs and outputs",
      "Interface sensors, displays and actuators",
      "Complete practical projects end to end",
    ],
    prerequisites: ["No prior electronics experience needed"],
    highlights: ["4 levels with videos and PDF notes", "25-question final assessment", "Verifiable certificate"],
    tags: ["Arduino", "C/C++", "Electronics", "Sensors"],
    sortOrder: 2,
    levels: [
      { title: "Level 1: Introduction & IDE Setup", summary: "What Arduino is, the Uno board, installing the IDE and your first sketch.", topic: "Introduction and IDE setup" },
      { title: "Level 2: Digital & Analog Electronics", summary: "Digital I/O, buttons, analog inputs and PWM output.", topic: "Digital and analog electronics" },
      { title: "Level 3: Sensors, Actuators & Interfacing", summary: "Common sensors, servos and motors, serial, I2C and SPI devices.", topic: "Sensors, actuators and interfacing" },
      { title: "Level 4: Practical Projects & Final Revision", summary: "Complete projects that combine everything, then revise for the assessment.", topic: "Practical projects and revision" },
    ],
  },
];

export const levelId = (courseId: string, n: number) => `${courseId}-l${n}`;
export const lessonId = (courseId: string, n: number, kind: "video" | "pdf") => `${courseId}-l${n}-${kind}`;
export const assessmentId = (courseId: string) => `${courseId}-final`;

/** Returns the writes for one course (course, levels, lessons, private content, assessment). */
export function courseWrites(db: Firestore, c: CourseDef, extra: Record<string, unknown> = {}): ((b: WriteBatch) => void)[] {
  const now = FieldValue.serverTimestamp();
  const writes: ((b: WriteBatch) => void)[] = [];
  const by = "course-publisher";
  writes.push((b) =>
    b.set(db.collection(COLLECTIONS.courses).doc(c.id), {
      ...extra,
      title: c.title,
      slug: c.slug,
      code: c.code,
      illustration: c.illustration,
      shortDescription: c.shortDescription,
      description: c.description,
      durationLabel: c.durationLabel,
      durationWeeks: c.durationWeeks,
      level: "beginner",
      pricePaise: 0, // 0 = fee to be announced
      compareAtPricePaise: null,
      objectives: c.objectives,
      prerequisites: c.prerequisites,
      highlights: c.highlights.map((label) => ({ icon: "CheckCircle2", label })),
      tags: c.tags,
      thumbnailPath: null,
      bannerPath: null,
      status: "published",
      enrollmentOpen: true,
      sortOrder: c.sortOrder,
      moduleCount: 4,
      lessonCount: 8,
      completion: { requireAllLessons: true, minProgressPercent: 100, requireAssessmentPass: true },
      finalAssessmentId: assessmentId(c.id),
      certificate: { enabled: true, templateId: "classic", titleOverride: null },
      seo: { title: null, description: null, ogImagePath: null },
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: by,
      updatedBy: by,
    }),
  );
  writes.push((b) => b.set(db.collection(COLLECTIONS.slugs).doc(c.slug), { ...extra, courseId: c.id }));

  c.levels.forEach((lv, i) => {
    const n = i + 1;
    writes.push((b) =>
      b.set(db.collection(COLLECTIONS.courseModules).doc(levelId(c.id, n)), {
        ...extra,
        courseId: c.id,
        title: lv.title,
        summary: lv.summary,
        order: n,
        status: "published",
        lessonCount: 2,
        createdAt: now,
        updatedAt: now,
      }),
    );
    (["video", "pdf"] as const).forEach((kind, k) => {
      const ref = db.collection(COLLECTIONS.lessons).doc(lessonId(c.id, n, kind));
      writes.push((b) =>
        b.set(ref, {
          ...extra,
          courseId: c.id,
          moduleId: levelId(c.id, n),
          title: kind === "video" ? `Video lesson: ${lv.topic}` : `Study notes (PDF): ${lv.topic}`,
          type: kind === "video" ? "video" : "resource",
          order: n * 10 + k + 1,
          durationMinutes: kind === "video" ? 30 : 20,
          isPreview: false,
          required: true,
          status: "published",
          createdAt: now,
          updatedAt: now,
        }),
      );
      writes.push((b) =>
        b.set(ref.collection("private").doc("content"), { ...extra, video: null, videoUrl: null, pdfUrl: null, bodyMarkdown: null, resources: [], assignment: null }),
      );
    });
  });

  writes.push((b) =>
    b.set(db.collection(COLLECTIONS.assessments).doc(assessmentId(c.id)), {
      ...extra,
      courseId: c.id,
      title: `${c.title}: Final Assessment`,
      instructions:
        "25 multiple-choice questions, one at a time. You have 30 minutes; the assessment submits automatically when time runs out. Each question has exactly one correct answer.",
      questionCount: ASSESSMENT.questionCount,
      durationMinutes: ASSESSMENT.durationMinutes,
      passingPercent: DEFAULT_PASSING_PERCENT,
      shuffleQuestions: true,
      shuffleOptions: true,
      maxAttempts: ASSESSMENT.maxAttempts,
      cooldownHours: 0,
      unlockRule: { minCourseProgressPercent: 100 },
      gradingScale: DEFAULT_GRADING_SCALE,
      revealAnswers: false,
      status: "published",
      createdAt: now,
      updatedAt: now,
    }),
  );
  return writes;
}

export async function commitInChunks(db: Firestore, writes: ((b: WriteBatch) => void)[]) {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach((w) => w(batch));
    await batch.commit();
  }
}
