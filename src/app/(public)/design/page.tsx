import { ArrowRight, BookOpen, Cpu, Inbox, Radio, Sparkles, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountUp } from "@/components/animations/count-up";
import { Magnetic } from "@/components/animations/magnetic";
import { MaskReveal } from "@/components/animations/mask-reveal";
import { Reveal } from "@/components/animations/reveal";
import { RevealText } from "@/components/animations/reveal-text";
import { Accent, Container, Eyebrow, Section, SectionHeading } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress, ProgressRing, Skeleton } from "@/components/ui/feedback";
import { Price } from "@/components/ui/price";
import { Stat } from "@/components/ui/stat";
import { DemoForm } from "./_components/demo-form";
import { AccordionDemo, OverlayDemos, TabsDemo, ToastDemos } from "./_components/interactive-demos";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/**
 * Internal component showcase. Available in development, and in other environments only
 * when ENABLE_DESIGN_SHOWCASE=true (e.g. Vercel previews). Contains no business data:
 * every value on this page is an illustrative sample, labelled as such.
 */
const enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_DESIGN_SHOWCASE === "true";

const SWATCHES = [
  { name: "canvas", hex: "#F6F7F4", className: "bg-canvas", text: "text-ink" },
  { name: "canvas-2", hex: "#EEF2ED", className: "bg-canvas-2", text: "text-ink" },
  { name: "surface", hex: "#FFFFFF", className: "bg-surface", text: "text-ink" },
  { name: "forest", hex: "#173F35", className: "bg-forest", text: "text-on-forest" },
  { name: "forest-deep", hex: "#0F2E26", className: "bg-forest-deep", text: "text-on-forest" },
  { name: "moss", hex: "#367A65", className: "bg-moss", text: "text-white" },
  { name: "mint", hex: "#B8E4C9", className: "bg-mint", text: "text-forest-deep" },
  { name: "mint-soft", hex: "#DDF2E5", className: "bg-mint-soft", text: "text-forest" },
  { name: "ink", hex: "#18251F", className: "bg-ink", text: "text-canvas" },
  { name: "ink-soft", hex: "#5E6A62", className: "bg-ink-soft", text: "text-white" },
  { name: "mute", hex: "#758078", className: "bg-mute", text: "text-white" },
  { name: "line", hex: "#DDE3DC", className: "bg-line", text: "text-ink" },
];

function Block({ index, title, children, note }: { index: string; title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="grid gap-8 border-t border-line py-14 lg:grid-cols-12">
      <div className="flex flex-col gap-3 lg:col-span-3">
        <Eyebrow>{index}</Eyebrow>
        <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
        {note && <p className="text-sm leading-relaxed text-ink-soft">{note}</p>}
      </div>
      <div className="min-w-0 lg:col-span-9">{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  if (!enabled) notFound();

  return (
    <main>
      <Section spacing="none" className="engineering-grid pt-40 pb-20">
        <Container>
          <Eyebrow>Internal · Design system v1</Eyebrow>
          <RevealText as="h1" immediate className="mt-6 max-w-[16ch] text-display-lg font-medium">
            Living circuit, <Accent className="text-moss">editorial</Accent> calm.
          </RevealText>
          <p className="mt-8 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
            Every reusable primitive for the Rehydria platform, rendered with the production tokens. Values shown here
            are illustrative samples, not business data.
          </p>
        </Container>
      </Section>

      <Container>
        <Block index="01" title="Color" note="Body copy uses ink-soft (5.3:1). mute is reserved for large or non-essential text.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SWATCHES.map((s) => (
              <div key={s.name} className="overflow-hidden rounded-md border border-line">
                <div className={`flex h-24 items-end p-3 ${s.className} ${s.text}`}>
                  <span className="font-mono text-xs">{s.hex}</span>
                </div>
                <div className="bg-surface px-3 py-2 font-mono text-xs text-ink-soft">{s.name}</div>
              </div>
            ))}
          </div>
        </Block>

        <Block index="02" title="Typography" note="Geist for display and UI, Instrument Serif italic for accents, Geist Mono for technical labels.">
          <div className="flex flex-col gap-8">
            <p className="text-display-xl font-medium">
              Build <Accent className="text-moss">real</Accent> things.
            </p>
            <p className="text-display-md font-medium">Display medium: section headings</p>
            <p className="text-3xl font-medium tracking-tight">Heading 2: page titles in dashboards</p>
            <p className="max-w-[60ch] text-lg leading-relaxed text-ink-soft">
              Lead paragraph. Hands-on internships with real hardware, structured modules and an assessment that proves
              what you learned.
            </p>
            <p className="max-w-[60ch] leading-relaxed">
              Body text at 16px with a comfortable 1.6 line height and a measure capped near 68 characters for
              readability.
            </p>
            <p className="font-mono text-eyebrow uppercase text-moss">[ 03 — Mono eyebrow label ]</p>
          </div>
        </Block>

        <Block index="03" title="Buttons" note="Primary actions are pills. Magnetic wrapper activates on desktop with a fine pointer only.">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="mint">Mint</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Text link</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">
                Large <ArrowRight aria-hidden="true" />
              </Button>
              <Button loading>Saving</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 rounded-md bg-forest p-6">
              <Magnetic>
                <Button size="lg" variant="on-forest" data-cursor="">
                  Magnetic CTA <ArrowRight aria-hidden="true" />
                </Button>
              </Magnetic>
              <Button size="lg" variant="mint">
                Mint on forest
              </Button>
            </div>
          </div>
        </Block>

        <Block index="04" title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="mint">Enrolled</Badge>
            <Badge variant="success">Passed</Badge>
            <Badge variant="warning">Pending payment</Badge>
            <Badge variant="danger">Revoked</Badge>
            <Badge variant="info">New</Badge>
            <Badge variant="outline">Module 01</Badge>
            <Badge variant="forest">Featured</Badge>
          </div>
        </Block>

        <Block index="05" title="Cards" note="Interactive cards lift, shift border to moss and show the 'View' cursor on desktop.">
          <Reveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card variant="interactive" data-cursor="View" className="flex flex-col">
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  Sample · 6 weeks
                </Badge>
                <CardTitle className="mt-3">Interactive card</CardTitle>
                <CardDescription>Used for program cards and dashboard course tiles.</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto justify-between">
                <Price amountPaise={149900} compareAtPaise={199900} size="sm" />
                <ArrowRight aria-hidden="true" className="size-5 text-moss" />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Cpu aria-hidden="true" className="mb-3 size-6 text-moss" />
                <CardTitle>Plain card</CardTitle>
                <CardDescription>Hairline border and a soft, green-tinted shadow.</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="muted">
              <CardHeader>
                <Radio aria-hidden="true" className="mb-3 size-6 text-moss" />
                <CardTitle>Muted card</CardTitle>
                <CardDescription>For secondary information on canvas.</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="feature" padding="lg" className="md:col-span-2">
              <p className="font-mono text-eyebrow uppercase text-mint">[ Feature island ]</p>
              <p className="mt-6 max-w-[24ch] text-3xl leading-tight font-medium tracking-tight">
                Dark forest panels create rhythm between <Accent className="text-mint">light</Accent> sections.
              </p>
            </Card>
            <div className="engineering-grid relative flex items-center justify-center rounded-md bg-canvas-2 p-6">
              <Card variant="glass" className="w-full">
                <CardTitle>Glass</CardTitle>
                <CardDescription>Navigation and floating chips only.</CardDescription>
              </Card>
            </div>
          </Reveal>
        </Block>

        <Block index="06" title="Forms" note="React Hook Form + Zod with the same schemas the server will use. Errors are announced and linked with aria-describedby.">
          <Card padding="lg">
            <DemoForm />
          </Card>
        </Block>

        <Block index="07" title="Overlays & disclosure">
          <div className="flex flex-col gap-12">
            <OverlayDemos />
            <TabsDemo />
            <AccordionDemo />
          </div>
        </Block>

        <Block index="08" title="Feedback & data" note="Skeletons mirror final geometry. Stats count up once in view; the final value is server-rendered.">
          <div className="flex flex-col gap-10">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="flex flex-col gap-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </Card>
              <Card className="flex flex-col justify-center gap-6">
                <Progress value={68} showValue label="Sample course progress" />
                <Progress value={32} showValue label="Sample module progress" />
                <div className="flex items-center gap-5">
                  <ProgressRing value={68} label="Sample completion" />
                  <ProgressRing value={100} size={56} stroke={5} label="Sample module complete" />
                </div>
              </Card>
              <EmptyState
                icon={<Inbox aria-hidden="true" />}
                title="No certificates yet"
                description="Complete a course and pass its assessment to earn one."
                action={
                  <Button size="sm" variant="secondary">
                    <BookOpen aria-hidden="true" /> Continue learning
                  </Button>
                }
              />
            </div>
            <Card variant="feature" padding="lg" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <Stat tone="forest" label="Sample metric" value={1284} icon={<Users aria-hidden="true" />} />
              <Stat tone="forest" label="Sample percent" value={92.4} decimals={1} suffix="%" icon={<Trophy aria-hidden="true" />} />
              <Stat tone="forest" label="Sample amount" value={48600} prefix="₹" icon={<Sparkles aria-hidden="true" />} />
              <Stat tone="forest" label="With delta" value={36} delta={12.5} />
            </Card>
            <ToastDemos />
          </div>
        </Block>

        <Block index="09" title="Motion primitives" note="All respect prefers-reduced-motion and clean up via gsap.context.">
          <div className="flex flex-col gap-16">
            <RevealText mode="scrub" as="p" className="max-w-[30ch] text-display-md font-medium">
              Scroll-scrubbed statements fade in word by word, turning a paragraph into a moment.
            </RevealText>
            <RevealText mode="lines" as="p" className="max-w-[40ch] text-3xl leading-tight font-medium tracking-tight">
              Masked line reveals slide each line up from behind an invisible edge as it enters the viewport.
            </RevealText>
            <div className="grid gap-4 md:grid-cols-2">
              <MaskReveal className="aspect-[4/3] rounded-md">
                <div className="h-full w-full bg-forest bg-[radial-gradient(rgb(184_228_201/0.22)_1px,transparent_1px),linear-gradient(135deg,var(--color-forest),var(--color-moss))] bg-[size:24px_24px,100%_100%]" />
              </MaskReveal>
              <MaskReveal from="left" parallax className="aspect-[4/3] rounded-md">
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,var(--color-mint),transparent_55%),radial-gradient(circle_at_75%_70%,var(--color-moss),transparent_50%)] bg-canvas-2" />
              </MaskReveal>
            </div>
            <p className="font-mono text-sm text-ink-soft">
              CountUp sample: <CountUp value={25} className="text-ink" /> questions ·{" "}
              <CountUp value={100} suffix="%" className="text-ink" /> server-graded
            </p>
          </div>
        </Block>
      </Container>

      <Section tone="canvas-2" spacing="compact">
        <Container>
          <SectionHeading
            align="split"
            eyebrow="10 — Section heading"
            title={
              <>
                Asymmetric <Accent className="text-moss">editorial</Accent> headings.
              </>
            }
            lead="Heading on the left columns, lead paragraph on the right. Stacks on smaller screens."
          />
        </Container>
      </Section>
    </main>
  );
}
