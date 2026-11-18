/**
 * Legal pages. Content MUST be supplied by Rehydria (and ideally reviewed by counsel):
 * Razorpay requires these pages before activating live payments. Paste each policy as
 * Markdown into `body`. While `body` is null the page shows a neutral "being finalised"
 * notice and is excluded from search engines.
 */
export interface LegalPage {
  slug: "privacy" | "terms" | "refunds";
  title: string;
  description: string;
  updated: string | null;
  body: string | null;
}

export const legalPages: LegalPage[] = [
  { slug: "privacy", title: "Privacy Policy", description: "How Rehydria Technology collects, uses and protects personal data.", updated: null, body: null },
  { slug: "terms", title: "Terms of Service", description: "The terms that apply when you use Rehydria Technology's website and programs.", updated: null, body: null },
  { slug: "refunds", title: "Refunds & Cancellations", description: "Rehydria Technology's refund and cancellation policy for programs and products.", updated: null, body: null },
];
