import { act, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRangePickerProps } from "./DateRangePicker.types";

// Server rendering and hydration. The unit project runs in jsdom, where `window` and `document` exist, so the
// server render is done with both removed: what it proves is that nothing touches them while rendering. The
// calendar's own clock (today) is read after the first commit, so the first client render matches the server's.
function onTheServer<T>(render: () => T): T {
  vi.stubGlobal("window", undefined);
  vi.stubGlobal("document", undefined);
  try {
    return render();
  } finally {
    vi.unstubAllGlobals();
  }
}

const stay = ["2026-10-05", "2026-10-09"] as const;

const variants: Array<[string, Partial<DateRangePickerProps>]> = [
  ["empty", {}],
  ["with a value", { defaultValue: stay, clearable: true }],
  ["open by default", { defaultOpen: true, defaultValue: stay }],
  ["open with nothing chosen", { defaultOpen: true }],
  ["open with only a start", { defaultOpen: true, defaultValue: ["2026-10-05", ""] }],
  ["controlled open", { open: true, value: stay, onValueChange: () => undefined }],
  ["named and required", { name: "stay", required: true }],
  ["day first", { format: "dmy", separator: ".", defaultValue: stay }],
  ["right to left", { dir: "rtl", defaultOpen: true, format: "ymd" }],
  [
    "with bounds and an unavailable rule",
    {
      min: "2026-10-01",
      max: "2026-10-31",
      isDateDisabled: (date) => date.endsWith("-10"),
      defaultValue: stay,
    },
  ],
  [
    "with length limits",
    {
      minRangeDays: 2,
      maxRangeDays: 7,
      rangeSpansUnavailable: false,
      defaultValue: stay,
      defaultOpen: true,
    },
  ],
  [
    "translated digits",
    {
      formatNumber: (n) => String.fromCodePoint(0x660 + n),
      defaultValue: stay,
    },
  ],
  ["today as a bound", { min: "today", max: "2030-01-01", defaultValue: stay }],
  [
    "presets that ask for today",
    {
      defaultOpen: true,
      presets: [{ label: "Soon", value: (today: string) => [today, today] }],
    },
  ],
  [
    "a reason and a side",
    {
      defaultOpen: true,
      side: "top",
      align: "center",
      unavailableReason: (date: string) => (date.endsWith("-10") ? "Booked" : undefined),
    },
  ],
  ["full width", { defaultOpen: true, presentation: "full-width" }],
  [
    "a responsive presentation and months",
    {
      defaultOpen: true,
      presentation: { base: "full-width", sm: "anchored" },
      numberOfMonths: { base: 1, md: 3 },
    },
  ],
  ["by month", { granularity: "month", defaultValue: ["2026-03", "2026-06"], min: "today" }],
  ["by month, open", { granularity: "month", defaultOpen: true, rounded: true, presets: [{ label: "Year", value: ["2026-01", "2026-12"] }] }],
  ["rounded, open", { defaultOpen: true, rounded: true, defaultValue: stay }],
  ["by month, right to left", { granularity: "month", dir: "rtl", defaultOpen: true, format: "ymd" }],
  [
    "a today and a calendar option",
    {
      today: "2026-10-16",
      defaultOpen: true,
      calendarProps: { showWeekNumbers: true },
    },
  ],
];

describe("DateRangePicker on the server and in hydration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(variants)("renders %s without touching window or document", (_name, props) => {
    const html = onTheServer(() => renderToString(<DateRangePicker aria-label="Stay" {...props} />));
    expect(html).toContain('role="group"');
  });

  it.each(variants)("hydrates %s over its server HTML without a mismatch", async (_name, props) => {
    const markup = <DateRangePicker aria-label="Stay" {...props} />;
    const html = onTheServer(() => renderToString(markup));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await act(async () => {
      hydrateRoot(container, markup, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(screen.getByRole("group", { name: "Stay" })).toBeInTheDocument();
    container.remove();
  });
});
