import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { FileIcon, PlayIcon } from "@dbm-system/icons";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Dialog } from "../Dialog";
import { Menu } from "../Menu";
import { Menubar } from "./Menubar";
import type { MenubarSize } from "./Menubar.types";
import { DemoMenus, overflowDemoChildren, ViewMenu } from "./MenubarStoryKit";

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
const barTrigger = (name: string | RegExp) =>
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

// A real key press: `:focus-visible` never matches after Storybook's synthetic keys.
async function realKey(
  key: string,
  code: string,
  windowsVirtualKeyCode: number,
) {
  await send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key,
    code,
    windowsVirtualKeyCode,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode,
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
  name: "Trigger text and focus ring clear their floors on every fill a tone draws, and the tones draw their own colours",
  render: () => (
    <Page>
      <div
        style={{
          display: "grid",
          gap: "var(--dbm-space-4)",
          justifyItems: "start",
        }}
      >
        <Menubar aria-label="Brand bar" tone="brand" surface="filled">
          <DemoMenus />
        </Menubar>
        <Menubar aria-label="Neutral bar" tone="neutral" surface="filled">
          <DemoMenus />
        </Menubar>
      </div>
    </Page>
  ),
  play: async () => {
    const ring = resolved("backgroundColor", "border-focus");
    const pairs: Record<string, { text: string; fills: string[] }> = {
      brand: {
        text: "text-primary",
        fills: ["bg-surface", "bg-brand-subtle", "bg-brand-subtle-hover"],
      },
      neutral: {
        text: "text-primary",
        fills: ["bg-surface", "bg-neutral-subtle", "bg-neutral-subtle-hover"],
      },
    };
    for (const [tone, { text, fills }] of Object.entries(pairs)) {
      const color = resolved("color", text);
      for (const fill of fills) {
        const background = resolved("backgroundColor", fill);
        await expect(
          contrast(color, background),
          `${tone} text on ${fill}`,
        ).toBeGreaterThanOrEqual(4.5);
        // the ring is drawn on the bar's resting fill: a focused trigger gives up its hover and open tints
        if (!fill.endsWith("-hover"))
          await expect(
            contrast(ring, background),
            `focus ring on ${fill}`,
          ).toBeGreaterThanOrEqual(3);
      }
    }
    // a trigger with keyboard focus rests on its bar's fill
    const focusedBar = body.getByRole("menubar", { name: "Neutral bar" });
    const edit = within(focusedBar).getByRole("menuitem", { name: "Edit" });
    edit.focus();
    await realKey("ArrowLeft", "ArrowLeft", 37);
    const file = within(focusedBar).getByRole("menuitem", { name: "File" });
    await expect(file).toHaveFocus();
    await expect(file.matches(":focus-visible")).toBe(true);
    // the fill eases in, so wait for it
    // resolved once, outside the wait: a probe added on every poll would re-trigger `waitFor`'s own observer
    const rest = resolved("backgroundColor", "bg-neutral-subtle");
    await waitFor(() =>
      expect(getComputedStyle(file).backgroundColor).toBe(rest),
    );
    // each bar really draws its own tone: the fill, the trigger text and the open trigger
    const brand = body.getByRole("menubar", { name: "Brand bar" });
    const neutral = body.getByRole("menubar", { name: "Neutral bar" });
    await expect(getComputedStyle(brand).backgroundColor).toBe(
      resolved("backgroundColor", "bg-brand-subtle"),
    );
    await expect(getComputedStyle(neutral).backgroundColor).toBe(
      resolved("backgroundColor", "bg-neutral-subtle"),
    );
    const trigger = (bar: HTMLElement, name: string) =>
      within(bar).getByRole("menuitem", { name });
    await expect(getComputedStyle(trigger(brand, "File")).color).toBe(
      resolved("color", "text-primary"),
    );
    await expect(getComputedStyle(trigger(neutral, "File")).color).toBe(
      resolved("color", "text-primary"),
    );
    await realClick(trigger(brand, "File"));
    await openMenu();
    await expect(getComputedStyle(trigger(brand, "File")).backgroundColor).toBe(
      resolved("backgroundColor", "bg-brand-subtle-hover"),
    );
    await closeMenu();
    await realClick(trigger(neutral, "Edit"));
    await openMenu();
    await expect(
      getComputedStyle(trigger(neutral, "Edit")).backgroundColor,
    ).toBe(resolved("backgroundColor", "bg-neutral-subtle-hover"));
    await closeMenu();
  },
};

export const OutlinedBarBorderIsSubtle: Story = {
  name: "An outlined bar's border is the subtle token of its tone",
  render: () => (
    <Page>
      <div
        style={{
          display: "grid",
          gap: "var(--dbm-space-4)",
          justifyItems: "start",
        }}
      >
        <Menubar aria-label="Brand bar" tone="brand" surface="outlined">
          <DemoMenus />
        </Menubar>
        <Menubar aria-label="Neutral bar" tone="neutral" surface="outlined">
          <DemoMenus />
        </Menubar>
      </div>
    </Page>
  ),
  play: async () => {
    const border = (name: string) =>
      getComputedStyle(body.getByRole("menubar", { name })).borderTopColor;
    await expect(border("Brand bar")).toBe(
      resolved("backgroundColor", "border-brand-subtle"),
    );
    await expect(border("Neutral bar")).toBe(
      resolved("backgroundColor", "border-neutral-subtle"),
    );
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

// ---- actions, overflow, hotkeys, reasons, sticky and platform shortcuts ----

const ManyMenus = ({ room }: { room: number }) => (
  <Page>
    <div data-room="" style={{ inlineSize: room }}>
      <Menubar aria-label="Application menu" surface="outlined" overflow="menu">
        {overflowDemoChildren}
      </Menubar>
    </div>
  </Page>
);

export const OverflowMenuFitsAndGrows: Story = {
  name: "overflow='menu' keeps the bar inside its room, lists the rest in More, and gives them back as the room grows",
  render: () => <ManyMenus room={180} />,
  play: async () => {
    const room = document.querySelector<HTMLElement>(
      "[data-room]",
    ) as HTMLElement;
    const bar = body.getByRole("menubar");
    await waitFor(() =>
      expect(
        within(bar).getByRole("menuitem", { name: "More" }),
      ).toBeInTheDocument(),
    );
    await expect(bar.getBoundingClientRect().right).toBeLessThanOrEqual(
      room.getBoundingClientRect().right + 0.5,
    );
    await expect(
      within(bar).getByRole("menuitem", { name: "File" }),
    ).toBeInTheDocument();
    await expect(
      within(bar).queryByRole("menuitem", { name: "Help" }),
    ).toBeNull();
    // what moved is reachable: each hidden menu is a submenu, each action an item, of the More menu
    await realClick(within(bar).getByRole("menuitem", { name: "More" }));
    const panel = await openMenu();
    await expect(
      within(panel).getByRole("menuitem", { name: "Help" }),
    ).toBeInTheDocument();
    await expect(
      within(panel).getByRole("menuitem", { name: "Window" }),
    ).toHaveAttribute("aria-haspopup", "menu");
    await closeMenu();
    // the room grows: every menu comes back and More goes
    room.style.inlineSize = "900px";
    await waitFor(() =>
      expect(within(bar).queryByRole("menuitem", { name: "More" })).toBeNull(),
    );
    await expect(within(bar).getAllByRole("menuitem")).toHaveLength(5);
  },
};

export const OverflowHoldsTheTriggerWithFocus: Story = {
  name: "overflow='menu' never takes a trigger out from under keyboard focus, and settles when focus leaves",
  render: () => (
    <div>
      <ManyMenus room={900} />
      <Button>Elsewhere</Button>
    </div>
  ),
  play: async () => {
    const room = document.querySelector<HTMLElement>(
      "[data-room]",
    ) as HTMLElement;
    const bar = body.getByRole("menubar");
    await waitFor(() =>
      expect(within(bar).getAllByRole("menuitem")).toHaveLength(5),
    );
    const help = within(bar).getByRole("menuitem", { name: "Help" });
    help.focus();
    room.style.inlineSize = "150px";
    await new Promise((resolve) => setTimeout(resolve, 300));
    // held: the focused one is still in the bar and still focused
    await expect(help).toBeInTheDocument();
    await expect(help).toHaveFocus();
    body.getByRole("button", { name: "Elsewhere" }).focus();
    await waitFor(() =>
      expect(within(bar).queryByRole("menuitem", { name: "Help" })).toBeNull(),
    );
    await expect(
      within(bar).getByRole("menuitem", { name: "More" }),
    ).toBeInTheDocument();
  },
};

export const ActionsAndTheOpenMenu: Story = {
  name: "An action runs on a real click, and a real pointer moving onto it closes the open menu",
  render: () => {
    const Run = () => {
      const [runs, setRuns] = useState(0);
      return (
        <Page>
          <Menubar aria-label="Application menu">
            <DemoMenus>
              <Menubar.Action onSelect={() => setRuns((n) => n + 1)}>
                Run
              </Menubar.Action>
            </DemoMenus>
          </Menubar>
          <output>{`runs: ${runs}`}</output>
        </Page>
      );
    };
    return <Run />;
  },
  play: async () => {
    const run = barTrigger("Run");
    await realClick(run);
    await waitFor(() => expect(body.getByText("runs: 1")).toBeInTheDocument());
    await expect(body.queryByRole("menu")).toBeNull();
    await realClick(barTrigger("File"));
    await openMenu();
    await realMove(run);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    // the action keeps the focus; the closing menu does not take it back to its trigger
    await waitFor(() => expect(run).toHaveFocus());
    await expect(body.getByText("runs: 1")).toBeInTheDocument();
  },
};

export const AHotkeyOpensAMenuOntoItsFirstItem: Story = {
  name: "A real Alt+F from outside the bar opens File with focus on its first item",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu" hotkeys={{ file: "alt+f" }}>
        <DemoMenus />
      </Menubar>
      <Button>Elsewhere</Button>
    </Page>
  ),
  play: async () => {
    body.getByRole("button", { name: "Elsewhere" }).focus();
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Alt",
      code: "AltLeft",
      windowsVirtualKeyCode: 18,
      modifiers: 1,
    });
    await send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "f",
      code: "KeyF",
      windowsVirtualKeyCode: 70,
      modifiers: 1,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "f",
      code: "KeyF",
      windowsVirtualKeyCode: 70,
      modifiers: 1,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Alt",
      code: "AltLeft",
      windowsVirtualKeyCode: 18,
      modifiers: 0,
    });
    const menu = await openMenu();
    await waitFor(() =>
      expect(
        within(menu).getByRole("menuitem", { name: /^New/ }),
      ).toHaveFocus(),
    );
    await closeMenu();
    await waitFor(() => expect(barTrigger("File")).toHaveFocus());
  },
};

export const AReasonIsShownOnHoverAndFocus: Story = {
  name: "A trigger disabled with a reason is focusable, opens nothing, and shows its reason on a real hover and on focus",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu">
        <DemoMenus>
          <Menubar.Menu value="view">
            <Menubar.Trigger
              disabled
              disabledReason="Open a document to change the view"
            >
              View
            </Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item>Zoom</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </DemoMenus>
      </Menubar>
    </Page>
  ),
  play: async () => {
    const view = barTrigger("View");
    await realClick(view);
    await expect(body.queryByRole("menu")).toBeNull();
    await expect(view).toHaveAttribute("aria-disabled", "true");
    await realMove(view);
    await waitFor(() =>
      expect(
        body.getAllByText("Open a document to change the view").length,
      ).toBeGreaterThan(0),
    );
    // focus alone shows it too, and the arrow keys reach the trigger
    barTrigger("Edit").focus();
    await realKey("ArrowRight", "ArrowRight", 39);
    await waitFor(() => expect(view).toHaveFocus());
    await expect(view).toHaveAccessibleDescription(
      "Open a document to change the view",
    );
  },
};

export const AStickyBarStaysAtTheTop: Story = {
  name: "A sticky bar stays at the top of its scroll container with a shadow while it is stuck",
  render: () => (
    <div data-scroller="" style={{ blockSize: 240, overflow: "auto" }}>
      <Menubar aria-label="Application menu" surface="outlined" sticky>
        <DemoMenus />
      </Menubar>
      <div style={{ blockSize: 800 }} />
    </div>
  ),
  play: async () => {
    const scroller = document.querySelector<HTMLElement>(
      "[data-scroller]",
    ) as HTMLElement;
    const bar = body.getByRole("menubar");
    scroller.scrollTop = 300;
    await waitFor(() => expect(bar).toHaveAttribute("data-stuck"));
    await expect(
      Math.abs(
        bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
      ),
    ).toBeLessThanOrEqual(2);
    await expect(getComputedStyle(bar).boxShadow).not.toBe("none");
  },
};

export const ShortcutHintsFollowThePlatform: Story = {
  name: "A hint written with mod is drawn for the platform in a menubar, and as written in a Menu",
  render: () => (
    <Page>
      <Menubar aria-label="Application menu">
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item shortcut="mod+shift+s">Save as</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar>
      <Menu>
        <Menu.Trigger asChild>
          <Button>Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item shortcut="mod+shift+s">Save as</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const apple = /mac|iphone|ipad|ipod/i.test(navigator.platform);
    await realClick(barTrigger("File"));
    const panel = await openMenu();
    await waitFor(() =>
      expect(
        within(panel).getByText(apple ? "⌘⇧S" : "Ctrl+Shift+S"),
      ).toBeInTheDocument(),
    );
    await closeMenu();
    await realClick(body.getByRole("button", { name: "Actions" }));
    const menu = await openMenu();
    await expect(within(menu).getByText("mod+shift+s")).toBeInTheDocument();
    await closeMenu();
  },
};

const iconSize = (size: MenubarSize): Story => ({
  name: `A trigger with an icon at size ${size} is at least 24px square and the icon sits before the label`,
  render: () => (
    <Page>
      <Menubar aria-label="Application menu" size={size} surface="outlined">
        <Menubar.Menu value="file">
          <Menubar.Trigger icon={FileIcon}>File</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>New</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Action icon={PlayIcon} trailing={<span>3</span>}>
          Run
        </Menubar.Action>
      </Menubar>
    </Page>
  ),
  play: async () => {
    for (const name of ["File", /^Run/]) {
      const trigger = barTrigger(name);
      const rect = trigger.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(24);
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      const icon = trigger.querySelector("svg") as SVGElement;
      await expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(
        (
          trigger.querySelector("span:not(:first-child)") as HTMLElement
        ).getBoundingClientRect().left + 1,
      );
      await expect(trigger.scrollWidth).toBeLessThanOrEqual(
        trigger.clientWidth,
      );
    }
  },
});
export const IconTriggerXs: Story = iconSize("xs");
export const IconTriggerMd: Story = iconSize("md");
export const IconTriggerXl: Story = iconSize("xl");
