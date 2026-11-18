import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/layout/page-hero";
import { Accent, Container, Section } from "@/components/layout/section";
import { routes } from "@/config/routes";
import { getCompanySettings } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Rehydria Technology about internships, the Hackathon Guide, certificates or partnerships.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const company = await getCompanySettings();
  const details = [
    company.email && { icon: Mail, label: "Email", value: company.email, href: `mailto:${company.email}` },
    company.phone && { icon: Phone, label: "Phone", value: company.phone, href: `tel:${company.phone.replace(/\s/g, "")}` },
    company.address && { icon: MapPin, label: "Address", value: company.address, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let&apos;s <Accent className="text-moss">talk</Accent>.
          </>
        }
        lead="Questions about a program, a payment, a certificate or a partnership? Send us a message and we'll reply by email."
      />
      <Section spacing="compact">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="rounded-md border border-line bg-surface p-6 shadow-card md:p-10 lg:col-span-7">
            <ContactForm />
          </div>
          <aside className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
            {details.length > 0 && (
              <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex gap-4 p-5">
                    <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-moss" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{label}</span>
                      {href ? (
                        <a href={href} className="hover:text-moss-text">{value}</a>
                      ) : (
                        <span>{value}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-3 rounded-md bg-canvas-2 p-6">
              <p className="font-medium">Looking for a quick answer?</p>
              <p className="text-ink-soft">Most questions about enrollment, assessments and certificates are covered in the FAQ.</p>
              <Link href={routes.faq} className="font-medium text-moss-text hover:underline">
                Browse the FAQ →
              </Link>
            </div>
            <div className="flex flex-col gap-3 rounded-md bg-forest p-6 text-on-forest">
              <p className="font-medium">Verifying a certificate?</p>
              <p className="text-on-forest-soft">Enter the certificate ID on our verification page.</p>
              <Link href="/verify" className="font-medium text-mint hover:underline">
                Verify a certificate →
              </Link>
            </div>
          </aside>
        </Container>
      </Section>
    </main>
  );
}
