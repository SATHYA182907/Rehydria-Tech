import { redirect } from "next/navigation";

/** Old URL: profile now lives under Settings. */
export default function ProfileRedirect() {
  redirect("/dashboard/settings");
}
