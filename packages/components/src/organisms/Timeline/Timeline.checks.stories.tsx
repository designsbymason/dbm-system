import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TruckIcon } from "@dbm-system/icons";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Timeline } from "./Timeline";
import { allSizes, Demo } from "./TimelineStoryKit";

// Hidden, real-browser checks (`!dev` on the whole group, ADR-0013's way of keeping a second stories file out of
// the sidebar and the Docs page): what jsdom can't evaluate — real layout, text direction, forced colours, focus
// rings, a media query — measured in Chromium.
const meta: Meta = {
  title: "Organisms/Data Display/Timeline/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const settle = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const box = (element: Element) => element.getBoundingClientRect();
const centreY = (rect: DOMRect) => rect.top + rect.height / 2;
const centreX = (rect: DOMRect) => rect.left + rect.width / 2;
const colour = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};
const part = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[class*="_${name}_"]`)!;

/** The rectangle of the first line of a node's text (a `Range` over the text, not the box that also holds other things). */
const firstLine = (element: Element): DOMRect => {
  const range = document.createRange();
  const text = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) ?? element.firstChild!;
  range.selectNodeContents(text);
  return range.getClientRects()[0]!;
};

export const MarkerLevelWithFirstLine: Story = {
  name: "The marker is level with the first line of text at every size, with the time above or beside",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {allSizes.map((size) => (
        <div key={size} data-testid={`top-${size}`}>
          <Demo size={size} aria-label={`top ${size}`} />
        </div>
      ))}
      {allSizes.map((size) => (
        <div key={size} data-testid={`side-${size}`}>
          <Demo size={size} timePlacement="side" aria-label={`side ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(640);
    const canvas = within(canvasElement);
    for (const size of allSizes) {
      for (const mode of ["top", "side"]) {
        const first = within(canvas.getByTestId(`${mode}-${size}`)).getAllByRole("listitem")[0]!;
        const marker = box(part(first, "marker"));
        // The first line of text is the time in both forms: above the title, or level with it in the side column.
        const line = firstLine(part(first, "time"));
        await expect(Math.abs(centreY(marker) - centreY(line))).toBeLessThanOrEqual(2);
      }
    }
  },
};

export const LineThroughTheMarkers: Story = {
  name: "The line runs through the middle of the markers and on to the next event, at every size",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {allSizes.map((size) => (
        <div key={size} data-testid={`s-${size}`}>
          <Demo size={size} descriptions aria-label={`size ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of allSizes) {
      const items = within(canvas.getByTestId(`s-${size}`)).getAllByRole("listitem");
      const [first, second] = items as [HTMLElement, HTMLElement];
      const line = box(part(first, "connector"));
      await expect(Math.abs(centreX(line) - centreX(box(part(first, "marker"))))).toBeLessThanOrEqual(1);
      // It starts below the marker and reaches (within its small end margin) the next event's marker.
      await expect(line.top).toBeGreaterThanOrEqual(box(part(first, "marker")).bottom);
      await expect(box(second).top - line.bottom).toBeLessThanOrEqual(6);
      // The last event draws no line.
      await expect(getComputedStyle(part(items[2]!, "connector")).display).toBe("none");
    }
  },
};

export const SideColumn: Story = {
  name: "The time column sits before the marker, right-aligned, and a phone draws the time above the title",
  render: () => <Demo timePlacement="side" descriptions aria-label="side" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(640);
    const first = within(canvasElement).getAllByRole("listitem")[0]!;
    const time = box(part(first, "time"));
    const marker = box(part(first, "marker"));
    const title = box(part(first, "title"));
    await expect(time.right).toBeLessThanOrEqual(marker.left);
    await expect(title.left).toBeGreaterThanOrEqual(marker.right);
    await expect(getComputedStyle(part(first, "time")).textAlign).toMatch(/end|right/);
    // The two first lines of text (not their boxes, which carry the padding that centres them on the marker) are level.
    await expect(Math.abs(centreY(firstLine(part(first, "time"))) - centreY(firstLine(part(first, "title"))))).toBeLessThanOrEqual(2);
  },
};

export const SideColumnOnAPhone: Story = {
  name: "On a phone the side column falls back to the time above the title",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Demo timePlacement="side" aria-label="side" />,
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const first = within(canvasElement).getAllByRole("listitem")[0]!;
    await expect(box(part(first, "time")).bottom).toBeLessThanOrEqual(box(part(first, "title")).top + 1);
    await expect(Math.abs(box(part(first, "time")).left - box(part(first, "title")).left)).toBeLessThanOrEqual(1);
  },
};

export const RightToLeft: Story = {
  name: "Right-to-left puts the marker on the right and the side time column on its far right",
  render: () => <Demo dir="rtl" timePlacement="side" aria-label="rtl" />,
  play: async ({ canvasElement }) => {
    const first = within(canvasElement).getAllByRole("listitem")[0]!;
    const time = box(part(first, "time"));
    const marker = box(part(first, "marker"));
    const title = box(part(first, "title"));
    await expect(time.left).toBeGreaterThanOrEqual(marker.right);
    await expect(title.right).toBeLessThanOrEqual(marker.left);
    await expect(getComputedStyle(part(first, "connector")).borderInlineStartStyle).toBe("solid");
  },
};

export const LongContentStaysInside: Story = {
  name: "A long title, an unbroken word and a long body line stay inside the event, at the largest size in a narrow box",
  render: () => (
    <div style={{ inlineSize: 220 }} data-testid="narrow">
      <Timeline aria-label="narrow" size="xl">
        <Timeline.Item
          title="A very long title that has to wrap onto several lines"
          time="Wednesday 14 March 2026, 09:30 Central European Summer Time"
          description="Supercalifragilisticexpialidocious_unbroken_word_that_never_breaks_anywhere"
          icon={TruckIcon}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{"a_very_wide_line_of_code_that_wraps_inside_its_own_box_and_not_the_page"}</pre>
        </Timeline.Item>
        <Timeline.Item title="Short" />
      </Timeline>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const narrow = within(canvasElement).getByTestId("narrow");
    const list = narrow.querySelector("ol")!;
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    for (const li of within(narrow).getAllByRole("listitem")) {
      await expect(li.scrollWidth).toBeLessThanOrEqual(li.clientWidth);
    }
  },
};

export const ShowMoreKeepsFocusAndPlace: Story = {
  name: "The show-more button is reached and pressed with the keyboard, keeps focus, and the events above do not move",
  render: () => <Demo maxVisible={2} count={5} aria-label="long" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstBefore = box(canvas.getAllByRole("listitem")[0]!);
    const button = canvas.getByRole("button", { name: "Show 3 more events" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button.matches(":focus-visible")).toBe(true);
    await expect(box(button).width).toBeGreaterThanOrEqual(24);
    await expect(box(button).height).toBeGreaterThanOrEqual(24);
    const ring = getComputedStyle(button);
    await expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(2);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(6));
    await expect(button).toHaveFocus();
    await expect(box(canvas.getAllByRole("listitem")[0]!).top).toBe(firstBefore.top);
    await expect(button.textContent).toContain("Show fewer events");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(3));
    await expect(button).toHaveFocus();
    // Close it down again so nothing is left focused for the next story.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const ForcedColours: Story = {
  name: "Forced colours keep the line, the dot and the icon marker in system colours",
  render: () => (
    <Timeline aria-label="forced">
      <Timeline.Item title="Dot" time="1" />
      <Timeline.Item title="Icon" time="2" icon={TruckIcon} />
      <Timeline.Item title="Pending" time="3" pending />
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const items = within(canvasElement).getAllByRole("listitem");
      await expect(getComputedStyle(part(items[0]!, "connector")).borderInlineStartColor).toBe(colour("GrayText"));
      await expect(parseFloat(getComputedStyle(part(items[0]!, "connector")).borderInlineStartWidth)).toBeGreaterThan(0);
      await expect(getComputedStyle(part(items[0]!, "marker")).backgroundColor).toBe(colour("CanvasText"));
      await expect(getComputedStyle(part(items[1]!, "marker")).borderTopColor).toBe(colour("CanvasText"));
      await expect(getComputedStyle(part(items[2]!, "marker")).borderTopColor).toBe(colour("Highlight"));
    } finally {
      await emulate("none");
    }
  },
};
