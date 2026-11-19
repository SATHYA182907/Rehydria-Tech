# Rehydria Platform — Firebase, Razorpay, Resend & Vercel Setup

> Status: **Phase 1** · Last updated: 2026-11-17
> Follow these steps once per environment (dev and prod). No credentials are stored in this repository.

## 0. Prerequisites

- Node.js 22 LTS, pnpm 10 (`corepack enable`)
- Firebase CLI: `pnpm dlx firebase-tools@latest login` (or install globally)
- A Google Cloud billing account. Cloud Functions v2, Secret Manager and signed URLs need the **Blaze** plan.
- Java 21+ for the Firestore/Storage emulators

## Current project

Production project: **`rehydria-tech`** (web config committed in `.env.production`; it is public by
design). Still required for the server to work in production:

1. ✅ Done (2026-11-18): **Email/Password** and **Google** sign-in enabled via the `auth` block in
   `firebase.json`; authorized domains include `rehydria-tech.vercel.app`. Firestore `(default)`
   created in `asia-south1` (Standard, delete protection on); rules + indexes deployed.
   To redeploy auth config: create the git-ignored `firebase.local.json` (a copy of
   `firebase.json` with the real `supportEmail`) and run
   `npx -y firebase-tools@latest deploy --only auth --config firebase.local.json --project rehydria-tech`.
2. Create a service account key (§3) and set `FIREBASE_ADMIN_CLIENT_EMAIL` and
   `FIREBASE_ADMIN_PRIVATE_KEY` in Vercel (Production + Preview). Without these, sign-in returns
   "not available yet" and catalog pages render their empty states.
3. ✅ Done. Firestore rules + indexes are redeployed with: `pnpm exec firebase deploy --only firestore:rules,firestore:indexes,storage --project rehydria-tech`.
4. Register, then grant yourself admin: `pnpm admin:grant you@example.com` (with the admin env vars in `.env.local`).

## 1. Create the Firebase projects

Create two projects so test data and live payments never mix:

| Alias | Suggested project id | Razorpay mode |
|---|---|---|
| `dev` | `rehydria-dev` | Test |
| `prod` | `rehydria-prod` | Live |

```bash
cp .firebaserc.example .firebaserc   # then edit the ids
firebase use dev
```

### Location

When creating Firestore and Storage, pick **`asia-south1` (Mumbai)** for both. The location
cannot be changed later. Cloud Functions also deploy to `asia-south1` (set in `functions/src/config.ts`).

## 2. Enable products (Console)

1. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
   - Settings → *User actions*: enable **Email enumeration protection**.
   - Settings → *Authorized domains*: add `localhost`, your Vercel preview domain pattern host, and the production domain.
   - Templates → *Password reset* → set the action URL to `https://<domain>/account/action`
     (our branded page handles `mode=resetPassword`). Branded emails are sent by Resend,
     so the Firebase default template is only a fallback.
2. **Firestore Database** → Create (production mode, `asia-south1`).
3. **Storage** → Get started (`asia-south1`).
4. **App Check** → register the web app with **reCAPTCHA Enterprise**. Start in *monitor*
   mode for Firestore/Storage, then enforce after a week of clean metrics.
5. **Project settings → General → Your apps** → add a **Web app**. Copy the config values
   into `NEXT_PUBLIC_FIREBASE_*` variables.

## 3. Service account for the Next.js server (Vercel)

1. Google Cloud Console → IAM & Admin → Service Accounts → **Create** `rehydria-web`.
2. Grant roles:
   - `Firebase Admin SDK Administrator Service Agent` (`roles/firebase.sdkAdminServiceAgent`)
   - `Service Account Token Creator` (`roles/iam.serviceAccountTokenCreator`) **on itself**, required for Storage V4 signed URLs
   - `Firebase App Check Admin` (to verify App Check tokens)
3. Keys → Add key → JSON. Copy `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL` and
   `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` escapes; `src/lib/env/server.ts`
   converts them). **Delete the JSON file afterwards.** Never commit it.
4. If your org policy blocks key creation, deploy with Vercel's OIDC Workload Identity
   Federation instead; `src/lib/firebase/admin.ts` falls back to Application Default Credentials when no key is set.

## 4. Deploy rules and indexes

```bash
pnpm firebase:deploy:rules     # firestore.rules, storage.rules, firestore.indexes.json
```

Then configure **TTL policies** (Console → Firestore → TTL):

| Collection group | Field |
|---|---|
| `rateLimits` | `expireAt` |
| `webhookEvents` | `expireAt` |

## 5. Cloud Functions

```bash
cd functions && pnpm install && cd ..
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RESEND_API_KEY
pnpm firebase:deploy:functions
```

Non-secret function params (`firebase deploy` prompts the first time; stored in `functions/.env.<project>`, which is git-ignored):
`SITE_URL`, `EMAIL_FROM`, `EMAIL_REPLY_TO`.

## 6. Grant the first administrator

Admin rights are a custom claim, never a Firestore field. After the person has registered
on the site:

```bash
# uses FIREBASE_ADMIN_* from .env.local
pnpm admin:grant founder@your-domain.com   # script added in Phase 5
```

The script sets `{ admin: true }`, revokes refresh tokens (forcing a fresh login), and writes
an `auditLogs` entry. Later admins can be granted from `/admin/settings`.

## 7. Razorpay

1. Dashboard → **Account & Settings → API Keys** → generate keys (Test mode first).
   → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
2. **Payment capture**: Settings → Payment Capture → *Automatic*, capture within 5 minutes.
3. **Webhooks** → Add:
   - URL: `https://<domain>/api/webhooks/razorpay`
   - Secret: generate a long random string → `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`
4. For local webhook testing use `ngrok http 3000` (or Cloudflare Tunnel) and a separate
   Test-mode webhook entry.
5. Before going live, complete KYC and website verification (Razorpay requires public
   Terms, Privacy, Refund & Cancellation, Contact and Shipping/Delivery policy pages. These are
   planned as static pages in Phase 4, and their **content must be supplied by Rehydria**).

## 8. Resend

1. Add and verify your sending domain (SPF, DKIM, and a DMARC record recommended).
2. Create an API key with *Sending access* → Firebase secret `RESEND_API_KEY`.
3. Set `EMAIL_FROM` e.g. `Rehydria Technology <no-reply@your-domain.com>`.

## 9. Bunny Stream (course videos)

1. Create a **Stream library** (region: Asia). Library → Security:
   - Enable **Embed view token authentication**.
   - Add allowed referrers: production and preview domains.
2. Copy library id → `BUNNY_STREAM_LIBRARY_ID`, token auth key → `BUNNY_STREAM_TOKEN_KEY`,
   API key → `BUNNY_STREAM_API_KEY` (admin uploads, Phase 12).

## 10. Vercel

1. Import the repository; framework preset Next.js; install command `pnpm install`.
2. Add environment variables from `.env.example` for **Production** and **Preview** separately
   (Preview uses the dev Firebase project and Razorpay Test keys). Mark secrets *Sensitive*.
3. Set `NEXT_PUBLIC_SITE_URL` per environment.
4. Region: `bom1` (Mumbai), close to Firestore `asia-south1`.

## 11. Local development

No Firebase project is needed to develop the site. The Firebase Emulator Suite (Java 21+) is enough:

```bash
pnpm install
cp .env.example .env.local
```

In `.env.local` set `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-rehydria`,
`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-rehydria.appspot.com`,
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and
`METADATA_SERVER_DETECTION=none`. Then, in separate terminals:

```bash
pnpm emulators
```

```bash
pnpm seed
```

```bash
pnpm dev
```

`pnpm seed` writes the IoT and Arduino programs (4 levels each with a video and a PDF lesson, the
published 25-question final assessment and 30 clearly-marked SAMPLE questions per course), the
Hackathon Guide and public company settings. It refuses to run without the emulator unless
`SEED_ALLOW_DEV_PROJECT=true`, and never against a project id containing "prod". Seeded documents
carry `_seed: true`. Everything except the Arduino module titles and the ₹200 guide price is
**sample content** (IoT curriculum, lesson titles, course prices, durations, guide contents) to be
replaced by Rehydria in the admin dashboard.

Without any Firebase configuration the site still builds: catalog sections render their empty states.

## 11b. Publish the launch courses to the real project

`pnpm courses:publish` writes the IoT and Arduino course structure (from
`scripts/lib/course-catalog.ts`, no sample questions) to the project in
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, using `FIREBASE_ADMIN_*` credentials. Existing courses are
skipped unless `--force`. Fees start at 0 ("Fee to be announced"); set them in `/admin/courses`.

Then, as admin:
1. `/admin/lessons`: add each level's video link and PDF link ("Add links").
2. `/admin/questions/new`: paste at least 25 questions per course (more = varied attempts).
   The assessment cannot start until the bank has enough active questions.
3. `/admin/settings`: director name (printed on certificates).

Until Razorpay is connected, activate paid applications in `/admin/enrollments` ("Activate").

## 12. Configure company details

Sign in as admin → `/admin/settings` → Company: logo, email, phone, address, director
name and signature (uploaded to private storage). These populate the website footer, emails
and certificates. Nothing is pre-filled with invented values.

## Checklist of credentials Rehydria must provide

| Item | Needed for | Phase |
|---|---|---|
| Firebase web config (dev, prod) | Auth, App Check | 5 |
| Service account key or Vercel OIDC setup | Server Admin SDK | 5 |
| reCAPTCHA Enterprise site key | App Check | 5 |
| Razorpay Test + Live keys, webhook secret | Payments | 7 |
| Resend API key + verified domain | Emails | 10 |
| Bunny Stream library id, token key, API key | Video lessons | 8 |
| Logo (SVG preferred), director name, signature (transparent PNG) | Branding, certificates | 2 / 10 |
| Company email, phone, address, legal policy texts | Footer, contact, Razorpay KYC | 4 |
| Course content: modules, videos, PDFs, MCQs, prices | LMS | 8–9 |
| Production domain | Auth domains, webhooks, email | 13 |
