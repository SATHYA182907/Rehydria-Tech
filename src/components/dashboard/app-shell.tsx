"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  BookText,
  ClipboardCheck,
  CreditCard,
  FileQuestion,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Layers,
  ListChecks,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

/** Icon names are strings so nav config can be passed from Server Components. */
const ICONS = {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  ListChecks,
  BarChart3,
  Award,
  UserRound,
  Users,
  Layers,
  PlayCircle,
  GraduationCap,
  ClipboardCheck,
  FileQuestion,
  CreditCard,
  Package,
  Settings,
  BookText,
} satisfies Record<string, LucideIcon>;

export type ShellIcon = keyof typeof ICONS;

export interface ShellNavItem {
  label: string;
  href: string;
  icon: ShellIcon;
  /** Exact match only (for the area root). */
  exact?: boolean;
}

export interface ShellNavGroup {
  label?: string;
  items: ShellNavItem[];
}

interface AppShellProps {
  area: string;
  nav: ShellNavGroup[];
  userSlot: ReactNode;
  children: ReactNode;
}

function isActive(pathname: string | null, item: ShellNavItem) {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavList({ nav, pathname, collapsed, onNavigate, layoutId }: { nav: ShellNavGroup[]; pathname: string | null; collapsed: boolean; onNavigate?: () => void; layoutId: string }) {
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-6">
      {nav.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {group.label && !collapsed && <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">{group.label}</p>}
          {group.items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-sm px-3 text-[15px] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss",
                  active ? "text-forest" : "text-ink-soft hover:bg-canvas hover:text-ink",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={layoutId}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-sm bg-surface shadow-xs ring-1 ring-line"
                    transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.18, duration: 0.45 }}
                  />
                )}
                <Icon aria-hidden="true" className={cn("relative size-[18px] shrink-0", active && "text-moss")} />
                {!collapsed && <span className="relative truncate">{item.label}</span>}
                {collapsed && <span className="sr-only">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function NavWithPath(props: Omit<Parameters<typeof NavList>[0], "pathname">) {
  return <NavList {...props} pathname={usePathname()} />;
}

/** Dashboard chrome shared by the student and admin areas. */
export function AppShell({ area, nav, userSlot, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-canvas">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-line bg-canvas-2 py-5 transition-[width] duration-300 ease-[var(--ease-out-expo)] lg:flex",
          collapsed ? "w-[76px] px-3" : "w-64 px-4",
        )}
      >
        <div className={cn("mb-8 flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && <Logo />}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="flex size-9 items-center justify-center rounded-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" className="size-[18px]" /> : <PanelLeftClose aria-hidden="true" className="size-[18px]" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" data-lenis-prevent>
          <Suspense fallback={<NavList nav={nav} pathname={null} collapsed={collapsed} layoutId="desk-nav" />}>
            <NavWithPath nav={nav} collapsed={collapsed} layoutId="desk-nav" />
          </Suspense>
        </div>
        {!collapsed && <p className="px-3 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">{area}</p>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Open navigation">
                  <Menu aria-hidden="true" />
                </Button>
              </DialogTrigger>
              <SheetContent side="left" className="bg-canvas-2 px-4 pt-6">
                <DialogTitle className="mb-6 px-1">
                  <Logo />
                </DialogTitle>
                <Suspense fallback={<NavList nav={nav} pathname={null} collapsed={false} layoutId="mob-nav" />}>
                  <NavWithPath nav={nav} collapsed={false} layoutId="mob-nav" onNavigate={() => setMobileOpen(false)} />
                </Suspense>
              </SheetContent>
            </Dialog>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{area}</span>
          </div>
          <span className="hidden lg:block" />
          {userSlot}
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
