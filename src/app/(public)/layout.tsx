import { Cursor } from "@/components/animations/cursor";
import { SmoothScrollProvider } from "@/components/animations/smooth-scroll-provider";
import { Footer } from "@/components/layout/footer";
import { Suspense } from "react";
import { Navbar, NavbarWithPath } from "@/components/layout/navbar";
import { getCompanySettings, getPublishedCourses } from "@/services/catalog";

/**
 * Marketing shell: smooth scrolling, desktop cursor, navigation and footer. Programs for the
 * mega menu and company contact details come from cached Firestore reads (prerendered).
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [courses, company] = await Promise.all([getPublishedCourses(), getCompanySettings()]);
  const programs = courses.map((c) => ({ slug: c.slug, title: c.title, summary: c.shortDescription, durationLabel: c.durationLabel }));

  return (
    <SmoothScrollProvider>
      <a
        href="#main"
        className="sr-only z-[60] rounded-pill bg-forest px-4 py-2 text-sm text-on-forest focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <Suspense fallback={<Navbar programs={programs} logoUrl={company.logoUrl} />}>
        <NavbarWithPath programs={programs} logoUrl={company.logoUrl} />
      </Suspense>
      <div id="main" className="flex flex-1 flex-col">
        {children}
      </div>
      <Footer company={company} />
      <Cursor />
    </SmoothScrollProvider>
  );
}
