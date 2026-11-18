import { z } from "zod";
import { emailSchema, fullNameSchema } from "./common";

export const contactTopics = [
  { value: "internships", label: "Internship programs" },
  { value: "hackathon-guide", label: "Hackathon Guide" },
  { value: "certificates", label: "Certificates & verification" },
  { value: "payments", label: "Payments" },
  { value: "partnerships", label: "Colleges & partnerships" },
  { value: "other", label: "Something else" },
] as const;

export const contactSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : undefined)),
  topic: z.enum(contactTopics.map((t) => t.value) as [string, ...string[]], { error: "Choose a topic." }),
  message: z.string().trim().min(20, "Please write at least 20 characters.").max(2000, "Keep it under 2000 characters."),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional(),
});
