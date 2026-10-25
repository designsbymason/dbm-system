import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormField } from "../../molecules/FormField";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRangePickerProps, DateRangeValue } from "./index";
import { laterOf, rangeProblem } from "./dateRangeValue";

const startGroup = () => screen.getByRole("group", { name: "Start date" });
const endGroup = () => screen.getByRole("group", { name: "End date" });
const segment = (group: HTMLElement, name: string) => within(group).getByRole("spinbutton", { name }) as HTMLInputElement;
const texts = (group: HTMLElement) =>
  within(group)
    .getAllByRole("spinbutton")
    .map((input) => (input as HTMLInputElement).value);
const day = (date: string) => document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`) as HTMLButtonElement;
const open = () => userEvent.click(screen.getByRole("button", { name: "Choose dates" }));
const hiddenInputs = (container: HTMLElement) => [...container.querySelectorAll<HTMLInputElement>('input[type="date"]')];

afterEach(() => vi.restoreAllMocks());

describe("DateRangePicker structure", () => {
  it("is a named group of a start and an end date, each a group of segments", () => {
    render(<DateRangePicker aria-label="Stay" />);
    const group = screen.getByRole("group", { name: "Stay" });
    expect(within(group).getByRole("group", { name: "Start date" })).toBeInTheDocument();
    expect(within(group).getByRole("group", { name: "End date" })).toBeInTheDocument();
    expect(texts(startGroup())).toEqual(["", "", ""]);
    expect(texts(endGroup())).toEqual(["", "", ""]);
  });

  it("shows a dash between the ends, hidden from assistive technology", () => {
    const { container } = render(<DateRangePicker aria-label="Stay" />);
    const dash = [...container.querySelectorAll("span[aria-hidden]")].find((node) => node.textContent === "–");
    expect(dash).toBeDefined();
  });

  it("shows the value in each end, in the format given", () => {
    render(<DateRangePicker aria-label="Stay" format="dmy" separator="." defaultValue={["2026-10-05", "2026-10-09"]} />);
    expect(texts(startGroup())).toEqual(["05", "10", "2026"]);
    expect(texts(endGroup())).toEqual(["09", "10", "2026"]);
  });

  it("puts the id on the start's first segment, and the aria on the outer group", () => {
    render(<DateRangePicker aria-label="Stay" id="when" aria-describedby="help" />);
    expect(segment(startGroup(), "Month")).toHaveAttribute("id", "when");
    expect(screen.getByRole("group", { name: "Stay" })).toHaveAttribute("aria-describedby", "help");
  });

  it("warns once when it has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DateRangePicker />);
    expect(warn.mock.calls.filter(([message]) => String(message).includes("no accessible name"))).toHaveLength(1);
  });

  it("translates every word, and keeps the default for a label left undefined", () => {
    render(
      <DateRangePicker
        aria-label="Stay"
        labels={{
          start: "Arrive",
          end: "Leave",
          openPicker: undefined,
          clear: "Reset",
        }}
        clearable
        defaultValue={["2026-10-05", ""]}
      />,
    );
    expect(screen.getByRole("group", { name: "Arrive" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Leave" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose dates" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("forwards its ref to the outer group, and takes className, style, data-testid and native attributes", () => {
    const ref = createRef<HTMLDivElement>();
    render(<DateRangePicker ref={ref} aria-label="Stay" className="mine" style={{ marginBlockStart: 3 }} data-testid="range" title="range" />);
    const group = screen.getByTestId("range");
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("mine");
    expect(group).toHaveStyle({ marginBlockStart: "3px" });
    expect(group).toHaveAttribute("title", "range");
  });

  it("does not let a native prop replace its role", () => {
    render(<DateRangePicker aria-label="Stay" {...({ role: "presentation" } as object)} />);
    expect(screen.getByRole("group", { name: "Stay" })).toBeInTheDocument();
  });

  it("takes every size", () => {
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const { unmount } = render(<DateRangePicker aria-label="Stay" size={size} />);
      expect(screen.getByRole("group", { name: "Stay" })).toBeInTheDocument();
      unmount();
    }
  });

  it("sets the direction on the group when given", () => {
    render(<DateRangePicker aria-label="Stay" dir="rtl" />);
    expect(screen.getByRole("group", { name: "Stay" })).toHaveAttribute("dir", "rtl");
  });

  it("works inside StrictMode", async () => {
    render(
      <StrictMode>
        <DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} />
      </StrictMode>,
    );
    await open();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("copes with an undefined labels entry and a malformed value", () => {
    render(<DateRangePicker aria-label="Stay" value={undefined as unknown as DateRangeValue} labels={{ start: undefined }} />);
    expect(screen.getByRole("group", { name: "Start date" })).toBeInTheDocument();
    render(<DateRangePicker aria-label="Bad" value={[1, null] as unknown as DateRangeValue} />);
    expect(screen.getByRole("group", { name: "Bad" })).toBeInTheDocument();
  });
});

describe("DateRangePicker value", () => {
  it("is uncontrolled by default, and typing an end reports the pair", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} onValueChange={onValueChange} />);
    await userEvent.click(segment(endGroup(), "Month"));
    await userEvent.keyboard("10092026");
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-05", "2026-10-09"]);
    expect(texts(endGroup())).toEqual(["10", "09", "2026"]);
  });

  it("is controlled by value, and an owner that ignores a change keeps the old range", async () => {
    render(<DateRangePicker aria-label="Stay" value={["2026-10-05", "2026-10-09"]} onValueChange={() => undefined} />);
    await userEvent.click(segment(endGroup(), "Day"));
    await userEvent.keyboard("{ArrowUp}");
    expect(segment(endGroup(), "Day").value).toBe("09");
  });

  it("follows a value set from outside, including to empty", () => {
    const { rerender } = render(<DateRangePicker aria-label="Stay" value={["2026-10-05", "2026-10-09"]} />);
    rerender(<DateRangePicker aria-label="Stay" value={["", ""]} />);
    expect(texts(startGroup())).toEqual(["", "", ""]);
    rerender(<DateRangePicker aria-label="Stay" value={["2026-11-01", "2026-11-03"]} />);
    expect(texts(endGroup())).toEqual(["11", "03", "2026"]);
  });

  it("reports a start typed while the end is empty as a range in progress", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" onValueChange={onValueChange} />);
    await userEvent.click(segment(startGroup(), "Month"));
    await userEvent.keyboard("10052026");
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-05", ""]);
  });

  it("writes digits through formatNumber", () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} formatNumber={(n) => String.fromCodePoint(0x660 + n)} />);
    expect(segment(startGroup(), "Day").value).toBe("٠٥");
  });
});

describe("DateRangePicker validity", () => {
  it("flags an end before the start, and reports it as typed", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-10", ""]} onValueChange={onValueChange} />);
    await userEvent.click(segment(endGroup(), "Month"));
    await userEvent.keyboard("10052026");
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-10", "2026-10-05"]);
    expect(segment(endGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
    expect(segment(startGroup(), "Month")).not.toHaveAttribute("aria-invalid");
  });

  it("does not flag the start for being after the end", () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-12", "2026-10-09"]} />);
    expect(segment(startGroup(), "Month")).not.toHaveAttribute("aria-invalid");
    expect(segment(endGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
  });

  it("flags either end outside min and max", () => {
    render(<DateRangePicker aria-label="Stay" min="2026-10-06" max="2026-10-08" defaultValue={["2026-10-05", "2026-10-09"]} />);
    expect(segment(startGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
    expect(segment(endGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
  });

  it.each([
    ["too short", { minRangeDays: 3 }, ["2026-10-05", "2026-10-06"], true],
    ["long enough", { minRangeDays: 3 }, ["2026-10-05", "2026-10-08"], false],
    ["too long", { maxRangeDays: 3 }, ["2026-10-05", "2026-10-08"], true],
    ["short enough", { maxRangeDays: 3 }, ["2026-10-05", "2026-10-07"], false],
    [
      "over an unavailable day",
      {
        rangeSpansUnavailable: false,
        isDateDisabled: (date: string) => date === "2026-10-07",
      },
      ["2026-10-05", "2026-10-09"],
      true,
    ],
    ["over one that is allowed", { isDateDisabled: (date: string) => date === "2026-10-07" }, ["2026-10-05", "2026-10-09"], false],
  ] as const)("flags an end that makes the range %s only when it does", (_name, props, value, flagged) => {
    render(<DateRangePicker aria-label="Stay" {...props} defaultValue={value} />);
    if (flagged) expect(segment(endGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
    else expect(segment(endGroup(), "Month")).not.toHaveAttribute("aria-invalid");
  });

  it("says why in the end's form message, in the labels given", () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" maxRangeDays={2} labels={{ tooLong: (days) => `Max ${days}` }} defaultValue={["2026-10-05", "2026-10-09"]} />
      </form>,
    );
    expect(hiddenInputs(container)[1]!.validationMessage).toBe("Max 2");
    expect(hiddenInputs(container)[0]!.validationMessage).toBe("");
  });

  it("uses the app's own reason for an unavailable date over its own limits", () => {
    const { container } = render(
      <form>
        <DateRangePicker
          aria-label="Stay"
          name="stay"
          maxRangeDays={2}
          unavailableReason={(date) => (date === "2026-10-09" ? "Fully booked" : null)}
          defaultValue={["2026-10-05", "2026-10-09"]}
        />
      </form>,
    );
    expect(hiddenInputs(container)[1]!.validationMessage).toBe("Fully booked");
  });

  it("names the bound in the message for an end before the start", () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" defaultValue={["2026-10-10", "2026-10-05"]} />
      </form>,
    );
    expect(hiddenInputs(container)[1]!.validationMessage).toBe("Choose 10/10/2026 or later");
  });

  it("shows hasError on both ends", () => {
    render(<DateRangePicker aria-label="Stay" hasError />);
    expect(segment(startGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
    expect(segment(endGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("DateRangePicker form", () => {
  it("submits both ends under name[], start then end", () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" defaultValue={["2026-10-05", "2026-10-09"]} />
      </form>,
    );
    const inputs = hiddenInputs(container);
    expect(inputs.map((input) => input.name)).toEqual(["stay[]", "stay[]"]);
    expect(inputs.map((input) => input.value)).toEqual(["2026-10-05", "2026-10-09"]);
    const data = new FormData(container.querySelector("form") as HTMLFormElement);
    expect(data.getAll("stay[]")).toEqual(["2026-10-05", "2026-10-09"]);
  });

  it("refuses a submit while either end is empty and required", () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" required defaultValue={["2026-10-05", ""]} />
      </form>,
    );
    const [first, second] = hiddenInputs(container);
    expect(first!.validity.valueMissing).toBe(false);
    expect(second!.validity.valueMissing).toBe(true);
  });

  it("associates the hidden inputs with a form by id", () => {
    const { container } = render(<DateRangePicker aria-label="Stay" name="stay" form="elsewhere" />);
    expect(hiddenInputs(container).map((input) => input.getAttribute("form"))).toEqual(["elsewhere", "elsewhere"]);
  });

  it("is named by a FormField label, and a click on the label focuses the start", async () => {
    render(<FormField label="Stay">{(field) => <DateRangePicker {...field} />}</FormField>);
    await userEvent.click(screen.getByText("Stay"));
    expect(segment(startGroup(), "Month")).toHaveFocus();
  });
});

describe("DateRangePicker states", () => {
  it("disabled: nothing takes input, and the buttons are inert", async () => {
    render(<DateRangePicker aria-label="Stay" disabled />);
    expect(segment(startGroup(), "Month")).toBeDisabled();
    expect(segment(endGroup(), "Month")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Choose dates" })).toBeDisabled();
  });

  it("read-only: segments cannot change, and the calendar cannot open", async () => {
    render(<DateRangePicker aria-label="Stay" readOnly defaultValue={["2026-10-05", "2026-10-09"]} defaultOpen />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(segment(startGroup(), "Day"));
    await userEvent.keyboard("{ArrowUp}");
    expect(segment(startGroup(), "Day").value).toBe("05");
  });

  it("hides the picker button with showPicker off", () => {
    render(<DateRangePicker aria-label="Stay" showPicker={false} />);
    expect(screen.queryByRole("button", { name: "Choose dates" })).toBeNull();
  });

  it("focuses the start's first segment on mount with autoFocus", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus -- the component's own opt-in prop, under test
    render(<DateRangePicker aria-label="Stay" autoFocus />);
    expect(segment(startGroup(), "Month")).toHaveFocus();
  });
});

describe("DateRangePicker clear", () => {
  it("shows no clear button by default; clearable turns it on, and only while there is something to clear", async () => {
    const { rerender } = render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} />);
    expect(screen.queryByRole("button", { name: "Clear dates" })).toBeNull();
    rerender(<DateRangePicker aria-label="Stay" clearable defaultValue={["2026-10-05", ""]} />);
    expect(screen.getByRole("button", { name: "Clear dates" })).toBeInTheDocument();
    rerender(<DateRangePicker aria-label="Stay" clearable={false} onClear={() => undefined} defaultValue={["2026-10-05", ""]} />);
    expect(screen.queryByRole("button", { name: "Clear dates" })).toBeNull();
  });

  it("empties both ends in one report, calls onClear and focuses the start", async () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} onClear={onClear} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear dates" }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["", ""]);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(texts(startGroup())).toEqual(["", "", ""]);
    expect(segment(startGroup(), "Month")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear dates" })).toBeNull();
  });
});

describe("DateRangePicker calendar", () => {
  it("opens a dialog with a range calendar, and focuses the chosen start", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} />);
    await open();
    const dialog = await screen.findByRole("dialog", {
      name: "Choose a date range",
    });
    expect(within(dialog).getAllByRole("grid").length).toBeGreaterThan(0);
    await waitFor(() => expect(day("2026-10-05")).toHaveFocus());
    expect(screen.getByRole("button", { name: "Choose dates" })).toHaveAttribute("aria-expanded", "true");
  });

  it("chooses a start and then an end, reporting each, and closes on the second", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" today="2026-10-01" defaultValue={["", ""]} onValueChange={onValueChange} defaultOpen />);
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-12"));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-12", ""]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(texts(startGroup())).toEqual(["10", "12", "2026"]);
    await userEvent.click(day("2026-10-15"));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-12", "2026-10-15"]);
    expect(texts(endGroup())).toEqual(["10", "15", "2026"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Choose dates" })).toHaveFocus();
  });

  it("starts a new range when opened with a whole one and a date is chosen from the button", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} />);
    await open();
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-20"));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-20", ""]);
    expect(texts(endGroup())).toEqual(["", "", ""]);
  });

  it("opened from the end with Alt+ArrowDown, chooses the end and leaves the start", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} />);
    await userEvent.click(segment(endGroup(), "Day"));
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await screen.findByRole("dialog");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.click(day("2026-10-14"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-05", "2026-10-14"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(segment(endGroup(), "Day")).toHaveFocus();
  });

  it("opened from the end, leaves the range as it was when closed without a choice", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} />);
    await userEvent.click(segment(endGroup(), "Day"));
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(texts(endGroup())).toEqual(["10", "09", "2026"]);
  });

  it("opens from a segment of the start with Alt+ArrowDown, and a plain ArrowDown steps instead", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} />);
    await userEvent.click(segment(startGroup(), "Day"));
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(segment(startGroup(), "Day").value).toBe("04");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the button", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} />);
    await open();
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Choose dates" })).toHaveFocus();
  });

  it("chooses with the keyboard", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} />);
    await open();
    await waitFor(() => expect(day("2026-10-05")).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(texts(endGroup())).toEqual(["10", "07", "2026"]);
  });

  it("disables the days outside min and max, the unavailable ones, and the ends that break the length limits", async () => {
    render(
      <DateRangePicker
        aria-label="Stay"
        min="2026-10-03"
        max="2026-10-25"
        isDateDisabled={(date) => date === "2026-10-11"}
        maxRangeDays={5}
        defaultValue={["2026-10-05", ""]}
        defaultOpen
      />,
    );
    await screen.findByRole("dialog");
    const disabled = (date: string) => day(date).closest("td")?.getAttribute("aria-disabled");
    expect(disabled("2026-10-02")).toBe("true");
    expect(disabled("2026-10-26")).toBe("true");
    expect(disabled("2026-10-11")).toBe("true");
    expect(disabled("2026-10-09")).not.toBe("true");
    expect(disabled("2026-10-10")).toBe("true");
  });

  it("shows two months on a wide screen's map and takes numberOfMonths", async () => {
    render(<DateRangePicker aria-label="Stay" numberOfMonths={2} defaultValue={["2026-10-05", ""]} defaultOpen />);
    await screen.findByRole("dialog");
    expect(day("2026-10-05")).toBeInTheDocument();
    expect(day("2026-11-05")).toBeInTheDocument();
  });

  it("starts the week where weekStartsOn says", async () => {
    render(<DateRangePicker aria-label="Stay" weekStartsOn={1} today="2026-10-01" defaultOpen />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("columnheader")[0]).toHaveTextContent(/^Mo/);
  });

  it("passes calendarProps to the calendar", async () => {
    render(
      <DateRangePicker
        aria-label="Stay"
        calendarProps={{
          labels: {
            months: ["j", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"],
          },
        }}
        defaultValue={["2026-10-05", ""]}
        defaultOpen
      />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("grid").getAttribute("aria-label") ?? dialog.textContent).toMatch(/o/);
    expect(segment(startGroup(), "Month")).toHaveAttribute("aria-valuetext", "o");
  });

  it("can be controlled, and is hidden for a disabled or read-only pair", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<DateRangePicker aria-label="Stay" open onOpenChange={onOpenChange} />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    rerender(<DateRangePicker aria-label="Stay" open disabled />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("follows a range set from outside while the calendar is open", async () => {
    const { rerender } = render(<DateRangePicker aria-label="Stay" value={["2026-10-05", "2026-10-09"]} defaultOpen />);
    await screen.findByRole("dialog");
    rerender(<DateRangePicker aria-label="Stay" value={["2026-11-02", "2026-11-04"]} defaultOpen />);
    expect(texts(startGroup())).toEqual(["11", "02", "2026"]);
  });

  it("shows why a day is unavailable in its name", async () => {
    render(
      <DateRangePicker aria-label="Stay" unavailableReason={(date) => (date === "2026-10-11" ? "Fully booked" : null)} defaultValue={["2026-10-05", ""]} defaultOpen />,
    );
    await screen.findByRole("dialog");
    expect(day("2026-10-11").getAttribute("aria-label") ?? day("2026-10-11").textContent).toContain("Fully booked");
  });

  it("says the range aloud when it is chosen", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} defaultOpen />);
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-08"));
    expect(await screen.findByText("Dates chosen: 10/05/2026 to 10/08/2026")).toBeInTheDocument();
  });
});

describe("DateRangePicker presets", () => {
  const presets: NonNullable<DateRangePickerProps["presets"]> = [
    { label: "This week", value: ["2026-10-05", "2026-10-11"] },
    {
      label: "Last 3 days",
      value: (today) => [today.replace(/\d\d$/, "08"), today],
    },
    { label: "Backwards", value: ["2026-10-11", "2026-10-05"] },
  ];

  it("lists the presets in a named group, and a preset picks a whole range and closes", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" today="2026-10-10" presets={presets} onValueChange={onValueChange} defaultOpen />);
    await screen.findByRole("dialog");
    const group = screen.getByRole("group", { name: "Quick choices" });
    await userEvent.click(within(group).getByRole("button", { name: "This week" }));
    expect(onValueChange).toHaveBeenCalledWith(["2026-10-05", "2026-10-11"]);
    expect(texts(startGroup())).toEqual(["10", "05", "2026"]);
    expect(texts(endGroup())).toEqual(["10", "11", "2026"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("works a function of today out once today is known", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" today="2026-10-10" presets={presets} onValueChange={onValueChange} defaultOpen />);
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Last 3 days" }));
    expect(onValueChange).toHaveBeenCalledWith(["2026-10-08", "2026-10-10"]);
  });

  it("disables a preset that is backwards, outside min and max, unavailable, or breaks a limit", async () => {
    render(<DateRangePicker aria-label="Stay" today="2026-10-10" presets={presets} min="2026-10-06" defaultOpen />);
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Backwards" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "This week" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last 3 days" })).toBeEnabled();
  });

  it("disables a preset longer than maxRangeDays", async () => {
    render(<DateRangePicker aria-label="Stay" today="2026-10-10" presets={presets} maxRangeDays={5} defaultOpen />);
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "This week" })).toBeDisabled();
  });
});

describe("DateRangePicker commitOn", () => {
  it('holds a start chosen in the calendar until the range is whole ("complete")', async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" commitOn="complete" onValueChange={onValueChange} today="2026-10-01" defaultOpen />);
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-12"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(texts(startGroup())).toEqual(["10", "12", "2026"]);
    await userEvent.click(day("2026-10-15"));
    await waitFor(() => expect(onValueChange).toHaveBeenCalledTimes(1));
    expect(onValueChange).toHaveBeenCalledWith(["2026-10-12", "2026-10-15"]);
  });

  it("reports what was held when the calendar closes without the end", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" commitOn="blur" onValueChange={onValueChange} today="2026-10-01" defaultOpen />);
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-12"));
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(["2026-10-12", ""]));
  });

  it("never holds a preset or the clear button", async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Stay"
        commitOn="blur"
        clearable
        defaultValue={["2026-10-01", "2026-10-02"]}
        presets={[{ label: "Week", value: ["2026-10-05", "2026-10-11"] }]}
        onValueChange={onValueChange}
        defaultOpen
      />,
    );
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Week" }));
    expect(onValueChange).toHaveBeenCalledWith(["2026-10-05", "2026-10-11"]);
  });
});

describe("DateRangePicker focus and blur", () => {
  it("calls onFocus once on arriving and onBlur once on leaving, not for each part it moves between", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <button type="button">before</button>
        <DateRangePicker aria-label="Stay" onFocus={onFocus} onBlur={onBlur} />
        <button type="button">after</button>
      </>,
    );
    await userEvent.click(screen.getByText("before"));
    for (let press = 0; press < 7; press += 1) await userEvent.tab();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByText("after")).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("counts the calendar as part of the pair", async () => {
    const onBlur = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} onBlur={onBlur} />);
    await open();
    await waitFor(() => expect(day("2026-10-05")).toHaveFocus());
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("has one tab stop per segment, then the button", async () => {
    render(<DateRangePicker aria-label="Stay" />);
    await userEvent.tab();
    expect(segment(startGroup(), "Month")).toHaveFocus();
    for (let press = 0; press < 5; press += 1) await userEvent.tab();
    expect(segment(endGroup(), "Year")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Choose dates" })).toHaveFocus();
  });

  it("does not take a press inside the calendar for one on a field", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} defaultOpen />);
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-07"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("DateRangePicker controlled by state", () => {
  it("round-trips a range chosen in the calendar through the owner's state", async () => {
    function Owner() {
      const [range, setRange] = useState<DateRangeValue>(["", ""]);
      return (
        <>
          <DateRangePicker aria-label="Stay" value={range} onValueChange={(next) => setRange(next)} today="2026-10-01" defaultOpen />
          <output>{range.join("|")}</output>
        </>
      );
    }
    render(<Owner />);
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-12"));
    await userEvent.click(day("2026-10-14"));
    expect(document.querySelector("output")).toHaveTextContent("2026-10-12|2026-10-14");
  });
});

describe("DateRangePicker by month", () => {
  const monthButton = (name: RegExp) => within(screen.getByRole("dialog")).getByRole("button", { name });

  it("has a month and a year segment on each end, and no day", () => {
    render(<DateRangePicker aria-label="Period" granularity="month" defaultValue={["2026-03", "2026-05"]} />);
    expect(
      within(startGroup())
        .getAllByRole("spinbutton")
        .map((input) => input.getAttribute("aria-label")),
    ).toEqual(["Month", "Year"]);
    expect(texts(startGroup())).toEqual(["03", "2026"]);
    expect(texts(endGroup())).toEqual(["05", "2026"]);
  });

  it("types a month and a year into each end, and reports YYYY-MM", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Period" granularity="month" onValueChange={onValueChange} />);
    await userEvent.click(segment(startGroup(), "Month"));
    await userEvent.keyboard("032026");
    await userEvent.click(segment(endGroup(), "Month"));
    await userEvent.keyboard("052026");
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-03", "2026-05"]);
  });

  it("opens a grid of months, and chooses a start and then an end from it", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Period" granularity="month" today="2026-10-01" onValueChange={onValueChange} />);
    await open();
    await screen.findByRole("dialog");
    expect(document.querySelector("button[data-date]")).toBeNull();
    await userEvent.click(monthButton(/^Mar/));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-03", ""]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(monthButton(/^Jun/));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-03", "2026-06"]);
    expect(texts(endGroup())).toEqual(["06", "2026"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("starts again when the second month is before the first", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Period" granularity="month" today="2026-10-01" onValueChange={onValueChange} />);
    await open();
    await screen.findByRole("dialog");
    await userEvent.click(monthButton(/^Jun/));
    await userEvent.click(monthButton(/^Mar/));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-03", ""]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("flags an end before the start, and takes min and max as months", () => {
    render(<DateRangePicker aria-label="Period" granularity="month" min="2026-04" defaultValue={["2026-06", "2026-05"]} />);
    expect(segment(startGroup(), "Month")).not.toHaveAttribute("aria-invalid");
    expect(segment(endGroup(), "Month")).toHaveAttribute("aria-invalid", "true");
  });

  it("takes presets as month pairs, and disables one that is not", async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        granularity="month"
        today="2026-10-01"
        onValueChange={onValueChange}
        presets={[
          { label: "First quarter", value: ["2026-01", "2026-03"] },
          {
            label: "This year so far",
            value: (today) => [`${today.slice(0, 4)}-01`, today.slice(0, 7)],
          },
          { label: "Backwards", value: ["2026-06", "2026-01"] },
          { label: "A day", value: ["2026-01-01", "2026-03-01"] },
        ]}
        defaultOpen
      />,
    );
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Backwards" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A day" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "This year so far" }));
    expect(onValueChange).toHaveBeenCalledWith(["2026-01", "2026-10"]);
  });

  it("says the months aloud when chosen, and warns that the day limits have no effect", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DateRangePicker aria-label="Period" granularity="month" maxRangeDays={5} defaultValue={["2026-03", ""]} defaultOpen today="2026-10-01" />);
    await screen.findByRole("dialog");
    expect(warn.mock.calls.some(([message]) => String(message).includes('granularity="month"'))).toBe(true);
    await userEvent.click(monthButton(/^Jun/));
    expect(await screen.findByText("Dates chosen: 03/2026 to 06/2026")).toBeInTheDocument();
  });

  it("submits two YYYY-MM values under name[]", () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Period" granularity="month" name="period" defaultValue={["2026-03", "2026-05"]} />
      </form>,
    );
    expect(new FormData(container.querySelector("form") as HTMLFormElement).getAll("period[]")).toEqual(["2026-03", "2026-05"]);
  });
});

describe("DateRangePicker editing one end from the calendar", () => {
  it("opened from the start of a whole range, a date chosen replaces the start and keeps the end", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} />);
    await userEvent.click(segment(startGroup(), "Day"));
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-07"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-07", "2026-10-09"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(segment(startGroup(), "Day")).toHaveFocus();
  });

  it("starts a new range when the date is after the end, or breaks a limit", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" maxRangeDays={4} defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} />);
    await userEvent.click(segment(startGroup(), "Day"));
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-12"));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-12", ""]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opened from the button, a date chosen still starts a new range", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} onValueChange={onValueChange} />);
    await open();
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-07"));
    expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-07", ""]);
  });
});

describe("DateRangePicker with only one end", () => {
  it("refuses a submit with a start and no end, and with an end and no start, even when not required", () => {
    const { container, rerender } = render(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" defaultValue={["2026-10-05", ""]} />
      </form>,
    );
    const [first, second] = hiddenInputs(container);
    expect(first!.validity.valueMissing).toBe(false);
    expect(second!.validity.valueMissing).toBe(true);
    expect((container.querySelector("form") as HTMLFormElement).checkValidity()).toBe(false);
    rerender(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" value={["", "2026-10-09"]} />
      </form>,
    );
    expect(hiddenInputs(container)[0]!.validity.valueMissing).toBe(true);
  });

  it("lets a completely empty range through when it is not required", () => {
    const { container } = render(
      <form>
        <DateRangePicker aria-label="Stay" name="stay" />
      </form>,
    );
    expect((container.querySelector("form") as HTMLFormElement).checkValidity()).toBe(true);
  });

  it("marks the end that is wanted as required to assistive technology", () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} />);
    expect(segment(endGroup(), "Month")).toHaveAttribute("aria-required", "true");
    expect(segment(startGroup(), "Month")).not.toHaveAttribute("aria-required");
  });
});

describe("DateRangePicker clear with half-typed ends", () => {
  it("shows the clear button for a half-typed end, and clears everything typed", async () => {
    const onClear = vi.fn();
    render(<DateRangePicker aria-label="Stay" onClear={onClear} />);
    expect(screen.queryByRole("button", { name: "Clear dates" })).toBeNull();
    await userEvent.click(segment(endGroup(), "Month"));
    await userEvent.keyboard("1");
    expect(await screen.findByRole("button", { name: "Clear dates" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear dates" }));
    expect(texts(endGroup())).toEqual(["", "", ""]);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(segment(startGroup(), "Month")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear dates" })).toBeNull();
  });
});

describe("dateRangeValue", () => {
  const rules = {
    minRangeDays: 1,
    maxRangeDays: 0,
    rangeSpansUnavailable: true,
    isBlocked: () => false,
  };

  it("judges length inclusive of both ends, and ignores an end before the start", () => {
    expect(rangeProblem("2026-10-05", "2026-10-05", rules)).toBeNull();
    expect(rangeProblem("2026-10-05", "2026-10-06", { ...rules, minRangeDays: 3 })).toBe("tooShort");
    expect(rangeProblem("2026-10-05", "2026-10-07", { ...rules, minRangeDays: 3 })).toBeNull();
    expect(rangeProblem("2026-10-05", "2026-10-08", { ...rules, maxRangeDays: 3 })).toBe("tooLong");
    expect(rangeProblem("2026-10-05", "2026-10-07", { ...rules, maxRangeDays: 3 })).toBeNull();
    expect(rangeProblem("2026-10-09", "2026-10-05", { ...rules, minRangeDays: 3 })).toBeNull();
  });

  it("finds an unavailable date between the ends only when the range may not run over one", () => {
    const blocked = {
      ...rules,
      isBlocked: (date: string) => date === "2026-10-07",
    };
    expect(rangeProblem("2026-10-05", "2026-10-09", blocked)).toBeNull();
    expect(
      rangeProblem("2026-10-05", "2026-10-09", {
        ...blocked,
        rangeSpansUnavailable: false,
      }),
    ).toBe("spansUnavailable");
    expect(
      rangeProblem("2026-10-05", "2026-10-06", {
        ...blocked,
        rangeSpansUnavailable: false,
      }),
    ).toBeNull();
  });

  it("returns nothing for text that is not dates", () => {
    expect(rangeProblem("", "2026-10-06", { ...rules, minRangeDays: 5 })).toBeNull();
    expect(rangeProblem("2026-10-05", "nope", { ...rules, minRangeDays: 5 })).toBeNull();
  });

  it("takes the later of two dates, or the one that exists", () => {
    expect(laterOf("2026-10-05", "2026-10-09")).toBe("2026-10-09");
    expect(laterOf("2026-10-12", "2026-10-09")).toBe("2026-10-12");
    expect(laterOf(undefined, "2026-10-09")).toBe("2026-10-09");
    expect(laterOf("2026-10-09", undefined)).toBe("2026-10-09");
    expect(laterOf(undefined, undefined)).toBeUndefined();
  });
});

describe("DateRangePicker status region", () => {
  it("has one region, its own, for the range chosen", () => {
    render(<DateRangePicker aria-label="Stay" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });
});

describe("DateRangePicker accessibility", () => {
  it("has no violations closed", async () => {
    const { container } = render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} clearable />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with the calendar open", async () => {
    render(<DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} presets={[{ label: "Week", value: ["2026-10-05", "2026-10-11"] }]} />);
    await open();
    await screen.findByRole("dialog");
    // The page-level "content in landmarks" rule is about whole pages, not a field.
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
