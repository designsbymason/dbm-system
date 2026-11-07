import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import buttonStyles from "../../atoms/Button/Button.module.css";
import { Calendar } from "./Calendar";
import styles from "./Calendar.module.css";
import type { CalendarProps, CalendarRangeValue } from "./Calendar.types";
import { DirectionProvider } from "../../atoms/DirectionProvider";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// October 2026: the 1st is a Thursday, the 5th a Monday. `today` is fixed so nothing depends on the clock.
function renderCalendar(props: Partial<CalendarProps> = {}) {
  return render(<Calendar month="2026-10" today="2026-10-14" data-testid="calendar" {...(props as CalendarProps)} />);
}

/** A day's button, by its date. */
const day = (date: string): HTMLButtonElement => {
  const button = document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`);
  if (!button) throw new Error(`no day ${date} on show`);
  return button;
};
const cell = (date: string) => day(date).closest("td") as HTMLTableCellElement;
const heading = () => screen.getByRole("grid").getAttribute("aria-labelledby");
const title = () => document.getElementById(heading() ?? "")?.textContent;
const previous = () => screen.getByRole("button", { name: "Previous month" });
const next = () => screen.getByRole("button", { name: "Next month" });
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.date;

function focusDay(date: string) {
  act(() => day(date).focus());
}

describe("Calendar", () => {
  describe("structure", () => {
    it("is a group named Calendar around a grid named by the month and year", () => {
      renderCalendar();
      expect(screen.getByRole("group", { name: "Calendar" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    });

    it("draws six weeks of seven days, always, whichever the month", () => {
      renderCalendar();
      expect(within(screen.getByRole("grid")).getAllByRole("row")).toHaveLength(7); // headings + 6 weeks
      expect(document.querySelectorAll("button[data-date]")).toHaveLength(42);
      render(<Calendar month="2026-02" today="2026-02-01" />);
      expect(document.querySelectorAll("button[data-date]")).toHaveLength(84);
    });

    it("starts the first week on the weekStartsOn day and lists the month's days in order", () => {
      renderCalendar();
      const dates = [...document.querySelectorAll<HTMLElement>("button[data-date]")].map((b) => b.dataset.date);
      expect(dates[0]).toBe("2026-09-27");
      expect(dates[4]).toBe("2026-10-01");
      expect(dates[41]).toBe("2026-11-07");
    });

    it("names the columns with the full weekday and shows the short one", () => {
      renderCalendar();
      const headers = screen.getAllByRole("columnheader");
      expect(headers.map((header) => header.textContent)).toEqual([
        "SuSunday",
        "MoMonday",
        "TuTuesday",
        "WeWednesday",
        "ThThursday",
        "FrFriday",
        "SaSaturday",
      ]);
      expect(screen.getByRole("columnheader", { name: "Sunday" })).toBeInTheDocument();
    });

    it("puts the week's first day first", () => {
      renderCalendar({ weekStartsOn: 1 });
      expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Monday");
      expect(document.querySelector("button[data-date]")).toHaveAttribute("data-date", "2026-09-28");
      expect(screen.getAllByRole("columnheader")[6]).toHaveAccessibleName("Sunday");
    });

    it("dims the neighbouring months' days and can leave their cells empty", () => {
      renderCalendar();
      expect(day("2026-09-30")).toHaveClass(styles.outside ?? "");
      expect(day("2026-10-01")).not.toHaveClass(styles.outside ?? "");
      renderCalendar({ showOutsideDays: false });
      expect(document.querySelectorAll("button[data-date]").length).toBe(42 + 31);
      expect(document.querySelectorAll("td:empty").length).toBe(11);
    });

    it("forwards the ref to the outermost element and passes className, style, id and data-testid there", () => {
      const ref = createRef<HTMLDivElement>();
      renderCalendar({ ref, className: "mine", style: { marginBlock: "3px" }, id: "cal" } as Partial<CalendarProps>);
      const root = screen.getByTestId("calendar");
      expect(ref.current).toBe(root);
      expect(root).toHaveClass("mine");
      expect(root).toHaveStyle({ marginBlock: "3px" });
      expect(root).toHaveAttribute("id", "cal");
    });

    it("passes other native attributes to the outermost element, but never lets them replace the role", () => {
      renderCalendar({ title: "Pick a day", role: "presentation" } as Partial<CalendarProps>);
      const root = screen.getByTestId("calendar");
      expect(root).toHaveAttribute("title", "Pick a day");
      expect(root).toHaveAttribute("role", "group");
    });

    it("takes its name from aria-label or aria-labelledby", () => {
      renderCalendar({ "aria-label": "Departure" });
      expect(screen.getByRole("group", { name: "Departure" })).toBeInTheDocument();
    });

    it("names a day in full, with its weekday, and shows only its number", () => {
      renderCalendar();
      expect(day("2026-10-05")).toHaveAccessibleName("Monday, October 5, 2026");
      expect(day("2026-10-05")).toHaveTextContent("5");
      expect(day("2026-10-05").textContent).toBe("5");
    });
  });

  describe("choosing a date", () => {
    it("chooses a date on click and calls onValueChange with it", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith("2026-10-20");
    });

    it("marks the chosen date selected, and only that one", async () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "true");
      expect(cell("2026-10-07")).toHaveAttribute("aria-selected", "false");
      await userEvent.click(day("2026-10-07"));
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "false");
      expect(cell("2026-10-07")).toHaveAttribute("aria-selected", "true");
      expect(day("2026-10-07")).toHaveClass(styles.selected ?? "");
    });

    it("does not call onValueChange for the date already chosen", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ defaultValue: "2026-10-06", onValueChange });
      await userEvent.click(day("2026-10-06"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("chooses with Enter and with Space", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ onValueChange });
      focusDay("2026-10-08");
      await userEvent.keyboard("{Enter}");
      focusDay("2026-10-09");
      await userEvent.keyboard(" ");
      expect(onValueChange.mock.calls).toEqual([["2026-10-08"], ["2026-10-09"]]);
    });

    it("is controlled by value: it shows what it is given and changes only when told", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ value: "2026-10-06", onValueChange });
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-12");
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "true");
      expect(cell("2026-10-12")).toHaveAttribute("aria-selected", "false");
    });

    it("follows a controlled value held in state", async () => {
      function Controlled() {
        const [value, setValue] = useState("2026-10-06");
        return <Calendar month="2026-10" today="2026-10-14" value={value} onValueChange={setValue} />;
      }
      render(<Controlled />);
      await userEvent.click(day("2026-10-12"));
      expect(cell("2026-10-12")).toHaveAttribute("aria-selected", "true");
    });

    it("starts an uncontrolled calendar on defaultValue", () => {
      renderCalendar({ defaultValue: "2026-10-22" });
      expect(cell("2026-10-22")).toHaveAttribute("aria-selected", "true");
    });

    it("moves to the month of a neighbouring day that is chosen", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      await userEvent.click(day("2026-11-03"));
      expect(title()).toBe("November 2026");
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
      expect(cell("2026-11-03")).toHaveAttribute("aria-selected", "true");
    });

    it("reads a value that is not a real date as none, and says so in development", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ value: "2026-02-30" });
      expect(document.querySelector('[aria-selected="true"]')).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`value` must be a real date"));
    });

    it("warns when both value and defaultValue are given", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ value: "2026-10-06", defaultValue: "2026-10-07" });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("both `value` and `defaultValue`"));
    });
  });

  describe("unavailable dates", () => {
    it("rules out dates before min and after max", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ min: "2026-10-10", max: "2026-10-20", onValueChange });
      expect(cell("2026-10-09")).toHaveAttribute("aria-disabled", "true");
      expect(cell("2026-10-21")).toHaveAttribute("aria-disabled", "true");
      expect(cell("2026-10-10")).not.toHaveAttribute("aria-disabled");
      await userEvent.click(day("2026-10-09"));
      await userEvent.click(day("2026-10-21"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-10"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-10");
    });

    it("rules out dates the isDateDisabled rule names", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ isDateDisabled: (date) => date.endsWith("-13"), onValueChange });
      expect(cell("2026-10-13")).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(day("2026-10-13"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("keeps an unavailable date focusable, so the arrow keys never skip it", async () => {
      renderCalendar({ isDateDisabled: (date) => date === "2026-10-15", defaultValue: "2026-10-14" });
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-10-15");
      await userEvent.keyboard("{Enter}");
      expect(cell("2026-10-15")).toHaveAttribute("aria-selected", "false");
    });

    it("does not choose anything when disabled, and marks every date and both buttons unavailable", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ disabled: true, onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-20")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("grid")).toHaveAttribute("aria-disabled", "true");
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      expect(next()).toHaveAttribute("aria-disabled", "true");
      // Not natively disabled: still reachable.
      expect(previous()).not.toBeDisabled();
    });

    it("shows the choice but does not change it when readOnly, and still moves between months and dates", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ readOnly: true, defaultValue: "2026-10-06", onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
      focusDay("2026-10-06");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-10-07");
    });

    it("warns about a min after max, and a bad date, in development", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ min: "2026-10-20", max: "2026-10-10" });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`min` is after `max`"));
      renderCalendar({ min: "soon" });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`min` must be a real date"));
    });
  });

  describe("choosing a range", () => {
    const range = (props: Partial<CalendarProps> = {}) =>
      renderCalendar({ mode: "range", ...props } as Partial<CalendarProps>);

    it("takes the first choice as the start and the second as the end", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await userEvent.click(day("2026-10-08"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", ""]);
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", "2026-10-12"]);
      expect(onValueChange).toHaveBeenCalledTimes(2);
    });

    it("starts again on a third choice", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange, defaultValue: ["2026-10-08", "2026-10-12"] });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-20", ""]);
    });

    it("moves the start when the second choice is before it", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange, defaultValue: ["2026-10-12", ""] });
      await userEvent.click(day("2026-10-08"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", ""]);
    });

    it("lets a range be one day long", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange, defaultValue: ["2026-10-12", ""] });
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-12", "2026-10-12"]);
    });

    it("marks the ends and everything between them selected, and nothing outside", () => {
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      for (const date of ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"]) {
        expect(cell(date)).toHaveAttribute("aria-selected", "true");
      }
      expect(cell("2026-10-07")).toHaveAttribute("aria-selected", "false");
      expect(cell("2026-10-13")).toHaveAttribute("aria-selected", "false");
      expect(day("2026-10-08")).toHaveClass(styles.selected ?? "");
      expect(day("2026-10-12")).toHaveClass(styles.selected ?? "");
      expect(day("2026-10-10")).not.toHaveClass(styles.selected ?? "");
    });

    it("draws the strip behind the days between and half behind each end", () => {
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      expect(cell("2026-10-08")).toHaveClass(styles.bandStart ?? "");
      expect(cell("2026-10-10")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-12")).toHaveClass(styles.bandEnd ?? "");
      expect(cell("2026-10-13").className).not.toMatch(/band/);
    });

    it("names the ends of the range", () => {
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      expect(day("2026-10-08")).toHaveAccessibleName("Thursday, October 8, 2026, range start");
      expect(day("2026-10-12")).toHaveAccessibleName("Monday, October 12, 2026, range end");
    });

    it("previews the range up to the day the pointer is over, while the end is still to be chosen", async () => {
      range({ defaultValue: ["2026-10-08", ""] });
      await userEvent.hover(day("2026-10-11"));
      expect(cell("2026-10-10")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-11")).toHaveClass(styles.bandEnd ?? "");
      expect(day("2026-10-11")).toHaveClass(styles.previewEnd ?? "");
      // The preview is not a choice.
      expect(cell("2026-10-11")).toHaveAttribute("aria-selected", "false");
      await userEvent.unhover(day("2026-10-11"));
      expect(cell("2026-10-10").className).not.toMatch(/band/);
    });

    it("previews from the focused day for a keyboard user", () => {
      range({ defaultValue: ["2026-10-08", ""] });
      focusDay("2026-10-10");
      expect(cell("2026-10-09")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-10")).toHaveClass(styles.bandEnd ?? "");
    });

    it("is controlled by value", async () => {
      const onValueChange = vi.fn();
      range({ value: ["2026-10-08", "2026-10-12"] as CalendarRangeValue, onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-20", ""]);
      expect(cell("2026-10-10")).toHaveAttribute("aria-selected", "true");
    });

    it("runs across months", async () => {
      const onValueChange = vi.fn();
      render(<Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" onValueChange={onValueChange} />);
      await userEvent.click(day("2026-10-28"));
      await userEvent.click(next());
      await userEvent.click(day("2026-11-03"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-28", "2026-11-03"]);
      expect(cell("2026-11-01")).toHaveClass(styles.band ?? "");
    });
  });

  describe("moving between months", () => {
    it("steps with the previous and next buttons and reports the new month", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      await userEvent.click(next());
      expect(title()).toBe("November 2026");
      await userEvent.click(previous());
      await userEvent.click(previous());
      expect(title()).toBe("September 2026");
      expect(onMonthChange.mock.calls).toEqual([["2026-11"], ["2026-10"], ["2026-09"]]);
    });

    it("keeps keyboard focus on the month button, and on a field, after using it", async () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" captionLayout="dropdown" />);
      act(() => next().focus());
      await userEvent.keyboard("{Enter}");
      expect(title()).toBe("November 2026");
      expect(next()).toHaveFocus();
      await userEvent.keyboard(" ");
      expect(title()).toBe("December 2026");
      expect(next()).toHaveFocus();
      act(() => previous().focus());
      await userEvent.keyboard("{Enter}");
      expect(previous()).toHaveFocus();
      const field = screen.getByRole("combobox", { name: "Month" });
      act(() => field.focus());
      await userEvent.keyboard("{ArrowDown}{Enter}");
      expect(screen.getByRole("combobox", { name: "Month" })).toHaveFocus();
    });

    it("crosses a year", async () => {
      render(<Calendar defaultMonth="2026-12" today="2026-10-14" />);
      await userEvent.click(next());
      expect(title()).toBe("January 2027");
      for (let step = 0; step < 12; step += 1) await userEvent.click(previous());
      expect(title()).toBe("January 2026");
    });

    it("is controlled by month: it changes only when told", async () => {
      const onMonthChange = vi.fn();
      renderCalendar({ onMonthChange });
      await userEvent.click(next());
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
      expect(title()).toBe("October 2026");
    });

    it("starts on the chosen date's month, else today's", () => {
      render(<Calendar defaultValue="2027-03-09" today="2026-10-14" />);
      expect(title()).toBe("March 2027");
      render(<Calendar today="2026-10-14" />);
      expect(screen.getAllByRole("grid")[1]).toHaveAccessibleName("October 2026");
    });

    it("makes the previous button unavailable at the month holding min, and the next at max's, but keeps focus on it", async () => {
      renderCalendar({ min: "2026-10-03", max: "2026-10-28" });
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      expect(next()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(previous());
      expect(title()).toBe("October 2026");
      act(() => previous().focus());
      expect(previous()).toHaveFocus();
    });

    it("leaves the next button available while there are later months before max", () => {
      renderCalendar({ max: "2027-01-10" });
      expect(next()).not.toHaveAttribute("aria-disabled");
    });

    it("announces the new month, but not the first one", () => {
      vi.useFakeTimers();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" />);
      const status = screen.getByRole("status");
      // The announcement goes in a moment after it is asked for, so look just after that moment.
      act(() => vi.advanceTimersByTime(150));
      expect(status).toHaveTextContent("");
      fireEvent.click(next());
      act(() => vi.advanceTimersByTime(150));
      expect(status).toHaveTextContent("November 2026");
      act(() => vi.advanceTimersByTime(1200));
      expect(status).toHaveTextContent("");
    });

    it("stays quiet with announce={false}", () => {
      vi.useFakeTimers();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" announce={false} />);
      fireEvent.click(next());
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("warns about a month that is not YYYY-MM", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<Calendar month="2026-13" today="2026-10-14" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`month` must be a month"));
    });
  });

  describe("keyboard", () => {
    it("is one tab stop on the grid: the chosen date, else today, else the 1st", () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      const stops = [...document.querySelectorAll("button[data-date]")].filter((b) => b.getAttribute("tabindex") === "0");
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveAttribute("data-date", "2026-10-06");
    });

    it("lands on today with nothing chosen, and on the 1st in another month", () => {
      renderCalendar();
      expect(day("2026-10-14")).toHaveAttribute("tabindex", "0");
      render(<Calendar month="2027-01" today="2026-10-14" />);
      expect(screen.getAllByRole("grid")[1]?.querySelector("button[tabindex='0']")).toHaveAttribute("data-date", "2027-01-01");
    });

    it("goes previous month, next month, then the grid when tabbing, and out", async () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      await userEvent.tab();
      expect(previous()).toHaveFocus();
      await userEvent.tab();
      expect(next()).toHaveFocus();
      await userEvent.tab();
      expect(day("2026-10-06")).toHaveFocus();
      await userEvent.tab();
      expect(document.body).toHaveFocus();
    });

    it("moves by a day with the left and right arrows and by a week with up and down", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-10-15");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(focused()).toBe("2026-10-13");
      await userEvent.keyboard("{ArrowDown}");
      expect(focused()).toBe("2026-10-20");
      await userEvent.keyboard("{ArrowUp}{ArrowUp}");
      expect(focused()).toBe("2026-10-06");
    });

    it("keeps one tab stop on the date focus moved to", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowDown}");
      expect(day("2026-10-21")).toHaveAttribute("tabindex", "0");
      expect(day("2026-10-14")).toHaveAttribute("tabindex", "-1");
    });

    it("moves to the ends of the week with Home and End, by where the week starts", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("{Home}");
      expect(focused()).toBe("2026-10-11");
      await userEvent.keyboard("{End}");
      expect(focused()).toBe("2026-10-17");
    });

    it("finds the ends of a week that starts on Monday", async () => {
      renderCalendar({ weekStartsOn: 1 });
      focusDay("2026-10-14");
      await userEvent.keyboard("{Home}");
      expect(focused()).toBe("2026-10-12");
      await userEvent.keyboard("{End}");
      expect(focused()).toBe("2026-10-18");
    });

    it("changes month with Page Up and Page Down, keeping the day, and a year with Shift", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      focusDay("2026-10-14");
      await userEvent.keyboard("{PageDown}");
      expect(title()).toBe("November 2026");
      expect(focused()).toBe("2026-11-14");
      await userEvent.keyboard("{PageUp}{PageUp}");
      expect(focused()).toBe("2026-09-14");
      await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
      expect(title()).toBe("September 2027");
      expect(focused()).toBe("2027-09-14");
      expect(onMonthChange).toHaveBeenLastCalledWith("2027-09");
    });

    it("falls back to a month's last day when it has no such day", async () => {
      render(<Calendar defaultMonth="2026-01" today="2026-01-31" />);
      focusDay("2026-01-31");
      await userEvent.keyboard("{PageDown}");
      expect(focused()).toBe("2026-02-28");
    });

    it("carries focus into the next month when an arrow runs off the end, and shows it", async () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" />);
      focusDay("2026-10-31");
      await userEvent.keyboard("{ArrowRight}");
      expect(title()).toBe("November 2026");
      expect(focused()).toBe("2026-11-01");
      await userEvent.keyboard("{ArrowLeft}");
      expect(title()).toBe("October 2026");
      expect(focused()).toBe("2026-10-31");
    });

    it("never moves focus before min or after max", async () => {
      renderCalendar({ min: "2026-10-10", max: "2026-10-20" });
      focusDay("2026-10-11");
      await userEvent.keyboard("{ArrowUp}");
      expect(focused()).toBe("2026-10-10");
      await userEvent.keyboard("{PageUp}");
      expect(focused()).toBe("2026-10-10");
      focusDay("2026-10-19");
      await userEvent.keyboard("{ArrowDown}");
      expect(focused()).toBe("2026-10-20");
      expect(title()).toBe("October 2026");
    });

    it("swaps the left and right arrows under right-to-left, so they follow the picture", async () => {
      renderCalendar({ dir: "rtl" });
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowLeft}");
      expect(focused()).toBe("2026-10-15");
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      expect(focused()).toBe("2026-10-13");
      // Up and down are the same.
      await userEvent.keyboard("{ArrowDown}");
      expect(focused()).toBe("2026-10-20");
    });

    it("leaves keys it does not own alone", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("a");
      await userEvent.keyboard("{Control>}{ArrowRight}{/Control}");
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(focused()).toBe("2026-10-14");
    });

    it("focuses the date Tab would land on when autoFocus is set", () => {
      renderCalendar({ autoFocus: true, defaultValue: "2026-10-06" });
      expect(day("2026-10-06")).toHaveFocus();
    });
  });

  describe("today", () => {
    it("marks today with aria-current and names it", () => {
      renderCalendar();
      expect(day("2026-10-14")).toHaveAttribute("aria-current", "date");
      expect(day("2026-10-14")).toHaveAccessibleName("Wednesday, October 14, 2026, today");
      expect(day("2026-10-15")).not.toHaveAttribute("aria-current");
    });

    it("marks nothing when today is in another month", () => {
      renderCalendar({ today: "2026-12-25" });
      expect(document.querySelector("[aria-current]")).toBeNull();
    });

    it("reads the clock in the browser when today is not given", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 14, 12));
      render(<Calendar month="2026-10" />);
      expect(day("2026-10-14")).toHaveAttribute("aria-current", "date");
    });

    it("renders on the server with no today and no clock reading", () => {
      const html = renderToString(<Calendar defaultMonth="2026-10" />);
      expect(html).toContain("October 2026");
      expect(html).not.toContain("aria-current");
    });
  });

  describe("rounded", () => {
    it("is square-cornered by default, and rounds the days and both month buttons with rounded", () => {
      const { rerender } = renderCalendar();
      expect(screen.getByTestId("calendar")).not.toHaveClass(styles.rounded ?? "");
      expect(previous()).not.toHaveClass(buttonStyles.rounded ?? "");
      rerender(<Calendar month="2026-10" today="2026-10-14" rounded data-testid="calendar" />);
      expect(screen.getByTestId("calendar")).toHaveClass(styles.rounded ?? "");
      expect(previous()).toHaveClass(buttonStyles.rounded ?? "");
      expect(next()).toHaveClass(buttonStyles.rounded ?? "");
    });
  });

  describe("key", () => {
    const key = () => screen.queryByRole("list", { name: "Key" });
    const entries = () => within(key() as HTMLElement).queryAllByRole("listitem").map((item) => item.textContent);

    it("is not shown unless asked for", () => {
      renderCalendar();
      expect(key()).toBeNull();
    });

    it("explains only the looks that are on screen: today, and the chosen date once there is one", () => {
      const { rerender } = renderCalendar({ showLegend: true });
      expect(entries()).toEqual(["Today"]);
      rerender(<Calendar key="chosen" month="2026-10" today="2026-10-14" showLegend defaultValue="2026-10-06" />);
      expect(entries()).toEqual(["Today", "Selected"]);
    });

    it("follows the choice: a date chosen adds its entry, and a controlled value cleared takes it away", async () => {
      renderCalendar({ showLegend: true });
      expect(entries()).toEqual(["Today"]);
      await userEvent.click(day("2026-10-20"));
      expect(entries()).toEqual(["Today", "Selected"]);
      const { unmount } = render(<Calendar month="2026-10" today="2026-10-14" showLegend value="" aria-label="b" />);
      expect(within(screen.getAllByRole("list", { name: "Key" })[1] as HTMLElement).queryAllByRole("listitem")).toHaveLength(1);
      unmount();
    });

    it("adds the range once a range is started, and the unavailable look when anything can be unavailable", () => {
      const { rerender } = renderCalendar({ showLegend: true, mode: "range" } as Partial<CalendarProps>);
      expect(entries()).toEqual(["Today"]);
      rerender(<Calendar key="started" month="2026-10" today="2026-10-14" showLegend mode="range" defaultValue={["2026-10-06", ""]} />);
      expect(entries()).toEqual(["Today", "Selected", "In range"]);
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend min="2026-10-02" />);
      expect(entries()).toEqual(["Today", "Unavailable"]);
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend isDateDisabled={() => false} />);
      expect(entries()).toContain("Unavailable");
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend disabled />);
      expect(entries()).toContain("Unavailable");
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend max="2026-10-30" />);
      expect(entries()).toContain("Unavailable");
    });

    it("leaves today out until the clock is known, so a server render has no entry for it", () => {
      const html = renderToString(<Calendar defaultMonth="2026-10" showLegend defaultValue="2026-10-06" />);
      expect(html).toContain("Selected");
      expect(html).not.toContain("Today");
    });

    it("is a real list in Safari too, and its samples are plain shapes hidden from assistive technology", () => {
      renderCalendar({ showLegend: true, defaultValue: "2026-10-06" });
      expect(key()).toHaveAttribute("role", "list");
      for (const item of within(key() as HTMLElement).getAllByRole("listitem")) {
        expect(item).toHaveAttribute("role", "listitem");
        const sample = item.querySelector("[aria-hidden='true']");
        expect(sample).toBeInTheDocument();
        expect(sample?.textContent).toBe("");
      }
    });

    it("sits below the grid", () => {
      renderCalendar({ showLegend: true });
      const grid = screen.getByRole("grid");
      expect(grid.compareDocumentPosition(key() as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("uses the labels it is given, and keeps English for those left undefined", () => {
      renderCalendar({
        showLegend: true,
        defaultValue: "2026-10-06",
        labels: { legend: "Leyenda", legendToday: "Hoy", legendSelected: undefined },
      });
      const list = screen.getByRole("list", { name: "Leyenda" });
      expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Hoy", "Selected"]);
    });

    it("has no axe violations", async () => {
      const { container } = renderCalendar({
        showLegend: true,
        mode: "range",
        defaultValue: ["2026-10-06", "2026-10-09"],
        disabled: true,
      } as Partial<CalendarProps>);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("month and year fields", () => {
    const monthField = () => screen.getByRole("combobox", { name: "Month" });
    const yearField = () => screen.getByRole("combobox", { name: "Year" });
    const dropdown = (props: Partial<CalendarProps> = {}) =>
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" captionLayout="dropdown" {...(props as CalendarProps)} />);

    it("shows the month and the year as two named fields in place of the heading, keeping the grid's name", () => {
      dropdown();
      expect(monthField()).toHaveTextContent("October");
      expect(yearField()).toHaveTextContent("2026");
      expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    });

    it("goes previous, month, year, next, then the grid when tabbing", async () => {
      dropdown({ defaultValue: "2026-10-06" });
      await userEvent.tab();
      expect(previous()).toHaveFocus();
      await userEvent.tab();
      expect(monthField()).toHaveFocus();
      await userEvent.tab();
      expect(yearField()).toHaveFocus();
      await userEvent.tab();
      expect(next()).toHaveFocus();
      await userEvent.tab();
      expect(day("2026-10-06")).toHaveFocus();
    });

    it("changes the month and the year, and reports each", async () => {
      const onMonthChange = vi.fn();
      dropdown({ onMonthChange });
      await userEvent.click(monthField());
      await userEvent.click(await screen.findByRole("option", { name: "March" }));
      expect(title()).toBe("March 2026");
      expect(onMonthChange).toHaveBeenLastCalledWith("2026-03");
      await userEvent.click(yearField());
      await userEvent.click(await screen.findByRole("option", { name: "1999" }));
      expect(title()).toBe("March 1999");
      expect(onMonthChange).toHaveBeenLastCalledWith("1999-03");
    });

    it("follows the buttons and the keys: the fields show the month on show", async () => {
      dropdown();
      await userEvent.click(next());
      expect(monthField()).toHaveTextContent("November");
      focusDay("2026-11-30");
      await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
      expect(yearField()).toHaveTextContent("2027");
    });

    it("offers the hundred years before this one and the twenty after it, unless told otherwise", async () => {
      dropdown();
      await userEvent.click(yearField());
      const years = (await screen.findAllByRole("option")).map((option) => option.textContent);
      expect(years[0]).toBe("1926");
      expect(years[years.length - 1]).toBe("2046");
      expect(years).toHaveLength(121);
    });

    it("offers the years of yearRange, narrowed by min and max, and always the year on show", async () => {
      dropdown({ yearRange: [2000, 2030], min: "2010-05-01", max: "2020-01-01", defaultMonth: "2026-10" });
      await userEvent.click(yearField());
      const years = (await screen.findAllByRole("option")).map((option) => option.textContent);
      expect(years[0]).toBe("2010");
      expect(years[years.length - 1]).toBe("2026");
    });

    it("uses yearRange when min and max are not set", async () => {
      dropdown({ yearRange: [2024, 2028] });
      await userEvent.click(yearField());
      expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["2024", "2025", "2026", "2027", "2028"]);
    });

    it("rules out the months that min and max leave no day in", async () => {
      dropdown({ min: "2026-03-10", max: "2026-11-20" });
      await userEvent.click(monthField());
      expect(await screen.findByRole("option", { name: "February" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("option", { name: "March" })).not.toHaveAttribute("aria-disabled");
      expect(screen.getByRole("option", { name: "December" })).toHaveAttribute("aria-disabled", "true");
    });

    it("puts the full name and a short one in each month, the short one hidden from assistive technology", async () => {
      dropdown();
      expect(monthField().querySelector(`.${styles.monthShort}`)).toHaveAttribute("aria-hidden", "true");
      expect(monthField().querySelector(`.${styles.monthShort}`)).toHaveTextContent("Oct");
      expect(monthField().querySelector(`.${styles.monthFull}`)).toHaveTextContent("October");
      await userEvent.click(monthField());
      // The list's rows are named by the full name only.
      expect(await screen.findByRole("option", { name: "September" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Sep" })).toBeNull();
      expect(screen.getAllByRole("option")).toHaveLength(12);
    });

    it("takes the short names from labels.monthsShort, and uses the English ones for a list of the wrong length", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      dropdown({ labels: { monthsShort: ["en", "fe", "ma", "ab", "my", "jn", "jl", "ag", "se", "oc", "no", "di"] } });
      expect(monthField().querySelector(`.${styles.monthShort}`)).toHaveTextContent("oc");
      dropdown({ labels: { monthsShort: ["x"] } });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`labels.monthsShort` needs 12 entries"));
    });

    it("writes the years with formatNumber and names the fields from labels", async () => {
      const arabic = new Intl.NumberFormat("ar-EG", { useGrouping: false }).format;
      dropdown({ formatNumber: arabic, labels: { monthSelect: "Mes", yearSelect: "Año" } });
      expect(screen.getByRole("combobox", { name: "Año" })).toHaveTextContent(arabic(2026));
      expect(screen.getByRole("combobox", { name: "Mes" })).toBeInTheDocument();
    });

    it("announces the new month when a field changes it", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      dropdown();
      await userEvent.click(monthField());
      await userEvent.click(await screen.findByRole("option", { name: "May" }));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("May 2026");
    });

    it("gives the fields to the first month only when several are on show, and says so", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      dropdown({ numberOfMonths: 2 });
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("gives the fields to the first month only"));
    });

    it("keeps the label heading when the layout is label", () => {
      renderCalendar();
      expect(screen.queryByRole("combobox")).toBeNull();
    });

    it("has no axe violations", async () => {
      const { container } = dropdown({ defaultValue: "2026-10-06" });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("several months", () => {
    const two = (props: Partial<CalendarProps> = {}) =>
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" numberOfMonths={2} {...(props as CalendarProps)} />);

    it("draws a named grid for each month, side by side", () => {
      two();
      expect(screen.getAllByRole("grid").map((grid) => grid.getAttribute("aria-labelledby"))).toHaveLength(2);
      expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
      expect(document.querySelectorAll("button[data-date]")).toHaveLength(31 + 30);
    });

    it("leaves the neighbouring months' days out, so no date is drawn twice", () => {
      two();
      const dates = [...document.querySelectorAll<HTMLElement>("button[data-date]")].map((button) => button.dataset.date);
      expect(new Set(dates).size).toBe(dates.length);
      expect(dates).toHaveLength(31 + 30);
    });

    it("has the previous button before the first month and the next after the last, and no more", () => {
      two();
      expect(screen.getAllByRole("button", { name: "Previous month" })).toHaveLength(1);
      expect(screen.getAllByRole("button", { name: "Next month" })).toHaveLength(1);
    });

    it("steps the first month by one, and reports it", async () => {
      const onMonthChange = vi.fn();
      two({ onMonthChange });
      await userEvent.click(next());
      expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "December 2026" })).toBeInTheDocument();
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
    });

    it("is one tab stop for all the months", () => {
      two({ defaultValue: "2026-11-05" });
      const stops = [...document.querySelectorAll("button[data-date]")].filter((button) => button.getAttribute("tabindex") === "0");
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveAttribute("data-date", "2026-11-05");
    });

    it("moves focus from one month to the next without turning the page", async () => {
      const onMonthChange = vi.fn();
      two({ onMonthChange });
      focusDay("2026-10-31");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-11-01");
      expect(onMonthChange).not.toHaveBeenCalled();
    });

    it("turns the page when focus leaves the months on show, forward and back", async () => {
      two();
      focusDay("2026-11-30");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-12-01");
      expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "December 2026" })).toBeInTheDocument();
      expect(screen.queryByRole("grid", { name: "October 2026" })).toBeNull();
      focusDay("2026-11-01");
      await userEvent.keyboard("{PageUp}{PageUp}");
      expect(focused()).toBe("2026-09-01");
      expect(screen.getByRole("grid", { name: "September 2026" })).toBeInTheDocument();
    });

    it("draws the strip of a range across the months", async () => {
      two({ mode: "range", defaultValue: ["2026-10-28", "2026-11-03"] } as Partial<CalendarProps>);
      expect(cell("2026-10-31")).toHaveClass(styles.band ?? "");
      expect(cell("2026-11-01")).toHaveClass(styles.band ?? "");
      expect(cell("2026-11-03")).toHaveClass(styles.bandEnd ?? "");
    });

    it("previews a range into the second month from the pointer", async () => {
      two({ mode: "range", defaultValue: ["2026-10-28", ""] } as Partial<CalendarProps>);
      await userEvent.hover(day("2026-11-02"));
      expect(cell("2026-11-01")).toHaveClass(styles.band ?? "");
      expect(cell("2026-11-02")).toHaveClass(styles.bandEnd ?? "");
    });

    it("announces both months", () => {
      vi.useFakeTimers();
      two();
      fireEvent.click(next());
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("November 2026 – December 2026");
    });

    it("makes next unavailable when the last month on show holds max, and previous when the first holds min", () => {
      two({ max: "2026-11-30", min: "2026-10-01" });
      expect(next()).toHaveAttribute("aria-disabled", "true");
      expect(previous()).toHaveAttribute("aria-disabled", "true");
    });

    it("never shows months past December 9999", () => {
      render(<Calendar defaultMonth="9999-12" today="9999-12-01" numberOfMonths={2} />);
      expect(screen.getByRole("grid", { name: "November 9999" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "December 9999" })).toBeInTheDocument();
      expect(next()).toHaveAttribute("aria-disabled", "true");
    });

    it("uses one month for a number that is not a whole number of 1 to 4, and 4 at most, and says so", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" numberOfMonths={1.5} />);
      expect(screen.getAllByRole("grid")).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`numberOfMonths` must be a whole number from 1 to 4"));
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" numberOfMonths={9} />);
      expect(screen.getAllByRole("grid")).toHaveLength(1 + 4);
    });

    it("has no axe violations", async () => {
      const { container } = two({ mode: "range", defaultValue: ["2026-10-28", "2026-11-03"], showLegend: true } as Partial<CalendarProps>);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("footer", () => {
    const todayButton = () => screen.getByRole("button", { name: "Today" });
    const clearButton = () => screen.getByRole("button", { name: "Clear" });

    it("is not drawn unless something asks for it", () => {
      renderCalendar();
      expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    });

    it("goes to today's month and chooses today", async () => {
      const onValueChange = vi.fn();
      render(<Calendar defaultMonth="2027-03" today="2026-10-14" showTodayButton onValueChange={onValueChange} />);
      await userEvent.click(todayButton());
      expect(title()).toBe("October 2026");
      expect(onValueChange).toHaveBeenCalledWith("2026-10-14");
      expect(cell("2026-10-14")).toHaveAttribute("aria-selected", "true");
    });

    it("starts a range with today", async () => {
      const onValueChange = vi.fn();
      render(<Calendar mode="range" defaultMonth="2027-03" today="2026-10-14" showTodayButton onValueChange={onValueChange} />);
      await userEvent.click(todayButton());
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-14", ""]);
    });

    it("shows today's month but chooses nothing when today can't be chosen", async () => {
      const onValueChange = vi.fn();
      render(<Calendar defaultMonth="2027-03" today="2026-10-14" showTodayButton min="2026-11-01" onValueChange={onValueChange} />);
      await userEvent.click(todayButton());
      expect(title()).toBe("October 2026");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("is unavailable, but focusable, when the calendar is disabled", async () => {
      renderCalendar({ showTodayButton: true, disabled: true });
      expect(todayButton()).toHaveAttribute("aria-disabled", "true");
      expect(todayButton()).not.toBeDisabled();
    });

    it("keeps focus on the Today button after it is used", async () => {
      render(<Calendar defaultMonth="2027-03" today="2026-10-14" showTodayButton />);
      await userEvent.click(todayButton());
      expect(todayButton()).toHaveFocus();
    });

    it("clears a date, and a range, and keeps its place afterwards with focus on it", async () => {
      const onValueChange = vi.fn();
      const { unmount } = renderCalendar({ clearable: true, defaultValue: "2026-10-06", onValueChange });
      expect(clearButton()).not.toHaveAttribute("aria-disabled");
      await userEvent.click(clearButton());
      expect(onValueChange).toHaveBeenCalledWith("");
      expect(document.querySelector('[aria-selected="true"]')).toBeNull();
      expect(clearButton()).toHaveAttribute("aria-disabled", "true");
      expect(clearButton()).toHaveFocus();
      unmount();
      const onRangeChange = vi.fn();
      renderCalendar({ mode: "range", clearable: true, defaultValue: ["2026-10-06", "2026-10-09"], onValueChange: onRangeChange } as Partial<CalendarProps>);
      await userEvent.click(clearButton());
      expect(onRangeChange).toHaveBeenCalledWith(["", ""]);
    });

    it("is unavailable with nothing chosen, when read-only and when disabled", async () => {
      const onValueChange = vi.fn();
      const { rerender } = renderCalendar({ clearable: true, onValueChange });
      expect(clearButton()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(clearButton());
      expect(onValueChange).not.toHaveBeenCalled();
      rerender(<Calendar key="ro" month="2026-10" today="2026-10-14" clearable readOnly defaultValue="2026-10-06" onValueChange={onValueChange} />);
      expect(clearButton()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(clearButton());
      expect(onValueChange).not.toHaveBeenCalled();
      rerender(<Calendar key="dis" month="2026-10" today="2026-10-14" clearable disabled defaultValue="2026-10-06" />);
      expect(clearButton()).toHaveAttribute("aria-disabled", "true");
    });

    it("draws the footer of your own after the buttons, below the grid", () => {
      renderCalendar({
        showTodayButton: true,
        clearable: true,
        footer: <p data-testid="note">Times are local.</p>,
      });
      const note = screen.getByTestId("note");
      expect(screen.getByRole("grid").compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(todayButton().compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("takes its words from labels", () => {
      renderCalendar({ showTodayButton: true, clearable: true, labels: { todayButton: "Hoy", clearButton: "Borrar" } });
      expect(screen.getByRole("button", { name: "Hoy" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Borrar" })).toBeInTheDocument();
    });

    it("has no axe violations", async () => {
      const { container } = renderCalendar({ showTodayButton: true, clearable: true, footer: <p>Note</p> });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("markers", () => {
    it("draws a dot under a marked day, hidden from assistive technology, in the tone asked for", () => {
      renderCalendar({ getMarker: (date: string) => (date === "2026-10-20" ? { tone: "danger" } : undefined) });
      const dot = day("2026-10-20").querySelector("[aria-hidden='true'] > span");
      expect(dot).toHaveClass(styles.dot ?? "");
      expect(dot).toHaveClass(styles.dotDanger ?? "");
      expect(day("2026-10-21").querySelector("[aria-hidden='true']")).toBeNull();
    });

    it("uses the brand tone when none is given, and ignores a day it returns nothing or false for", () => {
      renderCalendar({ getMarker: (date: string) => (date === "2026-10-20" ? {} : date === "2026-10-21" ? false : date === "2026-10-22" ? null : undefined) });
      expect(day("2026-10-20").querySelector(`.${styles.dotBrand}`)).toBeInTheDocument();
      for (const date of ["2026-10-21", "2026-10-22", "2026-10-23"]) expect(day(date).querySelector(`.${styles.dot}`)).toBeNull();
    });

    it("adds the marker's label to the day's accessible name", () => {
      renderCalendar({ getMarker: (date: string) => (date === "2026-10-20" ? { tone: "info", label: "2 events" } : undefined) });
      expect(day("2026-10-20")).toHaveAccessibleName("Tuesday, October 20, 2026, 2 events");
    });

    it("draws content of your own instead of the dot, still hidden, and puts every number at the top", () => {
      renderCalendar({ getMarker: (date: string) => (date === "2026-10-20" ? { content: <span data-testid="price">$80</span>, label: "$80" } : undefined) });
      expect(screen.getByTestId("price")).toBeInTheDocument();
      expect(screen.getByTestId("price").closest("[aria-hidden='true']")).toBeInTheDocument();
      expect(day("2026-10-20").querySelector(`.${styles.dot}`)).toBeNull();
      expect(screen.getByTestId("calendar")).toHaveClass(styles.contentMarkers ?? "");
    });

    it("opens the name with the number and the label when the marker shows text, so what is on screen is in the name in order", () => {
      renderCalendar({ getMarker: (date: string) => (date === "2026-10-20" ? { content: <span>$80</span>, label: "$80" } : undefined) });
      expect(day("2026-10-20")).toHaveAccessibleName("20 $80, Tuesday, October 20, 2026");
      // a day with no marker, or only a dot, is named as before
      expect(day("2026-10-21")).toHaveAccessibleName("Wednesday, October 21, 2026");
    });

    it("leaves the numbers centred when the markers are only dots", () => {
      renderCalendar({ getMarker: (date: string) => (date === "2026-10-20" ? { tone: "info" } : undefined) });
      expect(screen.getByTestId("calendar")).not.toHaveClass(styles.contentMarkers ?? "");
    });

    it("keeps the number as the day's visible text", () => {
      renderCalendar({ getMarker: () => ({ content: <span>$80</span> }) });
      expect(day("2026-10-20")).toHaveTextContent("20");
    });

    it("marks days that are only a neighbouring month's", () => {
      renderCalendar({ getMarker: () => ({ tone: "info" }) });
      expect(day("2026-09-30").querySelector(`.${styles.dot}`)).toBeInTheDocument();
    });

    it("has no axe violations", async () => {
      const { container } = renderCalendar({
        defaultValue: "2026-10-20",
        getMarker: (date: string) => (date === "2026-10-20" || date === "2026-10-21" ? { tone: "success", label: "Booked" } : undefined),
      });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("range limits", () => {
    const range = (props: Partial<CalendarProps> = {}) =>
      renderCalendar({ mode: "range", ...props } as Partial<CalendarProps>);
    const isUnavailable = (date: string) => cell(date).getAttribute("aria-disabled") === "true";

    it("rules out ends that would make the range shorter than minRangeDays, counting both ends", async () => {
      const onValueChange = vi.fn();
      range({ minRangeDays: 3, defaultValue: ["2026-10-10", ""], onValueChange });
      expect(isUnavailable("2026-10-10")).toBe(true);
      expect(isUnavailable("2026-10-11")).toBe(true);
      expect(isUnavailable("2026-10-12")).toBe(false);
      await userEvent.click(day("2026-10-11"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-10", "2026-10-12"]);
    });

    it("rules out ends that would make the range longer than maxRangeDays", async () => {
      const onValueChange = vi.fn();
      range({ maxRangeDays: 5, defaultValue: ["2026-10-10", ""], onValueChange });
      expect(isUnavailable("2026-10-14")).toBe(false);
      expect(isUnavailable("2026-10-15")).toBe(true);
      await userEvent.click(day("2026-10-15"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-14"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-10", "2026-10-14"]);
    });

    it("lets a date before the start restart the range, whatever the limits", async () => {
      const onValueChange = vi.fn();
      range({ minRangeDays: 3, maxRangeDays: 4, defaultValue: ["2026-10-10", ""], onValueChange });
      expect(isUnavailable("2026-10-05")).toBe(false);
      await userEvent.click(day("2026-10-05"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-05", ""]);
    });

    it("applies the limits only while the end is being chosen", () => {
      range({ minRangeDays: 3, defaultValue: ["2026-10-10", "2026-10-14"] });
      expect(isUnavailable("2026-10-11")).toBe(false);
    });

    it("lets a range run over an unavailable date by default", async () => {
      const onValueChange = vi.fn();
      range({ isDateDisabled: (date: string) => date === "2026-10-15", defaultValue: ["2026-10-10", ""], onValueChange });
      expect(isUnavailable("2026-10-20")).toBe(false);
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-10", "2026-10-20"]);
    });

    it("rules out everything after the first unavailable date with rangeSpansUnavailable false", async () => {
      const onValueChange = vi.fn();
      range({ rangeSpansUnavailable: false, isDateDisabled: (date: string) => date === "2026-10-15", defaultValue: ["2026-10-10", ""], onValueChange });
      expect(isUnavailable("2026-10-14")).toBe(false);
      expect(isUnavailable("2026-10-15")).toBe(true);
      expect(isUnavailable("2026-10-16")).toBe(true);
      expect(isUnavailable("2026-10-31")).toBe(true);
      expect(isUnavailable("2026-10-05")).toBe(false);
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-14"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-10", "2026-10-14"]);
    });

    it("lets a start after the unavailable date reach as far as the calendar goes", () => {
      range({ rangeSpansUnavailable: false, isDateDisabled: (date: string) => date === "2026-10-15", defaultValue: ["2026-10-16", ""] });
      expect(isUnavailable("2026-10-31")).toBe(false);
    });

    it("combines the limits with the unavailable date", () => {
      range({ rangeSpansUnavailable: false, maxRangeDays: 10, minRangeDays: 2, isDateDisabled: (date: string) => date === "2026-10-15", defaultValue: ["2026-10-10", ""] });
      expect(isUnavailable("2026-10-10")).toBe(true);
      expect(isUnavailable("2026-10-11")).toBe(false);
      expect(isUnavailable("2026-10-14")).toBe(false);
      expect(isUnavailable("2026-10-15")).toBe(true);
    });

    it("has no effect in single mode", () => {
      renderCalendar({ minRangeDays: 5, maxRangeDays: 5, rangeSpansUnavailable: false, defaultValue: "2026-10-10" });
      expect(isUnavailable("2026-10-11")).toBe(false);
    });

    it("is listed in the key as an unavailable look", () => {
      range({ minRangeDays: 3, showLegend: true });
      expect(screen.getByRole("list", { name: "Key" })).toHaveTextContent("Unavailable");
    });

    it("warns about a limit that is not a whole number of days, and about max below min", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      range({ maxRangeDays: 0 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`maxRangeDays` must be a whole number of at least 1"));
      range({ minRangeDays: 5, maxRangeDays: 3 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`maxRangeDays` is less than `minRangeDays`"));
    });
  });

  describe("several dates", () => {
    const multiple = (props: Partial<CalendarProps> = {}) =>
      renderCalendar({ mode: "multiple", ...props } as Partial<CalendarProps>);
    const selectedDates = () =>
      [...document.querySelectorAll("td[aria-selected='true'] button")].map((button) => (button as HTMLElement).dataset.date);

    it("adds a date when it is chosen and takes it away when it is chosen again", async () => {
      const onValueChange = vi.fn();
      multiple({ onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-20"]);
      await userEvent.click(day("2026-10-08"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", "2026-10-20"]);
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08"]);
      expect(selectedDates()).toEqual(["2026-10-08"]);
    });

    it("starts from defaultValue and marks every chosen date, however it is ordered", () => {
      multiple({ defaultValue: ["2026-10-20", "2026-10-03", "2026-10-11"] });
      expect(selectedDates()).toEqual(["2026-10-03", "2026-10-11", "2026-10-20"]);
      expect(day("2026-10-03")).toHaveClass(styles.selected ?? "");
    });

    it("is controlled by value", async () => {
      const onValueChange = vi.fn();
      multiple({ value: ["2026-10-03"], onValueChange });
      await userEvent.click(day("2026-10-04"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-03", "2026-10-04"]);
      expect(selectedDates()).toEqual(["2026-10-03"]);
    });

    it("chooses with Enter and Space and takes away with the same keys", async () => {
      const onValueChange = vi.fn();
      multiple({ onValueChange });
      focusDay("2026-10-08");
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");
      expect(onValueChange.mock.calls).toEqual([[["2026-10-08"]], [[]]]);
    });

    it("stops adding once maxSelected are chosen, and still lets a chosen one be taken away", async () => {
      const onValueChange = vi.fn();
      multiple({ maxSelected: 2, defaultValue: ["2026-10-03", "2026-10-04"], onValueChange });
      expect(cell("2026-10-05")).toHaveAttribute("aria-disabled", "true");
      expect(cell("2026-10-03")).not.toHaveAttribute("aria-disabled");
      await userEvent.click(day("2026-10-05"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-03"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-04"]);
      expect(cell("2026-10-05")).not.toHaveAttribute("aria-disabled");
    });

    it("counts each date once, and leaves out dates that are not real, with a warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      multiple({ value: ["2026-10-03", "2026-10-03", "2026-02-30"] });
      expect(selectedDates()).toEqual(["2026-10-03"]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("same date more than once"));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("must be a real date"));
    });

    it("warns about a maxSelected that is not a whole number of at least 1", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      multiple({ maxSelected: 0 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`maxSelected` must be a whole number of at least 1"));
    });

    it("is one tab stop, on the first date chosen", () => {
      multiple({ defaultValue: ["2026-10-20", "2026-10-03"] });
      const stops = [...document.querySelectorAll("button[data-date]")].filter((button) => button.getAttribute("tabindex") === "0");
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveAttribute("data-date", "2026-10-03");
    });

    it("adds today with the Today button, and does not take it away when it is already chosen", async () => {
      const onValueChange = vi.fn();
      multiple({ showTodayButton: true, defaultValue: ["2026-10-03"], onValueChange });
      await userEvent.click(screen.getByRole("button", { name: "Today" }));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-03", "2026-10-14"]);
      await userEvent.click(screen.getByRole("button", { name: "Today" }));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(selectedDates()).toContain("2026-10-14");
    });

    it("clears every date with Clear", async () => {
      const onValueChange = vi.fn();
      multiple({ clearable: true, defaultValue: ["2026-10-03", "2026-10-04"], onValueChange });
      await userEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(onValueChange).toHaveBeenCalledWith([]);
      expect(selectedDates()).toEqual([]);
    });

    it("does not change when read-only or disabled", async () => {
      const onValueChange = vi.fn();
      const { rerender } = multiple({ readOnly: true, onValueChange });
      await userEvent.click(day("2026-10-20"));
      rerender(<Calendar mode="multiple" month="2026-10" today="2026-10-14" disabled onValueChange={onValueChange} />);
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("announces how many dates are chosen", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      multiple();
      await userEvent.click(day("2026-10-20"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("1 date selected");
      await userEvent.click(day("2026-10-21"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("2 dates selected");
    });

    it("is listed in the key as selected once there is a date", () => {
      multiple({ showLegend: true, defaultValue: ["2026-10-03"] });
      expect(screen.getByRole("list", { name: "Key" })).toHaveTextContent("Selected");
    });

    it("has no axe violations", async () => {
      const { container } = multiple({ defaultValue: ["2026-10-03", "2026-10-09"], maxSelected: 3 });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("submitting with a form", () => {
    const inputs = () => [...document.querySelectorAll<HTMLInputElement>("input[type='hidden']")].map((input) => [input.name, input.value]);

    it("submits nothing without a name", () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      expect(inputs()).toEqual([]);
    });

    it("submits a single date as its name, an empty string when none is chosen", async () => {
      const { unmount } = renderCalendar({ name: "arrival" });
      expect(inputs()).toEqual([["arrival", ""]]);
      unmount();
      renderCalendar({ name: "arrival", defaultValue: "2026-10-06" });
      expect(inputs()).toEqual([["arrival", "2026-10-06"]]);
    });

    it("follows the choice", async () => {
      renderCalendar({ name: "arrival" });
      await userEvent.click(day("2026-10-20"));
      expect(inputs()).toEqual([["arrival", "2026-10-20"]]);
    });

    it("submits a range as two values under name[], an empty end while it is open", async () => {
      renderCalendar({ name: "stay", mode: "range", defaultValue: ["2026-10-06", "2026-10-09"] } as Partial<CalendarProps>);
      expect(inputs()).toEqual([["stay[]", "2026-10-06"], ["stay[]", "2026-10-09"]]);
      await userEvent.click(day("2026-10-20"));
      expect(inputs()).toEqual([["stay[]", "2026-10-20"], ["stay[]", ""]]);
    });

    it("submits several dates as one name[] each, and none when none is chosen", async () => {
      renderCalendar({ name: "days", mode: "multiple", defaultValue: ["2026-10-09", "2026-10-06"] } as Partial<CalendarProps>);
      expect(inputs()).toEqual([["days[]", "2026-10-06"], ["days[]", "2026-10-09"]]);
      await userEvent.click(day("2026-10-06"));
      await userEvent.click(day("2026-10-09"));
      expect(inputs()).toEqual([]);
    });

    it("reaches a surrounding form's data, and nothing when the calendar is disabled", () => {
      render(
        <form data-testid="form">
          <Calendar name="arrival" month="2026-10" today="2026-10-14" defaultValue="2026-10-06" />
          <Calendar name="off" month="2026-10" today="2026-10-14" defaultValue="2026-10-07" disabled />
        </form>,
      );
      const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
      expect([...data.entries()]).toEqual([["arrival", "2026-10-06"]]);
    });
  });

  describe("week numbers", () => {
    it("adds no column unless asked", () => {
      renderCalendar();
      expect(screen.queryByRole("rowheader")).toBeNull();
      expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    });

    it("adds a column of ISO week numbers, named, taken from each row's Thursday", () => {
      renderCalendar({ showWeekNumbers: true });
      expect(screen.getAllByRole("columnheader")).toHaveLength(8);
      expect(screen.getByRole("columnheader", { name: "Week number" })).toHaveTextContent("Wk");
      const rows = screen.getAllByRole("rowheader");
      expect(rows.map((row) => row.textContent)).toEqual(["40", "41", "42", "43", "44", "45"]);
      expect(rows[1]).toHaveAccessibleName("Week 41");
    });

    it("takes the same weeks when the week starts on Monday", () => {
      renderCalendar({ showWeekNumbers: true, weekStartsOn: 1 });
      expect(screen.getAllByRole("rowheader").map((row) => row.textContent)).toEqual(["40", "41", "42", "43", "44", "45"]);
    });

    it("takes a row's number from its Thursday, whichever day the rows start on", () => {
      // A row from Wednesday to Tuesday runs into the next ISO week on its Monday; its Thursday is in the first.
      renderCalendar({ showWeekNumbers: true, weekStartsOn: 3 });
      expect(screen.getAllByRole("rowheader").map((row) => row.textContent)).toEqual(["40", "41", "42", "43", "44", "45"]);
    });

    it("counts the week that holds the new year's first Thursday as week 1, and the last week of a year as 52 or 53", () => {
      render(<Calendar month="2026-12" today="2026-12-14" showWeekNumbers weekStartsOn={1} />);
      expect(screen.getAllByRole("rowheader").map((row) => row.textContent)).toEqual(["49", "50", "51", "52", "53", "1"]);
    });

    it("writes them with formatNumber and names them from labels", () => {
      const arabic = new Intl.NumberFormat("ar-EG").format;
      renderCalendar({ showWeekNumbers: true, formatNumber: arabic, labels: { weekNumberShort: "أ", weekNumberColumn: "رقم الأسبوع", weekNumber: (week: number) => `أسبوع ${arabic(week)}` } });
      expect(screen.getAllByRole("rowheader")[1]).toHaveTextContent(arabic(41));
      expect(screen.getAllByRole("rowheader")[1]).toHaveAccessibleName(`أسبوع ${arabic(41)}`);
      expect(screen.getByRole("columnheader", { name: "رقم الأسبوع" })).toBeInTheDocument();
    });

    it("leaves the number off a row with no day in it", () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" numberOfMonths={2} showWeekNumbers />);
      const [october] = screen.getAllByRole("grid");
      const numbers = [...(october as HTMLElement).querySelectorAll("tbody tr")].map((row) => row.firstElementChild?.textContent);
      // October 2026's last row (1 to 7 November) is empty when the neighbouring days are left out.
      expect(numbers).toEqual(["40", "41", "42", "43", "44", ""]);
    });

    it("gives each month its own column, and keeps the days the only tab stop", () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" numberOfMonths={2} showWeekNumbers />);
      expect(screen.getAllByRole("columnheader", { name: "Week number" })).toHaveLength(2);
      const stops = [...document.querySelectorAll("button[data-date]")].filter((button) => button.getAttribute("tabindex") === "0");
      expect(stops).toHaveLength(1);
    });

    it("has no axe violations", async () => {
      const { container } = renderCalendar({ showWeekNumbers: true, defaultValue: "2026-10-06" });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("fixed weeks", () => {
    const rows = () => document.querySelectorAll("tbody tr").length;

    it("draws six rows for every month by default", () => {
      renderCalendar();
      expect(rows()).toBe(6);
      render(<Calendar month="2026-02" today="2026-02-01" />);
      expect(document.querySelectorAll("tbody tr").length).toBe(6 + 6);
    });

    it("draws only the rows a month needs without them", () => {
      render(<Calendar month="2026-02" today="2026-02-01" fixedWeeks={false} />);
      expect(rows()).toBe(4);
    });

    it.each([
      ["2026-10", 5],
      ["2026-08", 6],
      ["2026-02", 4],
      ["2027-05", 6],
    ])("draws the rows %s needs: %i", (monthKey, expected) => {
      render(<Calendar month={monthKey} today={`${monthKey}-01`} fixedWeeks={false} />);
      expect(rows()).toBe(expected);
    });

    it("keeps the neighbouring days in the rows it draws", () => {
      renderCalendar({ fixedWeeks: false });
      expect(document.querySelector('button[data-date="2026-09-27"]')).toBeInTheDocument();
      expect(document.querySelector('button[data-date="2026-11-01"]')).toBeNull();
    });

    it("draws each month of several by its own rows", () => {
      render(<Calendar defaultMonth="2026-02" today="2026-02-01" numberOfMonths={2} fixedWeeks={false} />);
      const [february, march] = screen.getAllByRole("grid").map((grid) => grid.querySelectorAll("tbody tr").length);
      expect([february, march]).toEqual([4, 5]);
    });
  });

  describe("the strip of a range at the ends of a row", () => {
    it("marks the first and last day of each row, for the strip to be rounded there", () => {
      renderCalendar();
      expect(cell("2026-10-04")).toHaveClass(styles.rowFirst ?? "");
      expect(cell("2026-10-10")).toHaveClass(styles.rowLast ?? "");
      expect(cell("2026-10-07").className).not.toMatch(/row(First|Last)/);
    });

    it("marks them whatever day the week starts on", () => {
      renderCalendar({ weekStartsOn: 1 });
      expect(cell("2026-10-05")).toHaveClass(styles.rowFirst ?? "");
      expect(cell("2026-10-11")).toHaveClass(styles.rowLast ?? "");
    });
  });

  describe("moving between months with motion", () => {
    const months = () => screen.getByTestId("calendar").querySelector(`.${styles.months}`) as HTMLElement;

    it("starts no animation when the months are first drawn", () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" data-testid="calendar" />);
      expect(months()).not.toHaveAttribute("data-motion");
    });

    it("starts one when the month changes, forward for the next month and not for the previous", async () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" data-testid="calendar" />);
      await userEvent.click(next());
      expect(months()).toHaveAttribute("data-motion");
      expect(months()).toHaveAttribute("data-forward");
      await userEvent.click(previous());
      expect(months()).not.toHaveAttribute("data-forward");
    });

    it("swaps between two animations, so each change starts afresh", async () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" data-testid="calendar" />);
      await userEvent.click(next());
      const first = months().getAttribute("data-motion");
      await userEvent.click(next());
      const second = months().getAttribute("data-motion");
      expect([first, second].sort()).toEqual(["a", "b"]);
    });

    it("starts none with animated off", async () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" animated={false} data-testid="calendar" />);
      await userEvent.click(next());
      expect(months()).not.toHaveAttribute("data-motion");
    });

    it("animates a month the keys or a controlled month change turns to", async () => {
      const { rerender } = render(<Calendar month="2026-10" today="2026-10-14" data-testid="calendar" />);
      rerender(<Calendar month="2027-01" today="2026-10-14" data-testid="calendar" />);
      expect(months()).toHaveAttribute("data-motion");
      expect(months()).toHaveAttribute("data-forward");
    });
  });

  describe("announcing a choice", () => {
    const range = (props: Partial<CalendarProps> = {}) => renderCalendar({ mode: "range", ...props } as Partial<CalendarProps>);

    it("announces the start of a range and then the range", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      range();
      await userEvent.click(day("2026-10-08"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Range start Thursday, October 8, 2026");
      act(() => vi.advanceTimersByTime(1300));
      await userEvent.click(day("2026-10-12"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Range Thursday, October 8, 2026 to Monday, October 12, 2026");
    });

    it("announces a restarted range as a start again", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      await userEvent.click(day("2026-10-20"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Range start Tuesday, October 20, 2026");
    });

    it("uses the labels it is given", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      range({ labels: { rangeStartChosen: (name: string) => `Inicio: ${name}`, rangeChosen: (a: string, b: string) => `${a} → ${b}` } });
      await userEvent.click(day("2026-10-08"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Inicio: Thursday, October 8, 2026");
    });

    it("keeps English for a label left undefined", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      range({ labels: { rangeStartChosen: undefined } });
      await userEvent.click(day("2026-10-08"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Range start Thursday, October 8, 2026");
    });

    it("is quiet with announce off, and says nothing for a single date", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { unmount } = range({ announce: false });
      await userEvent.click(day("2026-10-08"));
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByRole("status")).toHaveTextContent("");
      unmount();
      renderCalendar();
      await userEvent.click(day("2026-10-08"));
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByRole("status")).toHaveTextContent("");
    });
  });

  describe("dragging across days", () => {
    const range = (props: Partial<CalendarProps> = {}) => renderCalendar({ mode: "range", ...props } as Partial<CalendarProps>);
    const drag = (from: string, to: string) =>
      userEvent.pointer([{ keys: "[MouseLeft>]", target: day(from) }, { target: day(to) }, { keys: "[/MouseLeft]", target: day(to) }]);

    it("chooses the range from where the press started to where it is let go", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await drag("2026-10-08", "2026-10-12");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-08", "2026-10-12"]);
    });

    it("orders the two ends when dragged backwards", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await drag("2026-10-12", "2026-10-08");
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-08", "2026-10-12"]);
    });

    it("treats a press and release on one day as an ordinary click", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { keys: "[/MouseLeft]", target: day("2026-10-08") }]);
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-08", ""]);
    });

    it("draws the range as it is dragged", async () => {
      range();
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: day("2026-10-11") }]);
      expect(cell("2026-10-09")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-11")).toHaveClass(styles.bandEnd ?? "");
      expect(day("2026-10-08")).toHaveClass(styles.selected ?? "");
      await userEvent.pointer({ keys: "[/MouseLeft]", target: day("2026-10-11") });
    });

    it("draws a range dragged backwards from its first day", async () => {
      range();
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-12") }, { target: day("2026-10-09") }]);
      expect(cell("2026-10-09")).toHaveClass(styles.bandStart ?? "");
      expect(cell("2026-10-10")).toHaveClass(styles.band ?? "");
      await userEvent.pointer({ keys: "[/MouseLeft]", target: day("2026-10-09") });
    });

    it("chooses nothing when the range is one the rules refuse: too short, too long, or over an unavailable date", async () => {
      const onValueChange = vi.fn();
      const { unmount } = range({ minRangeDays: 4, onValueChange });
      await drag("2026-10-08", "2026-10-10");
      unmount();
      const { unmount: unmountLong } = range({ maxRangeDays: 3, onValueChange });
      await drag("2026-10-08", "2026-10-12");
      unmountLong();
      range({ rangeSpansUnavailable: false, isDateDisabled: (date: string) => date === "2026-10-10", onValueChange });
      await drag("2026-10-08", "2026-10-12");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("accepts a range that meets the rules", async () => {
      const onValueChange = vi.fn();
      range({ minRangeDays: 3, maxRangeDays: 5, onValueChange });
      await drag("2026-10-08", "2026-10-11");
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-08", "2026-10-11"]);
    });

    it("does not start from an unavailable day, and not when read-only", async () => {
      const onValueChange = vi.fn();
      const { unmount } = range({ min: "2026-10-10", onValueChange });
      await drag("2026-10-08", "2026-10-12");
      unmount();
      range({ readOnly: true, onValueChange });
      await drag("2026-10-08", "2026-10-12");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("ends where the pointer is let go, outside the calendar too, choosing nothing there", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: document.body }, { keys: "[/MouseLeft]", target: document.body }]);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-09").className).not.toMatch(/band/);
    });

    it("chooses nothing when the drag is cancelled", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: day("2026-10-12") }]);
      fireEvent.pointerCancel(day("2026-10-12"), { pointerType: "mouse" });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-10").className).not.toMatch(/band/);
    });

    it("chooses nothing when the calendar turned read-only during the drag", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = range({ onValueChange });
      await user.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: day("2026-10-12") }]);
      rerender(<Calendar mode="range" month="2026-10" today="2026-10-14" readOnly onValueChange={onValueChange} data-testid="calendar" />);
      await user.pointer({ keys: "[/MouseLeft]", target: day("2026-10-12") });
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("does choose the range when the same gesture is let go with the calendar still editable", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      range({ onValueChange });
      await user.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: day("2026-10-12") }]);
      await user.pointer({ keys: "[/MouseLeft]", target: day("2026-10-12") });
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-08", "2026-10-12"]);
    });

    it("draws no range while a drag that started on an unavailable day goes on", async () => {
      range({ isDateDisabled: (date: string) => date === "2026-10-08" });
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: day("2026-10-12") }]);
      expect(cell("2026-10-10").className).not.toMatch(/band/);
      await userEvent.pointer({ keys: "[/MouseLeft]", target: day("2026-10-12") });
    });

    it("does not drag with a pen or a finger, only a mouse", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      for (const pointerType of ["pen", "touch"]) {
        fireEvent.pointerDown(day("2026-10-08"), { pointerType, button: 0, isPrimary: true });
        fireEvent.pointerEnter(day("2026-10-12"), { pointerType });
        fireEvent.pointerUp(day("2026-10-12"), { pointerType });
      }
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-10").className).not.toMatch(/band/);
    });

    it("leaves nothing listening when the calendar goes away mid-drag", async () => {
      const onValueChange = vi.fn();
      const removed = vi.spyOn(window, "removeEventListener");
      const { unmount } = range({ onValueChange });
      await userEvent.pointer([{ keys: "[MouseLeft>]", target: day("2026-10-08") }, { target: day("2026-10-12") }]);
      unmount();
      expect(removed).toHaveBeenCalledWith("pointerup", expect.any(Function));
      expect(removed).toHaveBeenCalledWith("pointercancel", expect.any(Function));
      fireEvent.pointerUp(document.body, { pointerType: "mouse" });
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("does not drag in single or multiple mode", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ onValueChange });
      await drag("2026-10-08", "2026-10-12");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("moves the calendar to the month the drag ends in", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      await drag("2026-10-28", "2026-11-03");
      // Neighbouring days are drawn, so the end is a real day on show.
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
    });
  });

  describe("swiping on a touch screen", () => {
    const touch = (target: Element, type: "pointerDown" | "pointerUp", x: number, y = 100) =>
      fireEvent[type](target, { pointerType: "touch", clientX: x, clientY: y, pointerId: 7 });
    const swipe = (from: number, to: number, fromY = 100, toY = 100) => {
      const grid = screen.getByRole("grid");
      touch(grid.querySelector("button")!, "pointerDown", from, fromY);
      touch(grid.querySelector("button")!, "pointerUp", to, toY);
    };
    const swipable = () => render(<Calendar defaultMonth="2026-10" today="2026-10-14" />);

    it("turns to the next month on a swipe to the left, and back on a swipe to the right", () => {
      swipable();
      swipe(250, 150);
      expect(title()).toBe("November 2026");
      swipe(150, 250);
      expect(title()).toBe("October 2026");
    });

    it("ignores a short swipe and one that goes mostly up or down", () => {
      swipable();
      swipe(200, 170);
      swipe(250, 150, 100, 260);
      expect(title()).toBe("October 2026");
    });

    it("goes the other way in right-to-left text", () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" dir="rtl" />);
      swipe(250, 150);
      expect(title()).toBe("September 2026");
    });

    it("goes the other way when a DirectionProvider says right to left", () => {
      render(<DirectionProvider dir="rtl"><Calendar defaultMonth="2026-10" today="2026-10-14" /></DirectionProvider>);
      swipe(250, 150);
      expect(title()).toBe("September 2026");
    });

    it("takes only a finger lifted after a finger touched down", () => {
      swipable();
      const button = screen.getByRole("grid").querySelector("button")!;
      fireEvent.pointerDown(button, { pointerType: "touch", clientX: 250, clientY: 100 });
      fireEvent.pointerUp(button, { pointerType: "mouse", clientX: 150, clientY: 100 });
      expect(title()).toBe("October 2026");
    });

    it("ignores a mouse, and a disabled calendar", () => {
      const { unmount } = swipable();
      const grid = screen.getByRole("grid");
      fireEvent.pointerDown(grid.querySelector("button")!, { pointerType: "mouse", clientX: 250, clientY: 100 });
      fireEvent.pointerUp(grid.querySelector("button")!, { pointerType: "mouse", clientX: 150, clientY: 100 });
      expect(title()).toBe("October 2026");
      unmount();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" disabled />);
      swipe(250, 150);
      expect(title()).toBe("October 2026");
    });

    it("reports the new month", () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      swipe(250, 150);
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
    });
  });

  describe("year and month views", () => {
    const views = (props: Partial<CalendarProps> = {}) =>
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" captionLayout="views" {...(props as CalendarProps)} />);
    const headingButton = () => screen.getByRole("button", { name: "October 2026, choose a month" });
    const monthsGrid = (year = 2026) => screen.getByRole("grid", { name: `Months of ${year}` });
    const yearsGrid = (range = "2017 – 2028") => screen.getByRole("grid", { name: range });
    const cellsOf = (grid: HTMLElement) => [...grid.querySelectorAll<HTMLButtonElement>("button[data-picker-cell]")];
    const openMonths = async () => userEvent.click(headingButton());
    const openYears = async () => {
      await openMonths();
      await userEvent.click(screen.getByRole("button", { name: "2026, choose a year" }));
    };

    it("makes the heading a button that names what it opens, keeping the grid's own name", () => {
      views();
      expect(headingButton()).toHaveTextContent("October 2026");
      expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    });

    it("leaves the heading as text for the other layouts, and with several months", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar();
      expect(screen.queryByRole("button", { name: /choose a month/ })).toBeNull();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" captionLayout="views" numberOfMonths={2} />);
      expect(screen.queryByRole("button", { name: /choose a month/ })).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`captionLayout="views"` needs one month on show'));
    });

    it("opens a grid of the year's twelve months, with the month on show chosen and today's month marked", async () => {
      views();
      await openMonths();
      const cells = cellsOf(monthsGrid());
      expect(cells.map((cell) => cell.textContent)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
      expect(cells[9]).toHaveAccessibleName("Oct, October");
      expect(cells[9]?.closest("[role=gridcell]")).toHaveAttribute("aria-selected", "true");
      expect(cells[9]).toHaveAttribute("aria-current", "date");
      expect(cells[3]?.closest("[role=gridcell]")).toHaveAttribute("aria-selected", "false");
      expect(screen.queryByRole("grid", { name: "October 2026" })).toBeNull();
    });

    it("moves keyboard focus to the chosen month when the grid opens", async () => {
      views();
      await openMonths();
      expect(cellsOf(monthsGrid())[9]).toHaveFocus();
    });

    it("goes back to the days of the month that is chosen, with focus on a day", async () => {
      const onMonthChange = vi.fn();
      views({ onMonthChange });
      await openMonths();
      await userEvent.click(screen.getByRole("button", { name: "Mar, March" }));
      expect(onMonthChange).toHaveBeenCalledWith("2026-03");
      expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
      expect(document.activeElement?.hasAttribute("data-date")).toBe(true);
    });

    it("steps the year in the months grid with its buttons", async () => {
      views();
      await openMonths();
      await userEvent.click(screen.getByRole("button", { name: "Next year" }));
      expect(monthsGrid(2027)).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Previous year" }));
      await userEvent.click(screen.getByRole("button", { name: "Previous year" }));
      expect(monthsGrid(2025)).toBeInTheDocument();
      // The month on show is only marked in its own year.
      expect(cellsOf(monthsGrid(2025))[9]?.closest("[role=gridcell]")).toHaveAttribute("aria-selected", "false");
    });

    it("opens a page of twelve years from the year heading, with the year on show chosen", async () => {
      views();
      await openYears();
      expect(cellsOf(yearsGrid()).map((cell) => cell.textContent)).toEqual(["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028"]);
      expect(cellsOf(yearsGrid())[9]).toHaveFocus();
      expect(cellsOf(yearsGrid())[9]?.closest("[role=gridcell]")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("2017 – 2028")).toBeInTheDocument();
    });

    it("turns the pages of years", async () => {
      views();
      await openYears();
      await userEvent.click(screen.getByRole("button", { name: "Next years" }));
      expect(yearsGrid("2029 – 2040")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Previous years" }));
      await userEvent.click(screen.getByRole("button", { name: "Previous years" }));
      expect(yearsGrid("2005 – 2016")).toBeInTheDocument();
    });

    it("goes from a year to its months, and from a month to the days", async () => {
      const onMonthChange = vi.fn();
      views({ onMonthChange });
      await openYears();
      await userEvent.click(screen.getByRole("button", { name: "2023" }));
      expect(monthsGrid(2023)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2023, choose a year" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Jun, June" }));
      expect(screen.getByRole("grid", { name: "June 2023" })).toBeInTheDocument();
      expect(onMonthChange).toHaveBeenLastCalledWith("2023-06");
    });

    it("moves between months with the arrow keys, by one and by three, clamped to the year", async () => {
      views();
      await openMonths();
      await userEvent.keyboard("{ArrowRight}");
      expect(cellsOf(monthsGrid())[10]).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      expect(cellsOf(monthsGrid())[11]).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      expect(cellsOf(monthsGrid())[8]).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      expect(cellsOf(monthsGrid())[11]).toHaveFocus();
      await userEvent.keyboard("{Home}");
      expect(cellsOf(monthsGrid())[9]).toHaveFocus();
      await userEvent.keyboard("{End}");
      expect(cellsOf(monthsGrid())[11]).toHaveFocus();
      // Up past the top row stays where it is: three ups from December reach March, and a fourth does not move.
      await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
      expect(cellsOf(monthsGrid())[2]).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      expect(cellsOf(monthsGrid())[2]).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
      expect(cellsOf(monthsGrid())[0]).toHaveFocus();
    });

    it("goes to the ends of its own row with Home and End, in the months and in the years", async () => {
      views();
      await openMonths();
      await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
      expect(cellsOf(monthsGrid())[0]).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("{End}");
      expect(cellsOf(monthsGrid())[2]).toHaveFocus();
      await userEvent.keyboard("{Home}");
      expect(cellsOf(monthsGrid())[0]).toHaveFocus();
      await userEvent.click(screen.getByRole("button", { name: "2026, choose a year" }));
      await userEvent.keyboard("{ArrowUp}{Home}");
      expect(document.activeElement).toHaveTextContent("2023");
      await userEvent.keyboard("{End}");
      expect(document.activeElement).toHaveTextContent("2025");
    });

    it("marks today's month only in today's year, and today's year in the years", async () => {
      views();
      await openMonths();
      expect(cellsOf(monthsGrid())[9]).toHaveAttribute("aria-current", "date");
      await userEvent.click(screen.getByRole("button", { name: "Next year" }));
      expect(monthsGrid(2027).querySelector("[aria-current]")).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: "2027, choose a year" }));
      expect(yearsGrid().querySelectorAll("[aria-current]")).toHaveLength(1);
      expect(yearsGrid().querySelector("[aria-current]")).toHaveTextContent("2026");
    });

    it("swaps the left and right arrows under right-to-left", async () => {
      views({ dir: "rtl" });
      await userEvent.click(screen.getByRole("button", { name: "October 2026, choose a month" }));
      await userEvent.keyboard("{ArrowLeft}");
      expect(cellsOf(monthsGrid())[10]).toHaveFocus();
    });

    it("steps the year with Page Up and Page Down, leaving focus on the same month", async () => {
      views();
      await openMonths();
      await userEvent.keyboard("{PageDown}");
      expect(monthsGrid(2027)).toBeInTheDocument();
      expect(cellsOf(monthsGrid(2027))[9]).toHaveFocus();
      await userEvent.keyboard("{PageUp}{PageUp}");
      expect(monthsGrid(2025)).toBeInTheDocument();
    });

    it("moves between years, and turns the page when the move leaves it", async () => {
      views();
      await openYears();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      expect(document.activeElement).toHaveTextContent("2028");
      await userEvent.keyboard("{ArrowRight}");
      expect(yearsGrid("2029 – 2040")).toBeInTheDocument();
      expect(document.activeElement).toHaveTextContent("2029");
      await userEvent.keyboard("{ArrowLeft}");
      expect(yearsGrid("2017 – 2028")).toBeInTheDocument();
      expect(document.activeElement).toHaveTextContent("2028");
      await userEvent.keyboard("{PageDown}");
      expect(document.activeElement).toHaveTextContent("2040");
    });

    it("chooses with Enter and Space", async () => {
      views();
      await openMonths();
      await userEvent.keyboard("{ArrowLeft}{Enter}");
      expect(screen.getByRole("grid", { name: "September 2026" })).toBeInTheDocument();
    });

    it("closes with Escape, returning focus to the heading button", async () => {
      views();
      await openMonths();
      await userEvent.keyboard("{Escape}");
      expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
      expect(headingButton()).toHaveFocus();
    });

    it("is one tab stop in a grid: previous, the heading, next, then the cell", async () => {
      views();
      await openMonths();
      act(() => (document.activeElement as HTMLElement).blur());
      await userEvent.tab();
      expect(screen.getByRole("button", { name: "Previous year" })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole("button", { name: "2026, choose a year" })).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole("button", { name: "Next year" })).toHaveFocus();
      await userEvent.tab();
      expect(cellsOf(monthsGrid())[9]).toHaveFocus();
      expect(cellsOf(monthsGrid()).filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
    });

    it("rules out the months and years that min and max leave no day in", async () => {
      views({ min: "2026-03-10", max: "2027-05-20" });
      await openMonths();
      expect(screen.getByRole("button", { name: "Feb, February" }).closest("[role=gridcell]")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "Mar, March" }).closest("[role=gridcell]")).not.toHaveAttribute("aria-disabled");
      await userEvent.click(screen.getByRole("button", { name: "Feb, February" }));
      expect(monthsGrid()).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "2026, choose a year" }));
      expect(screen.getByRole("button", { name: "2025" }).closest("[role=gridcell]")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "2027" }).closest("[role=gridcell]")).not.toHaveAttribute("aria-disabled");
      expect(screen.getByRole("button", { name: "2028" }).closest("[role=gridcell]")).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(screen.getByRole("button", { name: "2028" }));
      expect(yearsGrid()).toBeInTheDocument();
    });

    it("makes the year buttons unavailable at min and max", async () => {
      views({ min: "2026-03-10", max: "2026-12-31" });
      await openMonths();
      expect(screen.getByRole("button", { name: "Previous year" })).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "Next year" })).toHaveAttribute("aria-disabled", "true");
    });

    it("stays within the years there are", async () => {
      render(<Calendar defaultMonth="0001-05" today="0001-05-05" captionLayout="views" />);
      await userEvent.click(screen.getByRole("button", { name: "May 1, choose a month" }));
      expect(screen.getByRole("button", { name: "Previous year" })).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(screen.getByRole("button", { name: "1, choose a year" }));
      expect(screen.getByRole("button", { name: "Previous years" })).toHaveAttribute("aria-disabled", "true");
      expect(cellsOf(screen.getByRole("grid", { name: "1 – 12" }))).toHaveLength(12);
    });

    it("writes the years with formatNumber and takes its words from labels", async () => {
      const arabic = new Intl.NumberFormat("ar-EG", { useGrouping: false }).format;
      views({
        formatNumber: arabic,
        labels: {
          openMonths: (heading: string) => `${heading} — meses`,
          monthsView: (year: string) => `Meses de ${year}`,
          openYears: (year: string) => `${year} — años`,
          previousYear: "Año anterior",
          monthsShort: ["en", "fe", "ma", "ab", "my", "jn", "jl", "ag", "se", "oc", "no", "di"],
        },
      });
      await userEvent.click(screen.getByRole("button", { name: `October ${arabic(2026)} — meses` }));
      expect(screen.getByRole("grid", { name: `Meses de ${arabic(2026)}` })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Año anterior" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `${arabic(2026)} — años` })).toHaveTextContent(arabic(2026));
      expect(cellsOf(screen.getByRole("grid", { name: `Meses de ${arabic(2026)}` }))[9]).toHaveTextContent("oc");
    });

    it("announces the grid that opens", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      views();
      await openMonths();
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Months of 2026");
      act(() => vi.advanceTimersByTime(1300));
      await userEvent.click(screen.getByRole("button", { name: "2026, choose a year" }));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("2017 – 2028");
    });

    it("is not a grid when disabled: the buttons are unavailable but still focusable", async () => {
      views({ disabled: true });
      await openMonths();
      expect(screen.getByRole("button", { name: "Previous year" })).toHaveAttribute("aria-disabled", "true");
    });

    it("has no axe violations in any of its three grids", async () => {
      const { container } = views({ defaultValue: "2026-10-06" });
      expect(await axe(container)).toHaveNoViolations();
      await openMonths();
      expect(await axe(container)).toHaveNoViolations();
      await userEvent.click(screen.getByRole("button", { name: "2026, choose a year" }));
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("a whole week", () => {
    const weekMode = (props: Partial<CalendarProps> = {}) =>
      renderCalendar({ mode: "week", ...props } as Partial<CalendarProps>);
    const selectedDates = () =>
      [...document.querySelectorAll("td[aria-selected='true'] button")].map((button) => (button as HTMLElement).dataset.date);

    it("chooses the whole row from any day in it, by the date the week starts on", async () => {
      const onValueChange = vi.fn();
      weekMode({ onValueChange });
      await userEvent.click(day("2026-10-14"));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith("2026-10-11");
      expect(selectedDates()).toEqual(["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"]);
    });

    it("starts the week where weekStartsOn says", async () => {
      const onValueChange = vi.fn();
      weekMode({ weekStartsOn: 1, onValueChange });
      await userEvent.click(day("2026-10-11"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-05");
      expect(selectedDates()[0]).toBe("2026-10-05");
      expect(selectedDates()[6]).toBe("2026-10-11");
    });

    it("draws the ends as chosen days and the rest as the strip", () => {
      weekMode({ defaultValue: "2026-10-14" });
      expect(day("2026-10-11")).toHaveClass(styles.selected ?? "");
      expect(day("2026-10-17")).toHaveClass(styles.selected ?? "");
      expect(day("2026-10-14")).not.toHaveClass(styles.selected ?? "");
      expect(cell("2026-10-11")).toHaveClass(styles.bandStart ?? "");
      expect(cell("2026-10-14")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-17")).toHaveClass(styles.bandEnd ?? "");
    });

    it("reads any date in a week as that week, and reports the week's first day when another is chosen", async () => {
      const onValueChange = vi.fn();
      weekMode({ defaultValue: "2026-10-15", onValueChange });
      expect(selectedDates()).toHaveLength(7);
      await userEvent.click(day("2026-10-13"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-21"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-18");
    });

    it("is controlled by value", async () => {
      const onValueChange = vi.fn();
      weekMode({ value: "2026-10-11", onValueChange });
      await userEvent.click(day("2026-10-21"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-18");
      expect(selectedDates()[0]).toBe("2026-10-11");
    });

    it("draws a week that runs across months, whole, when both are on show", () => {
      render(<Calendar mode="week" defaultMonth="2026-09" today="2026-09-14" numberOfMonths={2} defaultValue="2026-09-30" />);
      expect([...document.querySelectorAll("td[aria-selected='true'] button")].map((button) => (button as HTMLElement).dataset.date)).toEqual([
        "2026-09-27",
        "2026-09-28",
        "2026-09-29",
        "2026-09-30",
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
      ]);
    });

    it("chooses with Enter and Space, and with Today and clears with Clear", async () => {
      const onValueChange = vi.fn();
      weekMode({ showTodayButton: true, clearable: true, onValueChange });
      focusDay("2026-10-21");
      await userEvent.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenLastCalledWith("2026-10-18");
      await userEvent.click(screen.getByRole("button", { name: "Today" }));
      expect(onValueChange).toHaveBeenLastCalledWith("2026-10-11");
      await userEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(onValueChange).toHaveBeenLastCalledWith("");
      expect(selectedDates()).toEqual([]);
    });

    it("does not choose from an unavailable day, a read-only or a disabled calendar", async () => {
      const onValueChange = vi.fn();
      const { unmount } = weekMode({ isDateDisabled: (date: string) => date === "2026-10-14", onValueChange });
      await userEvent.click(day("2026-10-14"));
      unmount();
      const { unmount: unmountReadOnly } = weekMode({ readOnly: true, onValueChange });
      await userEvent.click(day("2026-10-21"));
      unmountReadOnly();
      weekMode({ disabled: true, onValueChange });
      await userEvent.click(day("2026-10-21"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("lets a week be chosen by any of its days that is available", async () => {
      const onValueChange = vi.fn();
      weekMode({ isDateDisabled: (date: string) => date === "2026-10-14", onValueChange });
      await userEvent.click(day("2026-10-15"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-11");
    });

    it("draws the whole week under the pointer lightly before it is chosen", async () => {
      weekMode();
      await userEvent.hover(day("2026-10-21"));
      for (const date of ["2026-10-18", "2026-10-21", "2026-10-24"]) expect(cell(date)).toHaveClass(styles.weekPreview ?? "");
      expect(cell("2026-10-17").className).not.toMatch(/weekPreview/);
      await userEvent.unhover(day("2026-10-21"));
      expect(cell("2026-10-21").className).not.toMatch(/weekPreview/);
    });

    it("does not draw that in the other modes", async () => {
      renderCalendar();
      await userEvent.hover(day("2026-10-21"));
      expect(cell("2026-10-21").className).not.toMatch(/weekPreview/);
    });

    it("announces the week that is chosen", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      weekMode();
      await userEvent.click(day("2026-10-14"));
      act(() => vi.advanceTimersByTime(150));
      expect(screen.getByRole("status")).toHaveTextContent("Week Sunday, October 11, 2026 to Saturday, October 17, 2026");
    });

    it("submits the week's first day under its name", async () => {
      weekMode({ name: "week", defaultValue: "2026-10-14" });
      expect([...document.querySelectorAll<HTMLInputElement>("input[type='hidden']")].map((input) => [input.name, input.value])).toEqual([["week", "2026-10-11"]]);
    });

    it("is one tab stop, on the first day of the week chosen, and lists Selected in the key", () => {
      weekMode({ defaultValue: "2026-10-14", showLegend: true });
      expect(day("2026-10-11")).toHaveAttribute("tabindex", "0");
      expect(screen.getByRole("list", { name: "Key" })).toHaveTextContent("Selected");
    });

    it("has no axe violations", async () => {
      const { container } = weekMode({ defaultValue: "2026-10-14", showWeekNumbers: true });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("text and numbers", () => {
    it("uses the labels it is given for names, months and weekdays, keeping English for the rest", () => {
      renderCalendar({
        labels: {
          calendar: "Calendario",
          previousMonth: "Mes anterior",
          months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
          weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
          weekdaysShort: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
        },
      });
      expect(screen.getByRole("group", { name: "Calendario" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "octubre 2026" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mes anterior" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
      expect(day("2026-10-05")).toHaveAccessibleName("lunes, octubre 5, 2026");
    });

    it("lets a label function replace the heading and the day name", () => {
      renderCalendar({
        labels: {
          monthYear: (year, month) => `${year}/${month}`,
          day: ({ year, month, day: dayOfMonth }) => `${dayOfMonth}.${month}.${year}`,
        },
      });
      expect(title()).toBe("2026/10");
      expect(day("2026-10-05")).toHaveAccessibleName("5.10.2026");
    });

    it("keeps the default for a label whose override is undefined", () => {
      renderCalendar({ labels: { calendar: undefined, previousMonth: undefined, monthYear: undefined, day: undefined } });
      expect(screen.getByRole("group", { name: "Calendar" })).toBeInTheDocument();
      expect(previous()).toBeInTheDocument();
      expect(title()).toBe("October 2026");
      expect(day("2026-10-05")).toHaveAccessibleName("Monday, October 5, 2026");
    });

    it("uses English names for a list of the wrong length, and warns", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ labels: { months: ["one"] } });
      expect(title()).toBe("October 2026");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`labels.months` needs 12 entries"));
    });

    it("writes days and years with formatNumber, in the visible text and the names alike", () => {
      const arabic = new Intl.NumberFormat("ar-EG").format;
      renderCalendar({ formatNumber: arabic });
      expect(day("2026-10-05").textContent).toBe(arabic(5));
      expect(title()).toBe(`October ${arabic(2026)}`);
      expect(day("2026-10-05").getAttribute("aria-label")).toContain(arabic(5));
    });
  });

  describe("direction", () => {
    it("sets the direction on the root and swaps the month buttons' arrows", () => {
      const { rerender } = renderCalendar();
      expect(screen.getByTestId("calendar")).toHaveAttribute("dir", "ltr");
      const leftward = previous().innerHTML;
      rerender(<Calendar month="2026-10" today="2026-10-14" dir="rtl" data-testid="calendar" />);
      expect(screen.getByTestId("calendar")).toHaveAttribute("dir", "rtl");
      expect(previous().innerHTML).not.toBe(leftward);
    });
  });

  describe("robustness", () => {
    it("works inside StrictMode", async () => {
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop */}
          <Calendar month="2026-10" today="2026-10-14" onValueChange={onValueChange} autoFocus />
        </StrictMode>,
      );
      expect(day("2026-10-14")).toHaveFocus();
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    it("works inside StrictMode with the newer features on: views, several months, a drag target and a form name", async () => {
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          <Calendar
            mode="range"
            defaultMonth="2026-10"
            today="2026-10-14"
            captionLayout="dropdown"
            numberOfMonths={2}
            showWeekNumbers
            showLegend
            clearable
            name="stay"
            onValueChange={onValueChange}
          />
        </StrictMode>,
      );
      await userEvent.click(day("2026-10-20"));
      await userEvent.click(day("2026-11-03"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-20", "2026-11-03"]);
      expect(document.querySelectorAll("input[name='stay[]']")).toHaveLength(2);
    });

    it("renders each mode and layout on the server without touching the browser", () => {
      for (const props of [
        { mode: "range" as const, showWeekNumbers: true, numberOfMonths: 2 },
        { mode: "multiple" as const, defaultValue: ["2026-10-06"], name: "days" },
        { mode: "week" as const, defaultValue: "2026-10-12" },
        { captionLayout: "dropdown" as const },
        { captionLayout: "views" as const, showLegend: true, showTodayButton: true },
      ]) {
        const html = renderToString(<Calendar defaultMonth="2026-10" {...(props as CalendarProps)} />);
        expect(html).toContain("October 2026");
      }
    });

    it("stays within the calendar's years", async () => {
      render(<Calendar defaultMonth="9999-12" today="9999-12-31" />);
      focusDay("9999-12-31");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("9999-12-31");
      expect(next()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(next());
      expect(title()).toBe("December 9999");
    });

    it("has nothing before January of year 1", async () => {
      render(<Calendar defaultMonth="0001-01" today="0001-01-01" />);
      expect(title()).toBe("January 1");
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(previous());
      expect(title()).toBe("January 1");
      await userEvent.click(next());
      expect(title()).toBe("February 1");
      expect(previous()).not.toHaveAttribute("aria-disabled");
    });

    it("uses Sunday for a week start that is not a day", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ weekStartsOn: 9 as 0 });
      expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Sunday");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`weekStartsOn` must be"));
    });
  });

  describe("accessibility", () => {
    it("says that several cells can be selected in range, multiple and week mode, and not in single mode", () => {
      const grid = () => screen.getAllByRole("grid").at(-1) as HTMLElement;
      const modes: Array<[string, boolean]> = [["single", false], ["range", true], ["multiple", true], ["week", true]];
      for (const [mode, several] of modes) {
        const { unmount } = render(<Calendar mode={mode as "range"} month="2026-10" today="2026-10-14" />);
        if (several) expect(grid()).toHaveAttribute("aria-multiselectable", "true");
        else expect(grid()).not.toHaveAttribute("aria-multiselectable");
        unmount();
      }
    });

    it("has no axe violations as a single-date calendar", async () => {
      const { container } = renderCalendar({ defaultValue: "2026-10-06" });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations as a range, with unavailable days, in right-to-left and disabled", async () => {
      const { container, rerender } = renderCalendar({
        mode: "range",
        defaultValue: ["2026-10-08", "2026-10-12"],
        isDateDisabled: (date) => date.endsWith("-20"),
      });
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Calendar month="2026-10" today="2026-10-14" dir="rtl" />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Calendar month="2026-10" today="2026-10-14" disabled />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Calendar month="2026-10" today="2026-10-14" readOnly showOutsideDays={false} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
