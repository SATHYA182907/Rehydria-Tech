import Link from "next/link";
import { CircuitArt } from "@/components/homepage/hero/circuit-art";
import { Logo } from "@/components/layout/logo";
import { Accent } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="engineering-grid relative flex min-h-svh flex-col bg-canvas px-4 py-8 sm:px-10">
      <Logo />
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 py-16 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-eyebrow uppercase text-moss-text">[ Error 404 ]</p>
          <h1 className="text-display-md font-medium">
            This trace leads <Accent className="text-moss">nowhere</Accent>.
          </h1>
          <p className="max-w-[44ch] text-lg leading-relaxed text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/internships">Browse programs</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md opacity-90 [perspective:1400px]">
          <div className="[transform:rotateX(50deg)_rotateZ(-30deg)]">
            <CircuitArt />
          </div>
        </div>
      </div>
    </main>
  );
}
