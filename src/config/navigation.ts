import { routes } from "./routes";

export interface NavLink {
  label: string;
  href: string;
}

/** Program entry for the Internships mega menu. Supplied from published Firestore courses. */
export interface NavProgram {
  slug: string;
  title: string;
  summary: string;
  durationLabel?: string;
}

export const primaryNav: NavLink[] = [
  { label: "Internships", href: routes.internships },
  { label: "Hackathon Guide", href: routes.hackathonGuide },
  { label: "About", href: routes.about },
  { label: "FAQ", href: routes.faq },
  { label: "Contact", href: routes.contact },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Learn",
    links: [
      { label: "Internship programs", href: routes.internships },
      { label: "Hackathon Guide", href: routes.hackathonGuide },
      { label: "Verify a certificate", href: "/verify" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Rehydria", href: routes.about },
      { label: "Contact", href: routes.contact },
      { label: "FAQ", href: routes.faq },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Student login", href: routes.login },
      { label: "Create account", href: routes.register },
      { label: "Dashboard", href: routes.dashboard.root },
    ],
  },
];

/** Legal pages required for Razorpay KYC (content supplied by Rehydria, Phase 4). */
export const legalNav: NavLink[] = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Refunds & cancellations", href: "/legal/refunds" },
];
