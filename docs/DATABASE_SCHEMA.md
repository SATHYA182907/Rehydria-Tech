# Rehydria Platform — Firestore Database Schema

> Status: **Phase 1 design** · Implemented in Phase 6 · Last updated: 2026-11-17

Types below are the source of truth for `src/shared/types/*.ts`. Timestamps are Firestore
`Timestamp` on disk and ISO strings or epoch milliseconds after serialization to the client.

## Conventions

| Convention | Rule |
|---|---|
| Money | `…Paise: number` (integer, smallest unit). Currency always `"INR"`. Never floats. |
| IDs | Firestore auto-IDs unless a **deterministic ID** is listed. Deterministic IDs enforce uniqueness and idempotency without queries. |
| Status fields | String unions, documented per collection. Transitions only happen server-side. |
| Audit fields | `createdAt`, `updatedAt` (server timestamps) on every document; `createdBy` / `updatedBy` (uid) on admin-managed documents. |
| Soft delete | Catalog entities are **archived** (`status: "archived"`), never hard-deleted, so enrollments, results and certificates keep valid references. |
| Denormalisation | Snapshots of names and prices are copied onto enrollments, payments and certificates at the time of the event, so later catalog edits never rewrite history. |
| Client access | Browsers **never write**. Read access per collection is listed under *Rules* and enforced in `firebase/firestore.rules`. "Server only" means no client read either. |

---

## 1. `users/{uid}`

| Field | Type | Notes |
|---|---|---|
| uid | string | = Auth uid |
| fullName | string | 2–80 chars |
| email | string | lower-cased, mirrors Auth |
| phone | string | E.164, `+91XXXXXXXXXX` |
| role | `"student" \| "admin"` | **Display only.** Authorization uses the custom claim `admin: true` |
| college | string \| null | |
| degree | string \| null | Current higher-education course, e.g. "B.E. ECE" (enrollment form) |
| yearOfStudy | `"1" \| "2" \| "3" \| "4" \| "5" \| "graduate" \| "working" \| "other"` \| null | |
| profileImage | string \| null | Storage path `users/{uid}/avatar.webp` |
| accountSetupComplete | boolean | false until a first-time student sets a password |
| lastActiveCourseId | string \| null | Powers "Resume learning" |
| lastActiveLessonId | string \| null | |
| createdAt, updatedAt | Timestamp | |

Rules: owner read. Writes server only (profile edits go through a Server Action that whitelists `fullName`, `phone`, `college`, `yearOfStudy`, `profileImage`).

## 2. `courses/{courseId}`

| Field | Type | Notes |
|---|---|---|
| title | string | "Internet of Things (IoT)" |
| slug | string | unique, `^[a-z0-9-]+$`, e.g. `iot`, `arduino`. Uniqueness enforced with `slugs/{slug}` lock doc in the same transaction |
| shortDescription | string | ≤ 180 chars (cards, meta description) |
| description | string | Markdown |
| thumbnailPath, bannerPath | string \| null | Public Storage path `public/courses/{courseId}/…` |
| illustration | `"network" \| "board" \| "chip" \| "wave" \| "robot"` | Line-art motif used when no thumbnail is uploaded |
| code | string | Short mono course code shown on cards, e.g. `IOT-101` |
| durationLabel | string | "6 weeks" |
| durationWeeks | number | |
| pricePaise | number | integer, e.g. `149900` |
| compareAtPricePaise | number \| null | |
| level | `"beginner" \| "intermediate" \| "advanced"` | |
| objectives | string[] | Learning objectives |
| prerequisites | string[] | |
| highlights | `{ icon: string; label: string }[]` | Lucide icon name plus label |
| tags | string[] | |
| status | `"draft" \| "published" \| "archived"` | Only `published` is visible publicly |
| enrollmentOpen | boolean | Published but closed shows "Enrollment opens soon" |
| sortOrder | number | |
| moduleCount, lessonCount | number | Maintained by admin services |
| completion | `{ requireAllLessons: boolean; minProgressPercent: number; requireAssessmentPass: boolean }` | Default `{ true, 100, true }` |
| finalAssessmentId | string \| null | |
| certificate | `{ enabled: boolean; templateId: "classic"; titleOverride: string \| null }` | |
| seo | `{ title: string \| null; description: string \| null; ogImagePath: string \| null }` | |
| publishedAt | Timestamp \| null | |
| createdAt, updatedAt, createdBy, updatedBy | | |

Rules: public read when `status == "published"`; admin claim reads all.

### `slugs/{slug}` (internal)
`{ courseId }`. Server only. Guarantees slug uniqueness transactionally.

## 3. `courseModules/{moduleId}`

| Field | Type |
|---|---|
| courseId | string |
| title | string — "Module 01: Introduction to Arduino" |
| summary | string |
| order | number |
| status | `"draft" \| "published"` |
| lessonCount | number |
| createdAt, updatedAt | |

Rules: public read when published and parent course published. The rule checks `get(/courses/{courseId}).data.status`.

## 4. `lessons/{lessonId}` — public outline

| Field | Type | Notes |
|---|---|---|
| courseId, moduleId | string | |
| title | string | |
| type | `"video" \| "reading" \| "assignment" \| "resource"` | |
| order | number | within module |
| durationMinutes | number \| null | |
| isPreview | boolean | Free preview lesson, playable without enrollment |
| required | boolean | Counts toward completion |
| status | `"draft" \| "published"` | |

### `lessons/{lessonId}/private/content` — server only

| Field | Type | Notes |
|---|---|---|
| video | `{ provider: "bunny"; videoId: string; libraryId: string } \| null` | No playable URL is stored |
| bodyMarkdown | string \| null | Notes / reading |
| resources | `{ id: string; title: string; kind: "pdf" \| "zip" \| "code" \| "link"; storagePath?: string; url?: string; sizeBytes?: number }[]` | Files live at private `courses/{courseId}/resources/{resourceId}/{filename}` |
| assignment | `{ instructions: string; submissionType: "none" \| "link" } \| null` | |

Rules: outline is public read when published. `private/content` is denied to all clients and served by the DAL after an enrollment check.

## 5. `enrollments/{enrollmentId}`

**Deterministic ID:** `{courseId}_{emailKey}` where `emailKey = sha256(lowercase(trim(email))).slice(0, 32)`.
This blocks two pending or active enrollments for the same email and course, whether or not the visitor is signed in.

| Field | Type | Notes |
|---|---|---|
| courseId | string | |
| courseSnapshot | `{ title, slug, pricePaise }` | |
| uid | string \| null | null until associated at fulfilment |
| email | string | |
| applicant | `{ fullName, phone, degree, yearOfStudy }` | Form data as submitted |
| status | `"pending_payment" \| "active" \| "completed" \| "abandoned" \| "revoked" \| "refunded"` | |
| currentOrderId | string \| null | Latest Razorpay order |
| paymentId | string \| null | Razorpay payment id once paid |
| amountPaidPaise | number \| null | |
| progress | `{ completedLessons: number; requiredLessons: number; percent: number; lastLessonId: string \| null }` | Denormalised for dashboards |
| assessment | `{ bestResultId: string \| null; bestPercent: number; passed: boolean; attemptsUsed: number }` | Updated in the grading transaction |
| certificateId | string \| null | |
| source | `"checkout" \| "admin_grant" \| "payment_bypass"` | `payment_bypass`: activated without payment while no gateway is configured (preview mode) |
| activatedAt, completedAt | Timestamp \| null | |
| createdAt, updatedAt | | |

Status machine:
```
pending_payment ──paid──▶ active ──requirements met──▶ completed
      │                     │
      └─24h no payment──▶ abandoned  (a new attempt re-uses the doc → pending_payment)
active/completed ──admin──▶ revoked | refunded
```
Rules: read if `resource.data.uid == request.auth.uid`; admin reads all.

## 6. `lessonProgress/{uid}_{lessonId}`

| Field | Type |
|---|---|
| uid, courseId, moduleId, lessonId | string |
| status | `"in_progress" \| "completed"` |
| watchedSeconds | number |
| lastPositionSeconds | number |
| completedAt | Timestamp \| null |
| updatedAt | Timestamp |

The deterministic ID makes "mark complete" idempotent. Completing a lesson runs a
transaction that recomputes `enrollments.progress` and, when requirements are met, sets
`enrollments.status = "completed"` and unlocks the assessment.
Rules: owner read.

## 7. `assessments/{assessmentId}`

| Field | Type | Default |
|---|---|---|
| courseId | string | |
| title | string | "Arduino Final Assessment" |
| instructions | string | |
| questionCount | number | 25 |
| durationMinutes | number | 30 |
| passingPercent | number | 40 (equals 10/25, the lowest passing grade "D") |
| shuffleQuestions | boolean | true |
| shuffleOptions | boolean | true |
| maxAttempts | number | 2 |
| cooldownHours | number | 24 |
| unlockRule | `{ minCourseProgressPercent: number }` | 100 |
| gradingScale | `{ grade: string; minPercent: number }[]` sorted desc | A+ 92, A 80, B 68, C 56, D 40, Fail 0 |
| revealAnswers | boolean | false (keeps the answer key safe across retakes) |
| status | `"draft" \| "published" \| "archived"` | |
| createdAt, updatedAt | | |

The default scale is defined as percentages so it works for any question count. For 25 questions it maps exactly to the specification: 23–25 A+, 20–22 A, 17–19 B, 14–16 C, 10–13 D, 0–9 Fail.

Rules: read when published and the requester has an active enrollment in `courseId`. The rule uses an `exists()` lookup on a membership index doc; see SECURITY_PLAN.md §3. Admin reads all.

## 8. `questions/{questionId}` — server only

| Field | Type |
|---|---|
| courseId | string |
| assessmentIds | string[] | (a question bank can serve several assessments) |
| text | string |
| options | `{ id: "a" \| "b" \| "c" \| "d"; text: string }[]` (exactly 4) |
| correctOptionId | `"a" \| "b" \| "c" \| "d"` |
| explanation | string \| null |
| difficulty | `"easy" \| "medium" \| "hard"` |
| active | boolean |
| createdAt, updatedAt, createdBy | |

Rules: **no client access at all**, admins included. Admin UI reads it through Server Actions. The answer key therefore cannot be fetched with the client SDK.

## 9. `assessmentAttempts/{attemptId}`

**ID:** `{uid}_{assessmentId}_{attemptNumber}` (deterministic, so two concurrent starts cannot both create attempt N).

| Field | Type | Notes |
|---|---|---|
| uid, courseId, assessmentId | string | |
| attemptNumber | number | |
| status | `"in_progress" \| "submitted" \| "auto_submitted" \| "expired"` | |
| questions | `{ questionId: string; text: string; options: { id: string; text: string }[] }[]` | Served copy in randomized order, **without** `correctOptionId` |
| answers | `Record<questionId, optionId>` | Saved through a Server Action, which rejects writes after `expiresAt + 30s` grace |
| startedAt, expiresAt, submittedAt | Timestamp | Server clock only |
| resultId | string \| null | |

Starting an attempt runs a transaction. It checks eligibility (active enrollment, unlock rule,
`maxAttempts`, cooldown, no other `in_progress` attempt), draws `questionCount` active
questions, shuffles them, and writes the attempt. Submission evaluates server-side, in a
transaction that moves `in_progress → submitted` exactly once; a duplicate submit returns the existing result.

Rules: owner read.

## 10. `assessmentResults/{attemptId}`

Same ID as the attempt (1:1, idempotent).

| Field | Type |
|---|---|
| uid, courseId, assessmentId, attemptId | string |
| studentName | string (snapshot) |
| correct | number |
| total | number |
| percent | number (rounded to 2 dp) |
| grade | string |
| passed | boolean |
| timeTakenSeconds | number |
| submittedAt | Timestamp |
| submissionType | `"manual" \| "auto_timeout"` |
| certificateId | string \| null (set when this attempt passed) |

Rules: owner read; admin reads all.

## 11. `certificates/{certificateId}`

**ID:** `RHT-XXXX-XXXX-XXXX-XXXX`, 16 characters of Crockford Base32 from a CSPRNG (80 bits). It is non-guessable and readable over the phone.

| Field | Type | Notes |
|---|---|---|
| uid, courseId, enrollmentId, resultId | string | |
| studentName | string | snapshot |
| courseTitle | string | snapshot |
| grade | string | |
| percent | number | score of the passing attempt |
| completionDate | Timestamp | |
| issuedAt | Timestamp \| null | |
| status | `"pending" \| "valid" \| "revoked" \| "failed"` | Issued as `valid` in the grading transaction (HTML certificate); `pending` is reserved for the future PDF render function |
| pdfPath | string \| null | private `certificates/{certificateId}.pdf` |
| directorName | string | snapshot from settings |
| revokedAt, revokedReason, revokedBy | | |
| replacedBy, replaces | string \| null | reissue chain |

Rules: owner read. Public verification goes through `/verify/[id]`, which is server-rendered and exposes only name, course, ID, issue date and status. Public clients cannot read the collection directly.

## 12. `guideProducts/{productId}`

| Field | Type | Notes |
|---|---|---|
| slug | string | `hackathon-guide` |
| title, subtitle, description | string | |
| pricePaise | number | `20000` (₹200) |
| compareAtPricePaise | number \| null | |
| contents | `{ title: string; description: string }[]` | Table of contents |
| benefits | string[] | |
| previewImagePaths | string[] | public |
| coverImagePath | string | public |
| filePath | string | **private** `products/{productId}/v{n}/{file}.pdf` |
| fileVersion | number | |
| pageCount | number \| null | |
| status | `"draft" \| "published" \| "archived"` | |
| available | boolean | |

Rules: public read when published. Note that `filePath` is only a Storage path, and Storage rules deny that path to clients, so reading it is harmless.

## 13. `purchases/{uid}_{productId}`

The deterministic ID blocks a second purchase of the same guide. A guide purchase requires a signed-in account.

| Field | Type |
|---|---|
| uid, productId | string |
| productSnapshot | `{ title, pricePaise, fileVersion }` |
| status | `"pending_payment" \| "active" \| "refunded" \| "revoked"` |
| orderId, paymentId | string \| null |
| amountPaidPaise | number \| null |
| downloadCount | number |
| lastDownloadedAt | Timestamp \| null |
| createdAt, activatedAt | |

Rules: owner read.

## 14. `payments/{razorpayOrderId}`

The document ID is the Razorpay order ID, which is the idempotency anchor for verify, webhook and reconcile.

| Field | Type | Notes |
|---|---|---|
| orderId | string | `order_…` |
| kind | `"course_enrollment" \| "guide_purchase"` | |
| refPath | string | `enrollments/{id}` or `purchases/{id}` |
| uid | string \| null | |
| email | string | |
| amountPaise | number | Server-computed from the catalog price; never taken from the client |
| currency | `"INR"` | |
| receipt | string | `rht_{kind}_{shortId}` (≤ 40 chars) |
| status | `"created" \| "attempted" \| "paid" \| "failed" \| "refunded" \| "partially_refunded" \| "abandoned"` | |
| razorpayPaymentId | string \| null | |
| method | string \| null | upi / card / netbanking … |
| verifiedVia | `"checkout" \| "webhook" \| "reconcile"` \| null | First path that fulfilled the order |
| fulfilledAt | Timestamp \| null | Set once, inside the transaction. This is the idempotency latch |
| failure | `{ code, description, reason } \| null` | |
| refunds | `{ refundId, amountPaise, status, createdAt }[]` | |
| events | `{ type, at, source }[]` | capped at 50 |
| createdAt, updatedAt | | |

Rules: owner read (`uid == auth.uid`); admin reads all.

### `webhookEvents/{eventId}` (internal, server only)
`{ event, orderId, receivedAt, processedAt }`. Uses the `x-razorpay-event-id` header as the ID so replayed deliveries are no-ops.

## 15. `announcements/{announcementId}`

| Field | Type |
|---|---|
| title, body | string (Markdown) |
| courseId | string \| null (null = all students) |
| notifyByEmail | boolean |
| status | `"draft" \| "published"` |
| publishedAt | Timestamp \| null |
| createdBy | uid |

Rules: server only, delivered through the DAL, which filters by the reader's enrollments.

## 16. `reviews/{reviewId}`

Student testimonials. **Only real submissions are shown.** The homepage testimonial section hides itself when no approved reviews exist; no testimonials are fabricated.

| Field | Type |
|---|---|
| uid, courseId | string |
| courseTitle | string (snapshot) |
| displayName, college | string |
| rating | 1–5 |
| body | string ≤ 600 |
| status | `"pending" \| "approved" \| "rejected"` |
| featured | boolean |
| createdAt, moderatedAt, moderatedBy | |

Rules: public read when `status == "approved"`.

## 17. `settings/{docId}`

| Doc | Purpose |
|---|---|
| `settings/company` | `name`, `legalName`, `tagline`, `logoPath`, `email`, `phone`, `address`, `directorName`, `directorSignaturePath` (private), `socials{}`. Empty until an admin fills them in; the UI hides empty contact fields. Nothing is invented. |
| `settings/grading` | Default `gradingScale` for new assessments |
| `settings/payments` | `enabled`, `testMode` display flag |
| `settings/stats` | Aggregated counters (written by functions): `students`, `enrollmentsActive`, `revenuePaise`, `certificatesIssued`, … |

Rules: `company` is public read except signature path. Since rules can't hide fields, the signature path lives in `settings/companyPrivate` (server only). Others are server only.

## 18. `auditLogs/{logId}` — server only

| Field | Type |
|---|---|
| actorUid | string \| `"system"` |
| action | string (`course.publish`, `cert.revoke`, `user.grantAdmin`, `payment.fulfil` …) |
| targetType, targetId | string |
| before, after | map \| null (diff of changed fields only) |
| ip, userAgent | string \| null |
| createdAt | Timestamp |

Append-only. Never updated or deleted by application code.

## 19. Internal collections (server only)

| Collection | Purpose |
|---|---|
| `contactMessages/{id}` | Contact form submissions `{ fullName, email, phone?, topic, message, status: "new"\|"replied", createdAt }` |
| `mailQueue/{id}` | Outbox: `{ to, template, data, status: "queued"\|"sending"\|"sent"\|"failed", attempts, lastError, sentAt, resendId }` |
| `rateLimits/{bucketKey}` | Fixed-window counters `{ count, windowStart }` keyed by `{action}:{ip-or-uid}`; TTL policy on `expireAt` |
| `courseMembers/{courseId}_{uid}` | `{ active: true }`: a cheap membership marker used by security rules (`exists()`), written in the same transaction that activates an enrollment |

Firestore **TTL policies**: `rateLimits.expireAt`, `webhookEvents.expireAt` (90 days).

---

## Composite indexes

Defined in `firebase/firestore.indexes.json`:

| Collection | Fields | Query |
|---|---|---|
| courses | status ↑, sortOrder ↑ | Published catalog |
| courseModules | courseId ↑, order ↑ | Curriculum |
| lessons | courseId ↑, order ↑ | |
| lessons | moduleId ↑, order ↑ | |
| enrollments | uid ↑, status ↑, createdAt ↓ | My courses |
| enrollments | courseId ↑, status ↑, createdAt ↓ | Admin per-course list |
| enrollments | status ↑, createdAt ↓ | Admin enrollments |
| lessonProgress | uid ↑, courseId ↑, updatedAt ↓ | Progress & resume |
| assessmentAttempts | uid ↑, assessmentId ↑, startedAt ↓ | Attempts & cooldown |
| assessmentAttempts | status ↑, expiresAt ↑ | Expiry sweeper |
| assessmentResults | uid ↑, submittedAt ↓ | My results |
| assessmentResults | courseId ↑, submittedAt ↓ | Admin results |
| questions | courseId ↑, active ↑ | Question bank |
| questions | assessmentIds (array-contains), active ↑ | Draw questions |
| certificates | uid ↑, issuedAt ↓ | My certificates |
| certificates | status ↑, issuedAt ↓ | Admin |
| payments | status ↑, createdAt ↓ | Admin + reconciler |
| payments | uid ↑, createdAt ↓ | My payments |
| payments | kind ↑, status ↑, createdAt ↓ | Reports |
| purchases | uid ↑, createdAt ↓ | My guides |
| announcements | courseId ↑, status ↑, publishedAt ↓ | |
| reviews | status ↑, featured ↓, createdAt ↓ | Homepage |
| mailQueue | status ↑, createdAt ↑ | Retry sweeper |
| auditLogs | targetType ↑, targetId ↑, createdAt ↓ | |
| auditLogs | actorUid ↑, createdAt ↓ | |

## Transactions & batches

| Operation | Mechanism |
|---|---|
| Create course order | Transaction: read course (published, open) → read enrollment (reject active) → upsert enrollment `pending_payment`. Razorpay order is created **after** the transaction; the payment doc is written with the returned order id |
| `fulfilOrder` | Transaction: payment (exit if `fulfilledAt`) → enrollment/purchase → user doc → `courseMembers` → `mailQueue` → `auditLogs` |
| Complete lesson | Transaction: progress doc + enrollment progress recompute |
| Start / submit attempt | Transaction with status latch |
| Pass assessment → certificate | Transaction: result + enrollment update + `certificates/{id}` status `pending` |
| Admin reorder modules | Batched write |
| Publish course | Transaction: course + slug lock |
