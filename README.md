# Rehydria Technology Platform

**Learn. Innovate. Build the Future.**
Technical internships (IoT, Arduino, more to come), hands-on learning, MCQ assessments, verifiable
certificates and a Hackathon Guide marketplace for Rehydria Technology Pvt Ltd.

| | |
|---|---|
| Frontend | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui |
| Motion | GSAP + ScrollTrigger + SplitText · Lenis · Motion |
| Backend | Firebase Auth · Firestore · Storage · Cloud Functions v2 (asia-south1) |
| Payments / Email / Video | Razorpay · Resend · Bunny Stream |
| Hosting | Vercel (bom1) + Firebase |

## Documentation

Start here. These documents describe the actual implementation decision:

1. [Architecture](docs/ARCHITECTURE.md)
2. [Database schema](docs/DATABASE_SCHEMA.md)
3. [Firebase, Razorpay, Resend & Vercel setup](docs/FIREBASE_SETUP.md)
4. [Implementation plan & roadmap](docs/IMPLEMENTATION_PLAN.md)
5. [Design system](docs/DESIGN_SYSTEM.md)
6. [Security plan](docs/SECURITY_PLAN.md)

## Getting started

```bash
corepack enable
pnpm install
cp .env.example .env.local   # see docs/FIREBASE_SETUP.md §11 for emulator values
pnpm emulators               # terminal 1 (needs Java 21+)
pnpm seed                    # terminal 2, once
pnpm dev
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm typecheck` | Route typegen + `tsc` for app and functions |
| `pnpm lint` | ESLint (flat config) |
| `pnpm test` | Vitest unit tests |
| `pnpm check` | typecheck + lint + test (run before every commit) |
| `pnpm functions:build` | Bundle Cloud Functions with esbuild |
| `pnpm emulators` | Firebase Emulator Suite (Firestore, Auth, Storage) on project `demo-rehydria` |
| `pnpm seed` | Seed dev data into the emulator (refuses production) |
| `pnpm firebase:deploy:rules` / `:functions` | Deploy rules+indexes / functions |

## Repository layout

```
docs/        planning & architecture documents
firebase/    firestore.rules · storage.rules · firestore.indexes.json
functions/   Cloud Functions workspace (event-driven/background work)
src/app      routes: (public) · (auth) · dashboard · admin · verify · api
src/shared   pure domain code shared with functions (types, grading, money, ids)
src/services server-only data access layer
```

Never commit secrets. `.env*` files (except `.env.example`) are git-ignored.
