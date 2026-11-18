# Rehydria Platform — Security Plan

> Status: **Phase 1 design** · Rules implemented in Phase 6, payments in Phase 7 · Last updated: 2026-11-17

## 1. Assets & threats

| Asset | Threat | Primary control |
|---|---|---|
| Paid course content (videos, PDFs) | Access without paying, link sharing | Server-side enrollment check, Bunny token-auth embeds (2 h), Storage V4 signed URLs (5 min), private paths |
| Hackathon Guide PDF | Unpaid download, permanent link sharing | Same: purchase check plus a short-lived signed URL; download counter |
| Payment integrity | Forged success callbacks, amount tampering, replays, double-fulfilment | Server-created orders with price from DB, HMAC verification, Payments API cross-check, webhook signature, `fulfilledAt` latch, event-id dedupe |
| Assessment integrity | Reading the answer key, extending the timer, re-submitting, extra attempts | Questions are server-only, served copies have no answers, server clock, status-latch transactions, attempt limits |
| Certificates | Forgery, enumeration | 80-bit random IDs, public verify page, revoke/reissue chain, PDFs private |
| Student PII | Cross-tenant reads | Owner-only rules, DAL ownership checks, no client writes |
| Admin capability | Privilege escalation | Custom claim set only by server/CLI, claim re-verified per request, audit log |
| Secrets | Exposure in bundle or repo | Server-only env, `server-only` imports, Secret Manager for functions, `.env*` git-ignored |
| Availability / cost | Abuse of order creation, emails, login | Rate limiting, App Check, Razorpay order caps |

## 2. Secret handling

| Secret | Lives in | Never in |
|---|---|---|
| `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_CLIENT_EMAIL` | Vercel env (Production/Preview, *Sensitive*) | Client bundle, git |
| `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Vercel env + Firebase Secret Manager (functions) | Client bundle, logs |
| `RESEND_API_KEY` | Firebase Secret Manager (only functions send mail) | Next.js env |
| `BUNNY_STREAM_TOKEN_KEY` | Vercel env | Client |
| `SESSION_COOKIE_*` config | Vercel env | |

Controls:

- `src/lib/env/server.ts` validates env with Zod (lazily, per integration). It
  begins with `import "server-only"`, so a Client Component import fails the build.
- Only `NEXT_PUBLIC_*` values reach the browser: Firebase web config, App Check site key, site URL.
  The Razorpay **key id** is public by design and is returned by the order endpoint rather than baked into the bundle.
- `RAZORPAY_KEY_ID` is server-side so the active key (test/live) is chosen in one place.
- Logs never include signatures, secrets, full card or UPI details, or raw webhook bodies.
- `.gitignore` excludes `.env*` except `.env.example`; a pre-commit secret scan (gitleaks) is added in Phase 13.

## 3. Firestore rules design

Global stance: **deny everything; no client writes anywhere.**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isAdmin()  { return signedIn() && request.auth.token.admin == true; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function memberOf(courseId) {
      return signedIn() && exists(/databases/$(db)/documents/courseMembers/$(courseId + '_' + request.auth.uid));
    }

    match /{document=**} { allow read, write: if false; }

    match /courses/{id}        { allow read: if resource.data.status == 'published' || isAdmin(); }
    match /courseModules/{id}  { allow read: if isAdmin() || (resource.data.status == 'published'
                                   && get(/databases/$(db)/documents/courses/$(resource.data.courseId)).data.status == 'published'); }
    match /lessons/{id}        { allow read: if isAdmin() || resource.data.status == 'published';
                                 match /private/{doc} { allow read: if false; } }
    match /guideProducts/{id}  { allow read: if resource.data.status == 'published' || isAdmin(); }
    match /reviews/{id}        { allow read: if resource.data.status == 'approved' || isAdmin(); }
    match /settings/company    { allow read: if true; }

    match /users/{uid}                 { allow read: if isOwner(uid) || isAdmin(); }
    match /enrollments/{id}            { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    match /lessonProgress/{id}         { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    match /assessments/{id}            { allow read: if isAdmin() || (resource.data.status == 'published' && memberOf(resource.data.courseId)); }
    match /assessmentAttempts/{id}     { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    match /assessmentResults/{id}      { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    match /certificates/{id}           { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    match /purchases/{id}              { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    match /payments/{id}               { allow read: if isOwner(resource.data.uid) || isAdmin(); }
    // questions, announcements, auditLogs, mailQueue, rateLimits, webhookEvents,
    // courseMembers, slugs, settings/* (other than company): fall through to deny.
  }
}
```

Queries must include the owner constraint (`where('uid','==',auth.uid)`), otherwise rules
reject them. This is intended.

**Rules tests** (`@firebase/rules-unit-testing` against the emulator, Phase 6) cover at least:
anonymous cannot read draft course; student A cannot read student B's enrollment, attempt,
result, payment or certificate; nobody can read `questions` or `lessons/*/private/*`;
non-member cannot read an assessment; every client write is denied, including by admins.

## 4. Storage rules design

| Path | Read | Write |
|---|---|---|
| `public/**` (course thumbnails/banners, product covers, previews, brand logo) | anyone | none (server uploads) |
| `users/{uid}/avatar.*` | owner | none (uploads go through a signed upload URL issued by a Server Action that checks size and MIME) |
| `courses/{courseId}/resources/**` | none | none |
| `products/**` | none | none |
| `certificates/**` | none | none |
| `branding/private/**` (director signature) | none | none |

Private files are reached only through server endpoints that authorize the request and
then return a **V4 signed URL valid for 5 minutes** with `responseDisposition: attachment`:

- `GET /api/download/resource/[resourceId]` checks for an active enrollment in the owning course.
- `GET /api/download/guide/[productId]` checks for an active purchase and increments `downloadCount`.
- `GET /api/download/certificate/[certificateId]` checks the owner (or admin) and that status is `valid`.

Signing needs the service account to hold `roles/iam.serviceAccountTokenCreator`.

## 5. Payment security (Razorpay)

1. **Order creation is server-only.** The amount is read from Firestore (`pricePaise`) and
   never from the request. Receipt and `notes` carry `kind`, `refPath` and `uid`.
2. **Checkout verification** (`POST /api/payments/verify`):
   - Compute `HMAC_SHA256(order_id + "|" + razorpay_payment_id, KEY_SECRET)` and compare with
     `crypto.timingSafeEqual`.
   - Fetch the payment from the Razorpay API. Require `order_id` match, `status ∈ {captured}`
     (auto-capture is on), and `amount == payments.amountPaise`, `currency == INR`.
   - Call `fulfilOrder(orderId, { source: "checkout" })`.
3. **Webhook** (`POST /api/webhooks/razorpay`):
   - Read the raw body (`await req.text()`) and verify `X-Razorpay-Signature` as
     `HMAC_SHA256(rawBody, WEBHOOK_SECRET)` using a timing-safe comparison.
   - Dedupe with `webhookEvents/{x-razorpay-event-id}` (create-if-absent).
   - Handle `payment.captured` and `order.paid` (fulfil), `payment.failed` (record failure; the
     enrollment stays `pending_payment` so the student can retry), and `refund.processed` (mark refunded,
     revoke access, audit).
   - Always reply 2xx quickly once the signature is valid, so Razorpay does not retry storms.
4. **Idempotent fulfilment.** `fulfilOrder` runs in a Firestore transaction and exits early if
   `payments.fulfilledAt` is set. Checkout, webhook and the reconciler can all race safely.
5. **Duplicate payment prevention.**
   - Deterministic enrollment and purchase IDs reject a new order when access is already `active`.
   - When a `pending_payment` enrollment already has a `created` order younger than 15 minutes,
     that order is reused instead of creating a new one.
6. **Abandoned and pending checkouts.** The reconciler (every 15 min) queries
   `orders/{id}/payments` for stale `created`/`attempted` orders. It fulfils captured ones and marks orders older than 24 h `abandoned`.
7. **Frontend success is never trusted.** The UI shows "Confirming payment…" and polls
   `GET /api/payments/[orderId]/status` (owner-scoped), which reads Firestore.
8. Refund reconciliation and CSV export are available in `/admin/payments`.

## 6. Authentication hardening

- Session cookies are `__session`, `httpOnly`, `secure`, `sameSite=lax`, 7-day expiry, verified with
  `checkRevoked: true` on sensitive operations (payments, admin, assessment submit).
- `POST /api/auth/session` requires an ID token with `auth_time` within 5 minutes and is
  CSRF-protected: it requires `Origin` to match `NEXT_PUBLIC_SITE_URL`.
- Server Actions rely on Next's built-in Origin/Host check; `serverActions.allowedOrigins`
  is set explicitly for the production domain.
- Email enumeration protection is enabled in Firebase Auth.
- Passwords are handled only by Firebase Auth. **We never store passwords.**
- **First-time students** (enrolled while signed out): `fulfilOrder` creates the Auth user
  with `emailVerified: false` and no password. It queues an "Activate your account" email with a
  Firebase password-setup link (`generatePasswordResetLink` with `continueUrl=/account/setup`),
  which proves mailbox ownership. Until the password is set, the enrollment is visible only
  to that verified account.
- **Existing students**: if the email matches an existing Auth user, the enrollment is
  associated with that UID; if signed in, the session UID is used directly.
- Admin claim changes revoke refresh tokens.

## 7. Server-side validation

- Every Server Action and Route Handler parses input with a Zod schema from
  `src/lib/validations`. The same schema drives React Hook Form on the client.
- Phone: Indian mobile `^[6-9]\d{9}$` after stripping `+91`/spaces, stored as E.164.
- Email: Zod `email()` plus lower-casing; length ≤ 254.
- Strings are trimmed and length-capped; Markdown from admins is rendered with a sanitizing renderer.
- IDs from params are validated against `^[A-Za-z0-9_-]{1,64}$` before use in paths.

## 8. Rate limiting

A Firestore fixed-window limiter (`rateLimits/{action}:{key}`, TTL-expired) in
`src/services/security/rate-limit.ts`, keyed by uid when signed in, otherwise by IP
(`x-forwarded-for` first hop on Vercel).

| Action | Limit |
|---|---|
| Create order | 5 / 10 min / key |
| Payment verify | 20 / 10 min |
| Login session exchange | 10 / 10 min / IP |
| Password reset / setup email | 3 / hour / email |
| Contact form | 5 / hour / IP |
| Assessment answer save | 120 / min / uid |

Vercel Firewall rules (rate limit on `/api/*`) are added in Phase 13 as an outer layer.

## 9. App Check

- Web provider: **reCAPTCHA Enterprise** (`NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY`).
- The client attaches `X-Firebase-AppCheck` to calls into `/api/payments/*`, `/api/auth/session` and
  the contact form. The server verifies it with `getAppCheck().verifyToken()`.
- Rollout is monitor-only first (log failures), then enforced after metrics look clean.
- Debug tokens are used for local development and CI.

## 10. HTTP security headers (implemented in `next.config.ts`, Phase 2)

Applied to every route: `Content-Security-Policy`, `Strict-Transport-Security` (2 years, preload),
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/topics off; `payment` allowed
for self and Razorpay), `Cross-Origin-Opener-Policy: same-origin-allow-popups` (Google sign-in popup),
and `poweredByHeader: false`.

**CSP decision: static policy, no nonces.** Next.js nonces require every page to render dynamically
and are incompatible with the Cache Components static shell / partial prerendering that the
architecture depends on for performance and SEO. The policy therefore allows `'unsafe-inline'`
scripts (Next's inline hydration payload) but restricts script, frame and connect origins to an
explicit allow-list: Razorpay Checkout/API, reCAPTCHA, Google APIs/Firebase, Bunny Stream iframe.
`object-src 'none'`, `base-uri 'self'`, `form-action 'self' api.razorpay.com` and
`frame-ancestors 'none'` stay strict. XSS defence relies primarily on React escaping, no
`dangerouslySetInnerHTML` on user content, and sanitized Markdown. Revisit if Next ships hash-based
CSP for inline payloads.

## 11. Audit logging

Every admin mutation, claim change, manual enrollment, refund, certificate revoke/reissue,
and every payment fulfilment writes to `auditLogs` inside the same transaction as the change.

## 12. Security checklist per phase

- [ ] New collection → rules entry + rules test
- [ ] New mutation → Zod schema, `requireUser`/`requireAdmin`, rate limit if public
- [ ] New secret → `src/lib/env/server.ts`, `.env.example`, FIREBASE_SETUP.md, Vercel/Secret Manager
- [ ] New external origin → CSP update
