import { homeFaq } from "./home";

/**
 * Full FAQ. Same rule as the homepage copy: only statements true of the platform as built.
 * Policy answers (refund window, access duration, rescheduling) are intentionally absent
 * until Rehydria publishes those policies.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: readonly FaqItem[];
}

export const faqGroups: readonly FaqGroup[] = [
  {
    id: "general",
    title: "General",
    items: [
      homeFaq[0],
      {
        q: "Which programs are available?",
        a: "The current programs are listed on the Internships page with their curriculum, duration, prerequisites and fees. New programs are added there as they open.",
      },
      {
        q: "Do I need an account?",
        a: "Yes. Your account gives you a dashboard with your courses, progress, assessments, results, certificates and guide purchases. You can sign up with email or Google.",
      },
    ],
  },
  {
    id: "enrollment",
    title: "Enrollment & payments",
    items: [
      homeFaq[1],
      {
        q: "Which payment methods are accepted?",
        a: "Payments are processed by Razorpay, which supports UPI, cards, net banking and wallets. Rehydria never sees or stores your card details.",
      },
      {
        q: "What happens if my payment fails or I close the checkout?",
        a: "Your course is only activated after a payment is verified on our servers. If a payment fails or you close the window, nothing is activated and you can try again from the program page.",
      },
    ],
  },
  {
    id: "learning",
    title: "Learning",
    items: [
      homeFaq[2],
      {
        q: "Can I learn at my own pace?",
        a: "Yes. Lessons are available in your dashboard and your progress is saved automatically, so you can resume exactly where you left off.",
      },
    ],
  },
  {
    id: "assessments",
    title: "Assessments & certificates",
    items: [
      homeFaq[3],
      homeFaq[4],
      {
        q: "How can someone verify my certificate?",
        a: "Every certificate has a unique ID and QR code. Anyone can enter the ID on the Verify page, or scan the QR code, to see whether it is valid.",
      },
    ],
  },
  {
    id: "guide",
    title: "Hackathon Guide",
    items: [homeFaq[5]],
  },
];

export const allFaqItems: FaqItem[] = faqGroups.flatMap((g) => g.items);
