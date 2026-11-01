import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import {
  CopyIcon,
  FileIcon,
  ListIcon,
  PencilSimpleIcon,
  PlayIcon,
  TrashIcon,
} from "@dbm-system/icons";
import { fn } from "storybook/test";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Menu } from "../Menu";
import { Menubar } from "./Menubar";
import type { MenubarController } from "./Menubar.types";
import { menubarPlaygroundSnippet, menubarSnippets } from "./Menubar.snippets";
import {
  barPropsOf,
  DemoMenus,
  overflowDemoChildren,
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
        "The colour of the triggers' hover and open fills and of the bar's own border and fill: brand (the system's identity colour) or neutral. Every colour is a subtle one. It does not change the menus the bar opens.",
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

export const Actions: Story = {
  name: "Actions beside the menus",
  parameters: { docs: { source: { code: menubarSnippets.actions } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <DemoMenus>
        <Menubar.Action icon={PlayIcon}>Run</Menubar.Action>
        <Menubar.Action asChild>
          <a href="#help">Help</a>
        </Menubar.Action>
      </DemoMenus>
    </Menubar>
  ),
};

export const IconsAndTrailing: Story = {
  name: "An icon and trailing content on a trigger",
  parameters: { docs: { source: { code: menubarSnippets.iconsAndTrailing } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
      <Menubar.Menu value="file">
        <Menubar.Trigger icon={FileIcon}>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
          <Menubar.Item>Open</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Action trailing={<Badge size="sm">3</Badge>}>
        Inbox
      </Menubar.Action>
    </Menubar>
  ),
};

export const DisabledWithAReason: Story = {
  name: "A trigger or an action disabled with a reason",
  parameters: { docs: { source: { code: menubarSnippets.disabledReason } } },
  render: (args) => (
    <Menubar aria-label="Application menu" {...barPropsOf(args)}>
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
        <Menubar.Action disabled disabledReason="Nothing to run yet">
          Run
        </Menubar.Action>
      </DemoMenus>
    </Menubar>
  ),
};

export const HotkeysAndPlatformShortcuts: Story = {
  name: "Hotkeys, and shortcut hints drawn for the platform",
  parameters: { docs: { source: { code: menubarSnippets.hotkeys } } },
  render: (args) => (
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
        hotkeys={{ file: "alt+f", edit: "alt+e" }}
      >
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item shortcut="mod+n">New</Menubar.Item>
            <Menubar.Item shortcut="mod+s">Save</Menubar.Item>
            <Menubar.Item shortcut="mod+shift+s">Save as…</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger>Edit</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item shortcut="mod+z">Undo</Menubar.Item>
            <Menubar.Item shortcut="mod+shift+z">Redo</Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>
      </Menubar>
      <span
        style={{
          color: "var(--dbm-text-secondary)",
          fontFamily: "var(--dbm-font-family-primary)",
        }}
      >
        Press Alt+F or Alt+E anywhere on the page. The hints on the items follow
        your platform.
      </span>
    </div>
  ),
};

function ControllerBar(args: MenubarStageArgs) {
  const bar = useRef<MenubarController>(null);
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
        controllerRef={bar}
      >
        <DemoMenus />
      </Menubar>
      <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => bar.current?.open("file")}
        >
          Open File
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => bar.current?.open("edit")}
        >
          Open Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => bar.current?.close()}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export const Controller: Story = {
  name: "Opened from a controller",
  parameters: { docs: { source: { code: menubarSnippets.controller } } },
  render: (args) => <ControllerBar {...args} />,
};

export const OverflowMenu: Story = {
  name: "Menus that do not fit move into a More menu",
  parameters: { docs: { source: { code: menubarSnippets.overflowMenu } } },
  render: (args) => (
    <div style={{ inlineSize: 220 }}>
      <Menubar
        aria-label="Application menu"
        {...barPropsOf(args)}
        surface="outlined"
        overflow="menu"
      >
        {overflowDemoChildren}
      </Menubar>
    </div>
  ),
};

export const Sticky: Story = {
  name: "A sticky bar",
  parameters: { docs: { source: { code: menubarSnippets.sticky } } },
  render: (args) => (
    <div
      style={{
        blockSize: 160,
        overflow: "auto",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
      }}
    >
      <Menubar
        aria-label="Application menu"
        {...barPropsOf(args)}
        surface="outlined"
        sticky
      >
        <DemoMenus />
      </Menubar>
      <div
        style={{
          blockSize: 480,
          padding: "var(--dbm-space-4)",
          color: "var(--dbm-text-secondary)",
          fontFamily: "var(--dbm-font-family-primary)",
        }}
      >
        Scroll this panel: the bar stays at the top with a shadow.
      </div>
    </div>
  ),
};

const subscribeToWidth = (notify: () => void) => {
  const query = window.matchMedia("(min-width: 48rem)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

function NarrowScreenRecipe() {
  const wide = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia("(min-width: 48rem)").matches,
    () => true,
  );
  return wide ? (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
          <Menubar.Item>Save</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ) : (
    <Menu>
      <Menu.Trigger asChild>
        <IconButton icon={ListIcon} aria-label="Menu" />
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Label>File</Menu.Label>
        <Menu.Item>New</Menu.Item>
        <Menu.Item>Save</Menu.Item>
      </Menu.Content>
    </Menu>
  );
}

export const NarrowScreen: Story = {
  name: "Recipe: a menubar on a desktop, a Menu on a phone",
  parameters: {
    controls: { disable: true },
    docs: { source: { code: menubarSnippets.narrowScreen } },
  },
  render: () => <NarrowScreenRecipe />,
};
