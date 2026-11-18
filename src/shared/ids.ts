/**
 * Identifier helpers shared by the web app and Cloud Functions.
 * Uses the Web Crypto API (available in Node 20+ and browsers), so no Node-only imports.
 */

/** Crockford Base32: no I, L, O, U, so IDs are unambiguous when read aloud or typed. */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const CERTIFICATE_PREFIX = "RHT";
const CERTIFICATE_BODY_LENGTH = 16; // 16 × 5 bits = 80 bits of entropy

export const CERTIFICATE_ID_PATTERN = /^RHT-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

function randomCrockford(length: number): string {
  // 256 is divisible by 32, so `byte % 32` is unbiased.
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += CROCKFORD[byte % 32];
  return out;
}

/** e.g. "RHT-7K3M-9XQ2-HP4D-WZ8N" */
export function generateCertificateId(): string {
  const body = randomCrockford(CERTIFICATE_BODY_LENGTH);
  const groups = body.match(/.{4}/g) ?? [];
  return [CERTIFICATE_PREFIX, ...groups].join("-");
}

/** Normalizes user input on the verification page (case, spaces, look-alike characters). */
export function normalizeCertificateId(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s_]/g, "")
    .replace(/-/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (!cleaned.startsWith(CERTIFICATE_PREFIX)) return null;
  const body = cleaned.slice(CERTIFICATE_PREFIX.length);
  if (body.length !== CERTIFICATE_BODY_LENGTH) return null;
  const formatted = [CERTIFICATE_PREFIX, ...(body.match(/.{4}/g) ?? [])].join("-");
  return CERTIFICATE_ID_PATTERN.test(formatted) ? formatted : null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stable, non-reversible-at-a-glance key used in deterministic enrollment IDs. */
export async function emailKey(email: string): Promise<string> {
  return (await sha256Hex(normalizeEmail(email))).slice(0, 32);
}

/** `enrollments/{courseId}_{emailKey}`: one enrollment per email per course. */
export async function enrollmentId(courseId: string, email: string): Promise<string> {
  return `${courseId}_${await emailKey(email)}`;
}

/** `purchases/{uid}_{productId}`: one purchase per account per product. */
export function purchaseId(uid: string, productId: string): string {
  return `${uid}_${productId}`;
}

/** `lessonProgress/{uid}_{lessonId}` */
export function lessonProgressId(uid: string, lessonId: string): string {
  return `${uid}_${lessonId}`;
}

/** `courseMembers/{courseId}_{uid}`: membership marker read by security rules. */
export function courseMemberId(courseId: string, uid: string): string {
  return `${courseId}_${uid}`;
}

/** Razorpay receipts are limited to 40 characters. */
export function paymentReceipt(kind: "course" | "guide"): string {
  return `rht_${kind}_${randomCrockford(12).toLowerCase()}`;
}

export const DOC_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
