import type { Metadata } from "next";
import { CompanyForm } from "@/components/admin/company-form";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { getCompanyForAdmin } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const c = await getCompanyForAdmin();
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const socials = (c.socials ?? {}) as Record<string, string>;
  return (
    <>
      <DashboardHeader eyebrow="Settings" title="Company details" description="Shown in the website footer, on the contact page, in emails and on certificates. Empty fields are hidden." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <CompanyForm
            defaults={{
              email: s(c.email), phone: s(c.phone), address: s(c.address), directorName: s(c.directorName),
              linkedin: s(socials.linkedin), instagram: s(socials.instagram), youtube: s(socials.youtube), x: s(socials.x), github: s(socials.github),
            }}
          />
        </Card>
        <div className="flex flex-col gap-4">
          <Card variant="muted" className="flex flex-col gap-2">
            <p className="font-medium">Administrators</p>
            <p className="text-sm text-ink-soft">
              Admin access is a secure account claim. Grant it from a trusted machine with <code className="font-mono text-xs">pnpm admin:grant email@domain</code>. The person must sign in again afterwards.
            </p>
          </Card>
          <Card variant="muted" className="flex flex-col gap-2">
            <p className="font-medium">Logo & director signature</p>
            <p className="text-sm text-ink-soft">Uploads are enabled once Firebase Storage is configured for the project.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
