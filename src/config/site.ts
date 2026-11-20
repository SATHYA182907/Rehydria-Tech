/**
 * Static brand identity. Contact details, logo, director name and signature are
 * configured by an administrator in `settings/company` (see docs/DATABASE_SCHEMA.md §17)
 * and are intentionally NOT hardcoded here.
 */
export const siteConfig = {
  name: "Rehydria Technology",
  legalName: "Rehydria Technology Pvt Ltd",
  shortName: "Rehydria",
  tagline: "Learn. Innovate. Build the Future.",
  heroHeadline: "Where Technology Meets Innovation.",
  description:
    "Transform your ideas into practical skills through industry-oriented internships, hands-on technical learning and expert hackathon guidance.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  locale: "en_IN",
  keywords: [
    "IoT internship",
    "Arduino internship",
    "embedded systems training",
    "hackathon guide",
    "technical internship India",
    "Rehydria Technology",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
