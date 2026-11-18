import type { Metadata } from "next";
import { CourseForm } from "@/components/admin/course-form";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/services/auth/session";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <>
      <DashboardHeader eyebrow="Courses" title="New course" description="Create the course as a draft, add its content, then publish it." />
      <CourseForm
        courseId={null}
        defaults={{
          title: "", slug: "", code: "", shortDescription: "", description: "", durationLabel: "", durationWeeks: 4,
          level: "beginner", price: "", compareAtPrice: "", objectives: "", prerequisites: "", highlights: "", tags: "",
          illustration: "chip", status: "draft", enrollmentOpen: false, sortOrder: 10,
        }}
      />
    </>
  );
}
