import "server-only";
import { z } from "zod";

/**
 * Server-only environment. Importing this module from a Client Component fails the build
 * (via `server-only`). Values are parsed lazily so `next build` can run without
 * credentials, and each integration validates only what it needs when first used.
 */

const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const firebaseAdminSchema = z.object({
  projectId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
  storageBucket: z.string().min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required"),
  clientEmail: optional,
  privateKey: optional.transform((v) => v?.replace(/\\n/g, "\n")),
});

const razorpaySchema = z.object({
  keyId: z.string().regex(/^rzp_(test|live)_/, "RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_"),
  keySecret: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  webhookSecret: z.string().min(16, "RAZORPAY_WEBHOOK_SECRET must be at least 16 characters"),
});

const bunnySchema = z.object({
  libraryId: z.string().min(1, "BUNNY_STREAM_LIBRARY_ID is required"),
  tokenKey: z.string().min(1, "BUNNY_STREAM_TOKEN_KEY is required"),
  apiKey: optional,
});

const appSchema = z.object({
  siteUrl: z.url("NEXT_PUBLIC_SITE_URL must be an absolute URL"),
  directorName: optional,
  directorSignatureUrl: optional,
  sessionCookieDays: z.coerce.number().int().min(1).max(14).default(7),
});

function parse<T extends z.ZodType>(schema: T, input: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => `  - ${i.path.join(".") || label}: ${i.message}`).join("\n");
    throw new Error(`Invalid ${label} configuration:\n${details}\nSee .env.example and docs/FIREBASE_SETUP.md.`);
  }
  return result.data;
}

function memo<T>(factory: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= factory());
}

export const firebaseAdminEnv = memo(() =>
  parse(
    firebaseAdminSchema,
    {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    },
    "Firebase Admin",
  ),
);

export const razorpayEnv = memo(() =>
  parse(
    razorpaySchema,
    {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    "Razorpay",
  ),
);

export const bunnyEnv = memo(() =>
  parse(
    bunnySchema,
    {
      libraryId: process.env.BUNNY_STREAM_LIBRARY_ID,
      tokenKey: process.env.BUNNY_STREAM_TOKEN_KEY,
      apiKey: process.env.BUNNY_STREAM_API_KEY,
    },
    "Bunny Stream",
  ),
);

export const appEnv = memo(() =>
  parse(
    appSchema,
    {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      directorName: process.env.DIRECTOR_NAME,
      directorSignatureUrl: process.env.DIRECTOR_SIGNATURE_URL,
      sessionCookieDays: process.env.SESSION_COOKIE_DAYS,
    },
    "application",
  ),
);
