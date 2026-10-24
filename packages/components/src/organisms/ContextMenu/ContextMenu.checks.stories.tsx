import type { Meta, StoryObj } from "@storybook/react-vite";
import { DotsThreeIcon } from "@dbm-system/icons";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { IconButton } from "../../atoms/IconButton";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { Menu } from "../Menu";
import { countries } from "../Menu/MenuStoryKit";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuSize } from "./ContextMenu.types";

// Real-browser checks for what jsdom can't evaluate: where the panel is placed, the stacking above a dialog, a real
// right-click and a real touch, layout, computed style from the cascade and forced colours. Hidden from the sidebar
// and the Docs page, and still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Overlay/ContextMenu/Checks",
  tags: ["!dev"],
  // A modal menu hides the page behind it from assistive technology while the area stays focusable but unreachable
  // (focus is trapped in the panel and Tab does nothing), which axe's `aria-hidden-focus` reports for every story that
  // holds one open. The same markup is axe-checked open, with every kind of part, in the unit tests.
  parameters: { layout: "fullscreen", a11y: { test: "todo" } },
};

export default meta;

type Story = StoryObj;

const body = within(document.body);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// A measurement taken while the entrance is still easing is wrong by the easing's distance (the panel scales from
// 0.96), so wait for every animation on the panel to finish first.
const settled = async (element: HTMLElement) => {
  await nextFrame();
  await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await nextFrame();
};
const openMenu = async () => {
  const menu = await body.findByRole("menu");
  await settled(menu);
  return menu;
};
const waitClosed = () => waitFor(() => expect(body.queryByRole("menu")).toBeNull());

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events. The test page
// scales its iframe, so a point inside the story is mapped to the page it is drawn on.
function pagePoint(x: number, y: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
}
const centreOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};
async function click(x: number, y: number, button: "left" | "right") {
  const point = pagePoint(x, y);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button, clickCount: 1 });
}
const leftClick = (element: Element) => click(centreOf(element).x, centreOf(element).y, "left");

const Page = ({ children }: { children: React.ReactNode }) => (
  <div style={{ blockSize: "100vh", position: "relative" }}>{children}</div>
);
const Fill = ({ label = "Area", children }: { label?: string; children?: React.ReactNode }) => (
  <ContextMenu.Trigger
    tabIndex={0}
    aria-label={label}
    style={{ blockSize: "100vh", display: "block", inlineSize: "100%" }}
    data-testid="area"
  >
    {children}
  </ContextMenu.Trigger>
);
const items = (
  <>
    <ContextMenu.Item>Rename</ContextMenu.Item>
    <ContextMenu.Item>Duplicate</ContextMenu.Item>
    <ContextMenu.Item>Archive</ContextMenu.Item>
  </>
);

export const OpensWhereThePointerIs: Story = {
  name: "A real right-click opens the panel at the pointer",
  render: () => (
    <Page>
      <ContextMenu>
        <Fill />
        <ContextMenu.Content>{items}</ContextMenu.Content>
      </ContextMenu>
    </Page>
  ),
  play: async () => {
    await click(220, 140, "right");
    const menu = await openMenu();
    const rect = menu.getBoundingClientRect();
    // Radix puts the panel's start corner at the point, with the panel's own border outside it.
    await expect(Math.abs(rect.left - 220)).toBeLessThan(4);
    await expect(Math.abs(rect.top - 140)).toBeLessThan(4);
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    // the area is marked open, for the thing under the pointer to show it
    await expect(document.querySelector('[data-testid="area"]')).toHaveAttribute("data-state", "open");
    await userEvent.keyboard("{Escape}");
    await waitClosed();
  },
};

export const StaysOnScreenAtTheEdges: Story = {
  name: "A menu opened in the far corner flips and stays inside the viewport",
  render: () => (
    <Page>
      <ContextMenu>
        <Fill />
        <ContextMenu.Content>{items}</ContextMenu.Content>
      </ContextMenu>
    </Page>
  ),
  play: async () => {
    // The area stops short of the page's edge by the body's margin, so aim at its own corner (inside the viewport).
    const corner = (document.querySelector('[data-testid="area"]') as HTMLElement).getBoundingClientRect();
    await click(Math.min(corner.right, window.innerWidth) - 6, Math.min(corner.bottom, window.innerHeight) - 6, "right");
    const menu = await openMenu();
    const rect = menu.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.top).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    await userEvent.keyboard("{Escape}");
    await waitClosed();
  },
};

export const UsableInsideADialog: Story = {
  name: "Opened from inside a Dialog: above its scrim, chosen with a real mouse, the dialog stays open",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Files">
        <Dialog.Body>
          <ContextMenu>
            <ContextMenu.Trigger data-testid="area" style={{ display: "block", padding: "var(--dbm-space-8)" }}>
              Right-click me
            </ContextMenu.Trigger>
            <ContextMenu.Content>{items}</ContextMenu.Content>
          </ContextMenu>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    const dialog = await body.findByRole("dialog");
    await settled(dialog);
    const target = document.querySelector('[data-testid="area"]') as HTMLElement;
    const { x, y } = centreOf(target);
    await click(x, y, "right");
    const menu = await openMenu();
    const edit = within(menu).getByRole("menuitem", { name: "Rename" });
    const at = centreOf(edit);
    const top = document.elementFromPoint(at.x, at.y);
    await expect(edit.contains(top)).toBe(true);
    await leftClick(edit);
    await waitClosed();
    await expect(body.getByRole("dialog")).toBeInTheDocument();
  },
};

export const ScrollsWhenTallerThanTheRoom: Story = {
  name: "A long menu is capped to the viewport, scrolls, and keeps the focused item in view",
  render: () => (
    <Page>
      <ContextMenu>
        <Fill />
        <ContextMenu.Content>
          {countries.map((country) => (
            <ContextMenu.Item key={country}>{country}</ContextMenu.Item>
          ))}
        </ContextMenu.Content>
      </ContextMenu>
    </Page>
  ),
  play: async () => {
    await click(60, 60, "right");
    const menu = await openMenu();
    await expect(menu.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight);
    const port = menu.querySelector("[data-scrollport]") as HTMLElement;
    await expect(port.scrollHeight).toBeGreaterThan(port.clientHeight);
    await userEvent.keyboard("{End}");
    const last = within(menu).getByRole("menuitem", { name: countries[countries.length - 1] as string });
    await waitFor(() => expect(last).toHaveFocus());
    const portRect = port.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    await expect(lastRect.bottom).toBeLessThanOrEqual(portRect.bottom + 0.5);
    await expect(lastRect.top).toBeGreaterThanOrEqual(portRect.top - 0.5);
    await userEvent.keyboard("{Escape}");
    await waitClosed();
  },
};

const sizes: ContextMenuSize[] = ["xs", "sm", "md", "lg", "xl"];

export const EveryItemIsAtLeast24px: Story = {
  name: "Every size keeps each item at least 24px tall and inside the panel",
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", padding: "var(--dbm-space-4)" }}>
      {sizes.map((size) => (
        <ContextMenu key={size}>
          <ContextMenu.Trigger data-testid={`area-${size}`} style={{ display: "block", padding: "var(--dbm-space-3)" }}>
            {size}
          </ContextMenu.Trigger>
          <ContextMenu.Content size={size}>
            <ContextMenu.Item>Rename</ContextMenu.Item>
            <ContextMenu.CheckboxItem defaultChecked>Pinned</ContextMenu.CheckboxItem>
          </ContextMenu.Content>
        </ContextMenu>
      ))}
    </div>
  ),
  play: async () => {
    for (const size of sizes) {
      const target = document.querySelector(`[data-testid="area-${size}"]`) as HTMLElement;
      const { x, y } = centreOf(target);
      await click(x, y, "right");
      const menu = await openMenu();
      const panel = menu.getBoundingClientRect();
      for (const item of menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')) {
        const rect = item.getBoundingClientRect();
        await expect(rect.height, `${size} item height`).toBeGreaterThanOrEqual(24);
        await expect(rect.right, `${size} item inside the panel`).toBeLessThanOrEqual(panel.right + 0.5);
      }
      await userEvent.keyboard("{Escape}");
      await waitClosed();
    }
  },
};

export const FocusReturnsWithoutARingAfterAPointer: Story = {
  name: "Closing with a real mouse puts focus back on the row without a focus ring",
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <ContextMenu>
        <ContextMenu.Trigger asChild tabIndex={0}>
          <div
            data-testid="row"
            style={{ padding: "var(--dbm-space-4)", border: "var(--dbm-border-width-1) solid var(--dbm-border-default)" }}
          >
            quarterly-report.pdf
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </div>
  ),
  play: async () => {
    const row = document.querySelector('[data-testid="row"]') as HTMLElement;
    const { x, y } = centreOf(row);
    await click(x, y, "right");
    const menu = await openMenu();
    await leftClick(within(menu).getByRole("menuitem", { name: "Rename" }));
    await waitClosed();
    await waitFor(() => expect(row).toHaveFocus());
    await expect(row.matches(":focus-visible")).toBe(false);
  },
};

export const OpensOnALongPress: Story = {
  name: "A real touch held for 700ms opens the panel, and a short touch does not",
  render: () => (
    <Page>
      <ContextMenu>
        <Fill />
        <ContextMenu.Content>{items}</ContextMenu.Content>
      </ContextMenu>
    </Page>
  ),
  play: async () => {
    const point = pagePoint(200, 160);
    const touch = [{ x: point.x, y: point.y }];
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await new Promise((resolve) => setTimeout(resolve, 900));
    await expect(body.queryByRole("menu")).toBeNull();
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch });
    await new Promise((resolve) => setTimeout(resolve, 900));
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await openMenu();
    await userEvent.keyboard("{Escape}");
    await waitClosed();
  },
};

export const RightToLeftSubmenu: Story = {
  name: "Right to left: a submenu opens to the left of its trigger and its caret is mirrored",
  render: () => (
    <div dir="rtl">
      <Page>
        <ContextMenu dir="rtl">
          <Fill />
          <ContextMenu.Content>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item>Email</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu>
      </Page>
    </div>
  ),
  play: async () => {
    await click(window.innerWidth - 300, 120, "right");
    const menu = await openMenu();
    const trigger = within(menu).getByRole("menuitem", { name: "Share" });
    menu.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowLeft}");
    const sub = (await body.findAllByRole("menu"))[1] as HTMLElement;
    await settled(sub);
    await expect(sub.getBoundingClientRect().right).toBeLessThanOrEqual(trigger.getBoundingClientRect().left + 2);
    const caret = trigger.querySelector("svg") as SVGElement;
    await expect(getComputedStyle(caret).transform).not.toBe("none");
    await userEvent.keyboard("{Escape}{Escape}");
    await waitClosed();
  },
};

export const ForcedColoursDrawAnOutline: Story = {
  name: "Forced colours: the highlighted item is drawn with an outline",
  render: () => (
    <Page>
      <ContextMenu>
        <Fill />
        <ContextMenu.Content>{items}</ContextMenu.Content>
      </ContextMenu>
    </Page>
  ),
  play: async () => {
    await click(160, 120, "right");
    const menu = await openMenu();
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      menu.focus();
      await userEvent.keyboard("{ArrowDown}");
      const first = within(menu).getByRole("menuitem", { name: "Rename" });
      await waitFor(() => expect(first).toHaveAttribute("data-highlighted"));
      const style = getComputedStyle(first);
      await expect(style.outlineStyle).toBe("solid");
      await expect(style.outlineWidth).toBe("2px");
    } finally {
      await emulate("none");
    }
    await userEvent.keyboard("{Escape}");
    await waitClosed();
  },
};

export const RowWithBothMenus: Story = {
  name: "A row with a right-click menu and a button menu: each opens only its own",
  render: () => (
    <div style={{ padding: "var(--dbm-space-4)" }}>
      <ContextMenu>
        <ContextMenu.Trigger asChild tabIndex={0}>
          <div
            data-testid="row"
            style={{ alignItems: "center", display: "flex", justifyContent: "space-between", padding: "var(--dbm-space-2)" }}
          >
            quarterly-report.pdf
            <Menu>
              <Menu.Trigger asChild>
                <IconButton icon={DotsThreeIcon} aria-label="Actions for quarterly-report.pdf" variant="ghost" />
              </Menu.Trigger>
              <Menu.Content align="end">
                <Menu.Item>From the button</Menu.Item>
                <Menu.CheckboxItem>Pinned</Menu.CheckboxItem>
              </Menu.Content>
            </Menu>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>From a right-click</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </div>
  ),
  play: async () => {
    const button = body.getByRole("button", { name: "Actions for quarterly-report.pdf" });
    await leftClick(button);
    const menu = await openMenu();
    await expect(within(menu).getByRole("menuitem", { name: "From the button" })).toBeInTheDocument();
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Pinned" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitClosed();
    const row = document.querySelector('[data-testid="row"]') as HTMLElement;
    const rect = row.getBoundingClientRect();
    await click(rect.left + 40, rect.top + rect.height / 2, "right");
    const second = await openMenu();
    await expect(within(second).getByRole("menuitem", { name: "From a right-click" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitClosed();
  },
};
