/**
 * Cloud Functions entry point (event-driven and background work only).
 * Request/response logic lives in the Next.js app; see docs/ARCHITECTURE.md §1 and §8.
 *
 * Functions are added in their phases:
 *   Phase 7  — notifications/sendQueuedMail, payments/reconcilePayments
 *   Phase 9  — assessments/expireAssessmentAttempts
 *   Phase 10 — certificates/renderCertificate
 *   Phase 12 — notifications/aggregateStats
 */
import "./config.js";
