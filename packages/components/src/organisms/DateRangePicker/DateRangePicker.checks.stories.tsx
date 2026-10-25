import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { DateRangePicker } from "./DateRangePicker";

// Real-browser checks for what jsdom can't evaluate: where the calendar is drawn, a real mouse choosing a range inside a
// Dialog, text inserted all at once into each end, the width of the pair while it is typed into, target sizes, the height of
// each size against an Input, the months shown on a phone and beyond, the right-to-left layout and focus coming back. Hidden
// from the sidebar and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Inputs/DateRangePicker/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const TODAY = "2026-10-01";
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const body = () => within(document.body);
const startGroup = () => body().getByRole("group", { name: "Start date" }) as HTMLElement;
const endGroup = () => body().getByRole("group", { name: "End date" }) as HTMLElement;
const segment = (group: HTMLElement, name: string) => within(group).getByRole("spinbutton", { name }) as HTMLInputElement;
const dayButton = (date: string) => document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`);
const pair = () => body().getByRole("group", { name: /^(Stay|الإقامة)/ }) as HTMLElement;
const openButton = () => body().getByRole("button", { name: "Choose dates" });

// A measurement taken while the panel is still fading in is wrong by the easing's distance.
const settled = async (panel: HTMLElement) => {
  await nextFrame();
  const box = panel.closest("[data-radix-popper-content-wrapper]")?.firstElementChild as HTMLElement | null;
  await Promise.all((box?.getAnimations() ?? []).map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which a layer that
// disables the pointer outside it (a Dialog) never meets. The test page scales its iframe, so a point inside the story is
// mapped to the page it is drawn on.
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

const waitForDay = (date: string) =>
  waitFor(() => {
    const found = dayButton(date);
    if (!found) throw new Error("the calendar has not opened");
    return found;
  });

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-6)", maxWidth: "60rem", minHeight: "34rem" }}>
      <Button variant="secondary" data-testid="aside">
        Elsewhere
      </Button>
      {children}
    </div>
  );
}

export const CalendarSitsByThePair: Story = {
  name: "The calendar opens under the whole pair, above the page, in the pair's font, on the chosen start",
  render: () => (
    <Page>
      <DateRangePicker aria-label="Stay" defaultValue={["2026-10-12", "2026-10-15"]} today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(openButton());
    const dialog = await body().findByRole("dialog", { name: "Choose a date range" });
    await settled(dialog);
    const f = pair().getBoundingClientRect();
    const p = dialog.getBoundingClientRect();
    // below the pair, near it, lined up with its start edge, and on the screen
    await expect(p.top - f.bottom).toBeGreaterThanOrEqual(2);
    await expect(p.top - f.bottom).toBeLessThanOrEqual(12);
    await expect(Math.abs(p.left - f.left)).toBeLessThanOrEqual(1);
    await expect(p.right).toBeLessThanOrEqual(window.innerWidth);
    // the panel brings its own font and sits on the popover step
    await expect(getComputedStyle(dialog).fontFamily).toBe(getComputedStyle(pair()).fontFamily);
    await expect(getComputedStyle(dialog).zIndex).toBe("1500");
    const chosen = dayButton("2026-10-12") as HTMLButtonElement;
    const r = chosen.getBoundingClientRect();
    await expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)).toBe(chosen);
    await waitFor(() => expect(chosen).toHaveFocus());
  },
};

export const PointerChoosesARangeInADialog: Story = {
  name: "A range chosen with a real mouse in a DateRangePicker inside a Dialog, which stays open",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="With dates">
        <Dialog.Body>
          <DateRangePicker aria-label="Stay" today={TODAY} />
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await realClick(await body().findByRole("button", { name: "Choose dates" }));
    const first = await waitForDay("2026-10-12");
    await settled(body().getByRole("dialog", { name: "Choose a date range" }));
    const r = first.getBoundingClientRect();
    // the calendar is above the dialog's scrim and takes the pointer
    await expect(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)).toBe(first);
    await realClick(first);
    await waitFor(() => expect(segment(startGroup(), "Day")).toHaveValue("12"));
    // the panel is still open for the end
    await realClick(await waitForDay("2026-10-16"));
    await waitFor(() => expect(segment(endGroup(), "Day")).toHaveValue("16"));
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a date range" })).toBeNull());
    await expect(body().getByRole("dialog", { name: "With dates" })).toBeInTheDocument();
    await waitFor(() => expect(openButton()).toHaveFocus());
  },
};

export const InsertedTextFillsBothEnds: Story = {
  name: "Text inserted all at once, as a phone's keyboard, an autofill or a paste sends it, fills each end",
  render: () => (
    <Page>
      <DateRangePicker aria-label="Stay" today={TODAY} />
    </Page>
  ),
  play: async () => {
    segment(startGroup(), "Month").focus();
    await send("Input.insertText", { text: "10052026" });
    await waitFor(() => expect(segment(startGroup(), "Year")).toHaveValue("2026"));
    segment(endGroup(), "Month").focus();
    await send("Input.insertText", { text: "10092026" });
    await waitFor(() => expect(segment(endGroup(), "Year")).toHaveValue("2026"));
    await expect(segment(startGroup(), "Day")).toHaveValue("05");
    await expect(segment(endGroup(), "Day")).toHaveValue("09");
  },
};

export const WidthDoesNotMove: Story = {
  name: "The pair and its separators do not move as dates are typed, whatever the digits",
  render: () => (
    <Page>
      <DateRangePicker aria-label="Stay" today={TODAY} />
    </Page>
  ),
  play: async () => {
    const round = (value: number) => Math.round(value * 10) / 10;
    const measure = () => ({
      width: round(pair().getBoundingClientRect().width),
      startWidth: round(startGroup().getBoundingClientRect().width),
      endWidth: round(endGroup().getBoundingClientRect().width),
      endLeft: round(endGroup().getBoundingClientRect().left),
      height: round(pair().getBoundingClientRect().height),
    });
    const empty = measure();
    await userEvent.click(segment(startGroup(), "Month"));
    // wide digits, a half-typed year, then a whole date with the narrowest digits
    for (const text of ["08", "28", "2", "20", "2088"]) {
      await userEvent.keyboard(text);
      await expect(measure()).toEqual(empty);
    }
    await userEvent.click(segment(endGroup(), "Month"));
    await userEvent.keyboard("111");
    await expect(measure()).toEqual(empty);
  },
};

export const TargetsAreBigEnough: Story = {
  name: "The buttons are at least 24 by 24 pixels at every size",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DateRangePicker key={size} size={size} aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} today={TODAY} clearable />
      ))}
    </Page>
  ),
  play: async () => {
    const buttons = [...body().getAllByRole("button", { name: "Choose dates" }), ...body().getAllByRole("button", { name: "Clear dates" })];
    await expect(buttons).toHaveLength(10);
    for (const button of buttons) {
      const r = button.getBoundingClientRect();
      await expect(r.width).toBeGreaterThanOrEqual(24);
      await expect(r.height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const SameHeightAsInputAtEverySize: Story = {
  name: "Each end is as tall as an Input of the same size",
  render: () => (
    <Page>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-size={size} style={{ display: "flex", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
          <DateRangePicker size={size} aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} today={TODAY} />
          <Input size={size} aria-label={`Name, ${size}`} defaultValue="Jane" />
        </div>
      ))}
    </Page>
  ),
  play: async () => {
    const rows = [...document.querySelectorAll<HTMLElement>("[data-size]")];
    await expect(rows).toHaveLength(5);
    for (const row of rows) {
      const input = row.querySelector("input[aria-label^='Name']") as HTMLElement;
      // the Input's box is its wrapper; the bare input inside it has no border
      const box = (input.closest("[class*='root'], [class*='wrapper']") ?? input.parentElement) as HTMLElement;
      for (const end of within(row).getAllByRole("group", { name: /^(Start|End) date$/ })) {
        await expect(Math.abs(end.getBoundingClientRect().height - box.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
      }
    }
  },
};

export const MonthsFollowTheWidth: Story = {
  name: "One month on a phone and two beyond it, and the panel stays on the screen",
  render: () => (
    <Page>
      <DateRangePicker aria-label="Stay" defaultValue={["2026-10-12", "2026-10-15"]} today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(openButton());
    const dialog = await body().findByRole("dialog", { name: "Choose a date range" });
    await settled(dialog);
    const wide = window.matchMedia("(min-width: 640px)").matches;
    await expect(within(dialog).getAllByRole("grid")).toHaveLength(wide ? 2 : 1);
    const p = dialog.getBoundingClientRect();
    await expect(p.left).toBeGreaterThanOrEqual(0);
    await expect(p.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const OnAPhone: Story = {
  name: "On a phone: one month, a full-width panel, nothing scrolls sideways",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <DateRangePicker aria-label="Stay" presentation={{ base: "full-width", sm: "anchored" }} defaultValue={["2026-10-12", "2026-10-15"]} today={TODAY} />
    </div>
  ),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(640);
    await userEvent.click(openButton());
    const dialog = await body().findByRole("dialog", { name: "Choose a date range" });
    await settled(dialog);
    await expect(within(dialog).getAllByRole("grid")).toHaveLength(1);
    const p = dialog.getBoundingClientRect();
    await expect(p.left).toBeGreaterThanOrEqual(0);
    await expect(p.right).toBeLessThanOrEqual(window.innerWidth + 0.5);
    // spans the screen, less a small gap at each edge: it is the full-width form, not the anchored one's capped width
    await expect(getComputedStyle(dialog).maxWidth).toBe("none");
    await expect(p.left).toBeLessThanOrEqual(9);
    await expect(p.right).toBeGreaterThanOrEqual(window.innerWidth - 9);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // the pair wraps rather than overflowing
    await expect(pair().getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const ReasonLineDoesNotResizeThePanel: Story = {
  name: "The panel does not change height as the reason for an unavailable day appears",
  render: () => (
    <Page>
      <DateRangePicker
        aria-label="Stay"
        defaultValue={["2026-10-12", ""]}
        today={TODAY}
        unavailableReason={(date) => (date === "2026-10-20" ? "Fully booked" : undefined)}
      />
    </Page>
  ),
  play: async () => {
    await userEvent.click(openButton());
    const dialog = await body().findByRole("dialog", { name: "Choose a date range" });
    await settled(dialog);
    const before = dialog.getBoundingClientRect().height;
    (await waitForDay("2026-10-20")).focus();
    await waitFor(() => expect(within(dialog).getByText("Fully booked")).toBeInTheDocument());
    await expect(dialog.getBoundingClientRect().height).toBe(before);
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the segments still read in their format's order, and the buttons follow the page",
  render: () => (
    <div dir="rtl" style={{ padding: "var(--dbm-space-6)", maxWidth: "60rem" }}>
      <DateRangePicker
        aria-label="الإقامة"
        dir="rtl"
        format="dmy"
        defaultValue={["2026-10-05", "2026-10-09"]}
        today={TODAY}
        labels={{ start: "Start date", end: "End date" }}
        clearable
      />
    </div>
  ),
  play: async () => {
    const left = (element: Element) => element.getBoundingClientRect().left;
    for (const group of [startGroup(), endGroup()]) {
      // day, then month, then year, left to right
      await expect(left(segment(group, "Day"))).toBeLessThan(left(segment(group, "Month")));
      await expect(left(segment(group, "Month"))).toBeLessThan(left(segment(group, "Year")));
    }
    // the start comes first on the right, so the end is to its left, and the buttons are beyond the end
    await expect(left(endGroup())).toBeLessThan(left(startGroup()));
    await expect(left(openButton())).toBeLessThan(left(endGroup()));
    await userEvent.click(openButton());
    const dialog = await body().findByRole("dialog");
    await expect(dialog.querySelector("[dir='rtl']")).not.toBeNull();
  },
};

export const KeyboardRoundTrip: Story = {
  name: "Alt+ArrowDown on the end opens the calendar for the end, and focus is back on the segment it was opened from",
  render: () => (
    <Page>
      <DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", "2026-10-09"]} today={TODAY} />
    </Page>
  ),
  play: async () => {
    segment(endGroup(), "Day").focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await body().findByRole("dialog");
    await waitFor(() => expect(dayButton("2026-10-05")).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    // the start stays where it was and the end is the day chosen
    await waitFor(() => expect(segment(endGroup(), "Day")).toHaveValue("12"));
    await expect(segment(startGroup(), "Day")).toHaveValue("05");
    await waitFor(() => expect(segment(endGroup(), "Day")).toHaveFocus());
    // opened from the button, it goes back to the button
    await userEvent.click(openButton());
    await body().findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(openButton()).toHaveFocus();
  },
};

export const FocusIsKeptAfterAnOutsidePressOnce: Story = {
  name: "A press elsewhere that closed the calendar once does not stop focus coming back after a later keyboard close",
  render: () => (
    <Page>
      <DateRangePicker aria-label="Stay" defaultValue={["2026-10-05", ""]} today={TODAY} />
    </Page>
  ),
  play: async () => {
    await userEvent.click(openButton());
    await body().findByRole("dialog");
    await realClick(body().getByTestId("aside"));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    segment(startGroup(), "Month").focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await waitFor(() => expect(dayButton("2026-10-05")).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(document.activeElement).not.toBe(document.body);
    await expect(segment(startGroup(), "Month")).toHaveFocus();
  },
};

export const PresetsAreBigEnough: Story = {
  name: "The preset buttons are at least 24 by 24 pixels, and choosing one with a real mouse closes the calendar",
  render: () => (
    <Page>
      <DateRangePicker
        aria-label="Stay"
        today={TODAY}
        presets={[
          { label: "First week", value: ["2026-10-01", "2026-10-07"] },
          { label: "Next week", value: ["2026-10-08", "2026-10-14"] },
        ]}
      />
    </Page>
  ),
  play: async () => {
    await realClick(openButton());
    const dialog = await body().findByRole("dialog", { name: "Choose a date range" });
    await settled(dialog);
    const group = within(dialog).getByRole("group", { name: "Quick choices" });
    for (const button of within(group).getAllByRole("button")) {
      const r = button.getBoundingClientRect();
      await expect(r.width).toBeGreaterThanOrEqual(24);
      await expect(r.height).toBeGreaterThanOrEqual(24);
    }
    await realClick(within(group).getByRole("button", { name: "Next week" }));
    await waitFor(() => expect(segment(endGroup(), "Day")).toHaveValue("14"));
    await expect(segment(startGroup(), "Day")).toHaveValue("08");
    await waitFor(() => expect(body().queryByRole("dialog", { name: "Choose a date range" })).toBeNull());
  },
};
