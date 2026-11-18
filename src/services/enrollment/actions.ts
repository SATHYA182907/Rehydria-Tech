"use server";

import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { isPaymentsConfigured } from "@/lib/integrations";
import { enrollmentSchema } from "@/lib/validations/enrollment";

export type StartEnrollmentResult =
  | { ok: true; orderId: string }
  | { ok: false; code: "invalid" | "unavailable"; error: string };

/**
 * Starts an enrollment. The full flow (pending enrollment → Razorpay order → checkout →
 * verified payment → activation) is implemented in Phase 7 once Razorpay credentials exist.
 * Until then this validates the input on the server and refuses to continue: course access is
 * never granted without a verified payment.
 */
export async function startEnrollment(input: unknown): Promise<StartEnrollmentResult> {
  const parsed = enrollmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid", error: parsed.error.issues[0]?.message ?? "Please check the form." };
  if (!isFirebaseConfigured() || !isPaymentsConfigured()) {
    return {
      ok: false,
      code: "unavailable",
      error: "Online enrollment opens once secure payments are activated. Please check back soon or contact us.",
    };
  }
  return { ok: false, code: "unavailable", error: "Checkout is being finalised. Please try again shortly." };
}
