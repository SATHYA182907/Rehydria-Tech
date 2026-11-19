import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CertificateDocument } from "@/components/certificates/certificate-document";
import { PrintButton } from "@/components/certificates/print-button";
import { Spinner } from "@/components/ui/spinner";
import { routes } from "@/config/routes";
import { requireUser } from "@/services/auth/session";
import { getStudentCertificates } from "@/services/student";
import { CERTIFICATE_ID_PATTERN } from "@/shared/ids";

export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

/** Print-ready certificate for its owner. Browsers' "Save as PDF" produces the download. */
export default function CertificatePrintPage({ params }: PageProps<"/certificate/[certificateId]">) {
  return (
    <main className="min-h-svh bg-canvas-2 print:bg-white">
      <style>{"@page { size: A4 landscape; margin: 0 } @media print { html, body { background: #fff } }"}</style>
      <Suspense
        fallback={
          <div className="flex min-h-svh items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <Certificate params={params} />
      </Suspense>
    </main>
  );
}

async function Certificate({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const user = await requireUser(`/certificate/${certificateId}`);
  if (!CERTIFICATE_ID_PATTERN.test(certificateId)) notFound();
  const cert = (await getStudentCertificates(user.uid)).find((c) => c.id === certificateId && c.status === "valid");
  if (!cert) notFound();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={routes.dashboard.certificates} className="flex min-h-11 items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to certificates
        </Link>
        <PrintButton />
      </div>
      <div className="shadow-float print:shadow-none">
        <CertificateDocument cert={cert} />
      </div>
      <p className="text-center text-sm text-ink-soft print:hidden">Tip: in the print dialog choose “Save as PDF”, landscape, with background graphics on.</p>
    </div>
  );
}
