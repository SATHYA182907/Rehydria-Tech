import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { adminDb, isFirebaseConfigured, publicStorageUrl } from "@/lib/firebase/admin";
import { COLLECTIONS, SETTINGS_DOCS } from "@/shared/collections";
import type { Course, CourseIllustration, CourseLevel, GuideProduct } from "@/shared/types/domain";

/**
 * Public catalog reads (marketing pages). Every function:
 *  - returns a narrow, serializable DTO (never raw documents),
 *  - is cached with `'use cache'` and tagged so admin Server Actions can `updateTag()`,
 *  - returns an empty result when Firebase is not configured, so the site builds before setup.
 * Real Firestore errors are thrown, not swallowed: a misconfigured production build should fail loudly.
 */

export const CATALOG_TAGS = {
  catalog: "catalog",
  course: (id: string) => `course:${id}`,
  products: "products",
  reviews: "reviews",
  stats: "stats",
} as const;

export interface CourseCard {
  id: string;
  slug: string;
  code: string;
  title: string;
  shortDescription: string;
  durationLabel: string;
  durationWeeks: number;
  level: CourseLevel;
  pricePaise: number;
  compareAtPricePaise: number | null;
  moduleCount: number;
  lessonCount: number;
  highlights: { icon: string; label: string }[];
  tags: string[];
  illustration: CourseIllustration;
  thumbnailUrl: string | null;
  enrollmentOpen: boolean;
}

export interface GuideCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  benefits: string[];
  contents: { title: string; description: string }[];
  coverUrl: string | null;
  pageCount: number | null;
  available: boolean;
}

export interface ReviewCard {
  id: string;
  displayName: string;
  college: string;
  courseTitle: string | null;
  rating: number;
  body: string;
}

/** Real platform counters maintained by Cloud Functions (settings/stats). */
export interface PlatformStats {
  students: number;
  certificatesIssued: number;
  enrollmentsActive: number;
}

type Doc<T> = Omit<T, "id">;

function toCourseCard(id: string, d: Doc<Course<unknown>>): CourseCard {
  return {
    id,
    slug: d.slug,
    code: d.code ?? d.slug.toUpperCase(),
    title: d.title,
    shortDescription: d.shortDescription,
    durationLabel: d.durationLabel,
    durationWeeks: d.durationWeeks,
    level: d.level,
    pricePaise: d.pricePaise,
    compareAtPricePaise: d.compareAtPricePaise ?? null,
    moduleCount: d.moduleCount ?? 0,
    lessonCount: d.lessonCount ?? 0,
    highlights: d.highlights ?? [],
    tags: d.tags ?? [],
    illustration: d.illustration ?? "chip",
    thumbnailUrl: publicStorageUrl(d.thumbnailPath),
    enrollmentOpen: d.enrollmentOpen ?? false,
  };
}

export async function getPublishedCourses(): Promise<CourseCard[]> {
  "use cache";
  cacheTag(CATALOG_TAGS.catalog);
  cacheLife("hours");
  if (!isFirebaseConfigured()) return [];

  const snap = await adminDb()
    .collection(COLLECTIONS.courses)
    .where("status", "==", "published")
    .orderBy("sortOrder", "asc")
    .get();
  return snap.docs.map((doc) => toCourseCard(doc.id, doc.data() as Doc<Course<unknown>>));
}

/** The first published, available guide product (the Hackathon Guide at launch). */
export async function getFeaturedGuide(): Promise<GuideCard | null> {
  "use cache";
  cacheTag(CATALOG_TAGS.products);
  cacheLife("hours");
  if (!isFirebaseConfigured()) return null;

  const snap = await adminDb()
    .collection(COLLECTIONS.guideProducts)
    .where("status", "==", "published")
    .limit(5)
    .get();
  const doc = snap.docs.find((d) => (d.data() as Doc<GuideProduct<unknown>>).available) ?? snap.docs[0];
  if (!doc) return null;
  const d = doc.data() as Doc<GuideProduct<unknown>>;
  return {
    id: doc.id,
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle,
    pricePaise: d.pricePaise,
    compareAtPricePaise: d.compareAtPricePaise ?? null,
    benefits: d.benefits ?? [],
    contents: d.contents ?? [],
    coverUrl: publicStorageUrl(d.coverImagePath),
    pageCount: d.pageCount ?? null,
    available: d.available,
  };
}

export async function getFeaturedReviews(limit = 8): Promise<ReviewCard[]> {
  "use cache";
  cacheTag(CATALOG_TAGS.reviews);
  cacheLife("hours");
  if (!isFirebaseConfigured()) return [];

  const snap = await adminDb()
    .collection(COLLECTIONS.reviews)
    .where("status", "==", "approved")
    .orderBy("featured", "desc")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      displayName: String(d.displayName ?? ""),
      college: String(d.college ?? ""),
      courseTitle: (d.courseTitle as string | undefined) ?? null,
      rating: Number(d.rating ?? 5),
      body: String(d.body ?? ""),
    };
  });
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  "use cache";
  cacheTag(CATALOG_TAGS.stats);
  cacheLife("hours");
  if (!isFirebaseConfigured()) return null;

  const snap = await adminDb().collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.stats).get();
  if (!snap.exists) return null;
  const d = snap.data() ?? {};
  return {
    students: Number(d.students ?? 0),
    certificatesIssued: Number(d.certificatesIssued ?? 0),
    enrollmentsActive: Number(d.enrollmentsActive ?? 0),
  };
}
