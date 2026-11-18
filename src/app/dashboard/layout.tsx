import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell, type ShellNavGroup } from "@/components/dashboard/app-shell";
import { DashboardSkeleton, UserSlotSkeleton } from "@/components/dashboard/page-header";
import { UserSlot } from "@/components/dashboard/user-slot";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Rehydria Dashboard" }, robots: { index: false, follow: false } };

const NAV: ShellNavGroup[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard", icon: "LayoutDashboard", exact: true },
      { label: "My courses", href: "/dashboard/courses", icon: "BookOpen" },
      { label: "Learning materials", href: "/dashboard/materials", icon: "FolderOpen" },
    ],
  },
  {
    label: "Progress",
    items: [
      { label: "Assessments", href: "/dashboard/assessments", icon: "ListChecks" },
      { label: "Results", href: "/dashboard/results", icon: "BarChart3" },
      { label: "Certificates", href: "/dashboard/certificates", icon: "Award" },
    ],
  },
  { label: "Account", items: [{ label: "Profile", href: "/dashboard/profile", icon: "UserRound" }] },
];

/**
 * Student area. The shell is static; the session is verified inside the Suspense boundaries
 * (UserSlot and every page call requireUser), never at the layout's top level.
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <AppShell
      area="Student dashboard"
      nav={NAV}
      userSlot={
        <Suspense fallback={<UserSlotSkeleton />}>
          <UserSlot />
        </Suspense>
      }
    >
      <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
    </AppShell>
  );
}
