import { BadgeCheck, CircleX, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Eyebrow } from "@/components/layout/section";
import { Skeleton } from "@/components/ui/feedback";
import { VerifyForm } from "@/components/verify-form";
import { siteConfig } from "@/config/site";
import { verifyCertificate } from "@/services/certificates/verify";

export const metadata: Metadata = {
  title: "Certificate verification",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

async function Result({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const result = await verifyCertificate(decodeURIComponent(certificateId));

  if (result.status === "not_found") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4 rounded-md border border-danger/25 bg-danger-soft p-6">
          <CircleX aria-hidden="true" className="size-7 shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium text-ink">Certificate not found</h1>
            <p className="text-ink-soft">
              No certificate matches <span className="font-mono text-ink">{result.certificateId}</span>. Check the ID and try again.
            </p>
          </div>
        </div>
        <VerifyForm defaultValue={result.certificateId} />
      </div>
    );
  }

  const valid = result.status === "valid";
  return (
    <article className="overflow-hidden rounded-md border border-line bg-surface shadow-card">
      <div className={valid ? "flex items-center gap-4 bg-forest p-6 text-on-forest" : "flex items-center gap-4 bg-warning-soft p-6 text-ink"}>
        {valid ? <BadgeCheck aria-hidden="true" className="size-8 text-mint" /> : <ShieldAlert aria-hidden="true" className="size-8 text-warning" />}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-80">Verification status</p>
          <h1 className="text-2xl font-medium">{valid ? "Valid certificate" : "Certificate revoked"}</h1>
        </div>
      </div>
      <dl className="grid gap-px bg-line sm:grid-cols-2">
        {[
          ["Awarded to", result.studentName],
          ["Program", result.courseTitle],
          ["Certificate ID", result.certificateId],
          ["Issued on", dateFormat.format(new Date(result.issuedAt))],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 bg-surface p-6">
            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{label}</dt>
            <dd className={label === "Certificate ID" ? "font-mono text-lg" : "text-lg font-medium"}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-line p-6 text-sm text-ink-soft">
        {valid
          ? `This certificate was issued by ${siteConfig.legalName}.`
          : `This certificate was issued by ${siteConfig.legalName} and has since been revoked. It is no longer valid.`}
      </p>
    </article>
  );
}

export default function VerifyCertificatePage({ params }: PageProps<"/verify/[certificateId]">) {
  return (
    <main className="pt-32 pb-24 md:pt-40">
      <Container className="flex max-w-3xl flex-col gap-8">
        <Eyebrow>Certificate verification</Eyebrow>
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <Result params={params} />
        </Suspense>
      </Container>
    </main>
  );
}
