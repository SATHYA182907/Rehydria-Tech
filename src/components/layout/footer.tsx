import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { footerNav, legalNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import type { CompanySettings } from "@/shared/types/domain";
import { FooterWordmark } from "./footer-wordmark";
import { Container } from "./section";
import { Logo } from "./logo";

type FooterCompany = Partial<Pick<CompanySettings, "email" | "phone" | "address" | "socials">> & { logoUrl?: string | null };

/**
 * Site footer. Contact details come from `settings/company` (admin-configured); any
 * field that is empty is simply not rendered. Nothing is invented.
 */
export function Footer({ company = {} }: { company?: FooterCompany }) {
  const socials = Object.entries(company.socials ?? {}).filter(([, url]) => Boolean(url));
  const contacts = [
    company.email && { icon: Mail, label: company.email, href: `mailto:${company.email}` },
    company.phone && { icon: Phone, label: company.phone, href: `tel:${company.phone.replace(/\s/g, "")}` },
    company.address && { icon: MapPin, label: company.address, href: undefined },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href?: string }[];

  return (
    <footer className="relative overflow-hidden bg-forest-deep text-on-forest">
      <Container className="grid gap-14 pt-20 pb-10 lg:grid-cols-12 lg:pt-28">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Logo onDark logoUrl={company.logoUrl} />
          <p className="max-w-sm text-[15px] leading-relaxed text-on-forest-soft">{siteConfig.description}</p>
          {contacts.length > 0 && (
            <ul className="flex flex-col gap-3 text-sm">
              {contacts.map(({ icon: Icon, label, href }) => (
                <li key={label} className="flex items-start gap-3 text-on-forest-soft">
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
                  {href ? (
                    <a href={href} className="transition-colors hover:text-on-forest">
                      {label}
                    </a>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
          {footerNav.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mint">{group.title}</p>
              <ul className="flex flex-col gap-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-block py-1 text-[15px] text-on-forest-soft transition-colors hover:text-on-forest">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {socials.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mint">Follow</p>
              <ul className="flex flex-col gap-1">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 py-1 text-[15px] capitalize text-on-forest-soft transition-colors hover:text-on-forest"
                    >
                      {name === "x" ? "X" : name}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </Container>

      <FooterWordmark />

      <Container className="flex flex-col gap-4 border-t border-white/10 py-6 text-[13px] text-on-forest-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          © <CopyrightYear /> {siteConfig.legalName}. All rights reserved.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {legalNav.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="inline-block py-1 transition-colors hover:text-on-forest">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}

/** Cached so the footer stays in the static shell; refreshed daily for the year rollover. */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
