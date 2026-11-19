/**
 * Domain types mirroring docs/DATABASE_SCHEMA.md.
 *
 * `TTime` is the timestamp representation: Firestore `Timestamp` on the server and
 * `string` (ISO-8601) once serialized for Client Components. Converters (Phase 6)
 * map between them.
 */
import type { GradeBand } from "../grading";

export type UserRole = "student" | "admin";
export type YearOfStudy = "1" | "2" | "3" | "4" | "5" | "graduate" | "working" | "other";

export interface Audit<TTime> {
  createdAt: TTime;
  updatedAt: TTime;
}

export interface AdminAudit<TTime> extends Audit<TTime> {
  createdBy: string;
  updatedBy: string;
}

export interface UserProfile<TTime> extends Audit<TTime> {
  uid: string;
  fullName: string;
  email: string;
  phone: string | null;
  /** Display only. Authorization uses the `admin` custom claim. */
  role: UserRole;
  college: string | null;
  /** Current higher-education course, e.g. "B.E. Electronics & Communication". */
  degree: string | null;
  yearOfStudy: YearOfStudy | null;
  profileImage: string | null;
  accountSetupComplete: boolean;
  lastActiveCourseId: string | null;
  lastActiveLessonId: string | null;
}

export type PublishStatus = "draft" | "published" | "archived";

/** Line-art motif used for course visuals when no thumbnail is uploaded. Chosen by admins. */
export type CourseIllustration = "network" | "board" | "chip" | "wave" | "robot";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseCompletionRules {
  requireAllLessons: boolean;
  minProgressPercent: number;
  requireAssessmentPass: boolean;
}

export interface Course<TTime> extends AdminAudit<TTime> {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailPath: string | null;
  bannerPath: string | null;
  illustration: CourseIllustration;
  /** Short mono code shown on cards, e.g. "IOT-101". */
  code: string;
  durationLabel: string;
  durationWeeks: number;
  pricePaise: number;
  compareAtPricePaise: number | null;
  level: CourseLevel;
  objectives: string[];
  prerequisites: string[];
  highlights: { icon: string; label: string }[];
  tags: string[];
  status: PublishStatus;
  enrollmentOpen: boolean;
  sortOrder: number;
  moduleCount: number;
  lessonCount: number;
  completion: CourseCompletionRules;
  finalAssessmentId: string | null;
  certificate: { enabled: boolean; templateId: "classic"; titleOverride: string | null };
  seo: { title: string | null; description: string | null; ogImagePath: string | null };
  publishedAt: TTime | null;
}

export interface CourseModule<TTime> extends Audit<TTime> {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  order: number;
  status: Exclude<PublishStatus, "archived">;
  lessonCount: number;
}

export type LessonType = "video" | "reading" | "assignment" | "resource";

export interface LessonOutline<TTime> extends Audit<TTime> {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  type: LessonType;
  order: number;
  durationMinutes: number | null;
  isPreview: boolean;
  required: boolean;
  status: Exclude<PublishStatus, "archived">;
}

export interface LessonResource {
  id: string;
  title: string;
  kind: "pdf" | "zip" | "code" | "link";
  storagePath?: string;
  url?: string;
  sizeBytes?: number;
}

/** `lessons/{id}/private/content`: never sent to the client unredacted. */
export interface LessonContent {
  video: { provider: "bunny"; videoId: string; libraryId: string } | null;
  bodyMarkdown: string | null;
  resources: LessonResource[];
  assignment: { instructions: string; submissionType: "none" | "link" } | null;
}

export type EnrollmentStatus =
  | "pending_payment"
  | "active"
  | "completed"
  | "abandoned"
  | "revoked"
  | "refunded";

export interface Enrollment<TTime> extends Audit<TTime> {
  id: string;
  courseId: string;
  courseSnapshot: { title: string; slug: string; pricePaise: number };
  uid: string | null;
  email: string;
  applicant: { fullName: string; phone: string; degree: string; yearOfStudy: YearOfStudy };
  status: EnrollmentStatus;
  currentOrderId: string | null;
  paymentId: string | null;
  amountPaidPaise: number | null;
  progress: { completedLessons: number; requiredLessons: number; percent: number; lastLessonId: string | null };
  assessment: { bestResultId: string | null; passed: boolean; attemptsUsed: number };
  certificateId: string | null;
  source: "checkout" | "admin_grant";
  activatedAt: TTime | null;
  completedAt: TTime | null;
}

export interface LessonProgress<TTime> {
  uid: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  status: "in_progress" | "completed";
  watchedSeconds: number;
  lastPositionSeconds: number;
  completedAt: TTime | null;
  updatedAt: TTime;
}

export type OptionId = "a" | "b" | "c" | "d";

export interface Assessment<TTime> extends Audit<TTime> {
  id: string;
  courseId: string;
  title: string;
  instructions: string;
  questionCount: number;
  durationMinutes: number;
  passingPercent: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  maxAttempts: number;
  cooldownHours: number;
  unlockRule: { minCourseProgressPercent: number };
  gradingScale: GradeBand[];
  revealAnswers: boolean;
  status: PublishStatus;
}

/** Server only: holds the answer key. */
export interface Question<TTime> extends Audit<TTime> {
  id: string;
  courseId: string;
  assessmentIds: string[];
  text: string;
  options: { id: OptionId; text: string }[];
  correctOptionId: OptionId;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  active: boolean;
  createdBy: string;
}

/** What a student sees: no answer key. */
export interface ServedQuestion {
  questionId: string;
  text: string;
  options: { id: OptionId; text: string }[];
}

export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted" | "expired";

export interface AssessmentAttempt<TTime> {
  id: string;
  uid: string;
  courseId: string;
  assessmentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  questions: ServedQuestion[];
  answers: Record<string, OptionId>;
  startedAt: TTime;
  expiresAt: TTime;
  submittedAt: TTime | null;
  resultId: string | null;
}

export interface AssessmentResult<TTime> {
  id: string;
  uid: string;
  courseId: string;
  assessmentId: string;
  attemptId: string;
  studentName: string;
  correct: number;
  total: number;
  percent: number;
  grade: string;
  passed: boolean;
  timeTakenSeconds: number;
  submittedAt: TTime;
  submissionType: "manual" | "auto_timeout";
}

export type CertificateStatus = "pending" | "valid" | "revoked" | "failed";

export interface Certificate<TTime> {
  id: string;
  uid: string;
  courseId: string;
  enrollmentId: string;
  resultId: string;
  studentName: string;
  courseTitle: string;
  grade: string;
  completionDate: TTime;
  issuedAt: TTime | null;
  status: CertificateStatus;
  pdfPath: string | null;
  directorName: string;
  revokedAt: TTime | null;
  revokedReason: string | null;
  revokedBy: string | null;
  replacedBy: string | null;
  replaces: string | null;
}

/** Shape exposed by the public /verify page. Nothing beyond this leaves the server. */
export type CertificateVerification =
  | { status: "valid" | "revoked"; certificateId: string; studentName: string; courseTitle: string; issuedAt: string }
  | { status: "not_found"; certificateId: string };

export interface GuideProduct<TTime> extends AdminAudit<TTime> {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  contents: { title: string; description: string }[];
  benefits: string[];
  previewImagePaths: string[];
  coverImagePath: string | null;
  filePath: string | null;
  fileVersion: number;
  pageCount: number | null;
  status: PublishStatus;
  available: boolean;
}

export interface Purchase<TTime> {
  id: string;
  uid: string;
  productId: string;
  productSnapshot: { title: string; pricePaise: number; fileVersion: number };
  status: "pending_payment" | "active" | "refunded" | "revoked";
  orderId: string | null;
  paymentId: string | null;
  amountPaidPaise: number | null;
  downloadCount: number;
  lastDownloadedAt: TTime | null;
  createdAt: TTime;
  activatedAt: TTime | null;
}

export type PaymentKind = "course_enrollment" | "guide_purchase";
export type PaymentStatus =
  | "created"
  | "attempted"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "abandoned";

export interface Payment<TTime> extends Audit<TTime> {
  orderId: string;
  kind: PaymentKind;
  refPath: string;
  uid: string | null;
  email: string;
  amountPaise: number;
  currency: "INR";
  receipt: string;
  status: PaymentStatus;
  razorpayPaymentId: string | null;
  method: string | null;
  verifiedVia: "checkout" | "webhook" | "reconcile" | null;
  fulfilledAt: TTime | null;
  failure: { code: string; description: string; reason: string } | null;
  refunds: { refundId: string; amountPaise: number; status: string; createdAt: TTime }[];
  events: { type: string; at: TTime; source: string }[];
}

export interface CompanySettings {
  name: string;
  legalName: string;
  tagline: string;
  logoPath: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  directorName: string | null;
  socials: Partial<Record<"linkedin" | "instagram" | "youtube" | "x" | "github", string>>;
}

export type MailTemplate =
  | "account_setup"
  | "enrollment_confirmation"
  | "payment_confirmation"
  | "course_access"
  | "announcement"
  | "assessment_available"
  | "assessment_result"
  | "certificate_issued"
  | "guide_purchase"
  | "password_reset"
  | "contact_message";
