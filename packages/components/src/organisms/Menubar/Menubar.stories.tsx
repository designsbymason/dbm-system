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

// Every control the stories share. A story keeps live only the ones its canvas really shows, and the rest read "–".
const everyControl = [
  "size",
  "surface",
  "tone",
  "overflow",
  "sticky",
  "stickyOffset",
  "hotkeys",
  "labels",
  "loop",
  "dir",
  "aria-label",
] as const;
type ControlName = (typeof everyControl)[number];
const onlyControls = (...live: ControlName[]) =>
  Object.fromEntries(
    everyControl.filter((name) => !live.includes(name)).map((name) => [name, { control: false }]),
  );
// What a story with one ordinary bar can show.
const barControls: ControlName[] = ["size", "surface", "tone", "loop", "dir", "aria-label"];

// A box the reader can narrow by dragging its corner (so `overflow` has a room to run out of) and scroll (so `sticky`
// has something to stick to). `overflow: auto` is also what lets a box be resized.
const playgroundBoxStyle = {
  blockSize: 240,
  inlineSize: "100%",
  minInlineSize: 120,
  maxInlineSize: "100%",
  resize: "horizontal",
  overflow: "auto",
  border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
  padding: "var(--dbm-space-1)",
} as const;

const fillerStyle = {
  color: "var(--dbm-text-secondary)",
  display: "grid",
  fontFamily: "var(--dbm-font-family-primary)",
  fontSize: "var(--dbm-font-size-sm)",
  gap: "var(--dbm-space-3)",
  lineHeight: "var(--dbm-line-height-normal)",
  padding: "var(--dbm-space-4)",
} as const;

/** Text under the bar, so a box has something to scroll and a sticky bar something to stay above. */
function Filler({ count = 8 }: { count?: number }) {
  return (
    <div style={fillerStyle}>
      {Array.from({ length: count }, (_, index) => (
        <p key={index} style={{ margin: 0 }}>
          {index === 0
            ? "Scroll this box: with sticky on, the bar stays at the top while this text moves under it."
            : "A menu bar holds the commands of a window under a few short headings, so that the rest of the screen can be given to the work itself. Each heading opens a menu, and the arrow keys move between them."}
        </p>
      ))}
    </div>
  );
}

function PlaygroundStage(args: MenubarStageArgs) {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} style={playgroundBoxStyle}>
      <Menubar {...barPropsOf(args)} scrollContainerRef={box}>
        <DemoMenus>
          <ViewMenu />
        </DemoMenus>
      </Menubar>
      <Filler />
    </div>
  );
}

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
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description:
        "How the bar is drawn: ghost (no surface; the triggers sit on the page or on a header), outlined (a bordered bar) or filled (a tinted bar).",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand"],
      description:
        "The colour of the triggers' hover and open fills and of the bar's own border and fill: brand (the system's identity colour) or neutral. Every colour is a subtle one. It does not change the menus the bar opens.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    overflow: {
      control: "select",
      options: ["scroll", "menu"],
      description:
        "What the bar does when its menus do not fit its container: scroll (sideways, with a fade at each end that has more behind it) or menu (the menus that do not fit move into a More menu, each as a submenu). Drag the corner of the box to narrow it.",
      table: { defaultValue: { summary: '"scroll"' } },
    },
    sticky: {
      control: "boolean",
      description:
        "Keeps the bar at the top of the page (or of scrollContainerRef) as the reader scrolls, with a surface behind it and a shadow while it is stuck. It needs a scrolling page or container to show.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "number",
      description:
        "How far from the top a sticky bar sticks, from the spacing token scale. Has no effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    hotkeys: {
      control: "object",
      description:
        "Keys that open a menu from anywhere on the page: an object from a menu's value (file, edit or view here) to a combination such as alt+f, where mod is ⌘ on an Apple platform and Ctrl elsewhere, or false to turn one off. Nothing is bound by default.",
    },
    labels: {
      control: "object",
      description:
        "The text the bar supplies itself, each with an English default: more, the More menu's label. Pass any subset.",
    },
    loop: {
      control: "boolean",
      description:
        "Whether the arrow keys wrap from the last trigger to the first and back.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "The reading direction of the bar and its menus: it lays the triggers out (from the right in rtl), decides which arrow key moves to the next trigger and which side a submenu opens on.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    "aria-label": {
      control: "text",
      description:
        'An accessible name for the bar ("Application menu"). A page with more than one menubar needs one on each.',
    },
    value: {
      control: false,
      description:
        "The value of the menu that is open, or an empty string when none is, to drive the bar from your own state. See Opened from code.",
    },
    defaultValue: {
      control: false,
      description:
        "The menu that is open to begin with, for uncontrolled usage. Ignored once value is provided.",
      table: { defaultValue: { summary: '""' } },
    },
    controllerRef: {
      control: false,
      description:
        "Hands the bar's controls (open, close, value) to code outside it. See Opened from a controller.",
    },
    scrollContainerRef: {
      control: false,
      description:
        "The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without sticky.",
    },
    onValueChange: {
      control: false,
      description:
        "Called with the value of the menu that opened, or an empty string when the open one closed.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with a menu's value and true once it has finished opening, or false once it has finished closing, its focus is back and it is out of the page.",
    },
  },
  // The Controls panel lists props in the order of these keys, so this is the order a reader sees: visual props
  // first, then behaviour.
  args: {
    size: "md",
    surface: "ghost",
    tone: "brand",
    overflow: "scroll",
    sticky: false,
    stickyOffset: 0,
    hotkeys: {},
    labels: { more: "More" },
    loop: true,
    dir: "ltr",
    "aria-label": "Application menu",
    onValueChange: fn(),
    onOpenChangeComplete: fn(),
  },
  render: (args) => <PlaygroundStage {...args} />,
};

export default meta;

type Story = StoryObj<MenubarStageArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: { docs: { source: playgroundSource } },
};

export const IconsAndShortcuts: Story = {
  name: "Icons, shortcut hints and a danger item",
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.iconsAndShortcuts } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
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
  argTypes: onlyControls("surface", "tone", "loop", "dir"),
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
          {...barPropsOf(args)}
          aria-label={`Application menu, ${size}`}
          size={size}
        >
          <DemoMenus />
        </Menubar>
      ))}
    </div>
  ),
};

export const Surfaces: Story = {
  name: "Surfaces",
  argTypes: onlyControls("size", "tone", "loop", "dir"),
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
          {...barPropsOf(args)}
          aria-label={`Application menu, ${surface}`}
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
  argTypes: onlyControls("size", "loop", "dir"),
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
            {...barPropsOf(args)}
            aria-label={`Application menu, ${tone} ${surface}`}
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
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.checkboxAndRadio } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
      <ViewMenu />
    </Menubar>
  ),
};

export const Submenus: Story = {
  name: "Submenus",
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.submenus } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
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
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.disabled } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
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
      <Menubar
        {...barPropsOf(args)}
        value={open}
        onValueChange={(next) => {
          setOpen(next);
          args.onValueChange?.(next);
        }}
      >
        <DemoMenus />
      </Menubar>
    </div>
  );
}

export const Controlled: Story = {
  name: "Opened from code",
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.controlled } } },
  render: (args) => <ControlledBar {...args} />,
};

// A box of a fixed width, drawn so the room the bar has to fit in can be seen whatever its surface.
const roomStyle = {
  inlineSize: 220,
  border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
  padding: "var(--dbm-space-1)",
} as const;

export const Overflowing: Story = {
  name: "A bar wider than its room",
  argTypes: onlyControls(...barControls, "overflow", "labels"),
  parameters: { docs: { source: { code: menubarSnippets.overflowing } } },
  render: (args) => (
    <div style={roomStyle}>
      <Menubar {...barPropsOf(args)}>
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
  argTypes: onlyControls(...barControls),
  args: { dir: "rtl" },
  parameters: { docs: { source: { code: menubarSnippets.rightToLeft } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
      <DemoMenus>
        <ViewMenu />
      </DemoMenus>
    </Menubar>
  ),
};

export const Actions: Story = {
  name: "Actions beside the menus",
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.actions } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
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
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.iconsAndTrailing } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
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
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.disabledReason } } },
  render: (args) => (
    <Menubar {...barPropsOf(args)}>
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
  argTypes: onlyControls(...barControls, "hotkeys"),
  args: { hotkeys: { file: "alt+f", edit: "alt+e" } },
  parameters: { docs: { source: { code: menubarSnippets.hotkeys } } },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gap: "var(--dbm-space-3)",
        justifyItems: "start",
      }}
    >
      <Menubar {...barPropsOf(args)}>
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
      <Menubar {...barPropsOf(args)} controllerRef={bar}>
        <DemoMenus />
      </Menubar>
    </div>
  );
}

export const Controller: Story = {
  name: "Opened from a controller",
  argTypes: onlyControls(...barControls),
  parameters: { docs: { source: { code: menubarSnippets.controller } } },
  render: (args) => <ControllerBar {...args} />,
};

export const OverflowMenu: Story = {
  name: "Menus that do not fit move into a More menu",
  argTypes: onlyControls(...barControls, "overflow", "labels"),
  args: { overflow: "menu" },
  parameters: { docs: { source: { code: menubarSnippets.overflowMenu } } },
  render: (args) => (
    <div style={roomStyle}>
      <Menubar {...barPropsOf(args)}>
        <DemoMenus>
          <ViewMenu />
          <Menubar.Menu value="window">
            <Menubar.Trigger>Window</Menubar.Trigger>
            <Menubar.Content>
              <Menubar.Item>Minimize</Menubar.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Action>Help</Menubar.Action>
        </DemoMenus>
      </Menubar>
    </div>
  ),
};

export const Sticky: Story = {
  name: "A sticky bar",
  argTypes: onlyControls(...barControls, "sticky", "stickyOffset"),
  args: { sticky: true },
  parameters: { docs: { source: { code: menubarSnippets.sticky } } },
  render: (args) => (
    <div
      style={{
        blockSize: 160,
        overflow: "auto",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
      }}
    >
      <Menubar {...barPropsOf(args)}>
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
