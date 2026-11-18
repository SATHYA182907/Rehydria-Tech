import { AlertTriangle, Award, BookOpen, CreditCard, GraduationCap, Mail, Users } from "lucide-react";
import Link from "next/link";
import { EnrollmentChartLazy } from "@/components/admin/enrollment-chart-lazy";
import { fmtDate, fmtMoney, StatusBadge } from "@/components/admin/data-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Stat } from "@/components/ui/stat";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { isPaymentsConfigured, isVideoConfigured } from "@/lib/integrations";
import { getAdminOverview } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const o = await getAdminOverview();
  const setup = [
    { label: "Firebase server credentials", ok: isFirebaseConfigured() },
    { label: "Razorpay payments", ok: isPaymentsConfigured() },
    { label: "Video hosting (Bunny Stream)", ok: isVideoConfigured() },
  ];

  return (
    <>
      <DashboardHeader eyebrow="Admin console" title="Overview" description="Live figures from Firestore." />
      {setup.some((s) => !s.ok) && (
        <div className="mb-6 flex flex-col gap-2 rounded-md border border-warning/25 bg-warning-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-ink"><AlertTriangle aria-hidden="true" className="size-4 text-warning" /> Setup checklist</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-ink-soft">
            {setup.map((s) => (
              <li key={s.label}>{s.ok ? "✓" : "○"} {s.label}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Students" value={o.students} icon={<Users aria-hidden="true" />} /></Card>
        <Card><Stat label="Active enrollments" value={o.enrollmentsActive} icon={<GraduationCap aria-hidden="true" />} /></Card>
        <Card><Stat label="Revenue (paid)" value={o.revenuePaise / 100} prefix="₹" icon={<CreditCard aria-hidden="true" />} /></Card>
        <Card><Stat label="Certificates issued" value={o.certificatesIssued} icon={<Award aria-hidden="true" />} /></Card>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="muted"><Stat label="Published courses" value={o.coursesPublished} icon={<BookOpen aria-hidden="true" />} /></Card>
        <Card variant="muted"><Stat label="Completed enrollments" value={o.enrollmentsCompleted} /></Card>
        <Card variant="muted"><Stat label="Pending payments" value={o.enrollmentsPending} /></Card>
        <Card variant="muted"><Stat label="New messages" value={o.newContactMessages} icon={<Mail aria-hidden="true" />} /></Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <Card className="flex flex-col gap-4 lg:col-span-3">
          <h2 className="font-medium">Enrollments by course</h2>
          {o.enrollmentsByCourse.length ? <EnrollmentChartLazy data={o.enrollmentsByCourse} /> : <EmptyState title="No enrollments yet" />}
        </Card>
        <Card className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent registrations</h2>
            <Link href="/admin/students" className="text-sm text-moss-text hover:underline">All students</Link>
          </div>
          {o.recentUsers.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {o.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex flex-col">
                    <span className="font-medium">{String(u.fullName || "-")}</span>
                    <span className="text-ink-soft">{String(u.email ?? "")}</span>
                  </span>
                  <span className="text-ink-soft">{fmtDate(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">No registrations yet.</p>
          )}
        </Card>
      </div>

      <Card className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Recent payments</h2>
          <Link href="/admin/payments" className="text-sm text-moss-text hover:underline">All payments</Link>
        </div>
        {o.recentPayments.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {o.recentPayments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-mono">{p.id}</span>
                <span>{String(p.email ?? "")}</span>
                <span className="font-medium">{fmtMoney(p.amountPaise)}</span>
                <StatusBadge value={p.status} />
                <span className="text-ink-soft">{fmtDate(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No payments yet. They appear here once Razorpay is connected.</p>
        )}
        <p className="text-xs text-ink-soft">
          {o.paidPayments} paid · {o.failedPayments} failed
        </p>
      </Card>
    </>
  );
}
