import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/shared/collections";
import type { UserProfile, YearOfStudy } from "@/shared/types/domain";

export interface ProfileSeed {
  uid: string;
  email: string | null;
  name?: string | null;
  fullName?: string;
  phone?: string | null;
}

/**
 * Creates users/{uid} on first sign-in (idempotent). Role is always "student" here: admin
 * rights come only from the custom claim (scripts/admin-grant.ts).
 */
export async function ensureUserProfile(seed: ProfileSeed): Promise<void> {
  const ref = adminDb().collection(COLLECTIONS.users).doc(seed.uid);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      // Fill in details captured at registration if the profile was created earlier without them.
      const patch: Record<string, unknown> = {};
      const data = snap.data() ?? {};
      if (seed.fullName && !data.fullName) patch.fullName = seed.fullName;
      if (seed.phone && !data.phone) patch.phone = seed.phone;
      if (Object.keys(patch).length) tx.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
      return;
    }
    tx.set(ref, {
      uid: seed.uid,
      fullName: seed.fullName ?? seed.name ?? "",
      email: (seed.email ?? "").toLowerCase(),
      phone: seed.phone ?? null,
      role: "student",
      college: null,
      degree: null,
      yearOfStudy: null,
      profileImage: null,
      accountSetupComplete: true,
      lastActiveCourseId: null,
      lastActiveLessonId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export interface ProfileView {
  uid: string;
  fullName: string;
  email: string;
  phone: string | null;
  college: string | null;
  degree: string | null;
  yearOfStudy: YearOfStudy | null;
  role: "student" | "admin";
}

export async function getProfile(uid: string): Promise<ProfileView | null> {
  const snap = await adminDb().collection(COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data() as Partial<UserProfile<unknown>>;
  return {
    uid,
    fullName: d.fullName ?? "",
    email: d.email ?? "",
    phone: d.phone ?? null,
    college: d.college ?? null,
    degree: d.degree ?? null,
    yearOfStudy: d.yearOfStudy ?? null,
    role: d.role === "admin" ? "admin" : "student",
  };
}
