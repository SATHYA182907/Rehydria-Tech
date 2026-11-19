import { z } from "zod";
import { fullNameSchema, indianMobileSchema, yearOfStudySchema } from "./common";
import { degreeSchema } from "./enrollment";

export const profileSchema = z.object({
  fullName: fullNameSchema,
  phone: indianMobileSchema,
  degree: degreeSchema,
  college: z
    .string()
    .trim()
    .max(120, "Must be 120 characters or fewer.")
    .transform((v) => (v === "" ? null : v)),
  yearOfStudy: yearOfStudySchema,
});
