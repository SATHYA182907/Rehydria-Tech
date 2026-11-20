/**
 * Launch course structure: IoT and Arduino, each with 6 levels (a video lesson and a PDF
 * study-notes lesson per level), a 2-week internship period and a final MCQ assessment
 * (25 questions, 30 minutes).
 *
 * Content source: Rehydria's syllabus documents (module titles and topics). Fees are 0 =
 * "Fee to be announced" until Rehydria sets them in /admin/courses. Official videos and PDFs
 * are attached later; until then the demo files in public/demo are linked (see demo-content.ts).
 */
import { FieldValue, type Firestore, type WriteBatch } from "firebase-admin/firestore";
import { COLLECTIONS } from "../../src/shared/collections";
import { DEFAULT_GRADING_SCALE, DEFAULT_PASSING_PERCENT } from "../../src/shared/grading";
import { DEMO_QUESTIONS, demoLessonLinks } from "./demo-content";

export interface LevelDef {
  title: string;
  summary: string;
  /** Short name used in lesson titles, e.g. "Arduino programming concepts". */
  topic: string;
  /** Syllabus topics covered in this level (module). */
  topics: string[];
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
  levels: LevelDef[];
}

export const ASSESSMENT = { questionCount: 25, durationMinutes: 30, maxAttempts: 2 } as const;
/** Internship period: the certificate unlocks this many days after enrollment is activated. */
export const CERTIFICATE_UNLOCK_DAYS = 14;

/**
 * Levels and topics: from Rehydria's syllabus documents "Arduino Based Embedded System Design"
 * and "IoT Systems Design and Development using ESP32" (6 modules each). Course period: 2 weeks.
 */
export const COURSE_DEFS: CourseDef[] = [
  {
    id: "iot",
    code: "IOT-101",
    slug: "iot",
    title: "IoT Systems Design and Development using ESP32",
    illustration: "network",
    shortDescription: "Build connected IoT systems with the ESP32: sensors, actuators, Wi-Fi and Bluetooth, MQTT and cloud dashboards.",
    description:
      "A two-week internship that takes you from the fundamentals of the Internet of Things and the ESP32 microcontroller to wireless communication, IoT protocols, cloud platforms and live dashboards.\n\nThe program has **6 levels**, each with a video lesson and PDF study notes. After completing all levels you take a **25-question online assessment (30 minutes)**. Your certificate unlocks once you have passed the assessment and completed the **2-week internship period**.",
    durationLabel: "2 weeks",
    durationWeeks: 2,
    objectives: [
      "Explain IoT architecture and program the ESP32 using the Arduino IDE and Wokwi simulator",
      "Interface sensors, actuators and displays with the ESP32",
      "Connect devices over Wi-Fi and Bluetooth, and control GPIO from a web browser",
      "Send sensor data to the cloud with HTTP, REST and MQTT (ThingSpeak, Blynk)",
      "Build real-time IoT dashboards with remote monitoring and control",
    ],
    prerequisites: ["Basic programming in any language", "A laptop with a USB port"],
    highlights: ["6 levels with videos and PDF notes", "2-week internship", "25-question final assessment", "Verifiable certificate"],
    tags: ["ESP32", "Wi-Fi & BLE", "MQTT", "Cloud dashboards"],
    sortOrder: 1,
    levels: [
      {
        title: "Level 1: Introduction to ESP32 and IoT Technology",
        topic: "ESP32 and IoT technology",
        summary: "IoT architecture and applications, the ESP32 microcontroller, pin mapping, Arduino IDE setup and the Wokwi simulator.",
        topics: [
          "Introduction to Internet of Things (IoT)",
          "IoT Architecture and Applications",
          "Introduction to ESP32 Microcontroller",
          "ESP32 Architecture and Technical Specifications",
          "ESP32 GPIO Pin Configuration",
          "ESP32 Development Board and Pin Mapping",
          "Introduction to Arduino IDE and ESP32 Board Installation",
          "Introduction to Wokwi Simulator",
        ],
      },
      {
        title: "Level 2: ESP32 Programming and Development",
        topic: "ESP32 programming",
        summary: "Program structure, data types, control flow, digital and analog I/O, PWM, serial communication, timers and interrupts.",
        topics: [
          "Structure of ESP32 Arduino Program",
          "Variables, Data Types and Operators",
          "Conditional and Looping Statements",
          "Digital Input and Output Programming",
          "Analog Input and Output",
          "PWM-Based Control",
          "Serial Communication and Serial Monitor",
          "Timer and Interrupt Programming",
        ],
      },
      {
        title: "Level 3: Sensor and Actuator Interfacing with ESP32",
        topic: "Sensor and actuator interfacing",
        summary: "IR, ultrasonic, DHT11/DHT22, soil moisture, gas and LDR sensors; relays, servo and DC motors; LCD and I2C displays.",
        topics: [
          "IR Sensor Interfacing",
          "Ultrasonic Sensor Interfacing",
          "Temperature and Humidity Sensor (DHT11/DHT22)",
          "Soil Moisture Sensor Interfacing",
          "Gas Sensor (MQ-2) Interfacing",
          "LDR Sensor Interfacing",
          "Relay Module Interfacing",
          "Servo Motor Interfacing",
          "DC Motor Control using Motor Driver",
          "LCD and I2C LCD Display Interfacing",
        ],
      },
      {
        title: "Level 4: Wireless Communication Using ESP32",
        topic: "Wireless communication",
        summary: "Wi-Fi station and access-point modes, the ESP32 web server, browser-based GPIO control, Bluetooth and BLE.",
        topics: [
          "Wi-Fi Communication Fundamentals",
          "Connecting ESP32 to a Wi-Fi Network",
          "ESP32 as a Wi-Fi Access Point",
          "ESP32 as a Web Server",
          "Controlling GPIO through a Web Browser",
          "Bluetooth and BLE Communication",
          "Wireless Sensor Data Transmission",
        ],
      },
      {
        title: "Level 5: IoT Protocols and Cloud Integration",
        topic: "IoT protocols and cloud integration",
        summary: "HTTP GET/POST, REST APIs, MQTT publish/subscribe, cloud upload with ThingSpeak and Blynk, real-time monitoring.",
        topics: [
          "Introduction to IoT Communication Protocols",
          "HTTP GET and POST Methods",
          "REST API Communication",
          "MQTT Protocol and Publisher-Subscriber Model",
          "ESP32 and MQTT Broker Integration",
          "Sensor Data Upload to Cloud Platforms",
          "Introduction to ThingSpeak",
          "Introduction to Blynk IoT Platform",
          "Real-Time IoT Data Monitoring",
        ],
      },
      {
        title: "Level 6: IoT Dashboard and Data Visualization",
        topic: "IoT dashboards and data visualization",
        summary: "Dashboards, live sensor graphs, remote and mobile device control, data logging and historical analysis.",
        topics: [
          "Introduction to IoT Dashboards",
          "Real-Time Sensor Data Monitoring",
          "Graphical Representation of Sensor Data",
          "Remote Device Monitoring and Control",
          "Mobile-Based IoT Device Control",
          "Data Logging and Historical Data Analysis",
        ],
      },
    ],
  },
  {
    id: "arduino",
    code: "ARD-101",
    slug: "arduino",
    title: "Arduino Based Embedded System Design",
    illustration: "board",
    shortDescription: "Design embedded systems with the Arduino UNO: programming, sensors, actuators, displays and complete real-world projects.",
    description:
      "A two-week internship covering embedded-system fundamentals, Arduino programming, hardware and sensor interfacing, actuators and peripherals, finishing with complete Arduino-based applications.\n\nThe program has **6 levels**, each with a video lesson and PDF study notes. After completing all levels you take a **25-question online assessment (30 minutes)**. Your certificate unlocks once you have passed the assessment and completed the **2-week internship period**.",
    durationLabel: "2 weeks",
    durationWeeks: 2,
    objectives: [
      "Explain embedded systems and the Arduino UNO architecture",
      "Write Arduino programs using digital/analog I/O, PWM and serial communication",
      "Interface LEDs, buttons, buzzers and common sensors",
      "Drive servo and DC motors, relays, keypads and I2C LCD displays",
      "Build complete applications such as smart irrigation and a password door lock",
    ],
    prerequisites: ["No prior electronics experience needed", "A laptop with a USB port"],
    highlights: ["6 levels with videos and PDF notes", "2-week internship", "25-question final assessment", "Verifiable certificate"],
    tags: ["Arduino UNO", "Embedded C", "Sensors", "Projects"],
    sortOrder: 2,
    levels: [
      {
        title: "Level 1: Introduction to Embedded Systems and Arduino",
        topic: "Embedded systems and Arduino",
        summary: "Embedded systems, the Arduino UNO and its architecture, IDE setup, pin configuration and I/O concepts.",
        topics: [
          "Introduction to Embedded Systems",
          "Introduction to Arduino UNO and its architecture",
          "Arduino IDE installation and configuration",
          "Arduino board specifications and pin configuration",
          "Digital and Analog I/O concepts",
        ],
      },
      {
        title: "Level 2: Arduino Programming Concepts",
        topic: "Arduino programming concepts",
        summary: "Program structure, variables and operators, conditions and loops, digital/analog read and write, serial and PWM.",
        topics: [
          "Structure of an Arduino program",
          "Variables, data types and operators",
          "Conditional statements (if, if-else, switch)",
          "Looping statements (for, while)",
          "Digital Read and Digital Write",
          "Analog Read and Analog Write",
          "Serial Monitor and Serial Communication",
          "PWM concepts and applications",
        ],
      },
      {
        title: "Level 3: Basic Hardware Interfacing with Arduino",
        topic: "Basic hardware interfacing",
        summary: "LED blinking, multiple LEDs, push buttons, buzzers and RGB LEDs.",
        topics: ["LED Blinking using Arduino", "Multiple LED Control", "Push Button Interfacing", "Buzzer Interfacing", "RGB LED Interfacing"],
      },
      {
        title: "Level 4: Sensor Interfacing with Arduino",
        topic: "Sensor interfacing",
        summary: "IR, temperature, ultrasonic, gas, soil moisture, PIR and LDR sensors with live Serial Monitor readings.",
        topics: [
          "IR Sensor",
          "Temperature Sensor",
          "Ultrasonic Sensor (HC-SR04)",
          "Gas Sensor (MQ-2)",
          "Soil Moisture Sensor",
          "PIR Motion Sensor",
          "LDR Sensor",
          "Real-time sensor data monitoring using Serial Monitor",
        ],
      },
      {
        title: "Level 5: Actuator and Peripheral Interfacing",
        topic: "Actuator and peripheral interfacing",
        summary: "Servo and DC motors with a motor driver, relay modules, a 4×4 keypad and an I2C LCD display.",
        topics: [
          "Servo Motor Interfacing",
          "DC Motor Interfacing using Motor Driver",
          "Relay Module Interfacing",
          "4×4 Keypad Interfacing",
          "I2C LCD Display Interfacing",
        ],
      },
      {
        title: "Level 6: Arduino-Based Embedded System Applications",
        topic: "Embedded system applications",
        summary: "Complete projects: street light, smart dustbin, temperature alert, gas leakage, smart irrigation and a password door lock.",
        topics: [
          "Automatic Street Light System",
          "Smart Dustbin using Ultrasonic Sensor",
          "Temperature Monitoring and Alert System",
          "Gas Leakage Detection System",
          "Smart Irrigation System",
          "Password-Based Door Lock System",
        ],
      },
    ],
  },
];

export const levelId = (courseId: string, n: number) => `${courseId}-l${n}`;
export const lessonId = (courseId: string, n: number, kind: "video" | "pdf") => `${courseId}-l${n}-${kind}`;
export const assessmentId = (courseId: string) => `${courseId}-final`;

/** Returns the writes for one course (course, levels, lessons, private content, assessment). */
export function courseWrites(
  db: Firestore,
  c: CourseDef,
  extra: Record<string, unknown> = {},
  opts: { demoContent?: boolean } = {},
): ((b: WriteBatch) => void)[] {
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
      moduleCount: c.levels.length,
      lessonCount: c.levels.length * 2,
      completion: { requireAllLessons: true, minProgressPercent: 100, requireAssessmentPass: true },
      finalAssessmentId: assessmentId(c.id),
      certificate: { enabled: true, templateId: "classic", titleOverride: null, unlockAfterDays: CERTIFICATE_UNLOCK_DAYS },
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
        topics: lv.topics,
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
        b.set(ref.collection("private").doc("content"), {
          ...extra,
          video: null,
          ...(opts.demoContent ? { ...demoLessonLinks(c.id, n), demo: true } : { videoUrl: null, pdfUrl: null }),
          bodyMarkdown: null,
          resources: [],
          assignment: null,
        }),
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

/** DEMO question bank (25 per course), flagged `demo: true` so it can be swapped out later. */
export function demoQuestionWrites(db: Firestore, courseId: string, extra: Record<string, unknown> = {}): ((b: WriteBatch) => void)[] {
  const now = FieldValue.serverTimestamp();
  return (DEMO_QUESTIONS[courseId] ?? []).map(([text, a, b, cOpt, d, correct], i) => (batch: WriteBatch) =>
    batch.set(db.collection(COLLECTIONS.questions).doc(`${courseId}-demo-${String(i + 1).padStart(2, "0")}`), {
      ...extra,
      courseId,
      assessmentIds: [assessmentId(courseId)],
      text,
      options: [
        { id: "a", text: a },
        { id: "b", text: b },
        { id: "c", text: cOpt },
        { id: "d", text: d },
      ],
      correctOptionId: correct,
      explanation: null,
      difficulty: "easy",
      active: true,
      demo: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "course-publisher",
    }),
  );
}
