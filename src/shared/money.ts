/**
 * Money helpers. All amounts are integer paise (1 INR = 100 paise).
 * Never use floating point rupees in business logic.
 */

export const CURRENCY = "INR" as const;
export type Currency = typeof CURRENCY;

/** Razorpay's minimum order amount is ₹1.00. */
export const MIN_ORDER_PAISE = 100;

export function isValidPaise(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function assertValidPaise(value: unknown, label = "amount"): asserts value is number {
  if (!isValidPaise(value)) {
    throw new RangeError(`${label} must be a non-negative integer number of paise`);
  }
}

/**
 * Converts a rupee amount entered by an admin (e.g. "1499" or "1499.50") into paise
 * without floating-point error. Rejects more than two decimal places.
 */
export function rupeesToPaise(input: string | number): number {
  const text = typeof input === "number" ? input.toString() : input.trim();
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) {
    throw new RangeError(`Invalid rupee amount: "${text}"`);
  }
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  return whole * 100 + fraction;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats paise for display, e.g. 20000 → "₹200", 149950 → "₹1,499.50". */
export function formatPaise(paise: number): string {
  assertValidPaise(paise);
  return inrFormatter.format(paise / 100);
}
