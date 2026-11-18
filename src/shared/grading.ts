/**
 * Assessment grading. Bands are stored as minimum percentages so they work for any
 * question count. For the default 25-question exam they map exactly to the
 * specification: 23–25 A+, 20–22 A, 17–19 B, 14–16 C, 10–13 D, 0–9 Fail.
 */

export interface GradeBand {
  grade: string;
  /** Inclusive lower bound, 0–100. */
  minPercent: number;
}

export const FAIL_GRADE = "Fail";

export const DEFAULT_GRADING_SCALE: readonly GradeBand[] = Object.freeze([
  { grade: "A+", minPercent: 92 },
  { grade: "A", minPercent: 80 },
  { grade: "B", minPercent: 68 },
  { grade: "C", minPercent: 56 },
  { grade: "D", minPercent: 40 },
  { grade: FAIL_GRADE, minPercent: 0 },
]);

export const DEFAULT_PASSING_PERCENT = 40;
export const DEFAULT_QUESTION_COUNT = 25;
export const DEFAULT_DURATION_MINUTES = 30;

export interface GradeResult {
  correct: number;
  total: number;
  /** Rounded to two decimal places. */
  percent: number;
  grade: string;
  passed: boolean;
}

/** Validates an admin-configured scale: unique grades, 0–100, includes a 0% floor. */
export function validateGradingScale(scale: readonly GradeBand[]): string[] {
  const errors: string[] = [];
  if (scale.length === 0) errors.push("Scale must have at least one band.");
  const grades = new Set<string>();
  for (const band of scale) {
    if (!band.grade.trim()) errors.push("Grade labels cannot be empty.");
    if (grades.has(band.grade)) errors.push(`Duplicate grade "${band.grade}".`);
    grades.add(band.grade);
    if (!Number.isFinite(band.minPercent) || band.minPercent < 0 || band.minPercent > 100) {
      errors.push(`Band "${band.grade}" must have a minimum between 0 and 100.`);
    }
  }
  const mins = scale.map((b) => b.minPercent);
  if (new Set(mins).size !== mins.length) errors.push("Two bands share the same minimum.");
  if (!scale.some((b) => b.minPercent === 0)) errors.push("Scale must include a band starting at 0%.");
  return errors;
}

export function gradeScore(
  correct: number,
  total: number,
  options: { scale?: readonly GradeBand[]; passingPercent?: number } = {},
): GradeResult {
  if (!Number.isInteger(total) || total <= 0) throw new RangeError("total must be a positive integer");
  if (!Number.isInteger(correct) || correct < 0 || correct > total) {
    throw new RangeError("correct must be an integer between 0 and total");
  }
  const scale = [...(options.scale ?? DEFAULT_GRADING_SCALE)].sort((a, b) => b.minPercent - a.minPercent);
  const passingPercent = options.passingPercent ?? DEFAULT_PASSING_PERCENT;

  // Compare on exact ratios to avoid rounding pushing a score across a boundary.
  const exactPercent = (correct * 100) / total;
  const band = scale.find((b) => exactPercent >= b.minPercent);
  const grade = band?.grade ?? FAIL_GRADE;

  return {
    correct,
    total,
    percent: Math.round(exactPercent * 100) / 100,
    grade,
    passed: exactPercent >= passingPercent && grade !== FAIL_GRADE,
  };
}
