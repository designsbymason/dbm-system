import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Demo, manyTabs, pathTabs, statusTabs } from "./EditorTabsStoryKit";
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

const hover = async (element: Element) => {
  const box = element.getBoundingClientRect();
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...toPage(box.left + box.width / 2, box.top + box.height / 2) });
};
// The page's own corner: somewhere neutral for the pointer to rest between checks.
const rest = () => send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });

/** A tab whose name is cut short shows the whole of it in a tooltip, and a short name shows none. */
export const TooltipShowsACutName: Story = {
  render: () => (
    <Page width="30rem">
      <Demo
        addable={false}
        initialValue="x"
        initialTabs={[
          { id: "x", label: "an-extremely-long-file-name-that-keeps-going-and-going-and-going-forever.test.tsx" },
          { id: "y", label: "short.ts" },
        ]}
      />
    </Page>
  ),
  play: async () => {
    await ready();
    await rest();
    await hover(tabs()[1]!);
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(body().queryByRole("tooltip")).toBeNull();
    await hover(tabs()[0]!);
    const tip = await body().findByRole("tooltip");
    expect(tip).toHaveTextContent("an-extremely-long-file-name-that-keeps-going-and-going-and-going-forever.test.tsx");
    await rest();
    await waitFor(() => expect(body().queryByRole("tooltip")).toBeNull());
  },
};

/** A tab with a tooltip of its own shows it on a real hover, and keyboard focus. */
export const TooltipDetail: Story = {
  render: () => (
    <Page>
      <Demo initialTabs={pathTabs} initialValue="a" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    await rest();
    await hover(tabNamed(/App\.tsx/));
    expect(await body().findByRole("tooltip")).toHaveTextContent("src/App.tsx");
    await rest();
    await waitFor(() => expect(body().queryByRole("tooltip")).toBeNull());
    await userEvent.tab();
    expect(await body().findByRole("tooltip")).toHaveTextContent("src/organisms/EditorTabs/index.ts");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("tooltip")).toBeNull());
  },
};

/** The status mark sits after the name, inside the tab, clear of the close button, and never changes a tab's height. */
export const StatusFits: Story = {
  render: () => (
    <Page width="50rem">
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        {(["xs", "md", "xl"] as const).map((size) => (
          <Demo key={size} size={size} aria-label={`Size ${size}`} initialTabs={statusTabs} initialValue="index" addable={false} />
        ))}
      </div>
    </Page>
  ),
  play: async () => {
    await ready();
    for (const list of body().getAllByRole("tablist")) {
      const heights = [...list.querySelectorAll<HTMLElement>("[role=tab]")].map((tab) => Math.round(tab.getBoundingClientRect().height));
      expect(new Set(heights).size).toBe(1);
      for (const mark of list.querySelectorAll<HTMLElement>("[data-status]")) {
        const tab = mark.closest("[role=tab]")!.getBoundingClientRect();
        const box = mark.getBoundingClientRect();
        const close = mark.closest("[data-editor-tab-item]")!.querySelector("button[aria-label^='Close ']")!.getBoundingClientRect();
        expect(box.left).toBeGreaterThanOrEqual(tab.left);
        expect(box.right).toBeLessThanOrEqual(close.left + 0.5);
        expect(box.width).toBeGreaterThan(0);
        // On the name's own line, not wrapped beneath it.
        const label = mark.closest("[role=tab]")!.querySelector<HTMLElement>("[data-editor-tab-label]")!.getBoundingClientRect();
        expect(Math.abs(box.top + box.height / 2 - (label.top + label.height / 2))).toBeLessThan(4);
        expect(box.left).toBeGreaterThanOrEqual(label.right - 1);
      }
    }
  },
};

/** A vertical strip is a column that scrolls past its height, with tabs the width of the column. */
export const VerticalScrollsAndFills: Story = {
  render: () => (
    <Page width="16rem">
      <Demo orientation="vertical" style={{ blockSize: "14rem" }} initialTabs={manyTabs.slice(0, 14)} initialValue="file-1" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const list = body().getByRole("tablist");
    expect(list).toHaveAttribute("aria-orientation", "vertical");
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    expect(list.getBoundingClientRect().height).toBeLessThanOrEqual(14 * parseFloat(getComputedStyle(document.documentElement).fontSize) + 1);
    const widths = tabs().map((tab) => Math.round(tab.parentElement!.getBoundingClientRect().width));
    expect(new Set(widths).size).toBe(1);
    const bounds = list.getBoundingClientRect();
    await userEvent.tab();
    for (let index = 1; index < 14; index += 1) {
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => {
        const now = tabs()[index]!.getBoundingClientRect();
        expect(now.top).toBeGreaterThanOrEqual(bounds.top - 1);
        expect(now.bottom).toBeLessThanOrEqual(bounds.bottom + 1);
      });
    }
  },
};

/** In a vertical strip the add button, and the tab-list button, are as wide as the tabs. */
export const VerticalButtonsMatchTheTabs: Story = {
  render: () => (
    <Page width="16rem">
      <Demo orientation="vertical" overflow="menu" initialTabs={fixed} initialValue="a" />
    </Page>
  ),
  play: async () => {
    await ready();
    const tabWidth = tabs()[0]!.parentElement!.getBoundingClientRect().width;
    for (const name of ["New tab", "All tabs"]) {
      const button = body().getByRole("button", { name });
      expect(Math.abs(button.getBoundingClientRect().width - tabWidth)).toBeLessThan(1.5);
    }
  },
};

/** A mouse drag in a vertical strip moves a tab, with the marker on a tab's top or bottom edge. */
export const VerticalDrag: Story = {
  render: () => (
    <Page width="16rem">
      <Demo orientation="vertical" initialTabs={fixed} initialValue="a" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const target = tabNamed(/charlie/).getBoundingClientRect();
    await realDrag(tabNamed(/alpha/), { x: target.left + target.width / 2, y: target.bottom - 4 }, async () => {
      const marked = await waitFor(() => {
        const found = document.querySelector<HTMLElement>("[data-drop]");
        expect(found).not.toBeNull();
        return found!;
      });
      const line = getComputedStyle(marked, "::before");
      // A line along the tab's edge: wider than it is tall.
      expect(parseFloat(line.width)).toBeGreaterThan(parseFloat(line.height));
    });
    await waitFor(() => expect(labels()).toEqual(["bravo.ts", "charlie.ts", "alpha.ts", "delta.ts"]));
  },
};

/** After a reorder the tabs ease to their places and finish there, with no offset left behind. */
export const ReorderEasesAndSettles: Story = {
  render: () => (
    <Page>
      <Demo initialTabs={fixed} initialValue="a" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    await userEvent.tab();
    const before = tabNamed(/bravo/).getBoundingClientRect().left;
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await waitFor(() => expect(labels()).toEqual(["bravo.ts", "alpha.ts", "charlie.ts", "delta.ts"]));
    // Something is easing, or has already finished: either way nothing is left offset once it is over.
    await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    await nextFrame();
    for (const item of document.querySelectorAll<HTMLElement>("[data-editor-tab-item]")) expect(item.style.translate).toBe("");
    const lefts = tabs().map((tab) => tab.getBoundingClientRect().left);
    expect([...lefts].sort((a, b) => a - b)).toEqual(lefts);
    expect(lefts[0]).toBeLessThan(before + 1);
  },
};

/** A shortcut changes tab from the page with real key presses, and closing selects the tab used before. */
export const ShortcutsAndPreviousTab: Story = {
  render: () => (
    <Page>
      <Demo initialTabs={fixed} initialValue="a" addable={false} closeSelects="previous" hotkeys={{ next: "ctrl+alt+ArrowRight", previous: "ctrl+alt+ArrowLeft", close: "ctrl+alt+w" }} />
    </Page>
  ),
  play: async () => {
    await ready();
    await userEvent.keyboard("{Control>}{Alt>}{ArrowRight}{/Alt}{/Control}");
    await waitFor(() => expect(tabNamed(/bravo/)).toHaveAttribute("aria-selected", "true"));
    await userEvent.keyboard("{Control>}{Alt>}{ArrowRight}{/Alt}{/Control}");
    await waitFor(() => expect(tabNamed(/charlie/)).toHaveAttribute("aria-selected", "true"));
    await userEvent.keyboard("{Control>}{Alt>}w{/Alt}{/Control}");
    await waitFor(() => expect(labels()).toEqual(["alpha.ts", "bravo.ts", "delta.ts"]));
    // The one used before charlie was bravo, which is not charlie's neighbour to the right (delta).
    await waitFor(() => expect(tabNamed(/bravo/)).toHaveAttribute("aria-selected", "true"));
  },
};

/** The tab menu closes the others at once with a real mouse, and what is left is selected. */
export const PresetMenuClosesOthers: Story = {
  render: () => (
    <Page>
      <Demo initialTabs={fixed} initialValue="a" addable={false} presetMenu />
    </Page>
  ),
  play: async () => {
    await ready();
    const target = tabNamed(/charlie/).getBoundingClientRect();
    const point = toPage(target.left + target.width / 2, target.top + target.height / 2);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "right", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "right", clickCount: 1 });
    const menu = await body().findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Close others" }));
    await waitFor(() => expect(labels()).toEqual(["charlie.ts"]));
    expect(tabNamed(/charlie/)).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/** A tab's icon and status mark grow with each of the five sizes while the close cross stays small. */
export const IconsFollowTheSize: Story = {
  render: () => (
    <Page width="50rem">
      <div style={{ display: "grid", gap: "var(--dbm-space-4)" }}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Demo key={size} size={size} aria-label={`Size ${size}`} initialTabs={[statusTabs[1]!]} initialValue="app" addable={false} />
        ))}
      </div>
    </Page>
  ),
  play: async () => {
    await ready();
    const sizes = body()
      .getAllByRole("tablist")
      .map((list) => {
        const tab = list.querySelector<HTMLElement>("[role=tab]")!;
        const icon = Math.round(tab.querySelector<SVGElement>("svg")!.getBoundingClientRect().width);
        const status = Math.round(tab.querySelector<HTMLElement>("[data-status] svg")!.getBoundingClientRect().width);
        const cross = Math.round(list.querySelector<SVGElement>("button[aria-label^='Close '] svg")!.getBoundingClientRect().width);
        return { icon, status, cross };
      });
    expect(sizes.map((entry) => entry.icon)).toEqual([12, 16, 20, 24, 32]);
    expect(sizes.map((entry) => entry.status)).toEqual([12, 16, 20, 24, 32]);
    expect(sizes.map((entry) => entry.cross)).toEqual([12, 12, 12, 12, 12]);
    // A larger icon never makes a tab taller than the others at its size: each tab is its size's token height.
    const heights = body().getAllByRole("tablist").map((list) => Math.round(list.querySelector<HTMLElement>("[role=tab]")!.getBoundingClientRect().height));
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  },
};

/** The fade at an edge that has more tabs beyond it is solid next to the edge, so it covers what is cut off. */
export const OverflowFadeIsSolidNearTheEdge: Story = {
  render: () => (
    <Page width="30rem">
      <Demo initialTabs={manyTabs.slice(0, 14)} initialValue="file-1" addable={false} />
    </Page>
  ),
  play: async () => {
    await ready();
    const wrapper = body().getByRole("tablist").parentElement!;
    await waitFor(() => expect(wrapper).toHaveAttribute("data-overflow-end", "true"));
    // The fade eases in: read it once it has.
    await waitFor(() => expect(getComputedStyle(wrapper, "::after").opacity).toBe("1"));
    const fade = getComputedStyle(wrapper, "::after");
    expect(fade.backgroundImage).toMatch(/30%/);
    // The fade is wide enough to hold a scroll button.
    expect(parseFloat(fade.width)).toBeGreaterThanOrEqual(40);
    const button = body().getByRole("button", { name: "Scroll tabs to the end" }).getBoundingClientRect();
    const edge = wrapper.getBoundingClientRect();
    expect(edge.right - button.left).toBeLessThanOrEqual(parseFloat(fade.width) + 1);
  },
};
