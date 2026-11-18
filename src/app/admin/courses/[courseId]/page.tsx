import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getCourseForAdmin } from "@/services/admin/data";
import { requireAdmin } from "@/services/auth/session";
import { DOC_ID_PATTERN } from "@/shared/ids";

export const metadata: Metadata = { title: "Edit course" };

const rupees = (paise: unknown) => (typeof paise === "number" ? (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2) : "");
const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => (typeof x === "object" && x && "label" in x ? String((x as { label: unknown }).label) : String(x))).join("\n") : "");

export default async function EditCoursePage({ params }: PageProps<"/admin/courses/[courseId]">) {
  await requireAdmin();
  const { courseId } = await params;
  if (!DOC_ID_PATTERN.test(courseId)) notFound();
  const c = await getCourseForAdmin(courseId);
  if (!c) notFound();

  return (
    <>
      <DashboardHeader
        eyebrow="Courses"
        title={String(c.title)}
        description={`Course ID ${c.id}`}
        actions={
          c.status === "published" ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/internships/${String(c.slug)}`} target="_blank">View on site <ExternalLink aria-hidden="true" /></Link>
            </Button>
          ) : undefined
        }
      />
      <CourseForm
        courseId={c.id}
        defaults={{
          title: String(c.title ?? ""),
          slug: String(c.slug ?? ""),
          code: String(c.code ?? ""),
          shortDescription: String(c.shortDescription ?? ""),
          description: String(c.description ?? ""),
          durationLabel: String(c.durationLabel ?? ""),
          durationWeeks: Number(c.durationWeeks ?? 4),
          level: (c.level as "beginner") ?? "beginner",
          price: rupees(c.pricePaise),
          compareAtPrice: rupees(c.compareAtPricePaise),
          objectives: list(c.objectives),
          prerequisites: list(c.prerequisites),
          highlights: list(c.highlights),
          tags: Array.isArray(c.tags) ? (c.tags as string[]).join(", ") : "",
          illustration: (c.illustration as "chip") ?? "chip",
          status: (c.status as "draft") ?? "draft",
          enrollmentOpen: Boolean(c.enrollmentOpen),
          sortOrder: Number(c.sortOrder ?? 10),
        }}
      />
    </>
  );
}
