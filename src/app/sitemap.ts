import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { legalPages } from "@/content/legal";
import { getPublishedCourses } from "@/services/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const courses = await getPublishedCourses();
  const staticPaths = ["/", "/about", "/internships", "/hackathon-guide", "/faq", "/contact", "/verify"];
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...courses.map((c) => ({ url: `${base}/internships/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...legalPages.filter((p) => p.body).map((p) => ({ url: `${base}/legal/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
