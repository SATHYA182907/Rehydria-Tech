import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/shared/collections";
import { normalizeCertificateId } from "@/shared/ids";
import type { CertificateVerification } from "@/shared/types/domain";

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

/**
 * Public certificate verification. Returns only name, course, ID, issue date and status;
 * nothing else about the student ever leaves the server (docs/DATABASE_SCHEMA.md §11).
 */
export async function verifyCertificate(rawId: string): Promise<CertificateVerification> {
  "use cache";
  cacheLife("minutes");
  const id = normalizeCertificateId(rawId);
  if (!id || !isFirebaseConfigured()) return { status: "not_found", certificateId: rawId.slice(0, 40) };
  cacheTag(`certificate:${id}`);

  const snap = await adminDb().collection(COLLECTIONS.certificates).doc(id).get();
  const d = snap.data();
  if (!snap.exists || !d || (d.status !== "valid" && d.status !== "revoked")) return { status: "not_found", certificateId: id };
  return {
    status: d.status,
    certificateId: id,
    studentName: String(d.studentName ?? ""),
    courseTitle: String(d.courseTitle ?? ""),
    issuedAt: toIso(d.issuedAt),
  };
}
