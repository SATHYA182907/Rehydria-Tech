import { z } from "zod";
import { rupeesToPaise } from "@/shared/money";
import { SLUG_PATTERN } from "@/shared/ids";

const lines = z
  .string()
  .max(4000)
  .transform((v) => v.split("\n").map((l) => l.trim()).filter(Boolean));

const rupees = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => {
      try {
        rupeesToPaise(v);
        return true;
      } catch {
        return false;
      }
    }, `${label} must be a rupee amount like 1499 or 1499.50.`)
    .transform((v) => rupeesToPaise(v));

export const courseFormSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(120),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens (e.g. iot)."),
  code: z.string().trim().toUpperCase().min(2).max(16),
  shortDescription: z.string().trim().min(20, "At least 20 characters.").max(180, "Keep it under 180 characters."),
  description: z.string().trim().max(10000),
  durationLabel: z.string().trim().min(2).max(40),
  durationWeeks: z.coerce.number().int().min(1).max(104),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  price: rupees("Price"),
  compareAtPrice: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(rupees("Compare-at price").nullable()),
  objectives: lines,
  prerequisites: lines,
  highlights: lines,
  tags: z
    .string()
    .max(400)
    .transform((v) => v.split(",").map((t) => t.trim()).filter(Boolean)),
  illustration: z.enum(["network", "board", "chip", "wave", "robot"]),
  status: z.enum(["draft", "published", "archived"]),
  enrollmentOpen: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});
export type CourseFormInput = z.input<typeof courseFormSchema>;
export type CourseFormOutput = z.output<typeof courseFormSchema>;

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.url("Enter a full URL starting with https://").nullable());

export const companyFormSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .pipe(z.email("Enter a valid email.").nullable()),
  phone: z
    .string()
    .trim()
    .max(20)
    .transform((v) => (v === "" ? null : v)),
  address: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v)),
  directorName: z
    .string()
    .trim()
    .max(80)
    .transform((v) => (v === "" ? null : v)),
  linkedin: optionalUrl,
  instagram: optionalUrl,
  youtube: optionalUrl,
  x: optionalUrl,
  github: optionalUrl,
});
export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type CompanyFormOutput = z.output<typeof companyFormSchema>;
