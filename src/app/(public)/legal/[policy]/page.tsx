import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/feedback";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Container, Section } from "@/components/layout/section";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { legalPages } from "@/content/legal";
import { Markdown } from "@/components/ui/markdown";

export function generateStaticParams() {
  return legalPages.map((p) => ({ policy: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[policy]">): Promise<Metadata> {
  const { policy } = await params;
  const page = legalPages.find((p) => p.slug === policy);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/legal/${page.slug}` },
    // Not indexed until the real policy text is published.
    robots: page.body ? undefined : { index: false, follow: true },
  };
}

async function LegalContent({ params }: { params: PageProps<"/legal/[policy]">["params"] }) {
  const { policy } = await params;
  const page = legalPages.find((p) => p.slug === policy);
  if (!page) notFound();

  return (
    <main>
      <PageHero eyebrow="Legal" title={page.title} lead={page.updated ? `Last updated ${page.updated}` : undefined} />
      <Section spacing="compact">
        <Container className="max-w-3xl">
          {page.body ? (
            <Markdown source={page.body} />
          ) : (
            <EmptyState
              icon={<FileText aria-hidden="true" />}
              title="This policy is being finalised"
              description="It will be published here shortly. If you have a question in the meantime, please contact us."
              action={
                <Button asChild variant="secondary" size="sm">
                  <Link href={routes.contact}>Contact us</Link>
                </Button>
              }
            />
          )}
        </Container>
      </Section>
    </main>
  );
}

/**
 * Params are awaited inside <Suspense> so pages for slugs published after the build render on
 * demand (and are then cached), while build-time slugs stay fully prerendered.
 */
export default function LegalPage({ params }: PageProps<"/legal/[policy]">) {
  return (
    <Suspense fallback={<main className="pt-40 pb-24"><div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-10"><Skeleton className="h-96 w-full" /></div></main>}>
      <LegalContent params={params} />
    </Suspense>
  );
}
