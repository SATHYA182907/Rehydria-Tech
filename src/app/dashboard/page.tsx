import { redirect } from "next/navigation";
import { requireUser } from "@/services/auth/session";
import { getLandingPath } from "@/services/student";

/** /dashboard sends students straight to their course (see getLandingPath). */
export default async function DashboardHome() {
  const user = await requireUser("/dashboard");
  redirect(await getLandingPath(user.uid));
}
