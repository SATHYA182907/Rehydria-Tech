import { z } from "zod";

/**
 * Public (browser-safe) environment. Each variable must be referenced literally as
 * `process.env.NEXT_PUBLIC_…` so Next.js inlines it at build time.
 */
const schema = z.object({
  firebase: z.object({
    apiKey: z.string().min(1),
    authDomain: z.string().min(1),
    projectId: z.string().min(1),
    storageBucket: z.string().min(1),
    messagingSenderId: z.string().min(1),
    appId: z.string().min(1),
  }),
  recaptchaEnterpriseSiteKey: z.string().optional(),
  useEmulators: z.boolean(),
  siteUrl: z.string().default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof schema>;

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const result = schema.safeParse({
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    recaptchaEnterpriseSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY || undefined,
    useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
  if (!result.success) {
    throw new Error(
      `Missing public Firebase configuration (${result.error.issues.map((i) => i.path.join(".")).join(", ")}). ` +
        "Copy .env.example to .env.local and fill in the NEXT_PUBLIC_FIREBASE_* values.",
    );
  }
  cached = result.data;
  return cached;
}
