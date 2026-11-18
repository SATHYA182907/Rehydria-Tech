import { Award, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/services/auth/session";
import { getStudentCertificates } from "@/services/student";

export const metadata: Metadata = { title: "Certificates" };

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const STATUS = {
  valid: <Badge variant="success">Valid</Badge>,
  pending: <Badge variant="warning">Being generated</Badge>,
  revoked: <Badge variant="danger">Revoked</Badge>,
  failed: <Badge variant="warning">Processing</Badge>,
} as const;

export default async function CertificatesPage() {
  const user = await requireUser("/dashboard/certificates");
  const certificates = await getStudentCertificates(user.uid);
  return (
    <>
      <DashboardHeader eyebrow="Achievements" title="Certificates" description="Certificates are issued automatically when you complete a course and pass its assessment." />
      {certificates.length === 0 ? (
        <EmptyState icon={<Award aria-hidden="true" />} title="No certificates yet" description="Complete a course and pass its assessment to earn a verifiable certificate." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {certificates.map((c) => (
            <li key={c.id} className="flex flex-col gap-5 overflow-hidden rounded-md border border-line bg-surface">
              <div className="flex items-start justify-between gap-4 bg-forest p-6 text-on-forest">
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint">Certificate of completion</p>
                  <p className="text-xl font-medium">{c.courseTitle}</p>
                </div>
                <Award aria-hidden="true" className="size-8 text-mint" />
              </div>
              <dl className="grid grid-cols-2 gap-4 px-6 text-sm">
                <div><dt className="text-ink-soft">Grade</dt><dd className="text-lg font-medium">{c.grade}</dd></div>
                <div><dt className="text-ink-soft">Issued</dt><dd className="font-medium">{c.issuedAt ? date.format(new Date(c.issuedAt)) : "-"}</dd></div>
                <div className="col-span-2"><dt className="text-ink-soft">Certificate ID</dt><dd className="font-mono">{c.id}</dd></div>
              </dl>
              <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
                {STATUS[c.status]}
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/verify/${c.id}`}>Verify <ExternalLink aria-hidden="true" /></Link>
                  </Button>
                  <Button size="sm" disabled title="PDF downloads are enabled once certificate generation is configured">Download PDF</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
