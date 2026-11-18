import { describe, expect, it } from "vitest";
import { emailSchema, fullNameSchema, indianMobileSchema, toE164India } from "./common";

describe("indianMobileSchema", () => {
  it.each(["9876543210", "+91 98765 43210", "+919876543210", "09876543210", "98765-43210", "91 9876543210"])(
    "accepts %s",
    (input) => {
      expect(indianMobileSchema.parse(input)).toBe("9876543210");
    },
  );
  it.each(["5876543210", "987654321", "98765432100", "abcdefghij", ""])("rejects %s", (input) => {
    expect(indianMobileSchema.safeParse(input).success).toBe(false);
  });
  it("formats E.164", () => {
    expect(toE164India("+91 98765 43210")).toBe("+919876543210");
  });
});

describe("emailSchema / fullNameSchema", () => {
  it("normalizes email", () => {
    expect(emailSchema.parse("  Asha@Example.COM ")).toBe("asha@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
  it("validates names", () => {
    expect(fullNameSchema.parse(" Anaya D'Souza ")).toBe("Anaya D'Souza");
    expect(fullNameSchema.safeParse("A").success).toBe(false);
    expect(fullNameSchema.safeParse("<script>").success).toBe(false);
  });
});
