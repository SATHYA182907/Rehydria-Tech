<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Rehydria project rules

- Read `docs/ARCHITECTURE.md` and `docs/SECURITY_PLAN.md` before changing backend code.
- Browsers never write to Firestore/Storage; all mutations go through Server Actions, Route Handlers or Cloud Functions with Zod validation and `requireUser()` / `requireAdmin()`.
- Money is integer paise. Admin authority is the `admin` custom claim, never a Firestore field.
- `src/shared` must stay runtime-agnostic (imported by both Next.js and `functions/`).
- Modules under `src/services` and `src/lib/env/server.ts` start with `import "server-only"`.
- Do not hardcode course, product, contact or testimonial data in components; read it from Firestore.
- Run `pnpm check` before finishing a change; keep `docs/` in sync with what was built.
