# Rehydria Platform — Implementation Plan

> Last updated: 2026-11-17 · Current phase: **All pages built (Phases 4, 5 and the page layer of 6, 8 and 12) → Razorpay (Phase 7) + course content next**

## Definition of done (every phase)

- `pnpm typecheck` passes (strict, `noUncheckedIndexedAccess`)
- `pnpm lint` passes with zero warnings in changed files
- `pnpm test` passes; new pure logic has unit tests
- Responsive check at 360 / 768 / 1024 / 1440 px (Playwright screenshots from Phase 2)
- Reduced-motion check for any new animation
- Rules/security checklist (SECURITY_PLAN.md §12) applied to new backend surface
- Docs in `docs/` updated to match what was actually built

## Requirement analysis summary

| Area | Key requirements | Hard dependencies |
|---|---|---|
| Marketing site | 13-section homepage, course & guide pages, SEO, premium GSAP | Design system; published catalog data |
| Catalog | Fully dynamic courses/modules/lessons, admin-managed | Firestore schema, admin CRUD, Storage |
| Enrollment | Native form (no Google Forms), guest or signed-in, duplicate protection | Auth, Razorpay, outbox email |
| Payments | Server orders, signature + webhook verification, idempotent, reconciliation | Razorpay keys, webhook URL (public domain) |
| LMS | Modules, secure video, PDFs, progress, resume, completion gating | Video provider, signed URLs |
| Assessments | 25 MCQ default, timer, shuffle, server grading, attempts | Enrollment, progress |
| Certificates | PDF + QR, email, verify page, revoke/reissue | Results, company settings, functions |
| Guide marketplace | ₹200 product, purchase, secure download | Payments, Storage |
| Admin | Overview stats, CRUD for everything, exports, announcements | All of the above |
| Email | 10 branded templates, retries, non-blocking | Resend, functions |

## Status: learning flow live (2026-11-19)

Every route in the specification exists, wired to real data:

| Area | Routes | State |
|---|---|---|
| Public | `/`, `/about`, `/internships`, `/internships/[slug]`, `/enroll` (account + application), `/enroll/payment` (placeholder until Razorpay), `/hackathon-guide`, `/contact`, `/faq`, `/legal/[policy]`, `/verify`, `/verify/[certificateId]`, 404, sitemap, robots, OG image | Live. Enrollment and guide purchase show "opens soon" until Razorpay keys exist; legal pages await Rehydria's policy text |
| Auth | `/login`, `/register` (redirects to `/enroll`, the account-creation form), `/reset-password`, `/account/action` | Live: email/password + Google, httpOnly session cookies, rate-limited |
| Student | Sidebar: Courses, Certificates, Settings. `/dashboard/courses`, `/dashboard/courses/[courseId]` (4 sequential levels, video + PDF per level, completion ring), `/dashboard/courses/[courseId]/assessment` (25 MCQ / 30 min exam), `/dashboard/certificates` (locked → unlocked), `/dashboard/settings`, `/certificate/[id]` (print / save as PDF) | Live. Lesson videos/PDFs are links set by admins; generated PDF files + email (Phase 10) pending |
| Admin | `/admin` + 12 sections + `/admin/courses/new`, `/admin/courses/[id]`, `/admin/questions/new` | Live: overview, tables for every collection, course create/edit, company settings, manual enrollment activation, lesson video/PDF links, question-bank import (plain text) and (de)activation |

Verified end-to-end on the production build against the Firebase emulators (register, login,
logout, admin grant, admin 404 for students, course creation → public page, lesson completion,
certificate verification, contact form, enrollment gating, rate limiting). On 2026-11-19 the full
learning flow was verified the same way: enroll → payment placeholder → admin activation → 4
levels → exam (answers survive a reload) → A+ result → certificate unlocked → print/PDF →
public verify, plus phone layout (no horizontal overflow).

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request: `pnpm install
--frozen-lockfile`, `pnpm check` (typecheck app + functions, ESLint, unit tests) and `pnpm build`
with only the public web config. Vercel deploys `main` independently (check its status on the
commit). End-to-end flows (sign-up → payment step → levels → exam → certificate, login landing,
logout) are verified against the production build with the Firebase emulators.

## Roadmap

### Phase 1: Setup, architecture & documentation ✅
- Next.js 16 + React 19 + TS strict + Tailwind 4 scaffold (pnpm workspace with `functions/`)
- Core dependencies installed; folder structure per ARCHITECTURE.md
- Zod-validated env module (server/client split), `.env.example`
- `src/shared`: collection names, domain types, money, grading, certificate IDs + unit tests
- Firebase config: `firebase.json`, deny-all rules baseline, designed composite indexes
- Functions workspace skeleton (esbuild bundle, region config)
- Six documentation files

### Phase 2: Design system & reusable components ✅
- Tokens in `globals.css` (`@theme`), fonts (Geist, Geist Mono, Instrument Serif)
- shadcn/ui init with custom theme; Button, Card, Badge, Input family, Dialog/Sheet,
  Accordion, Tabs, Tooltip, Dropdown, Skeleton, EmptyState, Progress/Ring, Stat, Toast
- Container/Section/SectionHeading, Navbar (glass + mega menu + mobile sheet), Footer
- `src/lib/gsap.ts`, `SmoothScrollProvider` (Lenis ↔ ScrollTrigger), `useReducedMotion`,
  `useGSAP` patterns, `MagneticButton`, `Cursor`, `RevealText`, `MaskImage` primitives
- Security headers + CSP in `next.config.ts`
- `/design` internal showcase route (dev, or `ENABLE_DESIGN_SHOWCASE=true` on previews; `notFound()` otherwise; noindex)
- Verified: no JS errors or CSP violations, no horizontal overflow at 375/768/1024/1440, form validation, dialog focus/Escape, mobile menu, navbar hide-on-scroll, reduced-motion (no Lenis, no SplitText)
- Not yet exercised in a browser: the Internships mega menu (renders only once published programs are passed in, Phase 4)

### Phase 3: Homepage & advanced animations ✅
- Preloader, hero (SplitText, aurora, circuit visual: R3F desktop / SVG mobile), all 13 sections
- Pinned horizontal programs track, scroll-drawn methodology timeline, count-up stats
- Lighthouse budget: LCP < 2.5s on 4G mid-tier, CLS < 0.05, TBT < 200ms
- Course/stats/testimonial data read through cached services with an empty-state fallback (no fake data)
- Built: `services/catalog` (cached, tagged Firestore reads → public DTOs), Firebase Admin singleton,
  dev seed script + emulator workflow (brought forward from Phase 6), preloader, hero with shared
  PCB geometry (SVG fallback + R3F scene), 11 content sections, Organization + FAQPage JSON-LD
- Measured (production build, Lighthouse 13): mobile Performance 99 / Accessibility 100 / SEO 100
  (LCP 1.1 s, TBT 110 ms, CLS 0); desktop 99 / 100 / 100. Real-browser LCP: ~0.2–0.4 s on phones
  and repeat desktop visits; ~2.1 s on a first desktop visit because of the intentional preloader.
  Best Practices 96 only because of 404 prefetches for Phase 4 routes.
- Verified: empty catalog renders gracefully (stats/guide/reviews hidden, "opening soon" card);
  reduced motion (no preloader, Lenis, splitting or pinning; nothing left hidden); client-side
  navigation back to "/" never replays the intro

### Phase 4: Public pages
- `/about`, `/internships`, `/internships/[slug]` (serves `/iot`, `/arduino`), `/hackathon-guide`,
  `/contact` (form → `mailQueue`), `/faq`, legal pages (content supplied by Rehydria)
- Metadata, OG images (`opengraph-image.tsx`), JSON-LD (`Organization`, `Course`, `Product`,
  `FAQPage`), `sitemap.ts`, `robots.ts`

### Phase 5: Firebase setup & authentication
- Client SDK (auth + App Check), Admin SDK singleton, emulator wiring
- `/login`, `/register`, `/reset-password`, `/account/setup`, `/account/action`
- Session cookie routes, DAL (`verifySession`, `requireUser`, `requireAdmin`), `proxy.ts`
- `admin:grant` CLI, `ensureUserProfile`

### Phase 6: Firestore schema & security rules
- Typed converters per collection, rules per SECURITY_PLAN.md §3, storage rules
- Rules unit tests in the emulator (`pnpm test:rules`)
- Seed script (dev/emulator only) for IoT, Arduino and Hackathon Guide
- Rate limiter service, audit log service

### Phase 7: Native enrollment & Razorpay
- Enrollment form (RHF + Zod), modal + dedicated `/enroll/[slug]` fallback
- `createCourseOrder` action, Checkout loader, `/api/payments/verify`,
  `/api/webhooks/razorpay`, `fulfilOrder` transaction, payment status polling page
- Functions: `reconcilePayments`, `sendQueuedMail` (+ enrollment/payment/account templates)
- Tests: signature helpers, fulfilment idempotency (emulator), webhook replay

### Phase 8: Student dashboard & LMS
- Dashboard shell (sidebar, topbar), overview, My Courses, course player
  (modules accordion, Bunny player, notes, resources), materials, profile
- Progress tracking, resume learning, completion computation, secure downloads

### Phase 9: MCQ assessment engine (done)
- Start/save/submit Server Actions (`src/services/assessments`), exam UI (one question at a
  time, navigator, timer, auto-submit, confirm dialog), animated result screen, grading tests.
  Expired attempts are auto-submitted lazily when the student next opens the assessment (the
  scheduled `expireAssessmentAttempts` function remains optional).

### Phase 10: Certificates & email
- Done: certificate issued (status `valid`) in the grading transaction on a pass; animated
  unlock on `/dashboard/certificates`; print-ready `/certificate/[id]`; `/verify/[id]`
- Pending: `renderCertificate` function (pdf-lib, QR → `/verify/[id]`), certificate email,
  `/verify/[certificateId]` page, dashboard certificates, all 10 email templates

### Phase 11: Hackathon guide purchasing
- Purchase flow reusing payment core, dashboard "My guides", secure download endpoint

### Phase 12: Administrator dashboard
- Overview (stats + Recharts), students, courses/modules/lessons CRUD with uploads,
  enrollments (incl. manual grant), assessments/questions (CSV import), results,
  certificates (generate/revoke/reissue), payments (filters, refunds view, CSV export),
  products, announcements, settings (company, admins)

### Phase 13: Testing, optimization & deployment
- Playwright e2e (enroll with Razorpay test mode, learn, exam, certificate, verify)
- Performance pass, bundle analysis, image audit, a11y audit (axe)
- gitleaks, Vercel Firewall rate limits, production deploy runbook

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Webhook unreachable during local dev | Reconciler + checkout verify path make webhook non-critical |
| Animation weight hurting CWV | Per-section dynamic imports, R3F desktop-only, budgets enforced in Phase 3 |
| Cache Components learning curve | Session reads isolated in DAL behind Suspense; documented patterns in ARCHITECTURE.md §4 |
| Video cost/abuse | Token-auth embeds with expiry + referrer allow-list |
| Missing business content (legal text, contact details) | UI hides empty fields; checklist in FIREBASE_SETUP.md |
