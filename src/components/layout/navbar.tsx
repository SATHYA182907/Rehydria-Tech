"use client";

import { ArrowRight, ArrowUpRight, Menu } from "lucide-react";
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
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";

interface NavbarProps {
  /** Published programs for the Internships mega menu (from Firestore). Empty → plain link. */
  programs?: NavProgram[];
  logoUrl?: string | null;
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

export function Navbar({ programs = [], logoUrl }: NavbarProps) {
  const pathname = usePathname();
  const { scrolled, hidden } = useScrollState();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuValue, setMenuValue] = useState("");
  const reduceMotion = useReducedMotion();
  const activeHref = primaryNav.find((l) => isActive(pathname, l.href))?.href ?? null;
  const indicatorHref = hovered ?? activeHref;
  const keepVisible = menuValue !== "";

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
              const hasMega = link.href === routes.internships && programs.length > 0;
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
                        className="anim-pop absolute top-full left-1/2 mt-3 w-[min(720px,90vw)] -translate-x-1/2"
                      >
                        <ProgramsMenu programs={programs} />
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
            <Link href={routes.login}>Log in</Link>
          </Button>
          <Magnetic className="hidden sm:inline-flex">
            <Button asChild size="sm">
              <Link href={routes.internships}>
                Enroll now
                <ArrowRight aria-hidden="true" className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          </Magnetic>
          <MobileMenu pathname={pathname} programs={programs} />
        </div>
      </div>
    </header>
  );
}

function ProgramsMenu({ programs }: { programs: NavProgram[] }) {
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-md border border-line bg-surface shadow-float">
      <ul className="col-span-3 flex flex-col gap-1 p-3">
        {programs.map((program, i) => (
          <li key={program.slug}>
            <Nav.Link asChild>
              <Link
                href={routes.internship(program.slug)}
                className="group flex gap-4 rounded-sm p-3 transition-colors hover:bg-canvas-2 focus-visible:bg-canvas-2 focus-visible:outline-none"
              >
                <span className="font-mono text-xs text-moss">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex items-center justify-between gap-2 font-medium text-ink">
                    {program.title}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 text-ink-soft opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </span>
                  <span className="line-clamp-2 text-sm text-ink-soft">{program.summary}</span>
                  {program.durationLabel && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{program.durationLabel}</span>
                  )}
                </span>
              </Link>
            </Nav.Link>
          </li>
        ))}
      </ul>
      <div className="engineering-grid col-span-2 flex flex-col justify-between gap-6 bg-forest p-6 text-on-forest [background-image:radial-gradient(rgb(184_228_201/0.12)_1px,transparent_1px)]">
        <p className="font-mono text-eyebrow uppercase text-mint">[ Programs ]</p>
        <p className="text-xl leading-snug font-medium tracking-tight">Hands-on internships with real hardware and a verifiable certificate.</p>
        <Nav.Link asChild>
          <Link href={routes.internships} className="inline-flex items-center gap-2 text-sm font-medium text-mint hover:underline">
            Compare all programs <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Nav.Link>
      </div>
    </div>
  );
}

function MobileMenu({ pathname, programs }: { pathname: string; programs: NavProgram[] }) {
  const [open, setOpen] = useState(false);
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
              </motion.li>
            ))}
          </ul>
          {programs.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {programs.map((p) => (
                <DialogClose asChild key={p.slug}>
                  <Link
                    href={routes.internship(p.slug)}
                    className="rounded-pill border border-line-strong px-3.5 py-1.5 text-sm text-ink-soft"
                  >
                    {p.title}
                  </Link>
                </DialogClose>
              ))}
            </div>
          )}
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <Button asChild size="lg">
              <Link href={routes.internships}>Enroll now</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.login}>Log in</Link>
            </Button>
            <p className="pt-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{siteConfig.tagline}</p>
          </div>
        </nav>
      </SheetContent>
    </Dialog>
  );
}
