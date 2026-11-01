import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { CopyIcon, PencilSimpleIcon, TrashIcon } from "@dbm-system/icons";
import { fn } from "storybook/test";
import { useEffect, useState } from "react";
import { Button } from "../../atoms/Button";
import { Menubar } from "./Menubar";
import { menubarPlaygroundSnippet, menubarSnippets } from "./Menubar.snippets";
import {
  barPropsOf,
  DemoMenus,
  ViewMenu,
  type MenubarStageArgs,
} from "./MenubarStoryKit";

// Drives the bar's own props in one Playground. `Menubar.Menu`, `Menubar.Trigger` and `Menubar.Content` are separate
// components, so each gets its own Properties table from a hidden, docs-only stories file (guidelines/adr/0013).
const playgroundSource = {
  type: "dynamic" as const,
  transform: (_code: string, context: StoryContext) =>
    menubarPlaygroundSnippet(context.args),
};

const meta: Meta<MenubarStageArgs> = {
  title: "Organisms/Navigation/Menubar",
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The height and type size of the triggers, and the row size of every menu the bar opens.",
      table: { defaultValue: { summary: '"md"' } },
    },
    surface: {
      control: "inline-radio",
      options: ["ghost", "outlined", "filled"],
      description:
        "How the bar is drawn: ghost (no surface; the triggers sit on the page or on a header), outlined (a bordered bar) or filled (a tinted bar).",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    tone: {
      control: "inline-radio",
      options: ["neutral", "brand"],
      description:
        "The colour of the triggers and of the bar's own border and fill: brand (the system's identity colour) or neutral. Every colour is a subtle one. It does not change the menus the bar opens.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    loop: {
      control: "boolean",
      description:
        "Whether the arrow keys wrap from the last trigger to the first and back.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction, passed to the bar and its menus: it decides which arrow key moves to the next trigger and which side a submenu opens on.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    onValueChange: {
      control: false,
      description:
        "Called with the value of the menu that opened, or an empty string when the open one closed.",
    },
  },
  // The Controls panel lists props in the order of these keys, so this is the order a reader sees: visual props
  // first, then behaviour.
  args: {
    size: "md",
    surface: "ghost",
    tone: "brand",
    loop: true,
    dir: "ltr",
    onValueChange: fn(),
  },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <DemoMenus>
        <ViewMenu />
      </DemoMenus>
    </Menubar>
  ),
};

export default meta;

type Story = StoryObj<MenubarStageArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const IconsAndShortcuts: Story = {
  name: "Icons, shortcut hints and a danger item",
  parameters: { docs: { source: { code: menubarSnippets.iconsAndShortcuts } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item icon={PencilSimpleIcon} shortcut="F2">
            Rename
          </Menubar.Item>
          <Menubar.Item icon={CopyIcon} shortcut="⌘D">
            Duplicate
          </Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item icon={TrashIcon} tone="danger">
            Delete
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
          <Menubar.Item>Redo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  argTypes: { size: { control: false } },
  parameters: { docs: { source: { code: menubarSnippets.sizes } } },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-4)",
        justifyItems: "start",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Menubar
          key={size}
          aria-label={`Application menu, ${size}`}
          {...barPropsOf(args)}
          size={size}
          surface="outlined"
        >
          <DemoMenus />
        </Menubar>
      ))}
    </div>
  ),
};

export const Surfaces: Story = {
  name: "Surfaces",
  argTypes: { surface: { control: false } },
  parameters: { docs: { source: { code: menubarSnippets.surfaces } } },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-4)",
        justifyItems: "start",
      }}
    >
      {(["ghost", "outlined", "filled"] as const).map((surface) => (
        <Menubar
          key={surface}
          aria-label={`Application menu, ${surface}`}
          {...barPropsOf(args)}
          surface={surface}
        >
          <DemoMenus />
        </Menubar>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones",
  argTypes: { tone: { control: false } },
  parameters: { docs: { source: { code: menubarSnippets.tones } } },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-4)",
        justifyItems: "start",
      }}
    >
      {(["brand", "neutral"] as const).flatMap((tone) =>
        (["ghost", "outlined", "filled"] as const).map((surface) => (
          <Menubar
            key={`${tone}-${surface}`}
            aria-label={`Application menu, ${tone} ${surface}`}
            {...barPropsOf(args)}
            tone={tone}
            surface={surface}
          >
            <DemoMenus />
          </Menubar>
        )),
      )}
    </div>
  ),
};

export const CheckboxAndRadioItems: Story = {
  name: "Checkbox items, radio items and a submenu",
  parameters: { docs: { source: { code: menubarSnippets.checkboxAndRadio } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <ViewMenu />
    </Menubar>
  ),
};

export const Submenus: Story = {
  name: "Submenus",
  parameters: { docs: { source: { code: menubarSnippets.submenus } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
          <Menubar.Sub>
            <Menubar.SubTrigger>Share</Menubar.SubTrigger>
            <Menubar.SubContent>
              <Menubar.Item>Email</Menubar.Item>
              <Menubar.Item>Copy link</Menubar.Item>
            </Menubar.SubContent>
          </Menubar.Sub>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};

export const DisabledTrigger: Story = {
  name: "A disabled trigger",
  parameters: { docs: { source: { code: menubarSnippets.disabled } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <DemoMenus>
        <Menubar.Menu value="view">
          <Menubar.Trigger disabled>View</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item>Zoom</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </DemoMenus>
    </Menubar>
  ),
};

function ControlledBar(args: MenubarStageArgs) {
  const [open, setOpen] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.code === "KeyF") setOpen("file");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-3)",
        justifyItems: "start",
      }}
    >
      <Menubar
        aria-label="Application menu"
        {...barPropsOf(args)}
        value={open}
        onValueChange={(next) => {
          setOpen(next);
          args.onValueChange?.(next);
        }}
      >
        <DemoMenus />
      </Menubar>
      <Button variant="secondary" size="sm" onClick={() => setOpen("edit")}>
        Open the Edit menu from code
      </Button>
      <span
        style={{
          color: "var(--dbm-text-secondary)",
          fontFamily: "var(--dbm-font-family-primary)",
        }}
      >
        Open menu: {open === "" ? "none" : open} (Alt+F opens File)
      </span>
    </div>
  );
}

export const Controlled: Story = {
  name: "Opened from code",
  parameters: { docs: { source: { code: menubarSnippets.controlled } } },
  render: (args) => <ControlledBar {...args} />,
};

export const Overflowing: Story = {
  name: "A bar wider than its room",
  parameters: { docs: { source: { code: menubarSnippets.overflowing } } },
  render: (args) => (
    <div style={{ inlineSize: 220 }}>
      <Menubar
        aria-label="Application menu"
        {...barPropsOf(args)}
        surface="outlined"
      >
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
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  args: { dir: "rtl" },
  parameters: { docs: { source: { code: menubarSnippets.rightToLeft } } },
  render: (args) => (
    <div dir="rtl">
      <Menubar aria-label="Application menu" {...barPropsOf(args)}>
        <DemoMenus>
          <ViewMenu />
        </DemoMenus>
      </Menubar>
    </div>
  ),
};
