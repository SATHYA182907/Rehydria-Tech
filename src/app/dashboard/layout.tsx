import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell, type ShellNavGroup } from "@/components/dashboard/app-shell";
import { DashboardSkeleton, UserSlotSkeleton } from "@/components/dashboard/page-header";
import { UserSlot } from "@/components/dashboard/user-slot";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Rehydria Dashboard" }, robots: { index: false, follow: false } };

const NAV: ShellNavGroup[] = [
  {
    items: [
      { label: "Courses", href: "/dashboard/courses", icon: "BookOpen" },
      { label: "Certificates", href: "/dashboard/certificates", icon: "Award" },
      { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
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
