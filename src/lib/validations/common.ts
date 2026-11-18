import { z } from "zod";

/**
 * Field schemas shared by client forms (React Hook Form) and server actions.
 * Server code must always re-parse input with these schemas; never trust client validation.
 */

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(80, "Name must be 80 characters or fewer.")
  .regex(/^[\p{L}\p{M}' .-]+$/u, "Name can contain letters, spaces, apostrophes, dots and hyphens.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address."));

/** Strips +91 / 0 prefixes, spaces and dashes, then validates a 10-digit Indian mobile number. */
export function normalizeIndianMobile(input: string): string {
  const digits = input.replace(/[\s()-]/g, "").replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return digits;
}

export const indianMobileSchema = z
  .string()
  .transform(normalizeIndianMobile)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."));

export function toE164India(nationalNumber: string): string {
  return `+91${normalizeIndianMobile(nationalNumber)}`;
}

export const yearOfStudyOptions = [
  { value: "1", label: "1st year" },
  { value: "2", label: "2nd year" },
  { value: "3", label: "3rd year" },
  { value: "4", label: "4th year" },
  { value: "5", label: "5th year" },
  { value: "graduate", label: "Graduated" },
  { value: "working", label: "Working professional" },
  { value: "other", label: "Other" },
] as const;

export const yearOfStudySchema = z.enum(
  yearOfStudyOptions.map((o) => o.value) as [string, ...string[]],
  { error: "Select your year of study." },
);

export const organizationSchema = z
  .string()
  .trim()
  .min(2, "Enter your college or organization.")
  .max(120, "Must be 120 characters or fewer.");
