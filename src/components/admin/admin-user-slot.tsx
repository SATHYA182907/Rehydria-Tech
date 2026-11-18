import { UserMenu } from "@/components/dashboard/user-menu";
import { getProfile } from "@/services/auth/profile";
import { requireAdmin } from "@/services/auth/session";

export async function AdminUserSlot() {
  const user = await requireAdmin();
  const profile = await getProfile(user.uid);
  return <UserMenu name={profile?.fullName || user.name || user.email || "Admin"} email={user.email} isAdmin />;
}
