"use client";

import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Menu, UserPlus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu as Nav } from "radix-ui";
import { useEffect, useState } from "react";
import { Magnetic } from "@/components/animations/magnetic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogTitle, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { primaryNav, type NavLink, type NavProgram } from "@/config/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { useSignedInHint } from "@/lib/auth/client-session";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";

interface NavbarProps {
  /** Published programs for the Internships mega menu (from Firestore). Empty → plain link. */
  programs?: NavProgram[];
  logoUrl?: string | null;
  /** Current path for active states; null while streaming (no active indicator). */
  pathname?: string | null;
}

/**
 * Navbar with the active route. `usePathname()` is runtime data on dynamic routes, so the
 * layout renders this inside <Suspense> with a pathname-less <Navbar> as the fallback.
 */
export function NavbarWithPath(props: Omit<NavbarProps, "pathname">) {
  return <Navbar {...props} pathname={usePathname()} />;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Tracks scroll to compact the bar after the hero and hide it while scrolling down. */
function useScrollState() {
  const [state, setState] = useState({ scrolled: false, hidden: false });
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > last + 4;
        const goingUp = y < last - 4;
        setState((prev) => {
          const next = {
            scrolled: y > 24,
            hidden: y > 320 ? (goingDown ? true : goingUp ? false : prev.hidden) : false,
          };
          return next.scrolled === prev.scrolled && next.hidden === prev.hidden ? prev : next;
        });
        last = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return state;
}

export function Navbar({ programs = [], logoUrl, pathname: currentPath = null }: NavbarProps) {
  const pathname = currentPath ?? "";
  const { scrolled, hidden } = useScrollState();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuValue, setMenuValue] = useState("");
  const reduceMotion = useReducedMotion();
  const activeHref = primaryNav.find((l) => isActive(pathname, l.href))?.href ?? null;
  const indicatorHref = hovered ?? activeHref;
  const keepVisible = menuValue !== "";
  const signedIn = useSignedInHint();
  const accountHref = signedIn === "admin" ? routes.admin.root : routes.dashboard.root;
  const enrollHref = routes.enroll(Boolean(signedIn));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 transition-transform duration-500 ease-[var(--ease-out-expo)] sm:px-6 sm:pt-4",
        hidden && !keepVisible && "-translate-y-[130%]",
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[1240px] items-center justify-between gap-4 rounded-pill border pr-2 pl-4 transition-[padding,background-color,border-color,box-shadow] duration-500 ease-[var(--ease-out-expo)] sm:pl-5",
          scrolled
            ? "border-white/60 bg-canvas/75 py-1.5 shadow-card backdrop-blur-[14px] backdrop-saturate-[1.4]"
            : "border-transparent bg-transparent py-2.5",
        )}
      >
        <Logo logoUrl={logoUrl} />

        <Nav.Root
          value={menuValue}
          onValueChange={setMenuValue}
          className="relative hidden lg:block"
          aria-label="Main"
          onPointerLeave={() => setHovered(null)}
        >
          <Nav.List className="flex items-center gap-0.5">
            {primaryNav.map((link) => {
              const active = isActive(pathname, link.href);
              const showIndicator = indicatorHref === link.href;
              const hasMega = link.href === routes.internships;
              const itemClass = cn(
                "relative inline-flex h-10 items-center gap-1 rounded-pill px-4 text-[15px] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss",
                active ? "text-ink" : "text-ink-soft hover:text-ink",
              );
              const indicator = showIndicator && (
                <motion.span
                  layoutId="nav-indicator"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-pill bg-canvas-2"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.45 }}
                />
              );
              return (
                <Nav.Item key={link.href} value={hasMega ? "programs" : undefined} onPointerEnter={() => setHovered(link.href)}>
                  {hasMega ? (
                    <>
                      <Nav.Trigger className={cn(itemClass, "group")} onPointerMove={(e) => e.preventDefault()}>
                        {indicator}
                        {link.label}
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full bg-moss transition-transform duration-300 group-data-[state=open]:scale-150"
                        />
                      </Nav.Trigger>
                      <Nav.Content
                        onPointerMove={(e) => e.preventDefault()}
                        className="anim-pop absolute top-full left-1/2 mt-3 w-[min(640px,90vw)] -translate-x-1/2"
                      >
                        <InternshipsMenu programs={programs} enrollHref={enrollHref} signedIn={Boolean(signedIn)} />
                      </Nav.Content>
                    </>
                  ) : (
                    <Nav.Link asChild active={active}>
                      <Link href={link.href} className={itemClass} aria-current={active ? "page" : undefined}>
                        {indicator}
                        {link.label}
                      </Link>
                    </Nav.Link>
                  )}
                </Nav.Item>
              );
            })}
          </Nav.List>
        </Nav.Root>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden rounded-pill sm:inline-flex">
            <Link href={signedIn ? accountHref : routes.login}>{signedIn ? "Dashboard" : "Log in"}</Link>
          </Button>
          <Magnetic className="hidden sm:inline-flex">
            <Button asChild size="sm">
              <Link href={enrollHref}>
                Enroll now
                <ArrowRight aria-hidden="true" className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </Magnetic>
          <MobileMenu pathname={pathname} programs={programs} accountHref={signedIn ? accountHref : null} enrollHref={enrollHref} />
        </div>
      </div>
    </header>
  );
}

/**
 * Internships dropdown: two choices. "Courses" lists published programs (from Firestore);
 * "Enroll" sends visitors to sign up / sign in, then back to choose a program.
 */
function InternshipsMenu({ programs, enrollHref, signedIn }: { programs: NavProgram[]; enrollHref: string; signedIn: boolean }) {
  const option =
    "group flex h-full flex-col gap-3 rounded-sm p-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-moss";
  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-2 shadow-float">
      <div className="flex flex-col rounded-sm bg-canvas-2">
        <Nav.Link asChild>
          <Link href={routes.internships} className={cn(option, "hover:bg-mint-soft/60")}>
            <span className="flex size-10 items-center justify-center rounded-sm bg-surface text-moss shadow-xs">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <span className="flex items-center justify-between gap-2 text-lg font-medium text-ink">
              Courses
              <ArrowUpRight aria-hidden="true" className="size-4 text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <span className="text-sm text-ink-soft">Browse the available internship programs, curriculum and fees.</span>
          </Link>
        </Nav.Link>
        {programs.length > 0 && (
          <ul className="flex flex-col gap-0.5 border-t border-line px-3 pt-2 pb-3">
            {programs.map((program) => (
              <li key={program.slug}>
                <Nav.Link asChild>
                  <Link
                    href={routes.internship(program.slug)}
                    className="flex items-center justify-between gap-2 rounded-xs px-2 py-2 text-sm text-ink transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
                  >
                    {program.title}
                    {program.durationLabel && <span className="font-mono text-[11px] text-ink-soft">{program.durationLabel}</span>}
                  </Link>
                </Nav.Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Nav.Link asChild>
        <Link href={enrollHref} className={cn(option, "bg-forest text-on-forest hover:bg-forest-deep")}>
          <span className="flex size-10 items-center justify-center rounded-sm bg-white/10 text-mint">
            <UserPlus aria-hidden="true" className="size-5" />
          </span>
          <span className="flex items-center justify-between gap-2 text-lg font-medium">
            Enroll
            <ArrowRight aria-hidden="true" className="size-4 text-mint transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
          <span className="text-sm text-on-forest-soft">
            {signedIn ? "Choose a program and complete your enrollment." : "Create your account or sign in to enroll in a program."}
          </span>
          <span className="mt-auto font-mono text-[11px] uppercase tracking-[0.14em] text-mint">{signedIn ? "Choose a program" : "Sign up · Sign in"}</span>
        </Link>
      </Nav.Link>
    </div>
  );
}

function MobileMenu({ pathname, programs, accountHref, enrollHref }: { pathname: string; programs: NavProgram[]; accountHref: string | null; enrollHref: string }) {
  const [open, setOpen] = useState(false);
  const [internshipsOpen, setInternshipsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const links: NavLink[] = [{ label: "Home", href: "/" }, ...primaryNav];

  // Close when the route changes (link tapped).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <SheetContent side="full" className="bg-canvas px-6 pt-24 pb-10">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <DialogDescription className="sr-only">Site navigation</DialogDescription>
        <nav aria-label="Mobile" className="flex flex-1 flex-col">
          <ul className="flex flex-col">
            {links.map((link, i) => (
              <motion.li
                key={link.href}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="border-b border-line"
              >
                {link.href === routes.internships ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setInternshipsOpen((v) => !v)}
                      aria-expanded={internshipsOpen}
                      aria-controls="mobile-internships"
                      className="flex w-full items-center justify-between py-4 text-left text-[2.1rem] leading-none font-medium tracking-[-0.04em] text-ink"
                    >
                      {link.label}
                      <ChevronDown aria-hidden="true" className={cn("size-6 text-ink-soft transition-transform duration-300", internshipsOpen && "rotate-180 text-moss")} />
                    </button>
                    {internshipsOpen && (
                      <div id="mobile-internships" className="anim-fade grid grid-cols-2 gap-2 pb-4" data-state="open">
                        <DialogClose asChild>
                          <Link href={routes.internships} className="flex flex-col gap-2 rounded-md bg-canvas-2 p-4">
                            <BookOpen aria-hidden="true" className="size-5 text-moss" />
                            <span className="text-lg font-medium">Courses</span>
                            <span className="text-xs text-ink-soft">{programs.length ? programs.map((p) => p.title).join(" · ") : "Browse programs"}</span>
                          </Link>
                        </DialogClose>
                        <DialogClose asChild>
                          <Link href={enrollHref} className="flex flex-col gap-2 rounded-md bg-forest p-4 text-on-forest">
                            <UserPlus aria-hidden="true" className="size-5 text-mint" />
                            <span className="text-lg font-medium">Enroll</span>
                            <span className="text-xs text-on-forest-soft">{accountHref ? "Choose a program" : "Sign up or sign in"}</span>
                          </Link>
                        </DialogClose>
                      </div>
                    )}
                  </>
                ) : (
                  <DialogClose asChild>
                    <Link
                      href={link.href}
                      aria-current={isActive(pathname, link.href) ? "page" : undefined}
                      className="flex items-baseline justify-between py-4 text-[2.1rem] leading-none font-medium tracking-[-0.04em] text-ink aria-[current=page]:text-moss"
                    >
                      {link.label}
                      <span className="font-mono text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                    </Link>
                  </DialogClose>
                )}
              </motion.li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <Button asChild size="lg">
              <Link href={enrollHref}>Enroll now</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={accountHref ?? routes.login}>{accountHref ? "Dashboard" : "Log in"}</Link>
            </Button>
            <p className="pt-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{siteConfig.tagline}</p>
          </div>
        </nav>
      </SheetContent>
    </Dialog>
  );
}
