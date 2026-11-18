import { Cursor } from "@/components/animations/cursor";
import { SmoothScrollProvider } from "@/components/animations/smooth-scroll-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/**
 * Marketing shell: smooth scrolling, desktop cursor, navigation and footer.
 * Programs for the mega menu and company contact details are wired to Firestore in
 * Phase 4/5 via cached services; until then the navbar shows a plain Internships link and
 * the footer hides empty contact fields.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <SmoothScrollProvider>
      <a
        href="#main"
        className="sr-only z-[60] rounded-pill bg-forest px-4 py-2 text-sm text-on-forest focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main" className="flex flex-1 flex-col">
        {children}
      </div>
      <Footer />
      <Cursor />
    </SmoothScrollProvider>
  );
}
