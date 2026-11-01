import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Navbar } from "../Navbar";
import { NavigationMenu } from "./NavigationMenu";
import { DemoItems, DemoMenu, MenuStage } from "./NavigationMenuStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, the cascade, a real pointer, forced colours,
// direction). They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Organisms/Navigation/NavigationMenu/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

const tokenPx = (name: string) => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
/** A length token in pixels, whatever unit it is written in (the measure tokens are in rem). */
function tokenLength(name: string): number {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;inline-size:var(${name})`;
  document.body.append(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

// A real pointer, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which never set `:hover` and
// never start the primitive's hover-intent timers. The test page scales its iframe, so a point is mapped to the page it is drawn on.
async function moveTo(x: number, y: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale });
}

async function pointAt(element: Element) {
  const rect = element.getBoundingClientRect();
  await moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

/** Puts the real pointer somewhere neutral, so a pointer left by an earlier check can't open or hold a panel. */
async function parkPointer() {
  await moveTo(2, 2);
  await wait(400);
}

async function settled(element: Element) {
  await waitFor(() => expect(element.getAnimations().length).toBe(0), { timeout: 3000 });
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * A press on a trigger. A synthetic click also moves the pointer over the trigger first, which starts the primitive's hover timer
 * (200ms), and a panel closed before that timer fires is opened again by it: a person can't hover and press Escape that fast,
 * so the check waits it out.
 */
async function press(trigger: HTMLElement) {
  await userEvent.click(trigger);
  await wait(300);
}

/** The panel that holds a link, once the primitive has worked out which way it came from (it does so just after mounting it). */
async function motionOf(link: Element): Promise<HTMLElement> {
  await waitFor(() => expect(link.closest("[data-motion]")).not.toBeNull(), { timeout: 3000 });
  return link.closest<HTMLElement>("[data-motion]")!;
}

/**
 * Closes whatever panel is open and waits for it to be gone: the accessibility run that follows every story sees a panel still easing
 * out with the primitive's hidden focus proxy beside its trigger, and fails `aria-hidden-focus`.
 */
async function closeAndWait(canvasElement: HTMLElement) {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(canvasElement.querySelector("[data-radix-collection-item][href]:not([class*='_link_'])")).toBeNull(), { timeout: 4000 });
  await waitFor(() => expect(canvasElement.querySelector('button[aria-expanded="true"]')).toBeNull(), { timeout: 4000 });
  await waitFor(() => expect(canvasElement.querySelector('span[aria-hidden="true"][tabindex="0"]')).toBeNull(), { timeout: 4000 });
}

const panelFor = (canvasElement: HTMLElement) => canvasElement.querySelector<HTMLElement>('[data-radix-navigation-menu-viewport], [class*="_viewport_"]');

export const HoverOpensAndTheGapIsCrossable: Story = {
  name: "A resting pointer opens the panel, crossing to it keeps it open, and a link in it is the top element at its centre",
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Products" });
    await pointAt(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"), { timeout: 2000 });
    const link = await canvas.findByRole("link", { name: /Analytics/ });
    await settled(link.closest("[data-state]")!);
    // across the gap between the trigger and the panel to a link, without the panel closing
    const rect = link.getBoundingClientRect();
    await moveTo(rect.left + rect.width / 2, trigger.getBoundingClientRect().bottom + 2);
    await moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await wait(500);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const centre = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    expect(link.contains(centre)).toBe(true);
    expect(rect.height).toBeGreaterThanOrEqual(24);
    // and leaving the whole menu closes it
    await moveTo(canvasElement.getBoundingClientRect().right - 4, canvasElement.getBoundingClientRect().bottom - 4);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"), { timeout: 2000 });
    await parkPointer();
  },
};

export const PanelsResizeBetweenItems: Story = {
  name: "Moving to another trigger swaps the panel in the same area, which resizes to hold it, with a slide direction",
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    const products = canvas.getByRole("button", { name: "Products" });
    const solutions = canvas.getByRole("button", { name: "Solutions" });
    await press(products);
    const first = await canvas.findByRole("link", { name: /Analytics/ });
    const area = first.closest<HTMLElement>('[class*="_viewport_"]')!;
    await settled(area);
    const wide = area.getBoundingClientRect();
    // a key, not a click: a real click also moves the pointer over the trigger, which the primitive reads as a hover
    solutions.focus();
    await userEvent.keyboard("{Enter}");
    const second = await canvas.findByRole("link", { name: /Engineering/ });
    // the second panel is drawn in the same area, which is resized to it once the primitive has measured it
    await waitFor(() => expect(second.closest('[class*="_viewport_"]')).toBe(area), { timeout: 3000 });
    expect((await motionOf(second)).dataset.motion).toBe("from-end");
    await settled(area);
    // the panel is as wide as its content wants, inside the two measure tokens, and the area has the size of what it holds
    await waitFor(() => expect(area.getBoundingClientRect().width).toBeLessThan(wide.width), { timeout: 5000 });
    const width = area.getBoundingClientRect().width;
    expect(width).toBeGreaterThanOrEqual(Math.min(tokenLength("--dbm-navigation-menu-panel-min-width"), window.innerWidth) - 1);
    expect(width).toBeLessThanOrEqual(tokenLength("--dbm-navigation-menu-panel-max-width") + 1);
    const panel = second.closest<HTMLElement>("[data-motion]")!;
    await waitFor(() => expect(Math.abs(area.getBoundingClientRect().width - panel.getBoundingClientRect().width)).toBeLessThanOrEqual(2 * tokenPx("--dbm-border-width-1") + 1), { timeout: 5000 });
    expect(area.getBoundingClientRect().width).toBeLessThan(wide.width);
    await closeAndWait(canvasElement);
  },
};

export const KeyboardLeavesAndEntersThePanel: Story = {
  name: "Tab goes into the open panel, Escape returns to the trigger, and once closed the triggers are ordinary tab stops",
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const products = canvas.getByRole("button", { name: "Products" });
    const solutions = canvas.getByRole("button", { name: "Solutions" });
    const user = userEvent.setup();
    products.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(products).toHaveAttribute("aria-expanded", "true"));
    await user.tab();
    await waitFor(() => expect(canvasElement.contains(document.activeElement) && document.activeElement?.tagName === "A").toBe(true));
    expect(document.activeElement?.textContent).toContain("Analytics");
    // Escape in the panel closes it and returns focus to the trigger (Shift+Tab back was checked with real keys in the preview:
    // the primitive hands focus through a hidden proxy that a synthetic key doesn't reproduce)
    await user.keyboard("{Escape}");
    await waitFor(() => expect(products).toHaveFocus());
    await waitFor(() => expect(products).toHaveAttribute("aria-expanded", "false"));
    // a panel easing out is still in the page, so wait for it to be gone before tabbing on
    await waitFor(() => expect(canvas.queryByRole("link", { name: /Analytics/ })).not.toBeInTheDocument(), { timeout: 3000 });
    // closed, the triggers are ordinary tab stops
    await user.tab();
    await waitFor(() => expect(solutions).toHaveFocus());
  },
};

export const TargetsAreAtLeast24Pixels: Story = {
  name: "Every trigger and link in the bar is at least 24 × 24 CSS pixels at every size",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DemoMenu key={size} size={size} aria-label={`Primary ${size}`} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const controls = [...canvasElement.querySelectorAll<HTMLElement>("nav button, nav a")];
    expect(controls.length).toBeGreaterThanOrEqual(20);
    for (const control of controls) {
      const rect = control.getBoundingClientRect();
      expect(rect.width, control.textContent ?? "").toBeGreaterThanOrEqual(24);
      expect(rect.height, control.textContent ?? "").toBeGreaterThanOrEqual(24);
    }
  },
};

export const RightToLeftPanelStartsAtTheRight: Story = {
  name: "In right-to-left text the panel lines up with the menu's right edge and slides in from the mirrored side",
  render: () => (
    <MenuStage>
      <DemoMenu dir="rtl" />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    const root = canvas.getByRole("navigation", { name: "Primary" });
    expect(root).toHaveAttribute("dir", "rtl");
    await press(canvas.getByRole("button", { name: "Products" }));
    const link = await canvas.findByRole("link", { name: /Analytics/ });
    const area = link.closest<HTMLElement>('[class*="_viewport_"]')!;
    await settled(area);
    expect(Math.abs(area.getBoundingClientRect().right - root.getBoundingClientRect().right)).toBeLessThan(2);
    // the second panel comes from the side its trigger is on, which is the mirrored one
    canvas.getByRole("button", { name: "Solutions" }).focus();
    await userEvent.keyboard("{Enter}");
    const second = await canvas.findByRole("link", { name: /Engineering/ });
    const content = await motionOf(second);
    const animation = content.getAnimations()[0];
    // the first trigger is on the right in right-to-left text, so the later one's panel comes in from the left, which the
    // primitive calls the start and the keyframes move by a negative distance
    expect(content.dataset.motion).toBe("from-start");
    if (animation) {
      const start = (animation.effect as KeyframeEffect).getKeyframes()[0]!.transform as string;
      expect(Number.parseFloat(/translateX\((-?[\d.]+)px\)/.exec(start)?.[1] ?? "0")).toBeLessThan(0);
    }
    await closeAndWait(canvasElement);
  },
};

export const OwnPanelsHangFromTheirItems: Story = {
  name: "Without a shared area each panel hangs from its own item, centred under it when asked",
  render: () => (
    <MenuStage>
      <NavigationMenu aria-label="Primary" viewport={false} panelAlign="center">
        <DemoItems />
      </NavigationMenu>
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Solutions" });
    await press(trigger);
    const link = await canvas.findByRole("link", { name: /Engineering/ });
    const panel = link.closest<HTMLElement>('[class*="_content_"]')!;
    await settled(panel);
    const item = trigger.closest("li")!.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    expect(Math.abs(rect.left + rect.width / 2 - (item.left + item.width / 2))).toBeLessThan(2);
    expect(rect.top).toBeGreaterThan(item.bottom);
    await closeAndWait(canvasElement);
  },
};

export const UnderAStickyBar: Story = {
  name: "Opened from a bar, a panel sits above the page and a real click chooses a link in it",
  render: () => (
    <MenuStage height="30rem">
      <Navbar sticky aria-label="Site">
        <Navbar.Brand>Acme</Navbar.Brand>
        <Navbar.Links aria-label="Primary">
          <NavigationMenu>
            <DemoItems />
          </NavigationMenu>
        </Navbar.Links>
      </Navbar>
      <p>Page content under the bar.</p>
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Products" });
    await press(trigger);
    const link = await canvas.findByRole("link", { name: /Security/ });
    await settled(link.closest("[data-state]")!);
    const rect = link.getBoundingClientRect();
    expect(link.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))).toBe(true);
    const bar = canvasElement.querySelector("header")!.getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(bar.bottom - 1);
    await closeAndWait(canvasElement);
  },
};

export const StackedBelowTheWidthMap: Story = {
  name: "A width map draws the stacked form on a phone and the panels from a tablet up",
  parameters: { viewport: { defaultViewport: "mobile1" } },
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <NavigationMenu aria-label="Primary" presentation={{ base: "stacked", md: "mega" }}>
      <DemoItems />
    </NavigationMenu>
  ),
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Products" });
    expect(trigger).toHaveAttribute("aria-controls");
    await press(trigger);
    const link = await canvas.findByRole("link", { name: /Analytics/ });
    expect(link).toBeVisible();
    // nested beneath the trigger, in the list's own flow, not floating
    expect(getComputedStyle(link.closest("div[id]")!).position).toBe("static");
    expect(link.getBoundingClientRect().top).toBeGreaterThan(trigger.getBoundingClientRect().bottom);
    expect(link.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const ForcedColoursKeepTheMarksAndEdges: Story = {
  name: "In forced colours the current link keeps a mark, and an open panel keeps its edge and loses its shadow",
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    const emulate = (value: "active" | null) =>
      send("Emulation.setEmulatedMedia", { features: value === null ? [] : [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await wait(300);
      expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const current = canvas.getByRole("link", { name: "Pricing" });
      // the underline is a background, which forced colours replaces, so it names a system colour
      expect(getComputedStyle(current, "::after").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      await press(canvas.getByRole("button", { name: "Products" }));
      const link = await canvas.findByRole("link", { name: /Analytics/ });
      const area = link.closest<HTMLElement>('[class*="_viewport_"]')!;
      await settled(area);
      expect(getComputedStyle(area).boxShadow).toBe("none");
      expect(getComputedStyle(area).borderTopStyle).toBe("solid");
      expect(Number.parseFloat(getComputedStyle(area).borderTopWidth)).toBeGreaterThan(0);
      await closeAndWait(canvasElement);
    } finally {
      await emulate(null);
    }
  },
};

export const ReducedMotionFades: Story = {
  name: "With a reduced-motion preference the panels fade and do not slide",
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    const emulate = (on: boolean) =>
      send("Emulation.setEmulatedMedia", { features: on ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] });
    await emulate(true);
    try {
      await wait(300);
      await press(canvas.getByRole("button", { name: "Products" }));
      await canvas.findByRole("link", { name: /Analytics/ });
      canvas.getByRole("button", { name: "Solutions" }).focus();
      await userEvent.keyboard("{Enter}");
      const second = await canvas.findByRole("link", { name: /Engineering/ });
      const content = await motionOf(second);
      expect(getComputedStyle(content).animationName).toMatch(/fadeOnly/);
      await closeAndWait(canvasElement);
    } finally {
      await emulate(false);
    }
  },
};

export const ClosedAtTheEnd: Story = {
  name: "Closing leaves nothing of the panel in the page",
  render: () => (
    <MenuStage>
      <DemoMenu />
    </MenuStage>
  ),
  play: async ({ canvasElement }) => {
    await parkPointer();
    const canvas = within(canvasElement);
    await press(canvas.getByRole("button", { name: "Products" }));
    await canvas.findByRole("link", { name: /Analytics/ });
    await closeAndWait(canvasElement);
    expect(canvas.queryByRole("link", { name: /Analytics/ })).not.toBeInTheDocument();
    expect(panelFor(canvasElement)).toBeNull();
  },
};
