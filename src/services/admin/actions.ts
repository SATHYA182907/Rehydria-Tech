"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { companyFormSchema, courseFormSchema } from "@/lib/validations/admin";
import { requireAdmin } from "@/services/auth/session";
import { CATALOG_TAGS, COMPANY_TAG } from "@/services/catalog";
import { COLLECTIONS, SETTINGS_DOCS } from "@/shared/collections";
import { DOC_ID_PATTERN } from "@/shared/ids";

export type AdminActionResult = { ok: true; id?: string; message: string } | { ok: false; error: string };

/** Builds an audit log entry; written in the same transaction/batch as the change it records. */
async function auditEntry(actorUid: string, action: string, targetType: string, targetId: string, after: unknown) {
  const h = await headers();
  return {
    actorUid,
    action,
    targetType,
    targetId,
    before: null,
    after,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent")?.slice(0, 200) ?? null,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Create or update a course. Slug uniqueness is enforced with `slugs/{slug}` lock documents in
 * the same transaction. Saving invalidates the cached public catalog immediately.
 */
export async function saveCourse(courseId: string | null, input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = courseFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  if (courseId && !DOC_ID_PATTERN.test(courseId)) return { ok: false, error: "Invalid course." };
  const v = parsed.data;
  if (v.compareAtPrice !== null && v.compareAtPrice <= v.price) return { ok: false, error: "Compare-at price must be higher than the price." };

  const db = adminDb();
  const ref = courseId ? db.collection(COLLECTIONS.courses).doc(courseId) : db.collection(COLLECTIONS.courses).doc();
  const data = {
    title: v.title,
    slug: v.slug,
    code: v.code,
    shortDescription: v.shortDescription,
    description: v.description,
    durationLabel: v.durationLabel,
    durationWeeks: v.durationWeeks,
    level: v.level,
    pricePaise: v.price,
    compareAtPricePaise: v.compareAtPrice,
    objectives: v.objectives,
    prerequisites: v.prerequisites,
    highlights: v.highlights.map((label) => ({ icon: "CheckCircle2", label })),
    tags: v.tags,
    illustration: v.illustration,
    status: v.status,
    enrollmentOpen: v.enrollmentOpen,
    sortOrder: v.sortOrder,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: admin.uid,
  };

  const log = await auditEntry(admin.uid, courseId ? "course.update" : "course.create", "course", ref.id, { title: v.title, slug: v.slug, status: v.status, pricePaise: v.price });
  try {
    await db.runTransaction(async (tx) => {
      const existing = courseId ? await tx.get(ref) : null;
      if (courseId && !existing?.exists) throw new Error("Course not found.");
      const slugRef = db.collection(COLLECTIONS.slugs).doc(v.slug);
      const slugDoc = await tx.get(slugRef);
      if (slugDoc.exists && slugDoc.data()?.courseId !== ref.id) throw new Error(`The slug "${v.slug}" is already used by another course.`);
      const oldSlug = existing?.data()?.slug as string | undefined;
      if (oldSlug && oldSlug !== v.slug) tx.delete(db.collection(COLLECTIONS.slugs).doc(oldSlug));
      tx.set(slugRef, { courseId: ref.id });

      if (existing) {
        const wasPublished = existing.data()?.status === "published";
        tx.update(ref, { ...data, ...(v.status === "published" && !wasPublished ? { publishedAt: FieldValue.serverTimestamp() } : {}) });
      } else {
        tx.set(ref, {
          ...data,
          thumbnailPath: null,
          bannerPath: null,
          moduleCount: 0,
          lessonCount: 0,
          completion: { requireAllLessons: true, minProgressPercent: 100, requireAssessmentPass: true },
          finalAssessmentId: null,
          certificate: { enabled: true, templateId: "classic", titleOverride: null },
          seo: { title: null, description: null, ogImagePath: null },
          publishedAt: v.status === "published" ? FieldValue.serverTimestamp() : null,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: admin.uid,
        });
      }
      tx.set(db.collection(COLLECTIONS.auditLogs).doc(), log);
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the course." };
  }

  updateTag(CATALOG_TAGS.catalog);
  updateTag(CATALOG_TAGS.course(ref.id));
  revalidatePath("/admin/courses");
  return { ok: true, id: ref.id, message: courseId ? "Course updated." : "Course created." };
}

export async function saveCompanySettings(input: unknown): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const parsed = companyFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { linkedin, instagram, youtube, x, github, ...rest } = parsed.data;
  const socials = Object.fromEntries(Object.entries({ linkedin, instagram, youtube, x, github }).filter(([, url]) => url));
  const db = adminDb();
  const batch = db.batch();
  batch.set(
    db.collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.company),
    { ...rest, socials, name: "Rehydria Technology", legalName: "Rehydria Technology Pvt Ltd", tagline: "Learn. Innovate. Build the Future.", updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid },
    { merge: true },
  );
  batch.set(db.collection(COLLECTIONS.auditLogs).doc(), await auditEntry(admin.uid, "settings.company.update", "settings", SETTINGS_DOCS.company, { ...rest, socials }));
  await batch.commit();
  updateTag(COMPANY_TAG);
  revalidatePath("/admin/settings");
  return { ok: true, message: "Company details saved." };
}
