/** A count that is a finite number above zero, as a whole number; anything else (negative, `NaN`, `Infinity`, missing) is none. */
export const safeCount = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
