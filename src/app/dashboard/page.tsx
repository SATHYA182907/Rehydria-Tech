import { redirect } from "next/navigation";

/** The student area opens on Courses. */
export default function DashboardHome() {
  redirect("/dashboard/courses");
}
