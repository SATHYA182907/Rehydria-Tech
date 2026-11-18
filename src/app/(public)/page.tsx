import type { Metadata } from "next";
import { FaqSection, FinalCtaSection, TestimonialsSection } from "@/components/homepage/closing-sections";
import { GuideSection } from "@/components/homepage/guide-section";
import { Hero } from "@/components/homepage/hero/hero";
import { IntroSection } from "@/components/homepage/intro-section";
import { MethodologySection } from "@/components/homepage/methodology-section";
import { Preloader } from "@/components/homepage/preloader";
import { ProgramsSection } from "@/components/homepage/programs-section";
import { StatsSection } from "@/components/homepage/stats-section";
import { TechSection } from "@/components/homepage/tech-section";
import { WhySection } from "@/components/homepage/why-section";
import { siteConfig } from "@/config/site";
import { homeFaq, roadmapTopics } from "@/content/home";
import { getFeaturedGuide, getFeaturedReviews, getPlatformStats, getPublishedCourses } from "@/services/catalog";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.legalName} | ${siteConfig.tagline}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

/**
 * Homepage. All catalog data comes from cached Firestore reads (services/catalog) and is
 * prerendered into the static shell; admin edits invalidate it via cache tags.
 */
export default async function HomePage() {
  const [courses, guide, reviews, stats] = await Promise.all([
    getPublishedCourses(),
    getFeaturedGuide(),
    getFeaturedReviews(),
    getPlatformStats(),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.legalName,
      url: siteConfig.url,
      slogan: siteConfig.tagline,
      description: siteConfig.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: homeFaq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Preloader />
      <Hero />
      <IntroSection />
      <StatsSection courses={courses} stats={stats} />
      <ProgramsSection courses={courses} upcoming={roadmapTopics} />
      <MethodologySection />
      <WhySection />
      <TechSection courses={courses} upcoming={roadmapTopics} />
      <GuideSection guide={guide} />
      <TestimonialsSection reviews={reviews} />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
}
