import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { CaretLeftIcon } from "@dbm-system/icons";
import { IconButton } from "../../atoms/IconButton";
import { send } from "../CodeBlock/browserProtocol";
import { Calendar } from "./Calendar";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus
// rings, the Docs page's own stylesheet — measured in Chromium.
const meta: Meta = {
  title: "Components/Calendar/Checks",
  id: "molecules-inputs-calendar-checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const day = (root: HTMLElement, date: string) => root.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!;
const box = (element: Element) => element.getBoundingClientRect();
const colour = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

export const DaysAreSquaresAsTallAsAnIconButton: Story = {
  name: "At every size a day is a square as tall as an IconButton of that step, and the grid is seven wide",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {sizes.map((size) => (
        <div key={size} data-testid={`row-${size}`} style={{ display: "flex", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
          <Calendar size={size} defaultMonth="2026-10" today="2026-10-14" aria-label={`c-${size}`} />
          <IconButton size={size} icon={CaretLeftIcon} aria-label={`b-${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const row = canvas.getByTestId(`row-${size}`);
      const calendar = row.firstElementChild as HTMLElement;
      const reference = box(row.querySelector("button[aria-label^='b-']")!);
      const first = box(day(calendar, "2026-10-14"));
      await expect(Math.abs(first.height - reference.height)).toBeLessThan(1);
      await expect(Math.abs(first.width - first.height)).toBeLessThan(1);
      await expect(Math.abs(box(calendar).width - 7 * reference.width)).toBeLessThan(1);
    }
  },
};

export const GridKeepsItsHeight: Story = {
  name: "The grid is as tall in a five-week month as in a six-week one, and does not move as the month changes",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-02" today="2026-10-14" aria-label="February" data-testid="feb" />
      <Calendar defaultMonth="2026-11" today="2026-10-14" aria-label="November" data-testid="nov" />
      <Calendar defaultMonth="2026-08" today="2026-10-14" aria-label="August" data-testid="aug" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heights = ["feb", "nov", "aug"].map((id) => box(canvas.getByTestId(id)).height);
    await expect(Math.abs(heights[0]! - heights[1]!)).toBeLessThan(1);
    await expect(Math.abs(heights[0]! - heights[2]!)).toBeLessThan(1);
    const aug = canvas.getByTestId("aug");
    const before = box(aug);
    const nextButton = within(aug).getByRole("button", { name: "Next month" });
    const nextBefore = box(nextButton);
    await userEvent.click(nextButton);
    await expect(box(aug).height).toBe(before.height);
    // The buttons keep their place whatever the heading says.
    await expect(box(nextButton).x).toBe(nextBefore.x);
    await expect(box(nextButton).y).toBe(nextBefore.y);
  },
};

export const SevenEqualColumns: Story = {
  name: "The seven columns are equal, and the calendar shrinks to a narrow container without overflowing",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <Calendar defaultMonth="2026-10" today="2026-10-14" aria-label="Wide" data-testid="wide" />
      <div style={{ inlineSize: "14rem" }} data-testid="narrow-box">
        <Calendar size="xl" defaultMonth="2026-10" today="2026-10-14" aria-label="Narrow" data-testid="narrow" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const widths = [...canvas.getByTestId("wide").querySelectorAll("th")].map((th) => box(th).width);
    await expect(widths).toHaveLength(7);
    for (const width of widths) await expect(Math.abs(width - widths[0]!)).toBeLessThan(1);
    const narrow = canvas.getByTestId("narrow");
    const boxWidth = box(canvas.getByTestId("narrow-box")).width;
    await expect(box(narrow).width).toBeLessThanOrEqual(boxWidth + 0.5);
    await expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth + 1);
    const grid = narrow.querySelector("table")!;
    await expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
  },
};

export const RightToLeft: Story = {
  name: "Right to left: the week starts at the right, the buttons swap sides and the arrow keys follow the picture",
  render: () => <Calendar dir="rtl" defaultMonth="2026-10" today="2026-10-14" aria-label="rtl" data-testid="rtl" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId("rtl");
    const [first, last] = [...root.querySelectorAll("th")];
    await expect(box(first!).x).toBeGreaterThan(box(last!).x);
    const previous = within(root).getByRole("button", { name: "Previous month" });
    const next = within(root).getByRole("button", { name: "Next month" });
    await expect(box(previous).x).toBeGreaterThan(box(next).x);
    // The previous button's arrow points the way the page reads backwards: to the right.
    await expect(previous.querySelector("svg")).toBeInTheDocument();
    day(root, "2026-10-14").focus();
    const before = box(day(root, "2026-10-14"));
    await userEvent.keyboard("{ArrowLeft}");
    const after = box(document.activeElement as Element);
    await expect((document.activeElement as HTMLElement).dataset.date).toBe("2026-10-15");
    await expect(after.x).toBeLessThan(before.x);
  },
};

export const RangeStripIsContinuous: Story = {
  name: "The strip behind a range runs unbroken between its ends, which it only half covers",
  render: () => (
    <Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" defaultValue={["2026-10-12", "2026-10-16"]} aria-label="strip" data-testid="strip" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("strip");
    const pseudo = (date: string) => getComputedStyle(day(root, date).closest("td")!, "::before");
    const cellWidth = box(day(root, "2026-10-14")).width;
    await expect(pseudo("2026-10-14").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(Math.abs(parseFloat(pseudo("2026-10-14").width) - cellWidth)).toBeLessThan(1);
    // The first day's strip is its half toward the end of the range, the last day's the half toward the start.
    await expect(Math.abs(parseFloat(pseudo("2026-10-12").width) - cellWidth / 2)).toBeLessThan(1);
    await expect(Math.abs(parseFloat(pseudo("2026-10-16").width) - cellWidth / 2)).toBeLessThan(1);
    await expect(getComputedStyle(day(root, "2026-10-17").closest("td")!, "::before").content).toBe("none");
    // The ends are the brand fill; the days between are not.
    await expect(getComputedStyle(day(root, "2026-10-12")).backgroundColor).not.toBe(getComputedStyle(day(root, "2026-10-14")).backgroundColor);
  },
};

export const FocusRingFitsInsideTheDay: Story = {
  name: "The focus ring is drawn inside the day, and in a readable colour on a chosen one",
  render: () => <Calendar defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-14" aria-label="focus" data-testid="focus" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("focus");
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    const chosen = day(root, "2026-10-14");
    await expect(chosen).toHaveFocus();
    const style = getComputedStyle(chosen);
    await expect(style.outlineStyle).toBe("solid");
    await expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
    // On the brand fill the ring takes the on-brand icon colour, not the focus colour.
    await expect(style.outlineColor).not.toBe(colour(getComputedStyle(document.documentElement).getPropertyValue("--dbm-border-focus")));
    await userEvent.keyboard("{ArrowRight}");
    const plain = getComputedStyle(document.activeElement as Element);
    await expect(plain.outlineColor).toBe(colour(getComputedStyle(document.documentElement).getPropertyValue("--dbm-border-focus")));
  },
};

export const ForcedColours: Story = {
  name: "Forced colours: a chosen day is the system highlight, the strip becomes two lines and today an outline",
  render: () => (
    <Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" defaultValue={["2026-10-12", "2026-10-16"]} aria-label="forced" data-testid="forced" />
  ),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const root = within(canvasElement).getByTestId("forced");
      await expect(getComputedStyle(day(root, "2026-10-12")).backgroundColor).toBe(colour("Highlight"));
      await expect(getComputedStyle(day(root, "2026-10-12")).color).toBe(colour("HighlightText"));
      const strip = getComputedStyle(day(root, "2026-10-14").closest("td")!, "::before");
      await expect(strip.borderTopStyle).toBe("solid");
      await expect(strip.borderTopWidth).not.toBe("0px");
      const today = getComputedStyle(day(root, "2026-10-14"));
      await expect(today.outlineStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const OnTheDocsPage: Story = {
  name: "Inside the Docs page's own content wrapper it looks the same as on its own",
  render: () => (
    <div>
      <Calendar defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" aria-label="plain" data-testid="plain" />
      <div className="sbdocs sbdocs-content">
        <Calendar defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" aria-label="docs" data-testid="docs" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [plain, docs] = [canvas.getByTestId("plain"), canvas.getByTestId("docs")];
    await expect(Math.abs(box(plain).width - box(docs).width)).toBeLessThan(1);
    await expect(Math.abs(box(plain).height - box(docs).height)).toBeLessThan(1);
    for (const [selector, property] of [
      ["td", "padding-top"],
      ["td", "border-top-width"],
      ["th", "padding-top"],
      ["th", "border-top-width"],
      ["button[data-date]", "border-top-width"],
      ["button[data-date]", "color"],
    ] as const) {
      await expect(getComputedStyle(docs.querySelector(selector)!).getPropertyValue(property)).toBe(
        getComputedStyle(plain.querySelector(selector)!).getPropertyValue(property),
      );
    }
  },
};

export const NeverNarrowerThanSevenTargets: Story = {
  name: "In a container narrower than seven 24px days it keeps that width and overflows, instead of squeezing the days together",
  render: () => (
    <div style={{ inlineSize: "6rem", overflow: "auto", border: "1px dashed currentColor" }} data-testid="tight">
      <Calendar size="xs" defaultMonth="2026-10" today="2026-10-14" aria-label="Tight" data-testid="tight-calendar" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = canvas.getByTestId("tight");
    const calendar = canvas.getByTestId("tight-calendar");
    // Seven 24px targets, the least WCAG 2.5.8 allows.
    await expect(box(calendar).width).toBeGreaterThanOrEqual(7 * 24 - 0.5);
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    for (const th of calendar.querySelectorAll("th")) await expect(box(th).width).toBeGreaterThanOrEqual(24 - 0.5);
    for (const date of ["2026-10-14", "2026-10-15"]) await expect(box(day(calendar, date)).width).toBeGreaterThanOrEqual(24 - 0.5);
  },
};

export const RoundedDays: Story = {
  name: "Rounded: a day is a circle, and so are its focus ring, today's ring and the month buttons",
  render: () => (
    <Calendar rounded defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" aria-label="rounded" data-testid="rounded" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rounded");
    for (const date of ["2026-10-06", "2026-10-14", "2026-10-20"]) {
      const radius = parseFloat(getComputedStyle(day(root, date)).borderTopLeftRadius);
      await expect(radius).toBeGreaterThanOrEqual(box(day(root, date)).height / 2);
    }
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(day(root, "2026-10-06")).toHaveFocus();
    await expect(parseFloat(getComputedStyle(day(root, "2026-10-06")).borderTopLeftRadius)).toBeGreaterThanOrEqual(box(day(root, "2026-10-06")).height / 2);
    const previous = within(root).getByRole("button", { name: "Previous month" });
    await expect(parseFloat(getComputedStyle(previous).borderTopLeftRadius)).toBeGreaterThanOrEqual(box(previous).height / 2);
  },
};

export const KeyFitsBelowTheGrid: Story = {
  name: "The key sits below the grid, wraps in a narrow container and never moves the grid",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-10" today="2026-10-14" mode="range" isDateDisabled={(date) => date.endsWith("-20")} showLegend aria-label="with key" data-testid="with-key" />
      <Calendar defaultMonth="2026-10" today="2026-10-14" mode="range" isDateDisabled={(date) => date.endsWith("-20")} aria-label="without key" data-testid="without-key" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const withKey = canvas.getByTestId("with-key");
    const without = canvas.getByTestId("without-key");
    const grid = (root: HTMLElement) => box(root.querySelector("table")!);
    await expect(grid(withKey).y).toBe(grid(without).y);
    await expect(grid(withKey).height).toBe(grid(without).height);
    const list = within(withKey).getByRole("list", { name: "Key" });
    await expect(box(list).y).toBeGreaterThanOrEqual(grid(withKey).bottom);
    // Every entry fits within the calendar's width.
    await expect(box(list).right).toBeLessThanOrEqual(box(withKey).right + 0.5);
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
  },
};

/** The box of a day's number, apart from anything else drawn in its button. */
const numberBox = (button: Element) => {
  const text = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)!;
  const range = document.createRange();
  range.selectNodeContents(text);
  return range.getBoundingClientRect();
};

export const FieldsFitTheHeader: Story = {
  name: "The month and year fields fit between the buttons at every size, and the heading row keeps its height",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {sizes.map((size) => (
        <Calendar key={size} size={size} captionLayout="dropdown" defaultMonth="2026-10" today="2026-10-14" aria-label={`d-${size}`} data-testid={`d-${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const root = canvas.getByTestId(`d-${size}`);
      const bounds = box(root);
      const [month, year] = within(root).getAllByRole("combobox").map(box);
      const previous = box(within(root).getByRole("button", { name: "Previous month" }));
      const next = box(within(root).getByRole("button", { name: "Next month" }));
      // Inside the calendar, side by side without overlapping each other or a button.
      for (const field of [month!, year!]) {
        await expect(field.left).toBeGreaterThanOrEqual(bounds.left - 0.5);
        await expect(field.right).toBeLessThanOrEqual(bounds.right + 0.5);
      }
      await expect(month!.right).toBeLessThanOrEqual(year!.left + 0.5);
      if (size !== "xs") {
        // On the same row as the buttons, between them.
        await expect(month!.left).toBeGreaterThanOrEqual(previous.right - 0.5);
        await expect(year!.right).toBeLessThanOrEqual(next.left + 0.5);
      } else {
        // At xs they take a row of their own under the buttons.
        await expect(month!.top).toBeGreaterThanOrEqual(previous.bottom - 0.5);
      }
    }
  },
};

export const MonthsSideBySideThenStacked: Story = {
  name: "Two months sit side by side with equal widths, and stack when their container is too narrow",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <Calendar numberOfMonths={2} defaultMonth="2026-10" today="2026-10-14" aria-label="wide" data-testid="wide-two" />
      <div style={{ inlineSize: "22rem" }}>
        <Calendar numberOfMonths={2} defaultMonth="2026-10" today="2026-10-14" aria-label="narrow" data-testid="narrow-two" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second] = within(canvas.getByTestId("wide-two")).getAllByRole("grid").map(box);
    await expect(Math.abs(first!.width - second!.width)).toBeLessThan(1);
    await expect(Math.abs(first!.top - second!.top)).toBeLessThan(1);
    await expect(second!.left).toBeGreaterThan(first!.right);
    const narrow = canvas.getByTestId("narrow-two");
    const [top, below] = within(narrow).getAllByRole("grid").map(box);
    await expect(below!.top).toBeGreaterThanOrEqual(top!.bottom - 0.5);
    await expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth + 1);
    await expect(box(narrow).width).toBeLessThanOrEqual(22 * 16 + 0.5);
  },
};

export const MonthsMirrorInRightToLeft: Story = {
  name: "Right to left: the first month is at the right, with the previous button, and the next button ends at the left",
  render: () => <Calendar dir="rtl" numberOfMonths={2} defaultMonth="2026-10" today="2026-10-14" aria-label="rtl two" data-testid="rtl-two" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rtl-two");
    const [october, november] = within(root).getAllByRole("grid").map(box);
    await expect(october!.left).toBeGreaterThan(november!.left);
    const previous = box(within(root).getByRole("button", { name: "Previous month" }));
    const next = box(within(root).getByRole("button", { name: "Next month" }));
    await expect(previous.left).toBeGreaterThan(next.left);
    day(root, "2026-10-31").focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect((document.activeElement as HTMLElement).dataset.date).toBe("2026-11-01");
  },
};

export const MarkerSitsInsideTheDay: Story = {
  name: "A marker's dot sits under the number inside the day, and with content every number is in line",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-10" today="2026-10-14" getMarker={(date) => (date === "2026-10-20" ? { tone: "info" } : undefined)} aria-label="dots" data-testid="dots" />
      <Calendar
        size="lg"
        showOutsideDays={false}
        defaultMonth="2026-10"
        today="2026-10-14"
        getMarker={(date) => (date === "2026-10-20" ? { content: <span>$80</span>, label: "$80" } : undefined)}
        aria-label="content"
        data-testid="content"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dots = canvas.getByTestId("dots");
    const marked = day(dots, "2026-10-20");
    const dot = marked.querySelector("[aria-hidden='true'] > span")!;
    await expect(box(dot).bottom).toBeLessThanOrEqual(box(marked).bottom + 0.5);
    await expect(box(dot).top).toBeGreaterThanOrEqual(numberBox(marked).bottom - 1);
    await expect(Math.abs(box(dot).left + box(dot).width / 2 - (box(marked).left + box(marked).width / 2))).toBeLessThan(1);
    // A dot leaves the numbers where they are.
    await expect(Math.abs(numberBox(marked).top - numberBox(day(dots, "2026-10-21")).top)).toBeLessThan(0.5);
    const content = canvas.getByTestId("content");
    const priced = day(content, "2026-10-20");
    const slot = priced.querySelector("[aria-hidden='true']")!;
    // The content sits under its number, inside the day, and every number in the row is at the same height.
    await expect(box(slot).top).toBeGreaterThanOrEqual(numberBox(priced).bottom - 1);
    await expect(box(slot).bottom).toBeLessThanOrEqual(box(priced).bottom + 0.5);
    await expect(Math.abs(numberBox(priced).top - numberBox(day(content, "2026-10-21")).top)).toBeLessThan(0.5);
  },
};

export const FooterKeepsFocus: Story = {
  name: "Clear leaves keyboard focus on itself, and the footer sits below the grid and the key",
  render: () => (
    <Calendar clearable showTodayButton showLegend defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-06" footer={<span data-testid="note">Note</span>} aria-label="footer" data-testid="footer" />
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("footer");
    const clear = within(root).getByRole("button", { name: "Clear" });
    const key = within(root).getByRole("list", { name: "Key" });
    await expect(box(clear).top).toBeGreaterThanOrEqual(box(key).bottom - 0.5);
    await expect(box(within(root).getByTestId("note")).top).toBeGreaterThanOrEqual(box(root.querySelector("table")!).bottom);
    clear.focus();
    await userEvent.keyboard("{Enter}");
    await expect(clear).toHaveFocus();
    await expect(clear).toHaveAttribute("aria-disabled", "true");
  },
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// One story per size: twelve calendars each, because sixty in one test is too slow for a busy runner.
const everyMonthFits = (size: (typeof sizes)[number]): Story => ({
  name: `Every month's name fits the month field's button at size ${size}, with the arrow inside the border`,
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
      {monthNames.map((_, index) => (
        <Calendar
          key={index}
          size={size}
          captionLayout="dropdown"
          defaultMonth={`2026-${String(index + 1).padStart(2, "0")}`}
          today="2026-10-14"
          aria-label={`${size}-${index + 1}`}
          data-testid={`${size}-${index + 1}`}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Every measure is gathered and judged once at the end: awaiting each of them is slow on a busy runner.
    const problems: string[] = [];
    const must = (ok: boolean, what: string): void => {
      if (!ok) problems.push(what);
    };
    for (const [index, name] of monthNames.entries()) {
      const where = `${size} ${name}`;
      const root = canvas.getByTestId(`${size}-${index + 1}`);
      const trigger = within(root).getByRole("combobox", { name: "Month" });
      const bounds = box(trigger);
      const arrow = box(trigger.querySelector("svg")!);
      // The arrow is inside the button's border box, and the text does not run past its own room.
      must(arrow.right <= bounds.right + 0.5, `${where}: arrow past the right edge`);
      must(arrow.left >= bounds.left - 0.5, `${where}: arrow past the left edge`);
      must(trigger.scrollWidth <= trigger.clientWidth + 1, `${where}: text runs past the button`);
      // What is drawn is the short name; the full name is what assistive technology reads.
      const short = trigger.querySelector<HTMLElement>("[class*='monthShort']")!;
      const full = trigger.querySelector<HTMLElement>("[class*='monthFull']")!;
      must(short.textContent === name.slice(0, 3), `${where}: short name is "${short.textContent}"`);
      must(getComputedStyle(short).display !== "none", `${where}: short name is not drawn`);
      must(box(short).width > 2, `${where}: short name has no width`);
      // The full name is in the button but clipped to a dot, so it takes no room and is not drawn.
      must(full.textContent === name, `${where}: full name is "${full.textContent}"`);
      must(box(full).width <= 2, `${where}: full name takes room`);
    }
    await expect(problems).toEqual([]);
    // The list opened from it shows the full names.
    const root = canvas.getByTestId(`${size}-9`);
    await userEvent.click(within(root).getByRole("combobox", { name: "Month" }));
    const options = await within(document.body).findAllByRole("option");
    // What is drawn in the list (`innerText` leaves out the short names that are `display: none`) is the full names.
    await expect(options.map((option) => option.innerText.trim())).toEqual(monthNames);
    for (const option of options) await expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
    await userEvent.keyboard("{Escape}");
  },
});

export const EveryMonthFitsItsFieldXs: Story = everyMonthFits("xs");
export const EveryMonthFitsItsFieldSm: Story = everyMonthFits("sm");
export const EveryMonthFitsItsFieldMd: Story = everyMonthFits("md");
export const EveryMonthFitsItsFieldLg: Story = everyMonthFits("lg");
export const EveryMonthFitsItsFieldXl: Story = everyMonthFits("xl");

export const WeekNumbersAlignWithRows: Story = {
  name: "Week numbers: a column as wide as a day, each number level with its row, and the days keep their widths",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-10" today="2026-10-14" aria-label="plain" data-testid="plain" />
      <Calendar showWeekNumbers defaultMonth="2026-10" today="2026-10-14" aria-label="weeks" data-testid="weeks" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByTestId("plain");
    const weeks = canvas.getByTestId("weeks");
    const cellWidth = box(day(plain, "2026-10-14")).width;
    // Eight columns of one day's width.
    await expect(Math.abs(box(weeks).width - 8 * cellWidth)).toBeLessThan(1);
    await expect(Math.abs(box(day(weeks, "2026-10-14")).width - cellWidth)).toBeLessThan(1);
    const heading = within(weeks).getByRole("columnheader", { name: "Week number" });
    await expect(Math.abs(box(heading).width - cellWidth)).toBeLessThan(1);
    // Each number sits in its row.
    for (const row of weeks.querySelectorAll("tbody tr")) {
      const number = row.querySelector("th")!;
      const first = row.querySelector("button")!;
      await expect(Math.abs(box(number).top - box(first).top)).toBeLessThan(1);
      await expect(Math.abs(box(number).height - box(first).height)).toBeLessThan(1);
    }
    // The week number is before the first day, in the reading direction.
    await expect(box(weeks.querySelector("tbody th")!).right).toBeLessThanOrEqual(box(day(weeks, "2026-09-27")).left + 0.5);
  },
};

export const OnlyTheRowsAMonthNeeds: Story = {
  name: "Without fixed weeks a four-row month is shorter than a six-row one, by exactly the rows left out",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar defaultMonth="2026-02" today="2026-10-14" aria-label="fixed" data-testid="fixed" />
      <Calendar fixedWeeks={false} defaultMonth="2026-02" today="2026-10-14" aria-label="flexible" data-testid="flexible" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fixed = canvas.getByTestId("fixed");
    const flexible = canvas.getByTestId("flexible");
    const rowHeight = box(day(fixed, "2026-02-10")).height;
    await expect(flexible.querySelectorAll("tbody tr")).toHaveLength(4);
    await expect(Math.abs(box(fixed).height - box(flexible).height - 2 * rowHeight)).toBeLessThan(1);
  },
};

export const StripIsRoundedAtRowEnds: Story = {
  name: "The strip behind a range is rounded where it meets the end of a row, and square between days",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", alignItems: "flex-start" }}>
      <Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" defaultValue={["2026-10-08", "2026-10-20"]} aria-label="strip" data-testid="strip-square" />
      <Calendar rounded mode="range" defaultMonth="2026-10" today="2026-10-14" defaultValue={["2026-10-08", "2026-10-20"]} aria-label="strip rounded" data-testid="strip-round" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radius = (root: HTMLElement, date: string, corner: string) =>
      parseFloat(getComputedStyle(day(root, date).closest("td")!, "::before").getPropertyValue(corner));
    const square = canvas.getByTestId("strip-square");
    // Oct 10 is the last day of its row (Saturday), Oct 11 the first of the next (Sunday).
    await expect(radius(square, "2026-10-10", "border-top-right-radius")).toBeGreaterThan(0);
    await expect(radius(square, "2026-10-11", "border-top-left-radius")).toBeGreaterThan(0);
    await expect(radius(square, "2026-10-10", "border-top-left-radius")).toBe(0);
    await expect(radius(square, "2026-10-15", "border-top-left-radius")).toBe(0);
    await expect(radius(square, "2026-10-15", "border-top-right-radius")).toBe(0);
    // Rounded draws them as full circles' halves.
    const round = canvas.getByTestId("strip-round");
    await expect(radius(round, "2026-10-10", "border-top-right-radius")).toBeGreaterThan(radius(square, "2026-10-10", "border-top-right-radius"));
  },
};

export const MonthChangeSlides: Story = {
  name: "A month change slides the grid in and leaves the buttons still; under reduced motion it does not",
  render: () => <Calendar defaultMonth="2026-10" today="2026-10-14" aria-label="motion" data-testid="motion" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("motion");
    const grid = () => root.querySelector("table")!;
    const next = within(root).getByRole("button", { name: "Next month" });
    await expect(getComputedStyle(grid()).animationName).toBe("none");
    await userEvent.click(next);
    await expect(getComputedStyle(grid()).animationName).toMatch(/monthIn/);
    await expect(getComputedStyle(next).animationName).toBe("none");
    const first = getComputedStyle(grid()).animationName;
    await userEvent.click(next);
    await expect(getComputedStyle(grid()).animationName).not.toBe(first);
    const emulate = (value: "reduce" | "no-preference") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
    await emulate("reduce");
    try {
      await settle(200);
      await userEvent.click(next);
      await expect(getComputedStyle(grid()).animationName).toBe("none");
    } finally {
      await emulate("no-preference");
    }
  },
};

export const RealMouseDrag: Story = {
  name: "Dragging with a real mouse across days chooses the range, and draws it as it goes",
  render: () => <Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" aria-label="drag" data-testid="drag" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("drag");
    const from = day(root, "2026-10-08");
    const to = day(root, "2026-10-13");
    await userEvent.pointer([{ keys: "[MouseLeft>]", target: from }, { target: day(root, "2026-10-11") }]);
    await expect(day(root, "2026-10-10").closest("td")).toHaveAttribute("aria-selected", "true");
    await expect(from).toHaveClass(/selected/);
    await userEvent.pointer([{ target: to }, { keys: "[/MouseLeft]", target: to }]);
    for (const date of ["2026-10-08", "2026-10-09", "2026-10-12", "2026-10-13"]) {
      await expect(day(root, date).closest("td")).toHaveAttribute("aria-selected", "true");
    }
    await expect(day(root, "2026-10-14").closest("td")).toHaveAttribute("aria-selected", "false");
    await expect(day(root, "2026-10-08")).toHaveAccessibleName(/range start/);
    await expect(day(root, "2026-10-13")).toHaveAccessibleName(/range end/);
  },
};

export const TouchSwipe: Story = {
  name: "A swipe with a finger turns the month, and the page can still scroll up and down",
  render: () => (
    <div>
      <Calendar defaultMonth="2026-10" today="2026-10-14" aria-label="swipe" data-testid="swipe" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("swipe");
    const months = root.querySelector<HTMLElement>("[class*='months']")!;
    // Sideways is the calendar's; up and down is the page's.
    await expect(getComputedStyle(months).touchAction).toBe("pan-y");
    const target = day(root, "2026-10-14");
    const rect = box(target);
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const fire = (type: string, clientX: number) =>
      target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "touch", pointerId: 3, clientX, clientY: y, isPrimary: true }));
    fire("pointerdown", x);
    fire("pointerup", x - 120);
    await expect(await within(root).findByRole("grid", { name: "November 2026" })).toBeInTheDocument();
    const later = day(root, "2026-11-10");
    const fireLater = (type: string, clientX: number) =>
      later.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "touch", pointerId: 4, clientX, clientY: y, isPrimary: true }));
    fireLater("pointerdown", x);
    fireLater("pointerup", x + 120);
    await expect(await within(root).findByRole("grid", { name: "October 2026" })).toBeInTheDocument();
  },
};

export const ViewsKeepTheHeight: Story = {
  name: "Opening the months or years grid keeps the calendar's height at every size, and focus moves into the grid",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
      {sizes.map((size) => (
        <Calendar key={size} size={size} captionLayout="views" defaultMonth="2026-10" today="2026-10-14" aria-label={`v-${size}`} data-testid={`v-${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const root = canvas.getByTestId(`v-${size}`);
      const days = box(root).height;
      const daysGrid = box(root.querySelector("table")!).height;
      await userEvent.click(within(root).getByRole("button", { name: /choose a month/ }));
      const monthsGrid = within(root).getByRole("grid", { name: /Months of/ });
      await expect(Math.abs(box(root).height - days)).toBeLessThan(1);
      await expect(Math.abs(box(monthsGrid).height - daysGrid)).toBeLessThan(1);
      // Focus is on the month on show, inside the grid, and the twelve cells fit it.
      await expect(document.activeElement).toHaveAttribute("data-picker-cell", "10");
      for (const cell of monthsGrid.querySelectorAll("button")) {
        await expect(box(cell).left).toBeGreaterThanOrEqual(box(monthsGrid).left - 0.5);
        await expect(box(cell).right).toBeLessThanOrEqual(box(monthsGrid).right + 0.5);
        await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
      }
      await userEvent.click(within(root).getByRole("button", { name: /choose a year/ }));
      await expect(Math.abs(box(root).height - days)).toBeLessThan(1);
      await userEvent.keyboard("{Escape}");
      await expect(within(root).getByRole("button", { name: /choose a month/ })).toHaveFocus();
      await expect(Math.abs(box(root).height - days)).toBeLessThan(1);
    }
  },
};

export const WeekIsDrawnAsOneRow: Story = {
  name: "A chosen week is a strip of the whole row with its two ends filled, and the week under the pointer is lightly drawn",
  render: () => <Calendar mode="week" defaultMonth="2026-10" today="2026-10-14" defaultValue="2026-10-14" aria-label="week" data-testid="week" />,
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("week");
    const fill = (date: string) => getComputedStyle(day(root, date)).backgroundColor;
    const strip = (date: string) => getComputedStyle(day(root, date).closest("td")!, "::before").backgroundColor;
    const clear = "rgba(0, 0, 0, 0)";
    await expect(fill("2026-10-11")).not.toBe(clear);
    await expect(fill("2026-10-17")).toBe(fill("2026-10-11"));
    await expect(fill("2026-10-14")).toBe(clear);
    for (const date of ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"]) await expect(strip(date)).not.toBe(clear);
    // The row ends line up with the row: left of the first day to right of the last.
    const [first, last] = [box(day(root, "2026-10-11")), box(day(root, "2026-10-17"))];
    await expect(Math.abs(first.top - last.top)).toBeLessThan(1);
    // Another week, hovered, is drawn lightly, all seven days of it, and nothing in the weeks beside it.
    await userEvent.hover(day(root, "2026-10-21"));
    for (const date of ["2026-10-18", "2026-10-21", "2026-10-24"]) await expect(strip(date)).not.toBe(clear);
    await expect(strip("2026-10-25")).toBe(clear);
    await userEvent.unhover(day(root, "2026-10-21"));
    await expect(strip("2026-10-21")).toBe(clear);
  },
};

export const EveryLayoutAtTheNarrowestWidth: Story = {
  name: "At the narrowest width (seven 24px days) nothing in any layout runs outside the calendar's own box",
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", alignItems: "flex-start" }}>
      {(
        [
          ["plain", {}],
          ["dropdown", { captionLayout: "dropdown" }],
          ["dropdown-xs", { captionLayout: "dropdown", size: "xs" }],
          ["views", { captionLayout: "views" }],
          ["weeks", { showWeekNumbers: true }],
          ["footer", { showTodayButton: true, clearable: true, showLegend: true, mode: "range" }],
          ["markers", { getMarker: () => ({ tone: "info" as const }) }],
          ["rounded-lg", { rounded: true, size: "lg" }],
        ] as const
      ).map(([id, props]) => (
        <div key={id} style={{ inlineSize: "10.5rem", overflow: "auto", border: "1px dashed currentColor" }} data-testid={`box-${id}`}>
          <Calendar {...(props as object)} defaultMonth="2026-10" today="2026-10-14" aria-label={id} data-testid={`narrow-${id}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const id of ["plain", "dropdown", "dropdown-xs", "views", "weeks", "footer", "markers", "rounded-lg"]) {
      const calendar = canvas.getByTestId(`narrow-${id}`);
      const bounds = box(calendar);
      // The calendar keeps at least seven 24px targets, the least it can be.
      await expect(bounds.width).toBeGreaterThanOrEqual((id === "weeks" ? 8 : 7) * 24 - 0.5);
      // Every control and every day is inside its own box, on the inline axis.
      const inside = [...calendar.querySelectorAll("button, [role='combobox'], th, td")];
      for (const element of inside) {
        const rect = box(element);
        if (rect.width === 0) continue;
        await expect(rect.left, `${id}: ${element.tagName} ${element.textContent?.slice(0, 12)} starts inside`).toBeGreaterThanOrEqual(bounds.left - 0.5);
        await expect(rect.right, `${id}: ${element.tagName} ${element.textContent?.slice(0, 12)} ends inside`).toBeLessThanOrEqual(bounds.right + 0.5);
      }
    }
    // The views grids too, once opened.
    const views = canvas.getByTestId("narrow-views");
    await userEvent.click(within(views).getByRole("button", { name: /choose a month/ }));
    for (const element of views.querySelectorAll("button")) {
      await expect(box(element).right).toBeLessThanOrEqual(box(views).right + 0.5);
      await expect(box(element).left).toBeGreaterThanOrEqual(box(views).left - 0.5);
    }
  },
};
