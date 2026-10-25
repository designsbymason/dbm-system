import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Popover } from "../../molecules/Popover";
import { Dialog } from "../Dialog";
import { DatePicker } from "./DatePicker";

// Real-browser checks for what jsdom can't evaluate: where the calendar is drawn, a real mouse inside a Dialog and a
// Popover, text inserted all at once, the width of the field while it is typed into, target sizes, the right-to-left
// layout and forced colours. Hidden from the sidebar and the Docs page, and still run as tests (07 §4.2,
// guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Inputs/DatePicker/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const TODAY = "2026-10-16";
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const body = () => within(document.body);
const segment = (name: string) => body().getByRole("spinbutton", { name }) as HTMLInputElement;
const dayButton = (date: string) => document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`);
// The field's own group (the calendar inside a panel is a group too).
const field = () => body().getByRole("group", { name: /^(Start date|Card expires|Delivery date|تاريخ)/ }) as HTMLElement;

// A measurement taken while the panel is still fading in is wrong by the easing's distance.
const settled = async (panel: HTMLElement) => {
  await nextFrame();
  const box = panel.closest("[data-radix-popper-content-wrapper]")?.firstElementChild as HTMLElement | null;
  await Promise.all((box?.getAnimations() ?? []).map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which a layer
// that disables the pointer outside it (a Dialog) never meets. The test page scales its iframe, so a point inside
// the story is mapped to the page it is drawn on.
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-6)", maxWidth: "26rem", minHeight: "30rem" }}>
      <Button variant="secondary" data-testid="aside">
        Elsewhere
      </Button>
      {children}
    </div>
  );
}

export const CalendarSitsByTheField: Story = {
  name: "The calendar opens beside the field, above the page, in the field's font, on the chosen day",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const f = field().getBoundingClientRect();
    const p = dialog.getBoundingClientRect();
    // below the field, near it, and on the screen
    await expect(p.top - f.bottom).toBeGreaterThanOrEqual(2);
    await expect(p.top - f.bottom).toBeLessThanOrEqual(12);
    await expect(p.left).toBeGreaterThanOrEqual(0);
    await expect(p.right).toBeLessThanOrEqual(window.innerWidth);
    // the panel brings its own font and sits on the popover step
    await expect(getComputedStyle(dialog).fontFamily).toBe(getComputedStyle(field()).fontFamily);
    await expect(getComputedStyle(dialog).zIndex).toBe("1500");
    // a day is the top element at its own point, and focus is on the chosen one
    const chosen = dayButton("2026-10-15") as HTMLButtonElement;
    const r = chosen.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)).toBe(chosen);
    await waitFor(() => expect(chosen).toHaveFocus());
  },
};

export const PointerPicksADayInADialog: Story = {
  name: "A day chosen with a real mouse in a DatePicker inside a Dialog, which stays open",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a date">
        <Dialog.Body>
          <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("button", { name: "Choose date" }));
    const target = await waitFor(() => {
      const found = dayButton("2026-10-20");
      if (!found) throw new Error("the calendar has not opened");
      return found;
    });
    await settled(body().getByRole("dialog", { name: "Choose a date" }));
    const r = target.getBoundingClientRect();
    // the calendar is above the dialog's scrim and takes the pointer
    await expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)).toBe(target);
    await realClick(target);
    await waitFor(() => expect(segment("Day")).toHaveValue("20"));
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a date" })).toBeNull());
    await expect(body().getByRole("dialog", { name: "With a date" })).toBeInTheDocument();
    // focus is handed back to the button that opened it
    await waitFor(() => expect(body().getByRole("button", { name: "Choose date" })).toHaveFocus());
  },
};

export const PointerPicksADayInAPopover: Story = {
  name: "A day chosen with a real mouse in a DatePicker inside a Popover, which stays open",
  render: () => (
    <Popover defaultOpen>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content aria-label="With a date" hideArrow>
        <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
      </Popover.Content>
    </Popover>
  ),
  play: async () => {
    await realClick(await body().findByRole("button", { name: "Choose date" }));
    const target = await waitFor(() => {
      const found = dayButton("2026-10-21");
      if (!found) throw new Error("the calendar has not opened");
      return found;
    });
    await settled(body().getByRole("dialog", { name: "Choose a date" }));
    await realClick(target);
    await waitFor(() => expect(segment("Day")).toHaveValue("21"));
    await expect(body().getByRole("dialog", { name: "With a date" })).toBeInTheDocument();
  },
};

export const InsertedTextFillsEverySegment: Story = {
  name: "Text inserted all at once, as a phone's keyboard, an autofill or a paste sends it, fills the field",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" today={TODAY} />
    </Page>
  ),
  play: async () => {
    segment("Month").focus();
    await send("Input.insertText", { text: "03102026" });
    await waitFor(() => expect(segment("Year")).toHaveValue("2026"));
    await expect(segment("Month")).toHaveValue("03");
    await expect(segment("Day")).toHaveValue("10");
  },
};

export const WidthDoesNotMove: Story = {
  name: "The field and its separators do not move as a date is typed, whatever the digits",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" today={TODAY} />
    </Page>
  ),
  play: async () => {
    const measure = () => ({
      width: Math.round(field().getBoundingClientRect().width * 10) / 10,
      month: Math.round(segment("Month").getBoundingClientRect().width * 10) / 10,
      day: Math.round(segment("Day").getBoundingClientRect().width * 10) / 10,
      year: Math.round(segment("Year").getBoundingClientRect().width * 10) / 10,
      yearLeft: Math.round(segment("Year").getBoundingClientRect().left * 10) / 10,
    });
    const empty = measure();
    await userEvent.click(segment("Month"));
    // wide digits, a half-typed year, then a whole date with the narrowest digits
    for (const text of ["08", "28", "2", "20", "2088"]) {
      await userEvent.keyboard(text);
      await expect(measure()).toEqual(empty);
    }
    await userEvent.clear(segment("Year"));
    await userEvent.keyboard("{Backspace}");
    await expect(measure()).toEqual(empty);
  },
};

export const TargetsAreBigEnough: Story = {
  name: "The buttons are at least 24 by 24 pixels at every size",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DatePicker key={size} size={size} aria-label={`Start date, ${size}`} defaultValue="2026-10-03" today={TODAY} clearable />
      ))}
    </Page>
  ),
  play: async () => {
    for (const button of [...body().getAllByRole("button", { name: "Choose date" }), ...body().getAllByRole("button", { name: "Clear date" })]) {
      const r = button.getBoundingClientRect();
      await expect(r.width).toBeGreaterThanOrEqual(24);
      await expect(r.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const SameHeightAsInputAtEverySize: Story = {
  name: "Each size is as tall as an Input of the same size",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={{ display: "flex", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
          <DatePicker size={size} aria-label={`Start date, ${size}`} defaultValue="2026-10-03" today={TODAY} clearable />
          <Input size={size} aria-label={`Name, ${size}`} defaultValue="Jane" />
        </div>
      ))}
    </Page>
  ),
  play: async () => {
    const groups = body().getAllByRole("group", { name: /^Start date/ });
    for (const group of groups) {
      const input = group.parentElement?.querySelector("input[aria-label^='Name']") as HTMLElement;
      // the Input's box is its wrapper; the bare input inside it has no border
      const box = (input.closest("[class*='root'], [class*='wrapper']") ?? input.parentElement) as HTMLElement;
      await expect(Math.abs(group.getBoundingClientRect().height - box.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
    }
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the segments still read in their format's order, and the buttons follow the page",
  render: () => (
    <div dir="rtl" style={{ padding: "var(--dbm-space-6)", maxWidth: "26rem" }}>
      <DatePicker aria-label="تاريخ" dir="rtl" format="dmy" defaultValue="2026-10-03" today={TODAY} clearable />
    </div>
  ),
  play: async () => {
    const left = (element: Element) => element.getBoundingClientRect().left;
    // day, then month, then year, left to right
    await expect(left(segment("Day"))).toBeLessThan(left(segment("Month")));
    await expect(left(segment("Month"))).toBeLessThan(left(segment("Year")));
    // the buttons are on the far side from where the segments start
    await expect(left(body().getByRole("button", { name: "Choose date" }))).toBeLessThan(left(segment("Day")));
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog");
    await expect(dialog.querySelector("[dir='rtl']")).not.toBeNull();
  },
};

export const KeyboardRoundTrip: Story = {
  name: "Alt+ArrowDown opens the calendar, a key chooses a day, and focus is back on the segment it was opened from",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    segment("Day").focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await body().findByRole("dialog");
    await waitFor(() => expect(dayButton("2026-10-15")).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(segment("Day")).toHaveValue("22"));
    await waitFor(() => expect(segment("Day")).toHaveFocus());
    // opened from the button, it goes back to the button
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    await body().findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(body().getByRole("button", { name: "Choose date" })).toHaveFocus();
  },
};

export const FocusIsKeptAfterAnOutsidePressOnce: Story = {
  name: "A press elsewhere that closed the calendar once does not stop focus coming back after a later keyboard close",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    await body().findByRole("dialog");
    await realClick(body().getByTestId("aside"));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    segment("Month").focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await waitFor(() => expect(dayButton("2026-10-15")).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(document.activeElement).not.toBe(document.body);
    await expect(segment("Month")).toHaveFocus();
  },
};

export const ChosenDayChosenAgain: Story = {
  name: "A real mouse on the day that is already chosen closes the calendar and keeps the value",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    await realClick(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    await realClick(dayButton("2026-10-15") as Element);
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a date" })).toBeNull());
    await expect(segment("Day")).toHaveValue("15");
    await expect(body().getByRole("button", { name: "Choose date" })).toHaveFocus();
  },
};

export const PresetButtonsAreBigEnough: Story = {
  name: "The preset buttons are at least 24 by 24 pixels",
  render: () => (
    <Page>
      <DatePicker
        aria-label="Start date"
        today={TODAY}
        presets={[
          { label: "Today", value: TODAY },
          { label: "New year", value: "2027-01-01" },
        ]}
      />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const group = await body().findByRole("group", { name: "Quick choices" });
    for (const button of within(group).getAllByRole("button")) {
      const r = button.getBoundingClientRect();
      await expect(r.width).toBeGreaterThanOrEqual(24);
      await expect(r.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const FocusAfterClosingElsewhere: Story = {
  name: "Closing the calendar by moving focus away does not pull it back",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    await body().findByRole("dialog");
    await realClick(body().getByTestId("aside"));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(body().getByTestId("aside")).toHaveFocus();
  },
};

function Controlled() {
  const [value, setValue] = useState("2026-10-15");
  return <DatePicker aria-label="Start date" value={value} onValueChange={setValue} today={TODAY} />;
}

export const ControlledRoundTrip: Story = {
  name: "Wired to state, a day chosen and a segment stepped do not loop or undo each other",
  render: () => (
    <Page>
      <Controlled />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const target = await waitFor(() => {
      const found = dayButton("2026-10-24");
      if (!found) throw new Error("the calendar has not opened");
      return found;
    });
    await userEvent.click(target);
    await waitFor(() => expect(segment("Day")).toHaveValue("24"));
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowUp}");
    await expect(segment("Day")).toHaveValue("25");
  },
};

export const ForcedColors: Story = {
  name: "Forced colours: the focused segment still stands out and the field keeps its border",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const colour = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      await expect(getComputedStyle(field()).borderTopStyle).toBe("solid");
      const month = segment("Month");
      month.focus();
      await expect(getComputedStyle(month).backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(month).color).toBe(colour("HighlightText"));
    } finally {
      await emulate("none");
    }
  },
};

export const PanelLinesUpWithTheField: Story = {
  name: "The panel's start edge lines up with the field's, and end and top are honoured",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const f = field().getBoundingClientRect();
    await expect(Math.abs(dialog.getBoundingClientRect().left - f.left)).toBeLessThan(1.5);
  },
};

export const EndAlignedAndAbove: Story = {
  name: "align=end puts the panel's end edge on the field's, and side=top opens above it",
  render: () => (
    <div style={{ padding: "var(--dbm-space-6)", paddingBlockStart: "26rem", maxWidth: "40rem" }}>
      <DatePicker
        aria-label="Start date"
        defaultValue="2026-10-15"
        today={TODAY}
        side="top"
        align="end"
        style={{ marginInlineStart: "12rem" }}
      />
    </div>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const f = field().getBoundingClientRect();
    const p = dialog.getBoundingClientRect();
    await expect(p.bottom).toBeLessThanOrEqual(f.top);
    await expect(Math.abs(p.right - f.right)).toBeLessThan(1.5);
  },
};

export const ButtonTogglesWithARealMouse: Story = {
  name: "A real mouse on the button opens the panel, and a second press closes it without reopening",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} />
    </Page>
  ),
  play: async () => {
    const button = body().getByRole("button", { name: "Choose date" });
    await realClick(button);
    await body().findByRole("dialog", { name: "Choose a date" });
    await realClick(button);
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a date" })).toBeNull());
    // and it stays closed: the press was the toggle, not an outside press followed by a click
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(body().queryByRole("dialog", { name: "Choose a date" })).toBeNull();
    await expect(button).toHaveFocus();
  },
};

export const FullWidthSpansTheScreen: Story = {
  name: "Full width: the panel spans the visible screen with a small gap at each edge, and the calendar stays in the middle",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} presentation="full-width" />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const p = dialog.getBoundingClientRect();
    const width = window.visualViewport?.width ?? window.innerWidth;
    await expect(Math.abs(p.width - (width - 16))).toBeLessThan(1.5);
    await expect(p.left).toBeGreaterThanOrEqual(7);
    await expect(p.right).toBeLessThanOrEqual(width - 7);
    // the calendar is centred in it, not left against the edge
    const grid = within(dialog).getByRole("grid") as HTMLElement;
    const g = grid.getBoundingClientRect();
    await expect(Math.abs(g.left - p.left - (p.right - g.right))).toBeLessThan(2);
  },
};

export const PanelOnAPhone: Story = {
  name: "On a narrow screen the panel fits inside it, with presets wrapping under the calendar",
  render: () => (
    <div style={{ width: "20rem", padding: "var(--dbm-space-2)", overflow: "hidden" }}>
      <DatePicker
        aria-label="Start date"
        defaultValue="2026-10-15"
        today={TODAY}
        size="sm"
        calendarProps={{ size: "sm" }}
        presets={[
          { label: "Today", value: TODAY },
          { label: "End of the month", value: "2026-10-31" },
          { label: "New year", value: "2027-01-01" },
        ]}
      />
    </div>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const p = dialog.getBoundingClientRect();
    await expect(p.left).toBeGreaterThanOrEqual(0);
    await expect(p.right).toBeLessThanOrEqual(window.innerWidth);
    const group = within(dialog).getByRole("group", { name: "Quick choices" });
    await expect(group.getBoundingClientRect().top).toBeGreaterThan(within(dialog).getByRole("grid").getBoundingClientRect().bottom - 1);
  },
};

export const PresetWithARealMouseInADialog: Story = {
  name: "A preset chosen with a real mouse inside a Dialog picks the date and leaves the Dialog open",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a date">
        <Dialog.Body>
          <DatePicker aria-label="Start date" today={TODAY} presets={[{ label: "Today", value: (today) => today }]} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("button", { name: "Choose date" }));
    const preset = await body().findByRole("button", { name: "Today" });
    await settled(body().getByRole("dialog", { name: "Choose a date" }));
    const r = preset.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)).toBe(preset);
    await realClick(preset);
    await waitFor(() => expect(segment("Day")).toHaveValue("16"));
    await expect(body().getByRole("dialog", { name: "With a date" })).toBeInTheDocument();
  },
};

export const MonthGridWithARealMouse: Story = {
  name: "By month: a real mouse chooses a month from the grid, in a Dialog, and the field fills",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With a month">
        <Dialog.Body>
          <DatePicker aria-label="Card expires" granularity="month" defaultValue="2028-03" today={TODAY} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const month = within(dialog).getByRole("button", { name: "Jul, July" });
    const r = month.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)).toBe(month);
    await realClick(month);
    await waitFor(() => expect(segment("Month")).toHaveValue("07"));
    await expect(segment("Year")).toHaveValue("2028");
  },
};

export const MonthFieldWidthDoesNotMove: Story = {
  name: "By month: the field does not change width as digits are typed",
  render: () => (
    <Page>
      <DatePicker aria-label="Card expires" granularity="month" today={TODAY} />
    </Page>
  ),
  play: async () => {
    const measure = () => Math.round(field().getBoundingClientRect().width * 10) / 10;
    const empty = measure();
    await userEvent.click(segment("Month"));
    for (const text of ["08", "2", "20", "2088"]) {
      await userEvent.keyboard(text);
      await expect(measure()).toBe(empty);
    }
  },
};

export const ReasonDoesNotMoveThePanel: Story = {
  name: "The reason line under the calendar does not change the panel's height as the focus moves across days",
  render: () => (
    <Page>
      <DatePicker
        aria-label="Delivery date"
        defaultValue="2026-10-19"
        today={TODAY}
        unavailableReason={(date) => (date === "2026-10-20" ? "Fully booked, choose another day" : undefined)}
      />
    </Page>
  ),
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Choose date" }));
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    await waitFor(() => expect(dayButton("2026-10-19")).toHaveFocus());
    const before = dialog.getBoundingClientRect().height;
    await userEvent.keyboard("{ArrowRight}");
    const hint = dialog.querySelector("[class*='hint']") as HTMLElement;
    await waitFor(() => expect(hint).toHaveTextContent("Fully booked"));
    await expect(dialog.getBoundingClientRect().height).toBe(before);
  },
};

export const RoundedDaysAndMonths: Story = {
  name: "rounded draws the days, and by month the month cells, as circles; the field keeps its corners",
  render: () => (
    <Page>
      <DatePicker aria-label="Start date" defaultValue="2026-10-15" today={TODAY} rounded />
      <DatePicker aria-label="Card expires" granularity="month" defaultValue="2026-10" today={TODAY} rounded />
    </Page>
  ),
  play: async () => {
    const radius = (element: Element) => parseFloat(getComputedStyle(element).borderTopLeftRadius);
    const fieldRadius = radius(body().getByRole("group", { name: "Start date" }));
    await userEvent.click(body().getAllByRole("button", { name: "Choose date" })[0] as HTMLElement);
    const dialog = await body().findByRole("dialog", { name: "Choose a date" });
    await settled(dialog);
    const day = dayButton("2026-10-15") as HTMLButtonElement;
    await expect(radius(day)).toBeGreaterThanOrEqual(day.getBoundingClientRect().height / 2 - 0.5);
    // the field's own corners are the same as ever
    await expect(radius(body().getByRole("group", { name: "Start date" }))).toBe(fieldRadius);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await userEvent.click(body().getAllByRole("button", { name: /Choose (date|month)/ })[1] as HTMLElement);
    const months = await body().findByRole("dialog");
    await settled(months);
    const cell = months.querySelector("button[data-picker-cell]") as HTMLButtonElement;
    await expect(radius(cell)).toBeGreaterThanOrEqual(cell.getBoundingClientRect().height / 2 - 0.5);
  },
};
