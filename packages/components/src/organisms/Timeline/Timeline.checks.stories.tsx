import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TruckIcon } from "@dbm-system/icons";
import { useState } from "react";
import { Link } from "../../atoms/Link";
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

export const ConnectorColour: Story = {
  name: "The line is grey by default and takes its event's tone, per event, with colorfulConnector",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
      {[false, true].map((colourful) => (
        <div key={String(colourful)} data-testid={`colourful-${colourful}`}>
          <Timeline aria-label={`colourful ${colourful}`} colorfulConnector={colourful}>
            <Timeline.Item title="Failed" tone="danger" statusText="Failed" />
            <Timeline.Item title="Done" tone="success" statusText="Done" />
            <Timeline.Item title="Last" />
          </Timeline>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const line = (id: string, index: number) =>
      getComputedStyle(part(within(within(canvasElement).getByTestId(id)).getAllByRole("listitem")[index]!, "connector")).borderInlineStartColor;
    const token = (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${name})`;
      canvasElement.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    await expect(line("colourful-false", 0)).toBe(token("--dbm-border-default"));
    await expect(line("colourful-false", 1)).toBe(token("--dbm-border-default"));
    await expect(line("colourful-true", 0)).toBe(token("--dbm-border-danger-subtle"));
    await expect(line("colourful-true", 1)).toBe(token("--dbm-border-success-subtle"));
  },
};

export const AlternateOnAWideScreen: Story = {
  name: "Alternate puts the events' content on both sides of one centred line",
  render: () => <Demo align="alternate" count={4} descriptions aria-label="alternate" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const items = within(canvasElement).getAllByRole("listitem");
    const marker = (i: number) => box(part(items[i]!, "marker"));
    const title = (i: number) => box(part(items[i]!, "title"));
    // One column of markers and lines down the middle.
    await expect(Math.abs(centreX(marker(0)) - centreX(marker(1)))).toBeLessThanOrEqual(1);
    await expect(Math.abs(centreX(box(part(items[0]!, "connector"))) - centreX(marker(0)))).toBeLessThanOrEqual(1);
    // The first event's content after the line, the next before it, the third after it again.
    await expect(title(0).left).toBeGreaterThanOrEqual(marker(0).right);
    await expect(title(1).right).toBeLessThanOrEqual(marker(1).left);
    await expect(title(2).left).toBeGreaterThanOrEqual(marker(2).right);
    // Text before the line is aligned towards it.
    await expect(getComputedStyle(part(items[1]!, "body")).textAlign).toMatch(/end|right/);
  },
};

export const AlternateOnAPhone: Story = {
  name: "Alternate puts every event on one side on a phone",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Demo align="alternate" count={4} aria-label="alternate" />,
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(768);
    const items = within(canvasElement).getAllByRole("listitem");
    const lefts = items.map((item) => box(part(item, "title")).left);
    await expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThanOrEqual(1);
    await expect(box(part(items[0]!, "marker")).left).toBeLessThan(box(part(items[0]!, "title")).left);
  },
};

export const AlternateRightToLeft: Story = {
  name: "Alternate mirrors right to left: the first event's content is before the line",
  render: () => <Demo align="alternate" dir="rtl" count={3} aria-label="alternate rtl" />,
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    await expect(box(part(items[0]!, "title")).right).toBeLessThanOrEqual(box(part(items[0]!, "marker")).left);
    await expect(box(part(items[1]!, "title")).left).toBeGreaterThanOrEqual(box(part(items[1]!, "marker")).right);
  },
};

export const HorizontalRow: Story = {
  name: "Horizontal draws the markers in one row, the line between them, and the text under each",
  render: () => <Demo orientation="horizontal" count={4} descriptions aria-label="horizontal" />,
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    const markers = items.map((item) => box(part(item, "marker")));
    for (const marker of markers) await expect(Math.abs(centreY(marker) - centreY(markers[0]!))).toBeLessThanOrEqual(1);
    for (let i = 1; i < markers.length; i += 1) await expect(markers[i]!.left).toBeGreaterThan(markers[i - 1]!.right);
    // The line is a horizontal rule through the middle of the markers, reaching towards the next one.
    const line = box(part(items[0]!, "connector"));
    await expect(line.height).toBeLessThanOrEqual(2);
    await expect(Math.abs(centreY(line) - centreY(markers[0]!))).toBeLessThanOrEqual(2);
    await expect(line.left).toBeGreaterThanOrEqual(markers[0]!.right);
    await expect(markers[1]!.left - line.right).toBeLessThanOrEqual(8);
    // The text is under its marker.
    await expect(box(part(items[0]!, "title")).top).toBeGreaterThanOrEqual(markers[0]!.bottom);
    // Nothing scrolls, so the row is not a tab stop.
    await expect(canvasElement.querySelector("ol")).not.toHaveAttribute("tabindex");
  },
};

export const HorizontalScrollsAndIsReachable: Story = {
  name: "A horizontal row too narrow for its events scrolls and is a tab stop with a ring inside it",
  render: () => (
    <div style={{ inlineSize: 320 }}>
      <Demo orientation="horizontal" count={5} aria-label="scrolling" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector("ol")!;
    await waitFor(() => expect(list.scrollWidth).toBeGreaterThan(list.clientWidth));
    await waitFor(() => expect(list).toHaveAttribute("tabindex", "0"));
    await userEvent.tab();
    await expect(list).toHaveFocus();
    await expect(parseFloat(getComputedStyle(list).outlineWidth)).toBeGreaterThanOrEqual(2);
    // The ring is inside the box, so the scroll cannot clip it.
    await expect(parseFloat(getComputedStyle(list).outlineOffset)).toBeLessThan(0);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const StretchedLink: Story = {
  name: "A linked event takes a press anywhere on it, a link inside it still takes its own, and the ring goes round the event",
  render: () => (
    <Timeline aria-label="linked">
      <Timeline.Item title="Plan updated" time="Yesterday" href="#plan" description="Open the plan">
        <Link href="#inner">Inner link</Link>
      </Timeline.Item>
      <Timeline.Item title="Created" time="Last week" />
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const first = within(canvasElement).getAllByRole("listitem")[0]!;
    const rect = box(first);
    const link = within(first).getByRole("link", { name: "Plan updated" });
    // A point in the event's empty corner, and one on its description, both land on the title's link.
    await expect(document.elementFromPoint(rect.left + 2, rect.top + 2)).toBe(link);
    await expect(document.elementFromPoint(rect.right - 4, rect.bottom - 4)).toBe(link);
    // The link inside the body is on top of the stretched one.
    const inner = within(first).getByRole("link", { name: "Inner link" });
    const innerRect = box(inner);
    await expect(document.elementFromPoint(centreX(innerRect), centreY(innerRect))).toBe(inner);
    // Keyboard focus draws one ring around the whole event, inside its box.
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(parseFloat(getComputedStyle(first).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(getComputedStyle(link).outlineStyle).toBe("none");
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const GroupAndEndAlign: Story = {
  name: "A heading lines up with the titles, and the end's bar sits on the line",
  render: () => (
    <Timeline aria-label="grouped">
      <Timeline.Group>Today</Timeline.Group>
      <Timeline.Item title="Deployed" time="10:31" />
      <Timeline.Item title="Merged" time="10:00" />
      <Timeline.End>Closed</Timeline.End>
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    const [group, first, second, end] = items as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    await expect(Math.abs(box(part(group, "groupLabel")).left - box(part(first, "title")).left)).toBeLessThanOrEqual(1);
    // The line passes the heading, and reaches the end's bar, which is centred on it.
    await expect(Math.abs(centreX(box(part(group, "connector"))) - centreX(box(part(first, "marker"))))).toBeLessThanOrEqual(1);
    await expect(Math.abs(centreX(box(part(end, "marker"))) - centreX(box(part(second, "marker"))))).toBeLessThanOrEqual(1);
    await expect(box(part(end, "marker")).width).toBeGreaterThan(box(part(end, "marker")).height);
    // The end draws no line of its own.
    await expect(end.querySelector("[class*='_connector_']")).toBeNull();
  },
};

export const DetailByKeyboard: Story = {
  name: "The detail opens and closes from the keyboard, and what is closed is not drawn or read",
  render: () => (
    <Timeline aria-label="detail">
      <Timeline.Item title="Deploy failed" detail="The database was not reachable." time="10:42" />
      <Timeline.Item title="Built" time="10:31" />
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const detail = canvas.getByText("The database was not reachable.");
    await expect(getComputedStyle(detail).display).toBe("none");
    await userEvent.tab();
    const toggle = canvas.getByRole("button", { name: "Details" });
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(getComputedStyle(detail).display).not.toBe("none");
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(getComputedStyle(detail).display).toBe("none");
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

export const HorizontalAlternate: Story = {
  name: "Horizontal alternate puts the content below the line, then above it, with the markers in one row",
  render: () => <Demo orientation="horizontal" align="alternate" count={4} descriptions aria-label="horizontal alternate" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const items = within(canvasElement).getAllByRole("listitem");
    const marker = (i: number) => box(part(items[i]!, "marker"));
    for (let i = 1; i < items.length; i += 1) await expect(Math.abs(centreY(marker(i)) - centreY(marker(0)))).toBeLessThanOrEqual(1);
    const title = (i: number) => box(part(items[i]!, "title"));
    await expect(title(0).top).toBeGreaterThanOrEqual(marker(0).bottom);
    await expect(title(1).bottom).toBeLessThanOrEqual(marker(1).top);
    await expect(title(2).top).toBeGreaterThanOrEqual(marker(2).bottom);
    // The line is still one rule through the markers.
    await expect(Math.abs(centreY(box(part(items[0]!, "connector"))) - centreY(marker(0)))).toBeLessThanOrEqual(2);
  },
};

export const HorizontalAlternateOnAPhone: Story = {
  name: "Horizontal alternate puts every event below the line on a phone",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <Demo orientation="horizontal" align="alternate" count={4} aria-label="horizontal alternate" />,
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(768);
    const items = within(canvasElement).getAllByRole("listitem");
    for (const item of items) await expect(box(part(item, "title")).top).toBeGreaterThanOrEqual(box(part(item, "marker")).bottom);
  },
};

export const HorizontalTimeOpposite: Story = {
  name: "Horizontal opposite puts the time on the other side of the dot from the content, alternating with it",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-10)" }}>
      <div data-testid="plain">
        <Demo orientation="horizontal" timePlacement="opposite" count={3} aria-label="opposite" />
      </div>
      <div data-testid="alternating">
        <Demo orientation="horizontal" align="alternate" timePlacement="opposite" count={3} aria-label="opposite alternate" />
      </div>
      <div data-testid="same">
        <Demo orientation="horizontal" timePlacement="same" count={3} aria-label="same" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const canvas = within(canvasElement);
    const rows = (id: string) => within(canvas.getByTestId(id)).getAllByRole("listitem");
    const of = (item: HTMLElement) => ({ marker: box(part(item, "marker")), time: box(part(item, "time")), title: box(part(item, "title")) });
    // Not alternating: the time above the dot, the content below it.
    for (const item of rows("plain")) {
      const { marker, time, title } = of(item);
      await expect(time.bottom).toBeLessThanOrEqual(marker.top);
      await expect(title.top).toBeGreaterThanOrEqual(marker.bottom);
    }
    // Alternating: the content below then above, the time always on the other side.
    const [first, second] = rows("alternating") as [HTMLElement, HTMLElement];
    await expect(of(first).time.bottom).toBeLessThanOrEqual(of(first).marker.top);
    await expect(of(first).title.top).toBeGreaterThanOrEqual(of(first).marker.bottom);
    await expect(of(second).title.bottom).toBeLessThanOrEqual(of(second).marker.top);
    await expect(of(second).time.top).toBeGreaterThanOrEqual(of(second).marker.bottom);
    // The same side: the time over its title, both below the dot.
    for (const item of rows("same")) {
      const { marker, time, title } = of(item);
      await expect(time.top).toBeGreaterThanOrEqual(marker.bottom);
      await expect(time.bottom).toBeLessThanOrEqual(title.top + 1);
    }
  },
};

export const PlaceholderRowsAreClose: Story = {
  name: "The two lines of a placeholder event are one space-1 apart",
  render: () => (
    <Timeline aria-label="loading" loading loadingCount={1}>
      {[]}
    </Timeline>
  ),
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector<HTMLElement>("li [class*='_main_']")!;
    const [first, second] = [...main.children] as [HTMLElement, HTMLElement];
    const probe = document.createElement("span");
    probe.style.display = "block";
    probe.style.blockSize = "var(--dbm-space-1)";
    canvasElement.appendChild(probe);
    const space = probe.getBoundingClientRect().height;
    probe.remove();
    await expect(space).toBeGreaterThan(0);
    await expect(Math.abs(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom - space)).toBeLessThanOrEqual(0.5);
  },
};

export const ButtonTargetsAtTheSmallestSize: Story = {
  name: "The detail, show-more and load-more buttons are at least 24 by 24 pixels at the smallest sizes",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm"] as const).map((size) => (
        <Timeline key={size} aria-label={`size ${size}`} size={size} maxVisible={1} onLoadMore={() => {}}>
          <Timeline.Item title="A" detail="More" />
          <Timeline.Item title="B" />
        </Timeline>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    // A detail toggle and a show-more button per timeline (load-more waits for the rest to show).
    await expect(buttons.length).toBe(4);
    for (const button of buttons) {
      await expect(box(button).width).toBeGreaterThanOrEqual(24);
      await expect(box(button).height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const LoadMoreButtonTarget: Story = {
  name: "The load-more button is at least 24 by 24 pixels at the smallest sizes, busy or not",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Timeline aria-label="idle" size="xs" onLoadMore={() => {}}>
        <Timeline.Item title="A" />
      </Timeline>
      <Timeline aria-label="busy" size="xs" onLoadMore={() => {}} loading>
        <Timeline.Item title="A" />
      </Timeline>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    await expect(buttons.length).toBe(2);
    for (const button of buttons) {
      await expect(box(button).width).toBeGreaterThanOrEqual(24);
      await expect(box(button).height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const HorizontalRightToLeft: Story = {
  name: "Horizontal right to left runs the events from the right, with the line running between them",
  render: () => <Demo orientation="horizontal" dir="rtl" count={3} descriptions aria-label="horizontal rtl" />,
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole("listitem");
    const markers = items.map((item) => box(part(item, "marker")));
    // The first event is at the right, each next one to its left, all on one row.
    await expect(markers[0]!.left).toBeGreaterThan(markers[1]!.left);
    await expect(markers[1]!.left).toBeGreaterThan(markers[2]!.left);
    await expect(Math.abs(centreY(markers[1]!) - centreY(markers[0]!))).toBeLessThanOrEqual(1);
    // The line leaves the marker towards the next event (to its left) and the text is under the marker.
    const line = box(part(items[0]!, "connector"));
    await expect(line.right).toBeLessThanOrEqual(markers[0]!.left);
    await expect(markers[1]!.right).toBeLessThanOrEqual(line.left + 8);
    await expect(box(part(items[0]!, "title")).top).toBeGreaterThanOrEqual(markers[0]!.bottom);
  },
};

export const FocusAfterTheLastPage: Story = {
  name: "Pressing load more keeps focus in the timeline when the last page arrives and the button goes away",
  render: function Render() {
    const [count, setCount] = useState(2);
    const [loading, setLoading] = useState(false);
    return (
      <div>
        <Timeline
          aria-label="paged"
          loading={loading}
          hasMore={count < 4}
          onLoadMore={() => {
            setLoading(true);
            setTimeout(() => {
              setCount(4);
              setLoading(false);
            }, 300);
          }}
        >
          {Array.from({ length: count }, (_, index) => (
            <Timeline.Item key={index} title={`Event ${index + 1}`} />
          ))}
        </Timeline>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Load more" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(4));
    await waitFor(() => expect(canvas.queryByRole("button", { name: /Load/ })).toBeNull());
    // Focus did not fall to the page: it is on the list, which announces itself by its name.
    await expect(document.activeElement).toBe(canvas.getByRole("list", { name: "paged" }));
    (document.activeElement as HTMLElement | null)?.blur();
    await expect(canvas.getByRole("list", { name: "paged" })).not.toHaveAttribute("tabindex");
  },
};

export const ForcedColours: Story = {
  name: "Forced colours keep the line, the dot, the icon marker, the end bar and a horizontal line in system colours",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <Timeline aria-label="forced">
        <Timeline.Item title="Dot" time="1" />
        <Timeline.Item title="Icon" time="2" icon={TruckIcon} />
        <Timeline.Item title="Pending" time="3" pending />
        <Timeline.End>Closed</Timeline.End>
      </Timeline>
      <Timeline aria-label="forced horizontal" orientation="horizontal" colorfulConnector>
        <Timeline.Item title="One" tone="danger" />
        <Timeline.Item title="Two" />
      </Timeline>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await settle(400);
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const lists = canvasElement.querySelectorAll("ol");
      const items = within(lists[0] as HTMLElement).getAllByRole("listitem");
      await expect(getComputedStyle(part(items[0]!, "connector")).borderInlineStartColor).toBe(colour("GrayText"));
      await expect(parseFloat(getComputedStyle(part(items[0]!, "connector")).borderInlineStartWidth)).toBeGreaterThan(0);
      await expect(getComputedStyle(part(items[0]!, "marker")).backgroundColor).toBe(colour("CanvasText"));
      await expect(getComputedStyle(part(items[1]!, "marker")).borderTopColor).toBe(colour("CanvasText"));
      await expect(getComputedStyle(part(items[2]!, "marker")).borderTopColor).toBe(colour("Highlight"));
      // The end's bar is a solid system-coloured box, not a background that forced colours erases.
      await expect(getComputedStyle(part(items[3]!, "marker")).backgroundColor).toBe(colour("CanvasText"));
      await expect(box(part(items[3]!, "marker")).width).toBeGreaterThan(0);
      // The horizontal line is a top border in a system colour, and the tone's colour is not used.
      const horizontal = within(lists[1] as HTMLElement).getAllByRole("listitem");
      const line = getComputedStyle(part(horizontal[0]!, "connector"));
      await expect(line.borderTopColor).toBe(colour("GrayText"));
      await expect(parseFloat(line.borderTopWidth)).toBeGreaterThan(0);
    } finally {
      await emulate("none");
    }
  },
};
