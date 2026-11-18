import { z } from "zod";
import { emailSchema, fullNameSchema, indianMobileSchema, organizationSchema, yearOfStudySchema } from "./common";

/** Enrollment form (spec §10). Shared by the client form and the server action. */
export const enrollmentSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: indianMobileSchema,
  courseId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Select a program."),
  yearOfStudy: yearOfStudySchema,
  college: organizationSchema,
});

export type EnrollmentInput = z.input<typeof enrollmentSchema>;
