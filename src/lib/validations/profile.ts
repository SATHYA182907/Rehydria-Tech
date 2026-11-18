import { z } from "zod";
import { fullNameSchema, indianMobileSchema, organizationSchema, yearOfStudySchema } from "./common";

export const profileSchema = z.object({
  fullName: fullNameSchema,
  phone: indianMobileSchema,
  college: organizationSchema,
  yearOfStudy: yearOfStudySchema,
});
