import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell, type ShellNavGroup } from "@/components/dashboard/app-shell";
import { DashboardSkeleton, UserSlotSkeleton } from "@/components/dashboard/page-header";
import { AdminUserSlot } from "@/components/admin/admin-user-slot";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Rehydria Admin" }, robots: { index: false, follow: false } };

const NAV: ShellNavGroup[] = [
  { items: [{ label: "Overview", href: "/admin", icon: "LayoutDashboard", exact: true }, { label: "Students", href: "/admin/students", icon: "Users" }] },
  {
    label: "Catalog",
    items: [
      { label: "Courses", href: "/admin/courses", icon: "BookOpen" },
      { label: "Modules", href: "/admin/modules", icon: "Layers" },
      { label: "Lessons", href: "/admin/lessons", icon: "PlayCircle" },
      { label: "Products", href: "/admin/products", icon: "Package" },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Enrollments", href: "/admin/enrollments", icon: "GraduationCap" },
      { label: "Assessments", href: "/admin/assessments", icon: "ClipboardCheck" },
      { label: "Questions", href: "/admin/questions", icon: "FileQuestion" },
      { label: "Results", href: "/admin/results", icon: "BarChart3" },
      { label: "Certificates", href: "/admin/certificates", icon: "Award" },
    ],
  },
  { label: "Business", items: [{ label: "Payments", href: "/admin/payments", icon: "CreditCard" }, { label: "Settings", href: "/admin/settings", icon: "Settings" }] },
];

/** Admin area: every page and the header slot call requireAdmin() inside Suspense. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AppShell
      area="Admin console"
      nav={NAV}
      userSlot={
        <Suspense fallback={<UserSlotSkeleton />}>
          <AdminUserSlot />
        </Suspense>
      }
    >
      <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
    </AppShell>
  );
}
