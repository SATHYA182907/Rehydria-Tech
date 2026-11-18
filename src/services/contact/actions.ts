"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { contactSchema } from "@/lib/validations/contact";
import { clientIp, rateLimit } from "@/services/security/rate-limit";
import { COLLECTIONS } from "@/shared/collections";

export type ContactResult = { ok: true } | { ok: false; error: string };

/**
 * Stores a contact message and queues a notification email for the team (sent by the
 * mail outbox Cloud Function once Resend is configured). Rate-limited per IP.
 */
export async function submitContactMessage(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  if (parsed.data.website) return { ok: true }; // honeypot: pretend success, store nothing
  if (!isFirebaseConfigured()) {
    return { ok: false, error: "Messages can't be received online yet. Please try again later." };
  }
  if (!(await rateLimit("contact", await clientIp(), 5, 3600))) {
    return { ok: false, error: "You've sent several messages recently. Please try again later." };
  }

  const message: Partial<typeof parsed.data> = { ...parsed.data };
  delete message.website;
  const db = adminDb();
  const batch = db.batch();
  const ref = db.collection(COLLECTIONS.contactMessages).doc();
  batch.set(ref, { ...message, status: "new", createdAt: FieldValue.serverTimestamp() });
  batch.set(db.collection(COLLECTIONS.mailQueue).doc(), {
    to: "team",
    template: "contact_message",
    data: { messageId: ref.id, ...message },
    status: "queued",
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { ok: true };
}
