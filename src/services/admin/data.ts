import "server-only";
import { AggregateField } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, SETTINGS_DOCS } from "@/shared/collections";
import { toIso } from "@/services/student";

/**
 * Admin read models. Callers MUST have run requireAdmin() first (every admin page does).
 * Lists are capped (LIST_LIMIT) and filtered/searched in memory; the UI states the cap.
 */
export const LIST_LIMIT = 500;

export type AdminRow = { id: string } & Record<string, unknown>;

/** Reads up to LIST_LIMIT docs, converting Timestamps to ISO strings. */
export async function listCollection(name: string, opts: { where?: [string, string]; orderBy?: string } = {}): Promise<AdminRow[]> {
  let query: FirebaseFirestore.Query = adminDb().collection(name);
  if (opts.where) query = query.where(opts.where[0], "==", opts.where[1]);
  const snap = await query.limit(LIST_LIMIT).get();
  const rows = snap.docs.map((d) => {
    const data = d.data();
    const out: AdminRow = { id: d.id };
    for (const [k, v] of Object.entries(data)) out[k] = toIso(v) ?? v;
    return out;
  });
  if (opts.orderBy) {
    const key = opts.orderBy;
    rows.sort((a, b) => String(b[key] ?? "").localeCompare(String(a[key] ?? "")));
  }
  return rows;
}

async function count(name: string, where?: [string, unknown]): Promise<number> {
  let q: FirebaseFirestore.Query = adminDb().collection(name);
  if (where) q = q.where(where[0], "==", where[1]);
  return (await q.count().get()).data().count;
}

export interface AdminOverview {
  students: number;
  enrollmentsActive: number;
  enrollmentsCompleted: number;
  enrollmentsPending: number;
  coursesPublished: number;
  certificatesIssued: number;
  revenuePaise: number;
  paidPayments: number;
  failedPayments: number;
  newContactMessages: number;
  recentPayments: AdminRow[];
  recentUsers: AdminRow[];
  enrollmentsByCourse: { course: string; count: number }[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = adminDb();
  const [students, active, completed, pending, published, certs, failed, contact, paidSnap, recentPayments, recentUsers, enrollments, courses] = await Promise.all([
    count(COLLECTIONS.users, ["role", "student"]),
    count(COLLECTIONS.enrollments, ["status", "active"]),
    count(COLLECTIONS.enrollments, ["status", "completed"]),
    count(COLLECTIONS.enrollments, ["status", "pending_payment"]),
    count(COLLECTIONS.courses, ["status", "published"]),
    count(COLLECTIONS.certificates, ["status", "valid"]),
    count(COLLECTIONS.payments, ["status", "failed"]),
    count(COLLECTIONS.contactMessages, ["status", "new"]),
    db.collection(COLLECTIONS.payments).where("status", "==", "paid").aggregate({ total: AggregateField.sum("amountPaise"), n: AggregateField.count() }).get(),
    listCollection(COLLECTIONS.payments, { orderBy: "createdAt" }),
    listCollection(COLLECTIONS.users, { orderBy: "createdAt" }),
    listCollection(COLLECTIONS.enrollments),
    listCollection(COLLECTIONS.courses),
  ]);
  const titles = new Map(courses.map((c) => [c.id, String(c.title ?? c.id)]));
  const byCourse = new Map<string, number>();
  for (const e of enrollments) {
    if (e.status !== "active" && e.status !== "completed") continue;
    const key = titles.get(String(e.courseId)) ?? String(e.courseId);
    byCourse.set(key, (byCourse.get(key) ?? 0) + 1);
  }
  const agg = paidSnap.data() as { total: number | null; n: number };
  return {
    students,
    enrollmentsActive: active,
    enrollmentsCompleted: completed,
    enrollmentsPending: pending,
    coursesPublished: published,
    certificatesIssued: certs,
    revenuePaise: agg.total ?? 0,
    paidPayments: agg.n,
    failedPayments: failed,
    newContactMessages: contact,
    recentPayments: recentPayments.slice(0, 6),
    recentUsers: recentUsers.slice(0, 6),
    enrollmentsByCourse: [...byCourse].map(([course, n]) => ({ course, count: n })),
  };
}

export async function getCompanyForAdmin(): Promise<Record<string, unknown>> {
  const snap = await adminDb().collection(COLLECTIONS.settings).doc(SETTINGS_DOCS.company).get();
  return snap.data() ?? {};
}

export async function getCourseForAdmin(id: string): Promise<AdminRow | null> {
  const snap = await adminDb().collection(COLLECTIONS.courses).doc(id).get();
  return snap.exists ? { id: snap.id, ...(snap.data() as Record<string, unknown>) } : null;
}

