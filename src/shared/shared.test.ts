import { describe, expect, it } from "vitest";
import { DEFAULT_GRADING_SCALE, gradeScore, validateGradingScale } from "./grading";
import {
  CERTIFICATE_ID_PATTERN,
  emailKey,
  enrollmentId,
  generateCertificateId,
  normalizeCertificateId,
  paymentReceipt,
} from "./ids";
import { formatPaise, rupeesToPaise } from "./money";

describe("gradeScore: default 25-question specification", () => {
  const expectations: [number[], string, boolean][] = [
    [[23, 24, 25], "A+", true],
    [[20, 21, 22], "A", true],
    [[17, 18, 19], "B", true],
    [[14, 15, 16], "C", true],
    [[10, 11, 12, 13], "D", true],
    [[0, 1, 5, 9], "Fail", false],
  ];
  for (const [scores, grade, passed] of expectations) {
    it(`maps ${scores.join(", ")} → ${grade}`, () => {
      for (const correct of scores) {
        const result = gradeScore(correct, 25);
        expect(result.grade).toBe(grade);
        expect(result.passed).toBe(passed);
      }
    });
  }

  it("computes percent to two decimals", () => {
    expect(gradeScore(2, 3).percent).toBe(66.67);
  });

  it("respects custom pass mark", () => {
    expect(gradeScore(12, 25, { passingPercent: 50 }).passed).toBe(false);
  });

  it("rejects impossible scores", () => {
    expect(() => gradeScore(26, 25)).toThrow(RangeError);
    expect(() => gradeScore(1, 0)).toThrow(RangeError);
  });
});

describe("validateGradingScale", () => {
  it("accepts the default scale", () => {
    expect(validateGradingScale(DEFAULT_GRADING_SCALE)).toEqual([]);
  });
  it("requires a 0% floor and unique bands", () => {
    const errors = validateGradingScale([
      { grade: "A", minPercent: 80 },
      { grade: "A", minPercent: 80 },
    ]);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("money", () => {
  it("converts rupees to paise without float error", () => {
    expect(rupeesToPaise("200")).toBe(20000);
    expect(rupeesToPaise("1499.5")).toBe(149950);
    expect(rupeesToPaise("0.29")).toBe(29);
    expect(() => rupeesToPaise("1.234")).toThrow();
    expect(() => rupeesToPaise("-5")).toThrow();
  });
  it("formats INR", () => {
    expect(formatPaise(20000)).toBe("₹200");
    expect(formatPaise(14999900)).toBe("₹1,49,999");
    expect(() => formatPaise(1.5)).toThrow();
  });
});

describe("ids", () => {
  it("generates well-formed, unique certificate ids", () => {
    const ids = new Set(Array.from({ length: 2000 }, generateCertificateId));
    expect(ids.size).toBe(2000);
    for (const id of ids) expect(id).toMatch(CERTIFICATE_ID_PATTERN);
  });

  it("normalizes user-typed certificate ids", () => {
    const id = generateCertificateId();
    expect(normalizeCertificateId(id.toLowerCase().replaceAll("-", " "))).toBe(id);
    expect(normalizeCertificateId("RHT-OOOO-IIII-LLLL-0000")).toBe("RHT-0000-1111-1111-0000");
    expect(normalizeCertificateId("ABC-1234")).toBeNull();
    expect(normalizeCertificateId("RHT-1234")).toBeNull();
  });

  it("derives a stable enrollment id regardless of email casing", async () => {
    const a = await enrollmentId("arduino", "  Student@Example.com ");
    const b = await enrollmentId("arduino", "student@example.com");
    expect(a).toBe(b);
    expect(a).toMatch(/^arduino_[0-9a-f]{32}$/);
    expect(await emailKey("x@y.z")).not.toBe(await emailKey("x@y.za"));
  });

  it("keeps Razorpay receipts within 40 characters", () => {
    expect(paymentReceipt("course").length).toBeLessThanOrEqual(40);
  });
});
