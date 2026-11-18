/**
 * Firestore collection names: the single source of truth for the web app,
 * Cloud Functions, rules tests and seed scripts. See docs/DATABASE_SCHEMA.md.
 */
export const COLLECTIONS = {
  users: "users",
  courses: "courses",
  slugs: "slugs",
  courseModules: "courseModules",
  lessons: "lessons",
  enrollments: "enrollments",
  courseMembers: "courseMembers",
  lessonProgress: "lessonProgress",
  assessments: "assessments",
  questions: "questions",
  assessmentAttempts: "assessmentAttempts",
  assessmentResults: "assessmentResults",
  certificates: "certificates",
  guideProducts: "guideProducts",
  purchases: "purchases",
  payments: "payments",
  webhookEvents: "webhookEvents",
  announcements: "announcements",
  reviews: "reviews",
  settings: "settings",
  auditLogs: "auditLogs",
  mailQueue: "mailQueue",
  rateLimits: "rateLimits",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Sub-document holding server-only lesson content. */
export const LESSON_PRIVATE_CONTENT = { collection: "private", doc: "content" } as const;

export const SETTINGS_DOCS = {
  company: "company",
  companyPrivate: "companyPrivate",
  grading: "grading",
  payments: "payments",
  stats: "stats",
} as const;
