import { z } from "zod";
import { passwordSchema } from "./auth";
import { emailSchema, fullNameSchema, indianMobileSchema, yearOfStudySchema } from "./common";

/** Current higher-education course, e.g. "B.E. Electronics & Communication". */
export const degreeSchema = z.string().trim().min(2, "Enter your current course or degree.").max(120, "Keep it under 120 characters.");

/** Application details stored on the profile and enrollment (validated again on the server). */
export const enrollmentDetailsSchema = z.object({
  fullName: fullNameSchema,
  phone: indianMobileSchema,
  degree: degreeSchema,
  yearOfStudy: yearOfStudySchema,
  courseId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Choose the internship course."),
});

/** Full form for visitors without an account (adds email + password). */
export const enrollmentSignupSchema = enrollmentDetailsSchema
  .extend({ email: emailSchema, password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export type EnrollmentDetailsInput = z.input<typeof enrollmentDetailsSchema>;
export type EnrollmentSignupInput = z.input<typeof enrollmentSignupSchema>;
