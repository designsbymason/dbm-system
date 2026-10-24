import type { Meta, StoryObj } from "@storybook/react-vite";
import { DotsThreeIcon } from "@dbm-system/icons";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Popover } from "../../molecules/Popover";
import { Toolbar } from "../../molecules/Toolbar";
import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";
import { Dialog } from "../Dialog";
import { Menu } from "./Menu";
import type { MenuSize } from "./Menu.types";
import { countries } from "./MenuStoryKit";

// Real-browser checks for what jsdom can't evaluate: layout, the stacking above a dialog, a real pointer, the
// breakpoint, computed style from the cascade and forced colours. Hidden from the sidebar and the Docs page, and
// still run as tests (07 §4.2, guidelines/adr/0013).
const meta: Meta = {
  title: "Organisms/Navigation/Menu/Checks",
  tags: ["!dev"],
  // A modal menu hides the page behind it from assistive technology while its trigger stays focusable but unreachable
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

// A real mouse, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events. The test page
// scales its iframe, so a point inside the story is mapped to the page it is drawn on.
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

const trigger = (name: string) => body.getByRole("button", { name, hidden: true });
const textLeft = (element: Element) => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect().left;
};

const Page = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)" }}>{children}</div>
);

export const RealPointerInsideADialog: Story = {
  name: "An item chosen with a real mouse in a menu opened from inside a Dialog",
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Settings">
        <Dialog.Body>
          <Menu>
            <Menu.Trigger asChild>
              <Button variant="secondary">Theme</Button>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item>Light</Menu.Item>
              <Menu.Item>Dark</Menu.Item>
            </Menu.Content>
          </Menu>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
  play: async () => {
    await body.findByRole("dialog", { name: "Settings" });
    await realClick(trigger("Theme"));
    const menu = await openMenu();
    const item = within(menu).getByRole("menuitem", { name: "Dark" });
    const { left, top } = item.getBoundingClientRect();
    // the list is above the dialog's scrim and panel, and takes the pointer
    await expect(document.elementFromPoint(left + 8, top + 8)?.closest('[role="menuitem"]')).toBe(item);
    await realClick(item);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    // choosing did not close the dialog
    await expect(body.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  },
};

const sizeCheck = (size: MenuSize): Story => ({
  name: `Every item at size ${size} is at least 24px tall and nothing overflows`,
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content size={size}>
          <Menu.Item>Edit</Menu.Item>
          <Menu.CheckboxItem checked>Show grid</Menu.CheckboxItem>
          <Menu.RadioGroup value="a" aria-label="Sort by">
            <Menu.RadioItem value="a">Name</Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.Sub>
            <Menu.SubTrigger>More</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>Inside</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const items = [
      ...within(menu).getAllByRole("menuitem"),
      ...within(menu).getAllByRole("menuitemcheckbox"),
      ...within(menu).getAllByRole("menuitemradio"),
    ];
    await expect(items).toHaveLength(4);
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(24);
      await expect(rect.width).toBeGreaterThanOrEqual(24);
      await expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    }
    await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
  },
});

export const TargetSizeXs: Story = sizeCheck("xs");
export const TargetSizeSm: Story = sizeCheck("sm");
export const TargetSizeMd: Story = sizeCheck("md");
export const TargetSizeLg: Story = sizeCheck("lg");
export const TargetSizeXl: Story = sizeCheck("xl");

export const LongMenuScrollsInsideItsPanel: Story = {
  name: "A long menu is capped to the viewport, scrolls inside the panel, fades where there is more, and keeps the focused item in view",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Country</Button>
        </Menu.Trigger>
        <Menu.Content size="xl">
          {countries.map((country) => (
            <Menu.Item key={country}>{country}</Menu.Item>
          ))}
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const port = menu.querySelector<HTMLElement>("[data-scrollport]") as HTMLElement;
    const fades = [...menu.querySelectorAll<HTMLElement>('[aria-hidden="true"]')].filter((el) => el.className.includes("fade"));
    const [fadeStart, fadeEnd] = fades as [HTMLElement, HTMLElement];
    const rect = menu.getBoundingClientRect();
    await expect(rect.top).toBeGreaterThanOrEqual(0);
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    // the panel itself is still; what scrolls is inside it
    await expect(port.scrollHeight).toBeGreaterThan(port.clientHeight);
    await expect(menu.scrollHeight).toBeLessThanOrEqual(menu.clientHeight + 1);
    // at the top there is more below and nothing above
    await waitFor(() => expect(fadeEnd).toHaveAttribute("data-visible"));
    await expect(fadeStart).not.toHaveAttribute("data-visible");
    await waitFor(() => expect(getComputedStyle(fadeEnd).opacity).toBe("1"));
    await expect(getComputedStyle(fadeStart).opacity).toBe("0");
    // a fade takes no presses
    await expect(getComputedStyle(fadeEnd).pointerEvents).toBe("none");
    menu.focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{End}");
    const last = within(menu).getByRole("menuitem", { name: countries[countries.length - 1] as string });
    await waitFor(() => expect(last).toHaveFocus());
    // at the bottom the fades swap
    await waitFor(() => expect(fadeStart).toHaveAttribute("data-visible"));
    await expect(fadeEnd).not.toHaveAttribute("data-visible");
    // the focused item is fully in view, clear of the fade drawn over the end
    const panel = port.getBoundingClientRect();
    const target = last.getBoundingClientRect();
    await expect(target.top).toBeGreaterThanOrEqual(panel.top - 1);
    await expect(target.bottom).toBeLessThanOrEqual(panel.bottom - 1);
  },
};

export const ShortMenuHasNoFades: Story = {
  name: "A menu that fits draws no fade, and in forced colours the fades are not drawn at all",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const fades = [...menu.querySelectorAll<HTMLElement>('[aria-hidden="true"]')].filter((el) => el.className.includes("fade"));
    await expect(fades).toHaveLength(2);
    for (const fade of fades) {
      await expect(fade).not.toHaveAttribute("data-visible");
      await expect(getComputedStyle(fade).opacity).toBe("0");
    }
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      for (const fade of fades) await expect(getComputedStyle(fade).display).toBe("none");
    } finally {
      await emulate("none");
    }
  },
};

export const FlipsAboveATriggerAtTheBottom: Story = {
  name: "A menu opened near the bottom edge flips above its trigger and stays on screen",
  render: () => (
    <div style={{ blockSize: "100vh", position: "relative" }}>
      <div style={{ insetBlockEnd: "var(--dbm-space-2)", insetInlineStart: "var(--dbm-space-4)", position: "absolute" }}>
        <Menu defaultOpen>
          <Menu.Trigger asChild>
            <Button variant="secondary">Actions</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
            <Menu.Item>Archive</Menu.Item>
          </Menu.Content>
        </Menu>
      </div>
    </div>
  ),
  play: async () => {
    const menu = await openMenu();
    await expect(menu).toHaveAttribute("data-side", "top");
    const rect = menu.getBoundingClientRect();
    await expect(rect.bottom).toBeLessThanOrEqual(trigger("Actions").getBoundingClientRect().top);
    await expect(rect.top).toBeGreaterThanOrEqual(0);
  },
};

export const WidthStaysBetweenItsCaps: Story = {
  name: "The panel is at least the minimum width, and a very long label wraps inside the maximum",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Go</Menu.Item>
          <Menu.Item>
            This is a very long label that goes on and on well past any reasonable measure for a list of actions in a
            menu, so it has to wrap
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const rect = menu.getBoundingClientRect();
    await expect(rect.width).toBeLessThanOrEqual(24 * rem + 2);
    await expect(rect.width).toBeGreaterThanOrEqual(12 * rem - 2);
    const long = within(menu).getAllByRole("menuitem")[1] as HTMLElement;
    const short = within(menu).getAllByRole("menuitem")[0] as HTMLElement;
    await expect(long.getBoundingClientRect().height).toBeGreaterThan(short.getBoundingClientRect().height * 1.5);
    await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
  },
};

export const IndicatorColumnAlignsEveryLabel: Story = {
  name: "Check and radio indicators sit in a column that every label lines up with",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">View</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Group>
            <Menu.Label>Panels</Menu.Label>
            <Menu.Item>Plain item</Menu.Item>
          </Menu.Group>
          <Menu.CheckboxItem checked>Checked item</Menu.CheckboxItem>
          <Menu.CheckboxItem>Unchecked item</Menu.CheckboxItem>
          <Menu.RadioGroup value="a" aria-label="Mode">
            <Menu.RadioItem value="a">Radio item</Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.Sub>
            <Menu.SubTrigger>Sub trigger</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>Inside</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const labels = [
      within(menu).getByText("Panels"),
      within(menu).getByText("Plain item"),
      within(menu).getByText("Checked item"),
      within(menu).getByText("Unchecked item"),
      within(menu).getByText("Radio item"),
      within(menu).getByText("Sub trigger"),
    ];
    const lefts = labels.map(textLeft);
    for (const left of lefts) await expect(Math.abs(left - (lefts[0] as number))).toBeLessThan(0.75);
    // a group's label has more room above than below, so it clears the panel's edge and a separator line
    const heading = getComputedStyle(labels[0] as Element);
    await expect(parseFloat(heading.paddingTop)).toBeGreaterThan(parseFloat(heading.paddingBottom));
    // a group's label is drawn in capitals
    await expect(getComputedStyle(labels[0] as Element).textTransform).toBe("uppercase");
    // the indicator of the checked item is drawn, and the unchecked one's column is empty
    const checked = within(menu).getByRole("menuitemcheckbox", { name: "Checked item" });
    await expect(checked.querySelector("svg")).not.toBeNull();
    const unchecked = within(menu).getByRole("menuitemcheckbox", { name: "Unchecked item" });
    await expect(unchecked.querySelector("svg")).toBeNull();
  },
};

export const HighlightFollowsTheKeyboard: Story = {
  name: "The focused item is highlighted in the brand-subtle fill, and a danger item in the danger-subtle one",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item tone="danger">Delete</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const resolved = (token: string) => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = `var(${token})`;
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    };
    menu.focus();
    await userEvent.keyboard("{ArrowDown}");
    const edit = within(menu).getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveAttribute("data-highlighted"));
    await expect(getComputedStyle(edit).backgroundColor).toBe(resolved("--dbm-bg-brand-subtle"));
    // and the keyboard is marked by a ring inside the item, in the focus colour
    await expect(edit.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(edit).outlineStyle).toBe("solid");
    await expect(getComputedStyle(edit).outlineWidth).toBe("2px");
    await expect(parseFloat(getComputedStyle(edit).outlineOffset)).toBe(-2);
    await userEvent.keyboard("{ArrowDown}");
    const remove = within(menu).getByRole("menuitem", { name: "Delete" });
    await waitFor(() => expect(remove).toHaveAttribute("data-highlighted"));
    await expect(getComputedStyle(remove).backgroundColor).toBe(resolved("--dbm-bg-danger-subtle"));
    await expect(getComputedStyle(remove).color).toBe(
      (() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--dbm-text-danger)";
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      })(),
    );
  },
};

export const HoverShowsNoFocusRing: Story = {
  name: "Hovering an item shows the highlight and no focus ring, and the next key brings the ring back",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const rect = within(menu).getByRole("menuitem", { name: "Duplicate" }).getBoundingClientRect();
    const frame = window.frameElement?.getBoundingClientRect();
    const scale = frame ? frame.width / window.innerWidth : 1;
    // a real pointer moving over the item, which Radix answers by focusing it
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale,
      y: (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale,
    });
    const hovered = within(menu).getByRole("menuitem", { name: "Duplicate" });
    await waitFor(() => expect(hovered).toHaveAttribute("data-highlighted"));
    await expect(menu).toHaveAttribute("data-input", "pointer");
    await expect(getComputedStyle(hovered).outlineStyle).toBe("none");
    await userEvent.keyboard("{ArrowUp}");
    const edit = within(menu).getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveFocus());
    await expect(getComputedStyle(edit).outlineStyle).toBe("solid");
  },
};

export const PointerCloseReturnsFocusWithoutARing: Story = {
  name: "Closing with the mouse returns focus to the trigger without a focus ring",
  render: () => (
    <Page>
      <Menu>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const button = trigger("Actions");
    const outside = async () => {
      // a point well clear of the trigger and the panel
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;inset-block-start:70vh;inset-inline-start:60vw;inline-size:24px;block-size:24px";
      document.body.appendChild(probe);
      await realClick(probe);
      probe.remove();
    };
    // opened and closed with the mouse, by a press outside
    await realClick(button);
    await openMenu();
    await outside();
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await expect(button.matches(":focus-visible")).toBe(false);
    // opened with the mouse, an item chosen with the mouse
    await realClick(button);
    const menu = await openMenu();
    await realClick(within(menu).getByRole("menuitem", { name: "Edit" }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await expect(button.matches(":focus-visible")).toBe(false);
    // opened and closed with the keyboard keeps the ring that tells the keyboard where it is
    button.focus();
    await userEvent.keyboard("{Enter}");
    await openMenu();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await expect(button.matches(":focus-visible")).toBe(true);
  },
};

export const SeparatorIsDrawn: Story = {
  name: "A separator is a drawn line",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Separator />
          <Menu.Item>Delete</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const separator = within(menu).getByRole("separator");
    const style = getComputedStyle(separator);
    await expect(style.borderTopStyle).toBe("solid");
    await expect(style.borderTopWidth).toBe("1px");
    await expect(separator.getBoundingClientRect().width).toBeGreaterThan(50);
  },
};

export const ArrowUpOpensOnTheLastItem: Story = {
  name: "ArrowUp on the trigger opens the menu with focus on the last item, and Escape returns focus",
  render: () => (
    <Page>
      <Menu>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
          <Menu.Item disabled>Archive</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const button = trigger("Actions");
    button.focus();
    await userEvent.keyboard("{ArrowUp}");
    const menu = await openMenu();
    // the last item that can have focus: the disabled one is skipped
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Duplicate" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await expect(button.matches(":focus-visible")).toBe(true);
  },
};

export const SubmenuOpensOnTheStartSideInRtl: Story = {
  name: "In right-to-left a submenu opens to the left, its caret is mirrored and ArrowLeft opens it",
  render: () => (
    <div dir="rtl" style={{ minBlockSize: "100vh", padding: "var(--dbm-space-4)", paddingInlineStart: "40vw" }}>
      <Menu defaultOpen dir="rtl">
        <Menu.Trigger asChild>
          <Button variant="secondary">פעולות</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>עריכה</Menu.Item>
          <Menu.Sub>
            <Menu.SubTrigger>שיתוף</Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Item>דוא״ל</Menu.Item>
            </Menu.SubContent>
          </Menu.Sub>
        </Menu.Content>
      </Menu>
    </div>
  ),
  play: async () => {
    const menu = await openMenu();
    const subTrigger = within(menu).getByRole("menuitem", { name: "שיתוף" });
    // the caret is drawn mirrored
    const caret = subTrigger.querySelector("svg") as SVGElement;
    await expect(new DOMMatrix(getComputedStyle(caret).transform).a).toBeLessThan(0);
    menu.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(subTrigger).toHaveFocus());
    await userEvent.keyboard("{ArrowLeft}");
    const sub = await within(document.body).findByRole("menuitem", { name: "דוא״ל" });
    const subPanel = sub.closest('[role="menu"]') as HTMLElement;
    await settled(subPanel);
    await expect(subPanel.getBoundingClientRect().right).toBeLessThanOrEqual(menu.getBoundingClientRect().left + 8);
  },
};

export const ForcedColoursDrawAnOutline: Story = {
  name: "In forced colours the highlighted item is drawn with an outline",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Separator />
          <Menu.CheckboxItem checked>Show grid</Menu.CheckboxItem>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      menu.focus();
      await userEvent.keyboard("{ArrowDown}");
      const edit = within(menu).getByRole("menuitem", { name: "Edit" });
      await waitFor(() => expect(edit).toHaveAttribute("data-highlighted"));
      const style = getComputedStyle(edit);
      await expect(style.outlineStyle).toBe("solid");
      await expect(style.outlineWidth).toBe("2px");
      // the separator is a border, which forced colours keeps
      await expect(getComputedStyle(within(menu).getByRole("separator")).borderTopStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const IconButtonWithATooltipOpensTheMenu: Story = {
  name: "An IconButton with a tooltip is a working trigger",
  render: () => (
    <Page>
      <Menu>
        <Menu.Trigger asChild>
          <IconButton icon={DotsThreeIcon} aria-label="Row actions" tooltip variant="ghost" />
        </Menu.Trigger>
        <Menu.Content align="end">
          <Menu.Item>Edit</Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    await realClick(trigger("Row actions"));
    const menu = await openMenu();
    await expect(within(menu).getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger("Row actions")).toHaveFocus());
  },
};

export const InsideAToolbar: Story = {
  name: "A menu trigger in a Toolbar opens, and focus returns to it",
  render: () => (
    <Page>
      <Toolbar aria-label="Document">
        <Toolbar.Button>Bold</Toolbar.Button>
        <Toolbar.Item>
          <Menu.Trigger asChild>
            <Button variant="secondary">More</Button>
          </Menu.Trigger>
        </Toolbar.Item>
      </Toolbar>
    </Page>
  ),
  // The trigger needs a `Menu` around it; it sits in the story's own wrapper below.
  decorators: [
    (Story) => (
      <Menu>
        <Story />
        <Menu.Content>
          <Menu.Item>Italic</Menu.Item>
        </Menu.Content>
      </Menu>
    ),
  ],
  play: async () => {
    const button = trigger("More");
    await realClick(button);
    const menu = await openMenu();
    await expect(within(menu).getByRole("menuitem", { name: "Italic" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
  },
};

function DeleteFlow() {
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <Page>
      <Menu>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item tone="danger" onSelect={() => setConfirming(true)}>
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this row?"
        description="This can't be undone."
        labels={{ confirm: "Delete" }}
        tone="danger"
        onConfirm={() => setDeleted(true)}
      />
      <p data-testid="result">{deleted ? "deleted" : "kept"}</p>
    </Page>
  );
}

export const OpensAConfirmDialogFromAnItem: Story = {
  name: "An item that opens a ConfirmDialog: focus moves into it, it is pressable, and focus returns to the trigger",
  render: () => <DeleteFlow />,
  play: async () => {
    const button = trigger("Actions");
    await realClick(button);
    const menu = await openMenu();
    await realClick(within(menu).getByRole("menuitem", { name: "Delete" }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    const dialog = await body.findByRole("alertdialog", { name: "Delete this row?" });
    await settled(dialog);
    await expect(dialog.contains(document.activeElement)).toBe(true);
    // the confirm button takes a real press
    await realClick(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await expect(body.getByTestId("result")).toHaveTextContent("deleted");
    // focus is back on the menu's trigger, which is the element the dialog was opened from, and it works again
    await waitFor(() => expect(button).toHaveFocus());
    await waitFor(() => expect(document.body.style.pointerEvents).not.toBe("none"));
    // the scrim fades out after the panel is gone; the trigger takes a press once it has
    await waitFor(() => {
      const at = button.getBoundingClientRect();
      expect(document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2)?.closest("button")).toBe(button);
    });
    await realClick(button);
    await openMenu();
  },
};

export const CancellingTheDialogReturnsFocusToTheTrigger: Story = {
  name: "Cancelling a dialog an item opened returns focus to the menu's trigger",
  render: () => <DeleteFlow />,
  play: async () => {
    const button = trigger("Actions");
    button.focus();
    await userEvent.keyboard("{Enter}");
    await openMenu();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    const dialog = await body.findByRole("alertdialog", { name: "Delete this row?" });
    await settled(dialog);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(button).toHaveFocus());
    await expect(body.getByTestId("result")).toHaveTextContent("kept");
  },
};

export const AnItemShowsADescriptionAndATrailingBadge: Story = {
  name: "An item's description sits under its label and its trailing content at the end, on one row",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Account</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Profile</Menu.Item>
          <Menu.Item description="Plan and invoices" trailing={<span data-testid="badge">New</span>} shortcut="⌘B">
            Billing
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    const items = within(menu).getAllByRole("menuitem");
    const plain = items[0] as HTMLElement;
    const rich = items[1] as HTMLElement;
    await expect(rich.getBoundingClientRect().height).toBeGreaterThan(plain.getBoundingClientRect().height);
    const label = within(rich).getByText("Billing");
    const description = within(rich).getByText("Plan and invoices");
    // under the label, starting at the same edge
    await expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(label.getBoundingClientRect().bottom - 1);
    await expect(Math.abs(textLeft(description) - textLeft(label))).toBeLessThan(1);
    // the badge and the shortcut are at the end, the badge first
    const badge = within(rich).getByTestId("badge").getBoundingClientRect();
    const shortcut = rich.querySelector("kbd")!.getBoundingClientRect();
    await expect(badge.right).toBeLessThanOrEqual(shortcut.left + 1);
    await expect(rich.scrollWidth).toBeLessThanOrEqual(rich.clientWidth);
  },
};

export const ABusyItemShowsASpinner: Story = {
  name: "An item whose action is pending shows a spinner without moving anything, and the menu stays open until it resolves",
  render: () => {
    function Slow() {
      return (
        <Page>
          <Menu>
            <Menu.Trigger asChild>
              <Button variant="secondary">Actions</Button>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item icon={DotsThreeIcon} onSelect={() => new Promise((resolve) => setTimeout(resolve, 1200))} shortcut="⌘E">
                Export
              </Menu.Item>
              <Menu.Item onSelect={() => new Promise((resolve) => setTimeout(resolve, 1200))}>
                Export the whole workspace as CSV
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </Page>
      );
    }
    return <Slow />;
  },
  play: async () => {
    await realClick(trigger("Actions"));
    const menu = await openMenu();
    const withIcon = within(menu).getByRole("menuitem", { name: /^Export\s*⌘E/ });
    const widest = within(menu).getByRole("menuitem", { name: /whole workspace/ });
    const panelBefore = menu.getBoundingClientRect();
    const iconBox = withIcon.querySelector("span")!.getBoundingClientRect();
    const labelLeft = textLeft(within(withIcon).getByText("Export"));
    const widestBefore = widest.getBoundingClientRect();

    // an item with an icon: the spinner takes the icon's own box, and the label does not move
    await realClick(withIcon);
    await waitFor(() => expect(withIcon).toHaveAttribute("aria-busy", "true"));
    // the icon is gone from its slot and the spinner (a span, drawn in CSS) is in it
    await expect(withIcon.querySelector("span svg")).toBeNull();
    await expect(withIcon.querySelector("span > span[aria-hidden]")).not.toBeNull();
    const slotAfter = withIcon.querySelector("span")!.getBoundingClientRect();
    await expect(Math.abs(slotAfter.width - iconBox.width)).toBeLessThan(0.5);
    await expect(Math.abs(slotAfter.height - iconBox.height)).toBeLessThan(0.5);
    await expect(Math.abs(textLeft(within(withIcon).getByText("Export")) - labelLeft)).toBeLessThan(0.5);
    await expect(body.getByRole("menu")).toBeInTheDocument();
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull(), { timeout: 4000 });

    // the item that sets the panel's width, with no icon and no shortcut: the panel and the row keep their size
    await realClick(trigger("Actions"));
    const again = await openMenu();
    const long = within(again).getByRole("menuitem", { name: /whole workspace/ });
    const panelWide = again.getBoundingClientRect();
    await realClick(long);
    await waitFor(() => expect(long).toHaveAttribute("aria-busy", "true"));
    await expect(Math.abs(again.getBoundingClientRect().width - panelWide.width)).toBeLessThan(0.5);
    await expect(Math.abs(long.getBoundingClientRect().height - widestBefore.height)).toBeLessThan(0.5);
    await expect(Math.abs(panelBefore.width - panelWide.width)).toBeLessThan(0.5);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull(), { timeout: 4000 });
  },
};

export const MenuOpensFromInsideAPopover: Story = {
  name: "An item chosen with a real mouse in a menu opened from inside a Popover, which stays open",
  render: () => {
    function Host() {
      const [picked, setPicked] = useState("none");
      return (
        <Page>
          <Popover defaultOpen>
            <Popover.Trigger asChild>
              <Button>Settings</Button>
            </Popover.Trigger>
            <Popover.Content aria-label="Settings">
              <Menu>
                <Menu.Trigger asChild>
                  <Button variant="secondary">Theme</Button>
                </Menu.Trigger>
                <Menu.Content>
                  <Menu.Item onSelect={() => setPicked("Dark")}>Dark</Menu.Item>
                  <Menu.Item onSelect={() => setPicked("Light")}>Light</Menu.Item>
                </Menu.Content>
              </Menu>
              <p data-testid="picked">{picked}</p>
            </Popover.Content>
          </Popover>
        </Page>
      );
    }
    return <Host />;
  },
  play: async () => {
    await realClick(await body.findByRole("button", { name: "Theme" }));
    const menu = await openMenu();
    const item = within(menu).getByRole("menuitem", { name: "Dark" });
    const { left, top } = item.getBoundingClientRect();
    // the list is above the popover and takes the pointer
    await expect(document.elementFromPoint(left + 6, top + 6)?.closest('[role="menuitem"]')).toBe(item);
    await realClick(item);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(body.getByTestId("picked")).toHaveTextContent("Dark");
    // choosing did not close the popover
    await expect(body.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  },
};

export const ADisabledReasonIsShownOnHoverAndFocus: Story = {
  name: "A disabled item with a reason is reachable by keyboard, and its reason shows in a tooltip",
  render: () => (
    <Page>
      <Menu defaultOpen>
        <Menu.Trigger asChild>
          <Button variant="secondary">Actions</Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item disabled disabledReason="You need the admin role to delete">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </Page>
  ),
  play: async () => {
    const menu = await openMenu();
    menu.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    const item = within(menu).getByRole("menuitem", { name: "Delete" });
    await waitFor(() => expect(item).toHaveFocus());
    const tip = await body.findByRole("tooltip");
    await expect(tip).toHaveTextContent("You need the admin role to delete");
    // the tooltip is above the menu, not under it
    const at = tip.getBoundingClientRect();
    await expect(document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2)?.closest('[role="tooltip"]')).not.toBeNull();
    await expect(getComputedStyle(item).cursor).toBe("not-allowed");
  },
};

const sheetTree = (presentation: "sheet" | { base: "sheet"; md: "menu" } = "sheet") => (
  <Page>
    <Menu presentation={presentation}>
      <Menu.Trigger asChild>
        <Button variant="secondary">Actions</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Edit</Menu.Item>
        <Menu.Item>Duplicate</Menu.Item>
        <Menu.Sub>
          <Menu.SubTrigger>Share</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item>Email</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
      </Menu.Content>
    </Menu>
  </Page>
);

export const SheetIsPinnedToTheBottomEdge: Story = {
  name: "A sheet fills the width at the bottom edge, with 48px rows and a scrim a real press closes",
  render: () => sheetTree(),
  play: async () => {
    await realClick(trigger("Actions"));
    const menu = await openMenu();
    const rect = menu.getBoundingClientRect();
    await expect(Math.abs(rect.left)).toBeLessThan(1);
    await expect(Math.abs(rect.right - window.innerWidth)).toBeLessThan(1);
    await expect(Math.abs(rect.bottom - window.innerHeight)).toBeLessThan(1);
    await expect(rect.top).toBeGreaterThanOrEqual(0);
    for (const item of within(menu).getAllByRole("menuitem")) {
      await expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    }
    const scrim = document.querySelector("[data-menu-scrim]") as HTMLElement;
    await expect(scrim).not.toBeNull();
    const scrimRect = scrim.getBoundingClientRect();
    await expect(scrimRect.width).toBeGreaterThanOrEqual(window.innerWidth);
    // a real press on the scrim, above the sheet, closes the menu
    await realClick(document.elementFromPoint(10, 10) ?? scrim);
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

export const SheetSubmenuCoversTheMenu: Story = {
  name: "A sheet's submenu covers the menu under a Back row, and Back returns to it with focus on its trigger",
  render: () => sheetTree(),
  play: async () => {
    await realClick(trigger("Actions"));
    const menu = await openMenu();
    const share = within(menu).getByRole("menuitem", { name: "Share" });
    await realClick(share);
    const sub = (await body.findAllByRole("menu"))[1] as HTMLElement;
    await settled(sub);
    const rect = sub.getBoundingClientRect();
    await expect(Math.abs(rect.bottom - window.innerHeight)).toBeLessThan(1);
    await expect(Math.abs(rect.right - window.innerWidth)).toBeLessThan(1);
    // the menu it opened from is hidden and out of reach (inert), and focus was moved into the submenu first
    await expect(getComputedStyle(menu).opacity).toBe("0");
    await expect(menu).toHaveAttribute("inert");
    await expect(sub.contains(document.activeElement)).toBe(true);
    const rows = within(sub).getAllByRole("menuitem");
    await expect(rows.map((row) => row.textContent)).toEqual(["Back", "Email"]);
    await realClick(rows[0] as HTMLElement);
    await waitFor(() => expect(body.queryByRole("menuitem", { name: "Email" })).toBeNull());
    await expect(getComputedStyle(menu).opacity).toBe("1");
    await expect(menu).not.toHaveAttribute("inert");
    // and focus is back on the trigger, where a keyboard or a screen reader can carry on
    await waitFor(() => expect(share).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

export const SheetOnAPhoneAndMenuAbove: Story = {
  name: "On a phone, a responsive presentation is a sheet",
  // Opened on its own this story is shown at a phone's width (and it is in the test run).
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => sheetTree({ base: "sheet", md: "menu" }),
  play: async () => {
    await expect(window.innerWidth).toBeLessThan(768);
    await realClick(trigger("Actions"));
    const menu = await openMenu();
    await expect(menu).toHaveAttribute("data-presentation", "sheet");
    await expect(Math.abs(menu.getBoundingClientRect().right - window.innerWidth)).toBeLessThan(1);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

export const FloatingMenuAtDesktopWidth: Story = {
  name: "At a desktop width the same responsive presentation is the floating menu",
  render: () => sheetTree({ base: "sheet", md: "menu" }),
  play: async () => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    await realClick(trigger("Actions"));
    const menu = await openMenu();
    await expect(menu).not.toHaveAttribute("data-presentation");
    await expect(menu.getBoundingClientRect().width).toBeLessThan(window.innerWidth / 2);
    await expect(document.querySelector("[data-menu-scrim]")).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};
