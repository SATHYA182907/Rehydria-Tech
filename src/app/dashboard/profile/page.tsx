import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/services/auth/profile";
import { requireUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const profile = await getProfile(user.uid);
  return (
    <>
      <DashboardHeader eyebrow="Account" title="Profile" description="Keep your details up to date. Your full name is printed on your certificates." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <ProfileForm
            email={profile?.email || user.email || ""}
            defaults={{
              fullName: profile?.fullName ?? user.name ?? "",
              phone: (profile?.phone ?? "").replace(/^\+91/, ""),
              college: profile?.college ?? "",
              yearOfStudy: profile?.yearOfStudy ?? "",
            }}
          />
        </Card>
        <Card variant="muted" className="flex flex-col gap-3 self-start">
          <p className="font-medium">Password & security</p>
          <p className="text-sm text-ink-soft">To change your password, request a secure reset link by email.</p>
          <Link href="/reset-password" className="text-sm font-medium text-moss-text hover:underline">Send password reset link →</Link>
        </Card>
      </div>
    </>
  );
}
