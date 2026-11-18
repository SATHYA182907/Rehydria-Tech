import { getProfile } from "@/services/auth/profile";
import { requireUser } from "@/services/auth/session";
import { UserMenu } from "./user-menu";

/** Header account menu (server: verifies the session, then renders the client menu). */
export async function UserSlot() {
  const user = await requireUser();
  const profile = await getProfile(user.uid);
  return <UserMenu name={profile?.fullName || user.name || user.email || "Student"} email={user.email} isAdmin={user.isAdmin} />;
}
