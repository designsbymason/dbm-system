import { afterEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime } from "@dbm-system/utils";

const now = new Date("2026-03-14T12:00:00Z").getTime();
const ago = (ms: number) => now - ms;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

afterEach(() => vi.restoreAllMocks());

describe("formatRelativeTime", () => {
  it("writes the largest unit that fits, cut towards zero", () => {
    expect(formatRelativeTime(ago(30_000), { now })).toBe("30 seconds ago");
    expect(formatRelativeTime(ago(5 * MIN), { now })).toBe("5 minutes ago");
    expect(formatRelativeTime(ago(2 * HOUR + 59 * MIN), { now })).toBe("2 hours ago");
    expect(formatRelativeTime(ago(3 * DAY), { now })).toBe("3 days ago");
    expect(formatRelativeTime(ago(14 * DAY), { now })).toBe("2 weeks ago");
    expect(formatRelativeTime(ago(90 * DAY), { now })).toBe("3 months ago");
    expect(formatRelativeTime(ago(800 * DAY), { now })).toBe("2 years ago");
  });

  it("writes the future the same way", () => {
    expect(formatRelativeTime(now + 3 * HOUR, { now })).toBe("in 3 hours");
    expect(formatRelativeTime(now + 3 * DAY, { now })).toBe("in 3 days");
  });

  it("writes now for no distance, never a negative zero", () => {
    expect(formatRelativeTime(now, { now })).toBe("now");
    expect(formatRelativeTime(now + 500, { now })).toBe("now");
    expect(formatRelativeTime(ago(500), { now })).toBe("now");
  });

  it("writes yesterday and tomorrow, or 1 day ago with numeric always", () => {
    expect(formatRelativeTime(ago(DAY), { now })).toBe("yesterday");
    expect(formatRelativeTime(now + DAY, { now })).toBe("tomorrow");
    expect(formatRelativeTime(ago(DAY), { now, numeric: "always" })).toBe("1 day ago");
  });

  it("takes the language and style it is given, and never the browser's", () => {
    expect(formatRelativeTime(now + DAY, { now, locale: "fr" })).toBe("demain");
    expect(formatRelativeTime(ago(2 * HOUR), { now, style: "short" })).toBe("2 hr. ago");
  });

  it("accepts a date, a number or a string", () => {
    expect(formatRelativeTime(new Date(ago(2 * HOUR)), { now })).toBe("2 hours ago");
    expect(formatRelativeTime(new Date(ago(2 * HOUR)).toISOString(), { now })).toBe("2 hours ago");
    expect(formatRelativeTime(ago(2 * HOUR), { now: new Date(now) })).toBe("2 hours ago");
  });

  it("measures from the current time when no moment is given", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(ago(2 * HOUR))).toBe("2 hours ago");
    vi.useRealTimers();
  });

  it("writes an empty string, with a warning, for a value that is not a date", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(formatRelativeTime("not a date", { now })).toBe("");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a valid date"));
  });
});
