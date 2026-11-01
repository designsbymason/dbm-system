import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { Menubar } from "./Menubar";
import type { MenubarSize } from "./Menubar.types";
import { DemoMenus, ViewMenu } from "./MenubarStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the stacking above a dialog, a real pointer, computed
// style from the cascade, scrolling and forced colours. Hidden from the sidebar and the Docs page, and still run as
// tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Navigation/Menubar/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance, so wait for every
// animation on the panel to finish first.
const settled = async (element: HTMLElement) => {
  await nextFrame();
  await Promise.all(
    element
      .getAnimations()
      .map((animation) => animation.finished.catch(() => undefined)),
  );
  await nextFrame();
};
const openMenu = async () => {
  const menu = await body.findByRole("menu");
  await settled(menu);
  return menu;
};
const closeMenu = async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
};
const barTrigger = (name: string) =>
  body.getByRole("menuitem", { name, hidden: true });

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events. The test page
// scales its iframe, so a point inside the story is mapped to the page it is drawn on.
function pagePoint(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return {
    x: (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale,
    y: (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale,
  };
}
async function realMove(element: Element) {
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    ...pagePoint(element),
  });
}
async function realClick(element: Element) {
  const { x, y } = pagePoint(element);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
}

const Page = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>
    {children}
  </div>
);

// The relative luminance and contrast ratio of two `rgb(…)` strings, as WCAG defines them.
const channels = (color: string) =>
  (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const luminance = (color: string) => {
  const [r = 0, g = 0, b = 0] = channels(color).map((value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// The colour a token resolves to, read through an element rather than assumed.
const resolved = (property: "color" | "backgroundColor", token: string) => {
  const probe = document.createElement("div");
  probe.style[property] = `var(--dbm-${token})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe)[property];
  probe.remove();
  return value;
};

export const RealPointerInsideADialog: Story = {
  name: "An item chosen with a real mouse in a menu opened from inside a Dialog",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Settings">
        <Dialog.Body>
          <Menubar aria-label="Application menu">
            <DemoMenus />
          </Menubar>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await body.findByRole("dialog", { name: "Settings" });
    await realClick(barTrigger("File"));
    const menu = await openMenu();
    const item = within(menu).getByRole("menuitem", { name: /Open/ });
    const { left, top } = item.getBoundingClientRect();
    // the list is above the dialog's scrim and panel, and takes the pointer
    await expect(
      document
        .elementFromPoint(left + 8, top + 8)
        ?.closest('[role="menuitem"]'),
    ).toBe(item);
    await realClick(item);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    // choosing did not close the dialog
    await expect(
      body.getByRole("dialog", { name: "Settings" }),
    ).toBeInTheDocument();
  },
};

const sizeCheck = (size: MenubarSize): Story => ({
  name: `Every trigger at size ${size} is at least 24px square and the bar does not overflow`,
  render: () => (
    <Page>
      <Menubar aria-label="Application menu" size={size} surface="outlined">
        <DemoMenus>
          <ViewMenu />
        </DemoMenus>
      </Menubar>
    </Page>
  ),
  play: async () => {
    const bar = body.getByRole("menubar");
    const triggers = within(bar).getAllByRole("menuitem");
    await expect(triggers).toHaveLength(3);
    for (const item of triggers) {
      const rect = item.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(24);
      await expect(rect.width).toBeGreaterThanOrEqual(24);
    }
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
    // the menus it opens take the bar's row size
    await realClick(triggers[0] as HTMLElement);
    const menu = await openMenu();
    for (const row of within(menu).getAllByRole("menuitem")) {
      await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(
        24,
      );
    }
    await closeMenu();
  },
});

export const TargetSizeXs: Story = sizeCheck("xs");
export const TargetSizeSm: Story = sizeCheck("sm");
export const TargetSizeMd: Story = sizeCheck("md");
export const TargetSizeLg: Story = sizeCheck("lg");
export const TargetSizeXl: Story = sizeCheck("xl");

export const PanelHangsUnderItsTrigger: Story = {
  name: "A panel starts at its trigger's start edge, below it",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu">
        <DemoMenus />
      </Menubar>
    </Page>
  ),
  play: async () => {
    await realClick(barTrigger("Edit"));
    const menu = await openMenu();
    const trigger = barTrigger("Edit").getBoundingClientRect();
    const panel = menu.getBoundingClientRect();
    await expect(Math.abs(panel.left - trigger.left)).toBeLessThanOrEqual(1);
    await expect(panel.top).toBeGreaterThanOrEqual(trigger.bottom);
    await closeMenu();
  },
};

export const APointerMovesFromOneMenuToTheNext: Story = {
  name: "With a menu open, a real pointer moving onto another trigger opens that one",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu">
        <DemoMenus />
      </Menubar>
    </Page>
  ),
  play: async () => {
    await realClick(barTrigger("File"));
    await openMenu();
    await realMove(barTrigger("Edit"));
    await waitFor(() =>
      expect(barTrigger("Edit")).toHaveAttribute("aria-expanded", "true"),
    );
    await expect(barTrigger("File")).toHaveAttribute("aria-expanded", "false");
    // the menu that closed finishes its exit before it leaves the page
    await waitFor(() => expect(body.getAllByRole("menu")).toHaveLength(1));
    await closeMenu();
  },
};

export const OneTabStopFromTheNeighbour: Story = {
  name: "Tab from the control before the bar enters it once, and Tab again leaves it",
  render: () => (
    <Page>
      <Button>Before</Button>
      <Menubar aria-label="Application menu">
        <DemoMenus />
      </Menubar>
      <Button>After</Button>
    </Page>
  ),
  play: async () => {
    body.getByRole("button", { name: "Before" }).focus();
    await userEvent.tab();
    await expect(barTrigger("File")).toHaveFocus();
    await userEvent.tab();
    await expect(body.getByRole("button", { name: "After" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(barTrigger("File")).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(body.getByRole("button", { name: "Before" })).toHaveFocus();
  },
};

export const ArrowsMirrorInRightToLeft: Story = {
  name: "In a right-to-left page the bar is drawn from the right and ArrowLeft moves to the next trigger",
  render: () => (
    <div dir="rtl">
      <Page>
        <Menubar aria-label="Application menu" dir="rtl">
          <DemoMenus />
        </Menubar>
      </Page>
    </div>
  ),
  play: async () => {
    const file = barTrigger("File");
    const edit = barTrigger("Edit");
    // the first trigger is on the right
    await expect(file.getBoundingClientRect().left).toBeGreaterThan(
      edit.getBoundingClientRect().left,
    );
    file.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(edit).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(file).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await openMenu();
    const panel = body.getByRole("menu").getBoundingClientRect();
    // a panel under the first trigger lines up with its start (right) edge
    await expect(
      Math.abs(panel.right - file.getBoundingClientRect().right),
    ).toBeLessThanOrEqual(1);
    await closeMenu();
  },
};

export const AnOverflowingBarScrollsAndKeepsFocusInView: Story = {
  name: "A bar wider than its room scrolls, shows a fade, and each trigger the arrow keys reach ends fully in view clear of it",
  render: () => (
    <Page>
      <div style={{ inlineSize: 220 }}>
        <Menubar aria-label="Application menu" surface="outlined">
          <DemoMenus>
            <ViewMenu />
            <Menubar.Menu value="window">
              <Menubar.Trigger>Window</Menubar.Trigger>
              <Menubar.Content>
                <Menubar.Item>Minimize</Menubar.Item>
              </Menubar.Content>
            </Menubar.Menu>
            <Menubar.Menu value="help">
              <Menubar.Trigger>Help</Menubar.Trigger>
              <Menubar.Content>
                <Menubar.Item>Documentation</Menubar.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </DemoMenus>
        </Menubar>
      </div>
    </Page>
  ),
  play: async () => {
    const bar = body.getByRole("menubar");
    await expect(bar.scrollWidth).toBeGreaterThan(bar.clientWidth);
    await expect(bar.getBoundingClientRect().width).toBeLessThanOrEqual(220);
    // more behind the end, nothing behind the start
    await waitFor(() => expect(bar).toHaveAttribute("data-overflow-end"));
    await expect(bar).not.toHaveAttribute("data-overflow-start");
    await expect(getComputedStyle(bar).maskImage).not.toBe("none");
    const fade = Number.parseFloat(
      getComputedStyle(bar).scrollPaddingInlineStart,
    );
    const triggers = within(bar).getAllByRole("menuitem");
    barTrigger("File").focus();
    for (let index = 1; index < triggers.length; index += 1) {
      await userEvent.keyboard("{ArrowRight}");
      const current = triggers[index] as HTMLElement;
      await expect(current).toHaveFocus();
      // the reveal runs a frame after the browser's own scroll
      await waitFor(() => {
        const edge = bar.getBoundingClientRect();
        const rect = current.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(edge.left - 0.5);
        expect(rect.right).toBeLessThanOrEqual(edge.right + 0.5);
        if (bar.scrollLeft > 1)
          expect(rect.left).toBeGreaterThanOrEqual(edge.left + fade - 0.5);
        if (bar.scrollWidth - bar.clientWidth - bar.scrollLeft > 1)
          expect(rect.right).toBeLessThanOrEqual(edge.right - fade + 0.5);
      });
    }
    await waitFor(() => expect(bar).toHaveAttribute("data-overflow-start"));
  },
};

export const PointerCloseReturnsFocusWithoutARing: Story = {
  name: "Closing with the mouse returns focus to the trigger without a ring, and a press elsewhere keeps the focus it gave",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu">
        <DemoMenus />
      </Menubar>
      <div
        style={{
          marginBlockStart: "var(--dbm-space-4)",
          marginInlineStart: "50vw",
          maxInlineSize: 240,
        }}
      >
        <Input aria-label="Elsewhere" />
      </div>
    </Page>
  ),
  play: async () => {
    const file = barTrigger("File");
    // an item chosen with the mouse
    await realClick(file);
    const menu = await openMenu();
    await realClick(within(menu).getByRole("menuitem", { name: /Save/ }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(file).toHaveFocus());
    await expect(file.matches(":focus-visible")).toBe(false);
    // opened and closed with the keyboard keeps the ring that tells the keyboard where it is
    file.focus();
    await userEvent.keyboard("{Enter}");
    await openMenu();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(file).toHaveFocus());
    await expect(file.matches(":focus-visible")).toBe(true);
    // a press on another field closes the menu and leaves the focus on that field
    await realClick(file);
    await openMenu();
    const field = body.getByLabelText("Elsewhere");
    await realClick(field);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(field).toHaveFocus();
  },
};

export const TriggerStatesPassContrast: Story = {
  name: "Trigger text and focus ring clear their floors on the hover, open and bar fills",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu" surface="filled">
        <DemoMenus />
      </Menubar>
    </Page>
  ),
  play: async () => {
    const text = resolved("color", "text-primary");
    const ring = resolved("backgroundColor", "border-focus");
    for (const fill of ["bg-surface", "bg-neutral-subtle", "bg-brand-subtle"]) {
      const background = resolved("backgroundColor", fill);
      await expect(
        contrast(text, background),
        `text on ${fill}`,
      ).toBeGreaterThanOrEqual(4.5);
      await expect(
        contrast(ring, background),
        `focus ring on ${fill}`,
      ).toBeGreaterThanOrEqual(3);
    }
    // the open trigger really takes the brand tint, and the bar its own fill
    await realClick(barTrigger("File"));
    await openMenu();
    await expect(getComputedStyle(barTrigger("File")).backgroundColor).toBe(
      resolved("backgroundColor", "bg-brand-subtle"),
    );
    await expect(
      getComputedStyle(body.getByRole("menubar")).backgroundColor,
    ).toBe(resolved("backgroundColor", "bg-neutral-subtle"));
    await closeMenu();
  },
};

export const ForcedColoursDrawAnOutlineOnTheOpenTrigger: Story = {
  name: "In forced colours the open trigger is drawn with an outline and the fade is dropped",
  render: () => (
    <Page>
      <div style={{ inlineSize: 220 }}>
        <Menubar aria-label="Application menu" surface="outlined">
          <DemoMenus>
            <ViewMenu />
          </DemoMenus>
        </Menubar>
      </div>
    </Page>
  ),
  play: async () => {
    const emulate = (features: Array<{ name: string; value: string }>) =>
      send("Emulation.setEmulatedMedia", { features });
    await emulate([{ name: "forced-colors", value: "active" }]);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(
        true,
      );
      const bar = body.getByRole("menubar");
      await expect(getComputedStyle(bar).maskImage).toBe("none");
      await realClick(barTrigger("File"));
      await openMenu();
      const style = getComputedStyle(barTrigger("File"));
      await expect(style.outlineStyle).toBe("solid");
      await expect(style.outlineWidth).toBe("2px");
      await closeMenu();
    } finally {
      // an emulation left on leaks into every check that runs after this one: clear it, not set it to its default
      await emulate([]);
    }
  },
};
