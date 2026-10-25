import { addDays, daysBetween, formatDate, parseDate } from "../../internal/date/dateValue";
import type { DateRangeValue } from "./DateRangePicker.types";

/** How far into a range the dates between its ends are looked at for an unavailable one; past this a range is not scanned. */
const SCAN_DAYS = 732;

/** The limits a range is held to, with the ones left out already at their neutral value. */
export interface RangeRules {
  /** The fewest days, counting both ends (at least 1). */
  minRangeDays: number;
  /** The most days, counting both ends; `0` for no limit. */
  maxRangeDays: number;
  /** Whether the dates between the ends may include an unavailable one. */
  rangeSpansUnavailable: boolean;
  isBlocked: (date: string) => boolean;
}

export type RangeProblem = "tooShort" | "tooLong" | "spansUnavailable";

/** A whole number from `least` up, else `fallback` (what `Calendar` does with its own range limits). */
export function wholeNumber(value: unknown, least: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= least ? value : fallback;
}

/** Which of the length and spanning limits a range from `start` to `end` breaks, if any. An end before the start is not judged here. */
export function rangeProblem(start: string, end: string, rules: RangeRules): RangeProblem | null {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to) return null;
  const offset = daysBetween(from, to);
  if (offset < 0) return null;
  const length = offset + 1;
  if (length < rules.minRangeDays) return "tooShort";
  if (rules.maxRangeDays > 0 && length > rules.maxRangeDays) return "tooLong";
  if (!rules.rangeSpansUnavailable) {
    const reach = Math.min(offset - 1, SCAN_DAYS);
    for (let step = 1; step <= reach; step += 1) {
      if (rules.isBlocked(formatDate(addDays(from, step)))) return "spansUnavailable";
    }
  }
  return null;
}

/** The later of two dates written `"YYYY-MM-DD"`, or the one that exists. */
export function laterOf(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined || a === "") return b === "" ? undefined : b;
  if (b === undefined || b === "") return a;
  return a >= b ? a : b;
}

/** Whether a value is a whole range of real dates in order. */
export function isWholeRange(range: DateRangeValue): boolean {
  const from = parseDate(range[0]);
  const to = parseDate(range[1]);
  return Boolean(from && to && daysBetween(from, to) >= 0);
}
