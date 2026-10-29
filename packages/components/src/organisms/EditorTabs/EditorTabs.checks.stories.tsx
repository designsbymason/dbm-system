import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Demo, manyTabs } from "./EditorTabsStoryKit";
import type { EditorTab } from "./EditorTabs.types";

// Real-browser checks for what jsdom can't evaluate: a drag with a real mouse, the layout of a tab and its close button, the
// scrolling of a long strip and where focus goes. Hidden from the sidebar and the Docs page, and still run as tests (07 §4.2,
// guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Navigation/EditorTabs/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const body = () => within(document.body);
// Waits for the story to be drawn (a page with several strips has several lists).
const ready = () => body().findAllByRole("tablist");
const tabs = () => body().getAllByRole("tab");
const labels = () => tabs().map((tab) => tab.textContent?.replace(/ \(.*\)$/, ""));
const tabNamed = (name: RegExp | string) => body().getByRole("tab", { name });

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events. The test page scales its
// iframe, so a point inside the story is mapped to the page it is drawn on.
const toPage = (x: number, y: number) => {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
};

async function realDrag(from: Element, to: { x: number; y: number }, during?: () => Promise<void> | void) {
  const rect = from.getBoundingClientRect();
  const start = toPage(rect.left + rect.width / 2, rect.top + rect.height / 2);
  const end = toPage(to.x, to.y);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...start });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...start, button: "left", clickCount: 1 });
  for (let step = 1; step <= 8; step += 1) {
    const x = start.x + ((end.x - start.x) * step) / 8;
    const y = start.y + ((end.y - start.y) * step) / 8;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 });
    await nextFrame();
  }
  await during?.();
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...end, button: "left", clickCount: 1 });
  await nextFrame();
}

function Page({ children, width = "40rem" }: { children: React.ReactNode; width?: string }) {
  return (
    <div style={{ padding: "var(--dbm-space-6)" }}>
      <div style={{ inlineSize: width }}>{children}</div>
    </div>
  );
}

const fixed: EditorTab[] = [
  { id: "a", label: "alpha.ts" },
  { id: "b", label: "bravo.ts" },
  { id: "c", label: "charlie.ts" },
  { id: "d", label: "delta.ts" },
];

/** A mouse drag moves a tab past its neighbours, and the strip shows the order the owner applied. */
export const DragWithAMouse: Story = {
  render: () => (
    <Page>
      <Demo initialTabs={fixed} initialValue="a" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const target = tabNamed(/charlie/).getBoundingClientRect();
    await realDrag(tabNamed(/alpha/), { x: target.right - 4, y: target.top + target.height / 2 }, async () => {
      // While the button is down, the tab beside which it would land carries the drop marker.
      await waitFor(() => expect(document.querySelector("[data-drop]")).not.toBeNull());
    });
    await waitFor(() => expect(labels()).toEqual(["bravo.ts", "charlie.ts", "alpha.ts", "delta.ts"]));
    expect(document.querySelector("[data-dragging]")).toBeNull();
    expect(document.querySelector("[data-drop]")).toBeNull();
  },
};

/** The close button sits inside the tab, clear of the name, and is at least 24 × 24 px at every size. */
export const CloseButtonFits: Story = {
  render: () => (
    <Page width="60rem">
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Demo key={size} size={size} aria-label={`Size ${size}`} initialTabs={[{ id: "a", label: "a.ts" }, { id: "b", label: "app.tsx", dirty: true }]} />
        ))}
      </div>
    </Page>
  ),
  play: async () => {
    await ready();
    const closes = [...document.querySelectorAll<HTMLElement>("button[aria-label^='Close ']")];
    expect(closes.length).toBe(10);
    for (const close of closes) {
      const box = close.getBoundingClientRect();
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      const tab = close.parentElement!.parentElement!.querySelector<HTMLElement>("[role='tab']")!;
      const tabBox = tab.getBoundingClientRect();
      const label = tab.querySelector<HTMLElement>("span[class*=label]")!.getBoundingClientRect();
      // Inside the tab, and the name ends before the button begins.
      expect(box.right).toBeLessThanOrEqual(tabBox.right + 0.5);
      expect(box.left).toBeGreaterThanOrEqual(tabBox.left);
      expect(label.right).toBeLessThanOrEqual(box.left + 0.5);
    }
  },
};

/** A long name is cut with an ellipsis at the widest a tab gets, and the close button stays in view. */
export const LongNamesAreCut: Story = {
  render: () => (
    <Page>
      <Demo
        addable={false}
        initialValue="x"
        initialTabs={[{ id: "x", label: "an-extremely-long-file-name-that-keeps-going-and-going-and-going-forever.component.test.tsx" }, { id: "y", label: "short.ts" }]}
      />
    </Page>
  ),
  play: async () => {
    await ready();
    const [long, short] = [tabs()[0]!, tabs()[1]!];
    const max = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dbm-editor-tabs-tab-max-width")) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const min = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dbm-editor-tabs-tab-min-width")) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const item = long.parentElement!.getBoundingClientRect();
    expect(item.width).toBeLessThanOrEqual(max + 1);
    const label = long.querySelector<HTMLElement>("span[class*=label]")!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    expect(short.parentElement!.getBoundingClientRect().width).toBeGreaterThanOrEqual(min - 1);
  },
};

/** Arrowing through a strip longer than its width brings every tab fully into view. */
export const ArrowingRevealsEveryTab: Story = {
  render: () => (
    <Page width="30rem">
      <Demo initialTabs={manyTabs.slice(0, 14)} initialValue="file-1" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const list = body().getByRole("tablist");
    await userEvent.tab();
    expect(tabs()[0]).toHaveFocus();
    for (let index = 1; index < 14; index += 1) {
      await userEvent.keyboard("{ArrowRight}");
      await nextFrame();
      await nextFrame();
      const box = tabs()[index]!.getBoundingClientRect();
      const bounds = list.getBoundingClientRect();
      await waitFor(() => {
        const now = tabs()[index]!.getBoundingClientRect();
        expect(now.left).toBeGreaterThanOrEqual(bounds.left - 1);
        expect(now.right).toBeLessThanOrEqual(bounds.right + 1);
      });
      void box;
    }
  },
};

/** Dragging a tab to the edge of a strip that scrolls scrolls it, so a tab out of view can be reached. */
export const DragScrollsTheStrip: Story = {
  render: () => (
    <Page width="30rem">
      <Demo initialTabs={manyTabs.slice(0, 14)} initialValue="file-1" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const list = body().getByRole("tablist");
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    const bounds = list.getBoundingClientRect();
    const before = list.scrollLeft;
    await realDrag(tabs()[0]!, { x: bounds.right - 6, y: bounds.top + bounds.height / 2 }, async () => {
      await waitFor(() => expect(list.scrollLeft).toBeGreaterThan(before + 20));
    });
    await waitFor(() => expect(labels()[0]).not.toBe("module-1.ts"));
  },
};

/** Closing the focused tab from the keyboard leaves focus on the tab that takes its place. */
export const KeyboardCloseKeepsFocus: Story = {
  render: () => (
    <Page>
      <Demo initialTabs={fixed} initialValue="b" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    await userEvent.tab();
    expect(tabNamed(/bravo/)).toHaveFocus();
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(labels()).toEqual(["alpha.ts", "charlie.ts", "delta.ts"]));
    await waitFor(() => expect(tabNamed(/charlie/)).toHaveFocus());
    expect(tabNamed(/charlie/)).toHaveAttribute("aria-selected", "true");
  },
};

/** A press on the close button with a real mouse closes the tab without moving focus onto the button. */
export const MouseCloseDoesNotTakeFocus: Story = {
  render: () => (
    <Page>
      <button type="button" data-testid="aside">
        Elsewhere
      </button>
      <Demo initialTabs={fixed} initialValue="a" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const aside = body().getByTestId("aside");
    aside.focus();
    const close = document.querySelector<HTMLElement>("button[aria-label='Close charlie.ts']")!;
    const rect = close.getBoundingClientRect();
    const point = toPage(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
    await waitFor(() => expect(labels()).toEqual(["alpha.ts", "bravo.ts", "delta.ts"]));
    expect(aside).toHaveFocus();
  },
};
