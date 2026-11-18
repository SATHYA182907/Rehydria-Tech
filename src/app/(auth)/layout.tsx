import Link from "next/link";
import { CircuitArt } from "@/components/homepage/hero/circuit-art";
import { Accent } from "@/components/layout/section";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";

/** Split auth layout: brand panel (desktop) + form column. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest-deep p-10 text-on-forest lg:flex">
        <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.1)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative">
          <Logo onDark />
        </div>
        <div className="relative mx-auto w-full max-w-[520px] [perspective:1600px]">
          <div className="[transform:rotateX(50deg)_rotateZ(-30deg)] drop-shadow-[0_40px_40px_rgb(0_0_0/0.35)]">
            <CircuitArt />
          </div>
        </div>
        <div className="relative flex flex-col gap-4">
          <p className="max-w-[18ch] text-4xl leading-tight font-medium tracking-tight">
            Learn. Innovate. <Accent className="text-mint">Build</Accent> the Future.
          </p>
          <p className="max-w-[44ch] text-on-forest-soft">{siteConfig.description}</p>
        </div>
      </aside>
      <main id="main" className="flex flex-col bg-canvas px-4 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xs text-sm text-ink-soft transition-colors hover:text-ink">
            ← Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</div>
      </main>
    </div>
  );
}
