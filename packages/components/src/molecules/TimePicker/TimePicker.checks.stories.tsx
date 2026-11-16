import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../CodeBlock/browserProtocol";
import { TimePicker } from "./TimePicker";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus
// order — measured in Chromium.
const meta: Meta = {
  title: "Components/TimePicker/Checks",
  id: "molecules-inputs-timepicker-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

export const HeightMatchesInputAndButton: Story = {
  name: "At every size the field is as tall as an Input and a Button",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`row-${size}`} style={{ display: "flex", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
          <TimePicker size={size} aria-label={`t-${size}`} defaultValue="09:30" clearable />
          <Input size={size} aria-label={`i-${size}`} defaultValue="09:30" onClear={() => {}} />
          <Button size={size}>Go</Button>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const row = canvas.getByTestId(`row-${size}`);
      const [picker, input, button] = [...row.children] as HTMLElement[];
      const height = (element: HTMLElement) => element.getBoundingClientRect().height;
      // The picker's buttons are padded (with a compensating negative margin), so they must not stretch the row.
      await expect(Math.abs(height(picker!) - height(button!))).toBeLessThan(1);
      await expect(Math.abs(height(picker!) - height(input!.closest("[class]") as HTMLElement))).toBeLessThan(1);
    }
  },
};

export const WidthStaysPut: Story = {
  name: "Filling the field in never changes its width",
  render: () => <TimePicker aria-label="Start time" data-testid="field" />,
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId("field");
    const empty = field.getBoundingClientRect().width;
    await userEvent.click(within(field).getByRole("spinbutton", { name: "Hour" }));
    await userEvent.keyboard("1");
    await expect(field.getBoundingClientRect().width).toBe(empty);
    await userEvent.keyboard("2");
    await userEvent.keyboard("45p");
    await expect(field.getBoundingClientRect().width).toBe(empty);
    await userEvent.keyboard("{Backspace}");
    await expect(field.getBoundingClientRect().width).toBe(empty);
  },
};

export const TabOrder: Story = {
  name: "One tab stop per segment, then the picker button, then the next control",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
      <TimePicker aria-label="Start time" defaultValue="09:30" clearable />
      <Button>After</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const order = ["Hour", "Minute", "AM/PM", "Clear time", "Choose time", "After"];
    (document.activeElement as HTMLElement | null)?.blur();
    for (const name of order) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(canvas.getByRole(name.endsWith("time") || name === "After" ? "button" : "spinbutton", { name }));
    }
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the digits keep their order, and the field's parts follow the page",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="09:30" clearable />,
  play: async ({ canvasElement }) => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    try {
      await settle();
      const canvas = within(canvasElement);
      const hour = canvas.getByRole("spinbutton", { name: "Hour" }).getBoundingClientRect();
      const minute = canvas.getByRole("spinbutton", { name: "Minute" }).getBoundingClientRect();
      const clear = canvas.getByRole("button", { name: "Clear time" }).getBoundingClientRect();
      const picker = canvas.getByRole("button", { name: "Choose time" }).getBoundingClientRect();
      // Hours before minutes, left to right, whatever the page's direction.
      await expect(hour.left).toBeLessThan(minute.left);
      // The buttons sit at the end of the field, which in this direction is the left, in order: picker last.
      await expect(clear.right).toBeLessThanOrEqual(hour.left);
      await expect(picker.right).toBeLessThanOrEqual(clear.left + 1);
      // And ArrowRight still goes on to the minutes, since segments are laid out left to right.
      canvas.getByRole("spinbutton", { name: "Hour" }).focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("spinbutton", { name: "Minute" })).toHaveFocus();
    } finally {
      document.documentElement.dir = previous;
    }
  },
};

export const NoSegmentClipsItsText: Story = {
  name: "At every size no segment cuts its text off, including AM/PM and a longer label",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }} data-testid="all">
      {sizes.map((size) => (
        <TimePicker key={size} size={size} showSeconds aria-label={`t-${size}`} defaultValue="23:59:59" />
      ))}
      {sizes.map((size) => (
        <TimePicker key={`long-${size}`} size={size} aria-label={`long-${size}`} defaultValue="11:11" labels={{ am: "a.m.", pm: "p.m." }} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle();
    const segments = [...within(canvasElement).getByTestId("all").querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')];
    await expect(segments.length).toBeGreaterThan(20);
    for (const segment of segments) {
      // Text wider than its box would make the input scroll sideways.
      await expect(segment.scrollWidth).toBeLessThanOrEqual(segment.clientWidth);
    }
  },
};

export const InsertedText: Story = {
  name: "Text inserted all at once (a phone's keyboard, autofill, a paste) fills the segments in order",
  render: () => <TimePicker aria-label="Start time" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("spinbutton", { name: "Hour" }).focus();
    // The browser's own text insertion, which fires `input` with the whole string and no key events.
    await send("Input.insertText", { text: "0415p" });
    await settle(50);
    await expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveValue("04");
    await expect(canvas.getByRole("spinbutton", { name: "Minute" })).toHaveValue("15");
    await expect(canvas.getByRole("spinbutton", { name: "AM/PM" })).toHaveValue("PM");
    await expect(canvas.getByRole("spinbutton", { name: "AM/PM" })).toHaveFocus();
  },
};

export const TargetSizes: Story = {
  name: "Every button is at least 24 × 24 CSS pixels at every size (WCAG 2.5.8)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)", alignItems: "flex-start" }} data-testid="all">
      {sizes.map((size) => (
        <TimePicker key={size} size={size} aria-label={`t-${size}`} defaultValue="09:30" clearable />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const all = within(canvasElement).getByTestId("all");
    for (const element of all.querySelectorAll<HTMLElement>("button")) {
      const { width, height } = element.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(24);
      await expect(height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const PressingTheFieldFocusesASegment: Story = {
  name: "A press on the field's padding or a colon focuses the nearest segment",
  render: () => <TimePicker aria-label="Start time" defaultValue="09:30" data-testid="field" size="xl" />,
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByTestId("field");
    const box = field.getBoundingClientRect();
    const minute = within(field).getByRole("spinbutton", { name: "Minute" }).getBoundingClientRect();
    // The left padding, level with the segments: before the hour, so the hour.
    await userEvent.pointer({ keys: "[MouseLeft]", target: field, coords: { clientX: box.left + 3, clientY: box.top + box.height / 2 } });
    await expect(within(field).getByRole("spinbutton", { name: "Hour" })).toHaveFocus();
    // Just past the minute's left edge (the colon's gap and the minute's own box): the minute.
    await userEvent.pointer({ keys: "[MouseLeft]", target: field, coords: { clientX: minute.left + 2, clientY: box.top + 3 } });
    await expect(within(field).getByRole("spinbutton", { name: "Minute" })).toHaveFocus();
  },
};

const wheelOf = (name: string) => screen.getByRole("listbox", { name });
const rowHeightOf = (wheel: HTMLElement) => (wheel.firstElementChild as HTMLElement).offsetHeight;
const chosenOf = (name: string) => within(wheelOf(name)).getByRole("option", { selected: true });
/** The wheel's own number the way it is drawn: the opacity and the scale of a row. */
const drawn = (row: Element) => {
  const style = getComputedStyle(row);
  const matrix = style.transform === "none" ? [1] : style.transform.match(/-?[\d.]+/g)!.map(Number);
  return { opacity: Number(style.opacity), scale: matrix[0]! };
};

export const WheelGeometry: Story = {
  name: "Five rows, the chosen one in the middle behind the band",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:30" defaultOpen />,
  play: async () => {
    await screen.findByRole("dialog");
    await settle(400);
    const hours = wheelOf("Hour");
    const row = rowHeightOf(hours);
    await expect(row).toBeGreaterThan(30);
    // Five rows tall, scrolling exactly to a row.
    await expect(hours.clientHeight).toBe(5 * row);
    await expect(hours.scrollTop % row).toBeLessThan(1);
    // The chosen option is in the middle of the wheel, and the band is behind exactly that row.
    const chosen = chosenOf("Hour").getBoundingClientRect();
    const wheel = hours.getBoundingClientRect();
    await expect(Math.abs((chosen.top + chosen.bottom) / 2 - (wheel.top + wheel.bottom) / 2)).toBeLessThan(1);
    const band = document.querySelector("[aria-hidden='true'][class*='band']")!.getBoundingClientRect();
    await expect(Math.abs(band.top - (wheel.top + 2 * row))).toBeLessThan(1);
    await expect(Math.abs(band.height - row)).toBeLessThan(1);
    // Every wheel's chosen row is on the band.
    for (const name of ["Hour", "Minute"]) {
      const rect = chosenOf(name).getBoundingClientRect();
      await expect(Math.abs((rect.top + rect.bottom) / 2 - (band.top + band.bottom) / 2)).toBeLessThan(1);
    }
  },
};

export const NumbersFadeAwayFromTheMiddle: Story = {
  name: "The numbers grow and strengthen as they reach the middle",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:30" defaultOpen />,
  play: async () => {
    await screen.findByRole("dialog");
    await settle(400);
    const hours = wheelOf("Hour");
    const rows = [...hours.children];
    const middle = rows.findIndex((r) => r.getAttribute("aria-selected") === "true");
    const at = (offset: number) => drawn(rows[middle + offset]!);
    const close = (a: number, b: number) => Math.abs(a - b) < 0.02;
    // The chosen one at full size and strength; a row away at 90% and 68%; two rows away at 80% and 35%.
    await expect(close(at(0).opacity, 1) && close(at(0).scale, 1)).toBe(true);
    for (const offset of [-1, 1]) await expect(close(at(offset).opacity, 0.68) && close(at(offset).scale, 0.9)).toBe(true);
    for (const offset of [-2, 2]) await expect(close(at(offset).opacity, 0.35) && close(at(offset).scale, 0.8)).toBe(true);
    // Half way between two rows it is half way between the two looks.
    // Held half way between two rows: snapping would pull it to one, so it is switched off for the measurement.
    hours.style.scrollSnapType = "none";
    hours.scrollTop += rowHeightOf(hours) / 2;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const half = drawn(rows[middle + 1]!);
    await expect(half.opacity).toBeGreaterThan(0.68);
    await expect(half.opacity).toBeLessThan(1);
    hours.style.scrollSnapType = "";
  },
};

export const ScrollingChoosesLive: Story = {
  name: "Scrolling chooses the row in the middle as it passes, and rests on a row",
  args: { onValueChange: fn() },
  render: (args) => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:30" defaultOpen onValueChange={(args as { onValueChange?: (v: string) => void }).onValueChange} />,
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    await settle(400);
    const onValueChange = (args as { onValueChange: ReturnType<typeof fn> }).onValueChange;
    onValueChange.mockClear();
    const hours = wheelOf("Hour");
    const row = rowHeightOf(hours);
    // Three rows down (a swipe): 13:30, reported without waiting for the wheel to stop.
    hours.scrollBy({ top: 3 * row, behavior: "auto" });
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("13:30"));
    await settle(400);
    await expect(chosenOf("Hour").textContent).toBe("13");
    // And it came to rest exactly on a row: snapped, wherever the copy.
    await expect(hours.scrollTop % row).toBeLessThan(1);
  },
};

export const WheelLoops: Story = {
  name: "Hours, minutes and seconds loop: 23 is followed by 00, and it never runs out",
  args: { onValueChange: fn() },
  render: (args) => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="23:00" defaultOpen onValueChange={(args as { onValueChange?: (v: string) => void }).onValueChange} />,
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    await settle(400);
    const onValueChange = (args as { onValueChange: ReturnType<typeof fn> }).onValueChange;
    onValueChange.mockClear();
    const hours = wheelOf("Hour");
    const row = rowHeightOf(hours);
    const copyHeight = 24 * row;
    // Rest in the middle copy, with copies of the hours still above and below.
    await expect(hours.scrollTop).toBeGreaterThan(copyHeight);
    await expect(hours.scrollTop).toBeLessThan(hours.scrollHeight - hours.clientHeight - copyHeight);
    hours.scrollBy({ top: row, behavior: "auto" });
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("00:00"));
    await settle(400);
    // After a long way round it is put back to the middle copy, and says the same thing.
    await expect(chosenOf("Hour").textContent).toBe("00");
    await expect(hours.scrollTop).toBeGreaterThan(copyHeight);
    await expect(hours.scrollTop).toBeLessThan(hours.scrollHeight - hours.clientHeight - copyHeight);
    // Backwards past the start of the list as well.
    hours.scrollBy({ top: -2 * row, behavior: "auto" });
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("22:00"));
    await settle(400);
    // A fling of more than a whole copy (30 rows): the value is where it lands, and the wheel is put back to the
    // middle copy, so another fling the same way still has copies ahead of it.
    hours.scrollBy({ top: 30 * row, behavior: "auto" });
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("04:00"));
    await settle(500);
    const middleStart = 4 * copyHeight;
    await expect(hours.scrollTop).toBeGreaterThanOrEqual(middleStart - 1);
    await expect(hours.scrollTop).toBeLessThan(middleStart + copyHeight);
    await expect(chosenOf("Hour").textContent).toBe("04");
  },
};

export const DisabledRowsAreMovedOff: Story = {
  name: "A disabled row is moved off to the nearest allowed one when the wheel rests",
  args: { onValueChange: fn() },
  render: (args) => (
    <TimePicker aria-label="Start time" hourCycle="24" min="09:00" max="17:00" defaultValue="10:00" defaultOpen onValueChange={(args as { onValueChange?: (v: string) => void }).onValueChange} />
  ),
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    await settle(400);
    const onValueChange = (args as { onValueChange: ReturnType<typeof fn> }).onValueChange;
    onValueChange.mockClear();
    const hours = wheelOf("Hour");
    const row = rowHeightOf(hours);
    // Seven rows up: 03, disabled. It is never chosen on the way, and the wheel comes back to the nearest allowed hour (09).
    hours.scrollBy({ top: -7 * row, behavior: "auto" });
    await settle(900);
    await expect(chosenOf("Hour").textContent).toBe("09");
    await expect(onValueChange).toHaveBeenLastCalledWith("09:00");
    for (const [value] of onValueChange.mock.calls) {
      const hour = Number(String(value).slice(0, 2));
      await expect(hour).toBeGreaterThanOrEqual(9);
      await expect(hour).toBeLessThanOrEqual(17);
    }
    await expect(hours.scrollTop % row).toBeLessThan(1);
  },
};

export const ClickingARowBringsItToTheMiddle: Story = {
  name: "A click on a row chooses it and scrolls it to the middle",
  args: { onValueChange: fn() },
  render: (args) => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:30" defaultOpen onValueChange={(args as { onValueChange?: (v: string) => void }).onValueChange} />,
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    await settle(400);
    const hours = wheelOf("Hour");
    const below = within(hours).getByRole("option", { name: "12" });
    await userEvent.click(below);
    await expect((args as { onValueChange: ReturnType<typeof fn> }).onValueChange).toHaveBeenLastCalledWith("12:30");
    await settle(600);
    const wheel = hours.getBoundingClientRect();
    const rect = chosenOf("Hour").getBoundingClientRect();
    await expect(chosenOf("Hour").textContent).toBe("12");
    await expect(Math.abs((rect.top + rect.bottom) / 2 - (wheel.top + wheel.bottom) / 2)).toBeLessThan(1);
  },
};

export const OpeningAnEmptyFieldChoosesNothing: Story = {
  name: "Opening the picker on an empty field doesn't fill it in",
  args: { onValueChange: fn() },
  render: (args) => <TimePicker aria-label="Start time" defaultOpen onValueChange={(args as { onValueChange?: (v: string) => void }).onValueChange} />,
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    await settle(600);
    await expect((args as { onValueChange: ReturnType<typeof fn> }).onValueChange).not.toHaveBeenCalled();
    await expect(within(wheelOf("Hour")).queryAllByRole("option", { selected: true })).toHaveLength(0);
  },
};

export const PickerFitsAPhone: Story = {
  name: "On a phone the picker stays on screen",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <TimePicker aria-label="Start time" showSeconds defaultValue="09:30:15" size="sm" defaultOpen />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(480);
    const dialog = await screen.findByRole("dialog");
    await settle(400);
    const rect = dialog.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    for (const name of ["Hour", "Minute", "Second", "AM/PM"]) {
      const column = within(dialog).getByRole("listbox", { name }).getBoundingClientRect();
      await expect(column.right).toBeLessThanOrEqual(rect.right + 1);
      await expect(column.left).toBeGreaterThanOrEqual(rect.left - 1);
    }
  },
};

export const WheelFocusRingIsInside: Story = {
  name: "A wheel's focus ring is drawn inside it, not clipped",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="09:30" defaultOpen />,
  play: async () => {
    await screen.findByRole("dialog");
    await settle(400);
    const hours = wheelOf("Hour");
    hours.focus();
    await userEvent.keyboard("{ArrowDown}");
    const style = getComputedStyle(hours);
    await expect(hours.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
    await expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
  },
};

export const ForcedColors: Story = {
  name: "Forced colours: the focused segment still stands out, and the chosen row keeps an edge",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="09:30" defaultOpen />,
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const colour = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    await screen.findByRole("dialog");
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const field = within(canvasElement).getByRole("group", { name: "Start time" });
      await expect(getComputedStyle(field).borderTopStyle).toBe("solid");
      // The band's fill is gone, so it is outlined.
      const band = document.querySelector("[aria-hidden='true'][class*='band']") as HTMLElement;
      await expect(getComputedStyle(band).borderTopStyle).toBe("solid");
      await expect(getComputedStyle(band).borderTopWidth).not.toBe("0px");
      const hour = within(canvasElement).getByRole("spinbutton", { name: "Hour" });
      hour.focus();
      await expect(getComputedStyle(hour).backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(hour).color).toBe(colour("HighlightText"));
    } finally {
      await emulate("none");
    }
  },
};

export const PickerKeyboard: Story = {
  name: "Open the picker, choose with the arrow keys, close with Escape",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:00" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    await waitFor(() => expect(wheelOf("Hour")).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveValue("11"));
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveValue("12"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Choose time" })).toHaveFocus();
  },
};

/** The values the picker reported, in order, for the check below. */
const reported: string[] = [];

export const QuickKeysOnABusyPageNeverGoBackwards: Story = {
  name: "Two quick arrow keys on a busy page move the hour on by two, and the reported value never goes back",
  render: () => (
    <TimePicker
      aria-label="Start time"
      hourCycle="24"
      defaultValue="10:00"
      defaultOpen
      onValueChange={(value) => reported.push(value)}
    />
  ),
  play: async () => {
    reported.length = 0;
    await screen.findByRole("dialog");
    await waitFor(() => expect(wheelOf("Hour")).toHaveFocus());
    // A busy main thread delays the scroll events that keep the wheel's settle timer waiting, so the timer can fire
    // while a smooth scroll is still on its way and report the row the wheel has not yet left.
    await send("Emulation.setCPUThrottlingRate", { rate: 20 });
    try {
      for (let round = 0; round < 3; round += 1) {
        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{ArrowDown}");
        await settle(700);
      }
    } finally {
      await send("Emulation.setCPUThrottlingRate", { rate: 1 });
    }
    const hours = reported.map((value) => Number(value.slice(0, 2)));
    await expect(hours.at(-1)).toBe(16);
    for (let index = 1; index < hours.length; index += 1) await expect(hours[index]).toBeGreaterThan(hours[index - 1]!);
  },
};

export const NeighbourNumbersKeepTheirContrast: Story = {
  name: "The numbers a row from the middle, and the chosen one on its band, still read at 4.5:1 in every theme",
  render: () => <TimePicker aria-label="Start time" hourCycle="24" defaultValue="10:30" defaultOpen />,
  play: async () => {
    await screen.findByRole("dialog");
    await settle(400);
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    const rgb = (value: string) => {
      probe.style.color = value;
      return getComputedStyle(probe).color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    };
    const luminance = (c: number[]) => {
      const f = (x: number) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
    };
    const ratio = (a: number[], b: number[]) => {
      const [la, lb] = [luminance(a), luminance(b)];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    const opacity = Number(getComputedStyle(wheelOf("Hour").children[0]!.parentElement!.querySelector("[aria-selected='true']")!.nextElementSibling!).opacity);
    const previous = document.documentElement.dataset.theme;
    try {
      for (const theme of ["purple-light", "purple-dark", "emerald-light", "emerald-dark"]) {
        document.documentElement.dataset.theme = theme;
        await settle(80);
        const text = rgb("var(--dbm-text-primary)");
        const surface = rgb("var(--dbm-bg-surface)");
        // The number drawn at its own opacity over the panel's surface.
        const seen = text.map((channel, index) => channel * opacity + surface[index]! * (1 - opacity));
        await expect(ratio(seen, surface)).toBeGreaterThanOrEqual(4.5);
        // And the chosen number, at full strength, on the band it sits on.
        await expect(ratio(text, rgb("var(--dbm-bg-brand-subtle)"))).toBeGreaterThanOrEqual(4.5);
      }
    } finally {
      document.documentElement.dataset.theme = previous;
      probe.remove();
    }
  },
};

export const OpenOnFocusKeepsFocus: Story = {
  name: "With openOnFocus the picker opens beside the focused segment, which keeps focus and typing",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      <TimePicker aria-label="Start time" openOnFocus hourCycle="24" />
      <Button>After</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hour = canvas.getByRole("spinbutton", { name: "Hour" });
    await userEvent.tab();
    await expect(hour).toHaveFocus();
    await screen.findByRole("dialog", { name: "Choose a time" });
    // Typing goes to the segment while the picker is open, and the wheel follows.
    await userEvent.keyboard("0930");
    await expect(hour).toHaveValue("09");
    await expect(canvas.getByRole("spinbutton", { name: "Minute" })).toHaveValue("30");
    await waitFor(async () => {
      const selected = within(screen.getByRole("listbox", { name: "Hour" })).getByRole("option", { selected: true });
      await expect(selected).toHaveTextContent("09");
    });
    // Moving along the segments leaves it open; Escape closes it and focus stays on the segment.
    await userEvent.keyboard("{ArrowLeft}");
    await expect(screen.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(hour).toHaveFocus();
    // Tabbing out of the field to the button after it, and back in, opens it again.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await screen.findByRole("dialog");
  },
};

/** A field that shows how often its own `onFocus` and `onBlur` have been called. */
function CountingField() {
  const [counts, setCounts] = useState({ focus: 0, blur: 0 });
  return (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "center" }}>
      <TimePicker
        aria-label="Start time"
        defaultValue="09:30"
        onFocus={() => setCounts((c) => ({ ...c, focus: c.focus + 1 }))}
        onBlur={() => setCounts((c) => ({ ...c, blur: c.blur + 1 }))}
      />
      <Button>After</Button>
      <span data-testid="counts">{`focus ${counts.focus}, blur ${counts.blur}`}</span>
    </div>
  );
}

export const FieldFocusEventsAcrossThePicker: Story = {
  name: "onFocus and onBlur ignore focus going into the picker and back out of it",
  render: () => <CountingField />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const counts = () => canvas.getByTestId("counts");
    await userEvent.click(canvas.getByRole("spinbutton", { name: "Minute" }));
    await expect(counts()).toHaveTextContent("focus 1, blur 0");
    await userEvent.click(canvas.getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    await waitFor(() => expect(screen.getByRole("listbox", { name: "Hour" })).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}");
    // Escape closes the picker, and Radix gives focus back to the button: all of it inside the field.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Choose time" })).toHaveFocus();
    await settle(100);
    await expect(counts()).toHaveTextContent("focus 1, blur 0");
    await userEvent.click(canvas.getByRole("button", { name: "After" }));
    await expect(counts()).toHaveTextContent("focus 1, blur 1");
  },
};

export const FormValidationInTheBrowser: Story = {
  name: "A form refuses an empty or half-filled field and puts focus on the segment that needs it",
  render: () => (
    <form data-testid="form" onSubmit={(event) => event.preventDefault()} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      <TimePicker aria-label="Reminder" name="reminder" required hourCycle="24" data-testid="field" />
      <Button type="submit">Save</Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByTestId("form") as HTMLFormElement;
    const field = canvas.getByTestId("field");
    const widthBefore = field.getBoundingClientRect().width;
    const proxy = form.querySelector<HTMLInputElement>('input[type="time"]')!;
    // Hidden from sight and layout, but a real control the browser can validate and focus.
    await expect(proxy.getBoundingClientRect().width).toBe(0);
    await expect(getComputedStyle(proxy).display).not.toBe("none");
    await expect(form.checkValidity()).toBe(false);
    form.reportValidity();
    await waitFor(() => expect(canvas.getByRole("spinbutton", { name: "Hour" })).toHaveFocus());
    await userEvent.keyboard("09");
    await expect(form.checkValidity()).toBe(false);
    await expect(proxy.validationMessage).toBe("Enter a complete time");
    await userEvent.keyboard("30");
    await expect(form.checkValidity()).toBe(true);
    await expect(new FormData(form).get("reminder")).toBe("09:30");
    await expect(field.getBoundingClientRect().width).toBe(widthBefore);
  },
};

export const PeriodFirstReadsLeftToRight: Story = {
  name: "With periodPosition start, AM/PM is the leftmost segment, in the field and in the picker",
  render: () => <TimePicker aria-label="Start time" periodPosition="start" defaultValue="15:45" showSeconds />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lefts = (names: string[]) => names.map((name) => canvas.getByRole("spinbutton", { name }).getBoundingClientRect().left);
    const field = lefts(["AM/PM", "Hour", "Minute", "Second"]);
    await expect([...field].sort((a, b) => a - b)).toEqual(field);
    await userEvent.click(canvas.getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    const wheel = ["AM/PM", "Hour", "Minute", "Second"].map((name) => screen.getByRole("listbox", { name }).getBoundingClientRect().left);
    await expect([...wheel].sort((a, b) => a - b)).toEqual(wheel);
    // The wheel for the period sits on the same row as the others, centred on the band.
    const band = document.querySelector('[class*="band"]')!.getBoundingClientRect();
    await expect(band.width).toBeGreaterThan(0);
  },
};
