# Rehydria Platform — Architecture

> Status: **Phase 1 baseline** · Last updated: 2026-11-17
> Owner: Rehydria Technology Pvt Ltd engineering

This document records the decisions that shape the codebase. When an implementation
decision changes, update this file in the same change.

---

## 1. System overview

```
                         ┌──────────────────────────────────────────────┐
  Browser                │  Vercel — Next.js 16 (App Router, Node.js)    │
  ───────                │                                              │
  • Marketing pages ───▶ │  Server Components  ── 'use cache' + tags     │
  • Student dashboard    │  Server Actions     ── mutations (authz'd)     │
  • Admin dashboard      │  Route Handlers     ── /api/* (payments,       │
  • Razorpay Checkout ─┐ │                        webhooks, downloads,    │
  • Firebase Auth SDK  │ │                        session)               │
    (sign-in only)     │ │  proxy.ts           ── optimistic route guard  │
                       │ │  Data Access Layer  ── firebase-admin (server) │
                       │ └───────────────┬──────────────────────────────┘
                       │                 │ Admin SDK (service account)
                       ▼                 ▼
               ┌──────────────┐  ┌───────────────────────────────────────┐
               │  Razorpay     │  │  Firebase (asia-south1)                │
               │  Orders API   │  │  • Authentication (email/password,     │
               │  Checkout     │  │    Google) + custom claims             │
               │  Webhooks ────┼─▶│  • Cloud Firestore                     │
               └──────────────┘  │  • Cloud Storage (private buckets)      │
                                  │  • Cloud Functions v2 (event-driven):   │
               ┌──────────────┐  │    – mail outbox sender (→ Resend)      │
               │  Resend       │◀─┤    – certificate PDF renderer           │
               └──────────────┘  │    – scheduled reconciliation/expiry    │
               ┌──────────────┐  │    – auth onCreate profile bootstrap    │
               │ Bunny Stream │◀─┤                                         │
               │ (video, token│  └───────────────────────────────────────┘
               │  auth)       │
               └──────────────┘
```

### Split of responsibilities

| Concern | Where it runs | Why |
|---|---|---|
| Rendering, SEO, routing | Next.js on Vercel | Edge CDN, streaming, Cache Components |
| Request/response business logic (create order, verify payment, submit exam, admin CRUD) | Next.js Server Actions & Route Handlers using `firebase-admin` | One codebase, one deploy, typed end-to-end; no cold-start hop to a second service in the checkout path |
| Razorpay webhook | Next.js Route Handler `POST /api/webhooks/razorpay` | Needs raw body for HMAC; same fulfilment code as checkout verification |
| Event-driven & background work (emails, PDF generation, schedules) | Firebase Cloud Functions v2 | Retries, Firestore triggers, schedulers, longer CPU time; failures never block the user request |
| Authentication | Firebase Auth (client SDK for sign-in) → httpOnly session cookie verified by Admin SDK | Server-side authorization on every request |
| File storage | Firebase Storage (private) + short-lived V4 signed URLs | No permanent public links for paid content |
| Video | Bunny Stream with token-authenticated embeds (provider interface) | Firebase Storage is not a streaming CDN; adaptive HLS, low India egress cost |
| Email | Resend, sent only from the Cloud Functions outbox | Retries, never blocks payments |

### Guiding principles

1. **Server is the only writer.** Browsers never write to Firestore or Storage directly.
   Every mutation goes through a Server Action / Route Handler / Cloud Function that
   validates input with Zod and authorizes with the verified session.
2. **Security rules are defence in depth.** Rules are deny-by-default and allow only narrow
   owner reads and public reads of published catalog data, so a leaked client config or
   a future client feature cannot escalate access.
3. **Money is integer paise.** No floats anywhere in the payment path.
4. **Idempotent fulfilment.** Checkout verification, webhook, and reconciliation all call the
   same transactional `fulfilOrder()` which is safe to run any number of times.
5. **Outbox for side-effects.** Emails and certificate rendering are queued as Firestore
   documents written *inside* the business transaction, then processed asynchronously.
6. **Data-driven catalog.** Courses, modules, lessons, assessments and products live in
   Firestore. The frontend renders whatever is published; adding a course needs no code.

---

## 2. Technology choices (pinned at Phase 1)

| Area | Package | Version | Notes |
|---|---|---|---|
| Framework | `next` | 16.4.6 | App Router, Turbopack, `cacheComponents: true`, `proxy.ts` (Middleware was renamed in v16) |
| UI runtime | `react` / `react-dom` | 19.3 | |
| Language | `typescript` | 5.9 | `strict` + `noUncheckedIndexedAccess`. TS 7 (native port) deliberately not adopted yet — Next's type plugin targets 5.x |
| Styling | `tailwindcss` | 4.3 | CSS-first `@theme` tokens, see DESIGN_SYSTEM.md |
| Components | shadcn/ui (copied source) + `class-variance-authority`, `clsx`, `tailwind-merge` | — | Components are owned code under `src/components/ui` |
| Icons | `lucide-react` | 1.x | |
| Animation | `gsap` + `@gsap/react` (`useGSAP`), `ScrollTrigger`, `SplitText` | 3.15 | All GSAP plugins are free since 3.13 |
| Smooth scroll | `lenis` | 1.3 | Driven by GSAP ticker (see §6) |
| Component motion | `motion` | 14 | Layout/presence animations in dashboards & modals |
| Auth/DB/Storage | `firebase` (client, auth+app-check only), `firebase-admin` | 13 / 14 | |
| Functions | `firebase-functions` v2 API | 7.x | Separate workspace package `functions/` |
| Payments | `razorpay` (server SDK) + Checkout.js | 2.9 | |
| Email | `resend` | 6.x | Dependency of `functions/` only — the web app never holds the Resend key |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | 7 / 4 / 7 | Same Zod schemas validate on the server |
| Charts | `recharts` | 3.x | Dashboards only, dynamically imported |
| PDF | `pdf-lib` + `@pdf-lib/fontkit` + `qrcode` | — | Certificates, in Cloud Functions (Phase 10) |
| Tests | `vitest` (unit), `@firebase/rules-unit-testing` (rules, Phase 6), Playwright (e2e, Phase 13) | | |

Package manager: **pnpm 10** with a workspace (`.` and `functions/`).

---

## 3. Repository layout

```
rehydria/
├─ docs/                         Architecture & planning documents (this folder)
├─ firebase/
│  ├─ firestore.rules            Deny-by-default rules (Phase 6 fills them in)
│  ├─ firestore.indexes.json     Composite indexes (designed in DATABASE_SCHEMA.md)
│  └─ storage.rules
├─ firebase.json                 Firebase CLI config (rules, indexes, functions, emulators)
├─ functions/                    Cloud Functions workspace package (esbuild-bundled)
│  └─ src/{auth,payments,enrollment,assessments,certificates,notifications}/
│                                (email templates live in notifications/templates — only functions send mail)
├─ public/{images,icons,fonts}/
├─ src/
│  ├─ app/
│  │  ├─ (public)/               Marketing site — shared header/footer, Lenis
│  │  ├─ (auth)/                 /login, /register, /reset-password, /account/setup
│  │  ├─ dashboard/              Student area (own layout + sidebar)
│  │  ├─ admin/                  Admin area (own layout, admin claim required)
│  │  ├─ verify/[certificateId]/ Public certificate verification
│  │  ├─ api/                    Route handlers (session, payments, webhooks, downloads)
│  │  ├─ sitemap.ts, robots.ts, layout.tsx, globals.css
│  ├─ components/{ui,layout,animations,homepage,courses,enrollment,dashboard,admin}/
│  ├─ config/                    site.ts (brand), navigation.ts, routes.ts
│  ├─ hooks/                     Client hooks (useLenis, useReducedMotion, useMediaQuery…)
│  ├─ lib/
│  │  ├─ env/                    server.ts (server-only, lazy Zod parsing) · client.ts (NEXT_PUBLIC_*)
│  │  ├─ firebase/               client.ts (browser), admin.ts (server-only)
│  │  ├─ razorpay/               server client, signature helpers
│  │  ├─ validations/            Zod schemas shared by forms and server
│  │  └─ utils/                  cn(), formatters
│  ├─ services/                  Server-only domain services (the Data Access Layer)
│  │  ├─ auth/  courses/  enrollment/  payments/  assessments/  certificates/
│  ├─ shared/                    Pure, dependency-light TS shared with functions/
│  │                             (collection names, domain types, grading, money, ids)
│  ├─ types/
│  ├─ styles/
│  └─ proxy.ts                   Optimistic auth redirects (cookie presence only)
└─ .env.example
```

**Rule:** page components compose; they do not contain business logic. Pages call
`services/*` (server) or hooks (client). `services/*` modules start with
`import "server-only"` so they can never be bundled to the browser.

`src/shared/` must stay free of Node-only or browser-only APIs so both the Next app and the
`functions/` bundle can import it (functions resolve it through esbuild at build time).

---

## 4. Rendering & caching strategy (Cache Components)

`cacheComponents: true` is enabled. Consequences we design around:

- **Dynamic catalog routes** (`/internships/[slug]`, `/enroll`, `/legal/[policy]`) list build-time slugs in
  `generateStaticParams` and await `params` inside `<Suspense>`, so courses published after a deploy
  render on demand and are then cached (ISR with Partial Prefetching). Unknown slugs stream the
  404 UI with `noindex` (status 200, inherent to streaming).
- **Public catalog pages** (`/`, `/internships`, `/internships/[slug]`, `/hackathon-guide`)
  read Firestore through `src/services/catalog` (implemented in Phase 3) inside `'use cache'` functions tagged `catalog`, `course:{id}`,
  `product:{id}`, with `cacheLife('hours')`. Admin mutations (Server Actions) call
  `updateTag()` so edits are visible immediately. These pages prerender into the static
  shell and are fully SEO-crawlable.
- **`/internships/iot` and `/internships/arduino`** are not special files. They are the
  dynamic segment `/internships/[slug]` with `generateStaticParams()` over published course
  slugs. New courses get their page automatically.
- **Session-dependent UI** (header avatar, dashboards, admin) reads cookies, so it lives
  behind `<Suspense>` boundaries with skeleton fallbacks. Layouts never `await` the
  session at top level (that would block `{children}`).
- `getCurrentUser()` uses `'use cache: private'` so prefetches can reuse the verified user
  in the browser without caching it on the server.
- Per-user data (enrollments, progress) is fetched through a function that resolves the
  user, then passes `uid` into a `'use cache'` function tagged `user:{uid}:…` with a short
  lifetime; mutations call `updateTag()` on those tags.

---

## 5. Authentication & authorization

### Flow

1. Client signs in with the Firebase Auth JS SDK (email/password or Google).
2. Client posts the fresh ID token to `POST /api/auth/session`.
3. Server verifies the token (`verifyIdToken`, must be < 5 min old), checks App Check, and
   issues a **Firebase session cookie** (`createSessionCookie`, 7-day expiry) as
   `__session`: `httpOnly`, `secure`, `sameSite=lax`, `path=/`. In the same request it
   calls `ensureUserProfile(uid)`, which idempotently creates `users/{uid}` with role `student`.
   No Auth blocking function is needed, so the project does not require an Identity Platform upgrade.
4. Every server read/mutation calls `verifySession()` in the DAL →
   `verifySessionCookie(cookie, checkRevoked=true)`.
5. Sign-out: `DELETE /api/auth/session` clears the cookie and calls
   `revokeRefreshTokens(uid)`; client calls `signOut()`.

### Roles

- `student` is the default. It is stored on `users/{uid}.role` for display only.
- **Admin is a custom claim `{ admin: true }`.** It is set only by:
  - `pnpm admin:grant <email>`, a CLI script run locally with a service account, or
  - an existing admin from `/admin/settings` (Server Action, audited).
- The role field in Firestore is never trusted for authorization; the verified claim is.
- After a claim change, the user's refresh tokens are revoked so a fresh token is required.

### Enforcement layers

| Layer | What it does | Trust |
|---|---|---|
| `src/proxy.ts` | Redirects `/dashboard/*`, `/admin/*` to `/login` when no `__session` cookie | Optimistic UX only |
| Layout guards | `dashboard/layout.tsx` and `admin/layout.tsx` call `requireUser()` / `requireAdmin()` inside a Suspense boundary | Real check |
| DAL / Server Actions / Route Handlers | Every function re-verifies the session and checks ownership or claims | **Authoritative** |
| Firestore / Storage rules | Deny client writes; owner-only reads; public read of published catalog | Defence in depth |

---

## 6. Animation architecture

- **Single Lenis instance** is created in a client `SmoothScrollProvider` mounted only in the
  `(public)` layout. Dashboards use native scroll, because app UIs need predictable
  scrolling and nested scroll areas.
- Lenis is driven by GSAP's ticker so ScrollTrigger and Lenis share one RAF loop:
  ```ts
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
- All GSAP code uses `useGSAP()` (scoped `gsap.context`), so it reverts automatically on
  unmount and route change. No module-level tweens.
- `gsap.matchMedia()` gates animations:
  `(prefers-reduced-motion: no-preference)` for motion, `(min-width: 1024px) and (pointer: fine)`
  for cursor/magnetic/horizontal-pin effects. Reduced-motion users get instant states
  and Lenis is not started.
- **Device tiers.** Lenis runs only for fine pointers (it does not smooth touch input). The
  preloader and choreographed hero entrance run only on desktops with a fine pointer, once per
  session; phones/tablets paint the hero immediately so the headline is the LCP element. The hero
  visual is a DOM/CSS "learning journey" showcase (no WebGL), so phones download no 3D code.
- **Mobile.** Inputs are 16px on phones (no iOS focus zoom), `viewport-fit=cover` with safe-area
  padding on sticky bars, ScrollTrigger ignores address-bar resizes, large blurred layers are static
  on touch devices, and course pages show a sticky price + Enroll bar.
- **Deferred setup.** Below-the-fold animations initialise via `whenNear()` (`src/lib/when-near.ts`,
  IntersectionObserver) instead of during hydration, keeping Total Blocking Time low.
- Plugins (`ScrollTrigger`, `SplitText`) are registered once in `src/lib/gsap.ts`, which is
  imported only by client animation components. Marketing animation code is
  dynamically imported per section, so the dashboard bundles never include GSAP unless used.
- `ScrollTrigger.refresh()` runs after fonts load (`document.fonts.ready`) and after route
  transitions.
- Motion (`motion/react`) is used for component-level presence/layout transitions (modals,
  sidebar, tabs). GSAP owns scroll and timeline choreography. A single element is never
  animated by both.

---

## 7. Payments architecture (summary)

Full detail lives in SECURITY_PLAN.md §5 and DATABASE_SCHEMA.md (`payments`).

```
Client                        Next.js server                         Razorpay
──────                        ──────────────                         ────────
EnrollForm ──(zod)──▶ createCourseOrder (Server Action)
                       • rate-limit, App Check
                       • validate course published, price from DB
                       • duplicate-enrollment check
                       • create enrollments/{id} status=pending_payment
                       • razorpay.orders.create({amount: paise, receipt})──▶ order_xxx
                       • payments/{order_xxx} status=created  ◀──────────────┘
      ◀── {orderId, keyId, amount, prefill}
Checkout.js opens ──────────────────────────────────────────────────▶ user pays
handler(resp) ──▶ POST /api/payments/verify
                       • HMAC_SHA256(order_id|payment_id, key_secret) == signature
                       • fetch payment from Razorpay API, check amount/status/order
                       • fulfilOrder(orderId)  ── Firestore transaction (idempotent)
                                                                  webhook payment.captured
                  POST /api/webhooks/razorpay ◀──────────────────────────────┘
                       • verify X-Razorpay-Signature over raw body
                       • dedupe on event id (webhookEvents/{id})
                       • fulfilOrder(orderId)   (no-op if already fulfilled)
Scheduled (CF) every 15 min: reconcile `created`/`attempted` orders older than 15 min via
Orders API; expire orders older than 24 h → abandoned.
```

`fulfilOrder()` in one transaction: payment → `paid`; enrollment → `active` (or purchase →
`active`); ensures `users/{uid}` exists (creating the Auth user for first-time students);
writes `auditLogs` and `mailQueue` entries. Course access is derived **only** from an
`active` enrollment.

---

## 8. Background processing (Cloud Functions, region `asia-south1`)

| Function | Trigger | Purpose |
|---|---|---|
| `sendQueuedMail` | `onDocumentCreated("mailQueue/{id}")`, `retry: true` | Render template, send via Resend with idempotency key = doc id; exponential back-off; mark `sent`/`failed` |
| `renderCertificate` | `onDocumentWritten("certificates/{id}")` when `status == "pending"` | Generate PDF with pdf-lib, upload to private Storage, set `valid`, enqueue email |
| `reconcilePayments` | `onSchedule("every 15 minutes")` | Catch missed webhooks; expire abandoned orders |
| `expireAssessmentAttempts` | `onSchedule("every 5 minutes")` | Auto-submit attempts past `expiresAt` with saved answers |
| `aggregateStats` | `onDocumentWritten` on payments/enrollments/certificates | Maintain `stats/global` counters for admin overview (avoids full scans) |

Secrets for functions use `defineSecret()` (Google Secret Manager). They are never stored
in `.env` files committed to git.

---

## 9. Video delivery

A `VideoProvider` interface (`src/services/courses/video.ts`) produces a short-lived playback
URL for a lesson after the server confirms an active enrollment:

```ts
interface VideoProvider {
  getPlayback(lesson: { videoId: string }, viewer: { uid: string }): Promise<{ embedUrl: string; expiresAt: number }>;
}
```

The default implementation is **Bunny Stream** with Embed Token Authentication
(`sha256(tokenKey + videoId + expires)`, 2-hour expiry). Lesson documents store only the
provider `videoId`, never a playable public URL. Swapping to Mux or Cloudflare Stream means
adding one implementation; nothing else changes.

---

## 10. Environments

| Env | Next.js | Firebase project | Razorpay |
|---|---|---|---|
| local | `pnpm dev` | Firebase Emulator Suite (`demo-rehydria`) or dev project | Test mode keys |
| preview | Vercel Preview | `rehydria-dev` | Test mode |
| production | Vercel Production | `rehydria-prod` | Live mode |

Seed data (`pnpm seed`) writes the two launch courses (IoT, Arduino) and the Hackathon
Guide product **only to the emulator or dev project**. The script refuses to run
against a project id ending in `-prod`.

---

## 11. Observability

- Structured JSON logs from Route Handlers and Functions (`logger` from firebase-functions;
  a small `log()` wrapper in Next) with `requestId`, `uid`, `orderId`.
- `auditLogs` collection for every privileged action (admin edits, claim changes,
  certificate revoke/reissue, refunds, manual enrollment).
- Vercel Analytics / Speed Insights for Core Web Vitals (Phase 13).
