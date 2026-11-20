/**
 * Current time for request-time Server Component rendering (e.g. "Day 3 of 14"). Pages that
 * call this are dynamic (they verify the session first), so the value is per request.
 */
export function requestTime(): number {
  return Date.now();
}

export const DAY_MS = 86_400_000;
