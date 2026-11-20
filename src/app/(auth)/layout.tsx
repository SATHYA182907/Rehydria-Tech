import Link from "next/link";
import { CircuitArt } from "@/components/homepage/hero/circuit-art";
import { Accent } from "@/components/layout/section";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/config/site";

/**
 * Split auth layout that fits the screen: brand panel (desktop) + form column, locked to the
 * viewport height on desktop. Forms are sized (and the enrollment form is split into steps)
 * so they fit without scrolling; very short windows fall back to scrolling the form column only.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:overflow-hidden">
      <aside className="relative hidden flex-col justify-between gap-6 overflow-hidden bg-forest-deep p-8 text-on-forest lg:flex xl:p-10">
        <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(184_228_201/0.1)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative">
          <Logo onDark />
        </div>
        <div className="relative mx-auto flex min-h-0 w-full max-w-[440px] flex-1 items-center [perspective:1600px]">
          <div className="w-full [transform:rotateX(50deg)_rotateZ(-30deg)] drop-shadow-[0_40px_40px_rgb(0_0_0/0.35)] [@media(max-height:760px)]:scale-75">
            <CircuitArt />
          </div>
        </div>
        <div className="relative flex flex-col gap-3">
          <p className="max-w-[18ch] text-[clamp(1.75rem,1rem+1.6vw,2.5rem)] leading-tight font-medium tracking-tight">
            Learn. Innovate. <Accent className="text-mint">Build</Accent> the Future.
          </p>
          <p className="max-w-[44ch] text-sm text-on-forest-soft [@media(max-height:760px)]:hidden">{siteConfig.description}</p>
        </div>
      </aside>
      <main id="main" className="flex min-h-0 flex-col bg-canvas px-4 py-4 sm:px-8 lg:py-5">
        <div className="flex shrink-0 items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xs text-sm text-ink-soft transition-colors hover:text-ink">
            ← Back to site
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="m-auto w-full max-w-[30rem] py-4 [@media(max-height:820px)]:py-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
