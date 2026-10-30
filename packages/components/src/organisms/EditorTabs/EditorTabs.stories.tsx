import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { EditorTabs } from "./EditorTabs";
import { Demo, demoTabs, manyTabs, pathTabs, statusTabs } from "./EditorTabsStoryKit";
import { editorTabsPlaygroundSnippet, editorTabsSnippets } from "./EditorTabs.snippets";
import type { EditorTabsCloseSelects, EditorTabsOverflow, EditorTabsProps } from "./EditorTabs.types";
import type { TabsSize, TabsVariant } from "../../molecules/Tabs/Tabs.types";

// `EditorTabs.Panel` gets its own Properties table via a hidden docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  variant: TabsVariant;
  size: TabsSize;
  rounded: boolean;
  closeSelects: EditorTabsCloseSelects;
  tabMenu: boolean;
  menuPresentation: "menu" | "sheet";
  orientation: "horizontal" | "vertical";
  overflow: EditorTabsOverflow;
  dir: "ltr" | "rtl";
  "aria-label": string;
  tabs: EditorTabsProps["tabs"];
  value: EditorTabsProps["value"];
  defaultValue: EditorTabsProps["defaultValue"];
  onValueChange: EditorTabsProps["onValueChange"];
  onClose: EditorTabsProps["onClose"];
  onCloseMany: EditorTabsProps["onCloseMany"];
  hotkeys: EditorTabsProps["hotkeys"];
  onAdd: EditorTabsProps["onAdd"];
  onReorder: EditorTabsProps["onReorder"];
  tabContextMenu: EditorTabsProps["tabContextMenu"];
  labels: EditorTabsProps["labels"];
  formatNumber: EditorTabsProps["formatNumber"];
  controllerRef: EditorTabsProps["controllerRef"];
  "aria-labelledby": string;
  children: EditorTabsProps["children"];
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const off = { control: false } as const;
const noControls = {
  variant: off,
  size: off,
  rounded: off,
  closeSelects: off,
  tabMenu: off,
  menuPresentation: off,
  orientation: off,
  overflow: off,
  dir: off,
  "aria-label": off,
} as const;
/** The same, except the axes a story does draw from its own args. */
const except = (...keys: Array<keyof typeof noControls>) =>
  Object.fromEntries(Object.entries(noControls).filter(([key]) => !keys.includes(key as keyof typeof noControls)));

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Navigation/EditorTabs",
  parameters: { layout: "padded" },
  argTypes: {
    tabs: {
      control: false,
      description:
        "The tabs, in order, each { id, label, icon, title, dirty, pinned, closable, disabled }. Pinned tabs go first. The strip owns no list: it asks for changes through onClose, onAdd and onReorder and shows the array it is given next.",
    },
    value: { control: false, description: "The id of the selected tab, or null for none. Makes the selection controlled; pair it with onValueChange." },
    defaultValue: { control: false, description: "The id of the tab selected at first, for an uncontrolled strip." },
    onValueChange: { control: false, description: "Called with the id of the tab a person selected, and of the neighbour chosen after a close." },
    onClose: {
      control: false,
      description: "Called when a tab is asked to close, with the tab and what asked (the button, the Delete key, a middle-click or the controller). Closing is off when this is left out. Remove the tab from tabs to close it.",
    },
    onCloseMany: {
      control: false,
      description:
        "Called when several tabs are asked to close at once (close others, close all, the tab menu, the controller), with the tabs that can be closed. Remove them from tabs together. Without it the tab menu offers only Close.",
    },
    hotkeys: {
      control: false,
      description:
        "Keyboard shortcuts for selecting the next and previous tab, closing the selected one and adding one, each a combination such as ctrl+alt+ArrowRight (mod is ⌘ on an Apple platform and Ctrl elsewhere). None is bound by default: browsers keep some combinations for themselves (Ctrl+Tab, Ctrl+W, and on a Mac ⌘⌥ with the arrows or W), so choose ones the page can receive. The listener is on the document.",
    },
    onAdd: { control: false, description: "Called when the add button is pressed. The button appears only when this is given." },
    onReorder: {
      control: false,
      description: "Called when a tab is asked to move, with the position it has now and the one it should have. Reordering is off when this is left out. Apply it by changing the array.",
    },
    closeSelects: {
      control: "radio",
      options: ["neighbor", "previous", "none"],
      description:
        "What closing the selected tab selects once it is gone: neighbor (the next tab, or the one before it when it was last), previous (the tab that was selected before it, else its neighbour) or none (you choose).",
      table: { defaultValue: { summary: '"neighbor"' } },
    },
    tabMenu: {
      control: "boolean",
      description:
        "Draws the strip's own menu on each tab, opened by a right-click, a long press or the context-menu key: Close, Close others, Close tabs after this one and Close all (with onCloseMany), and the moves (with onReorder). The way to close or move a tab for a person who can't drag, on a touch screen or with a screen reader. With tabContextMenu too, your items follow these.",
      table: { defaultValue: { summary: "false" } },
    },
    menuPresentation: {
      control: "radio",
      options: ["menu", "sheet"],
      description:
        "How the tab menu is drawn: at the pointer, or as a sheet across the bottom of the screen (a single value or a mobile-first map keyed by breakpoint, such as { base: sheet, md: menu }). Needs tabMenu or tabContextMenu.",
      table: { defaultValue: { summary: '"menu"' } },
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Which way the strip runs. A vertical strip is a column, for a side panel of open items; it scrolls when the root is given a height.",
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    tabContextMenu: {
      control: false,
      description:
        "The items of the menu a right-click, a long press or the context-menu key opens on a tab, as ContextMenu items, for actions of your own. With tabMenu they follow the strip's own items.",
    },
    overflow: {
      control: "radio",
      options: ["scroll", "menu"],
      description: "How the tabs that don't fit are reached: scroll the strip, or also add a menu listing every tab.",
      table: { defaultValue: { summary: '"scroll"' } },
    },
    variant: {
      control: "select",
      options: ["underline", "subtle", "outlined", "solid"],
      description: "How the selected tab is marked.",
      table: { defaultValue: { summary: '"underline"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the tabs and the buttons beside them.",
      table: { defaultValue: { summary: '"md"' } },
    },
    rounded: {
      control: "boolean",
      description: "Fully rounds the tabs of every variant but underline.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, which flips the arrow keys and the side a dragged tab is dropped on.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: { control: false, description: "The text the strip supplies itself (the list's name, the close and add buttons, the announcements), merged over the English defaults." },
    formatNumber: { control: false, description: "Writes the numbers the strip announces. Defaults to String." },
    controllerRef: { control: false, description: "Receives the controller: select, close, add, move and focus, from code outside the strip." },
    "aria-label": { control: "text", description: "The tab list's accessible name, overriding labels.tabList." },
    "aria-labelledby": { control: false, description: "The id of a visible element that names the tab list." },
    children: { control: false, description: "Panels (EditorTabs.Panel), drawn under the strip." },
    id: { control: false, description: "Standard DOM id, on the root element." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect." },
  },
  args: {
    variant: "underline",
    size: "md",
    rounded: false,
    closeSelects: "neighbor",
    tabMenu: false,
    menuPresentation: "menu",
    orientation: "horizontal",
    overflow: "scroll",
    dir: "ltr",
    "aria-label": "Open files",
  },
  render: (args) => (
    <Demo
      // Keyed by the direction and orientation, so changing them restarts the demo's list.
      key={`${args.dir}-${args.orientation}`}
      variant={args.variant}
      size={args.size}
      rounded={args.rounded}
      closeSelects={args.closeSelects}
      presetMenu={args.tabMenu}
      menuPresentation={args.menuPresentation}
      orientation={args.orientation}
      style={args.orientation === "vertical" ? { blockSize: "16rem" } : undefined}
      overflow={args.overflow}
      dir={args.dir}
      aria-label={args["aria-label"]}
    />
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => editorTabsPlaygroundSnippet(context.args),
      },
    },
  },
};

/** Close, add and reorder, applied by the page. */
export const Basic: Story = {
  name: "Close, add and reorder",
  argTypes: { ...except("variant", "size") },
  render: (args) => <Demo variant={args.variant} size={args.size} />,
  parameters: { docs: { source: { code: editorTabsSnippets.basic } } },
};

export const Variants: Story = {
  name: "Variants",
  argTypes: { ...except("rounded") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {(["underline", "subtle", "outlined", "solid"] as const).map((variant) => (
        <Demo key={variant} variant={variant} rounded={args.rounded} aria-label={`${variant} tabs`} addable={false} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.variants } } },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: { ...except("variant") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Demo key={size} size={size} variant={args.variant} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.sizes } } },
};

export const DirtyAndPinned: Story = {
  name: "Unsaved and pinned tabs",
  argTypes: { ...except("variant") },
  render: (args) => (
    <Demo
      variant={args.variant}
      initialValue="home"
      addable={false}
      initialTabs={[
        { id: "home", label: "Dashboard", pinned: true },
        { id: "inbox", label: "Inbox", pinned: true },
        { id: "report", label: "Q3 report", dirty: true },
        { id: "notes", label: "Meeting notes" },
        { id: "locked", label: "Archived", disabled: true },
      ]}
    />
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.dirtyAndPinned } } },
};

export const CloseSelection: Story = {
  name: "What closing selects",
  // Fixed to "previous" so the story and its snippet say the same thing.
  argTypes: { ...except("variant") },
  render: (args) => <Demo variant={args.variant} closeSelects={args.closeSelects} initialValue="app" />,
  args: { closeSelects: "previous" },
  parameters: { docs: { source: { code: editorTabsSnippets.closeSelection } } },
};

export const Overflow: Story = {
  name: "A long strip with a tab menu",
  argTypes: { ...except("variant", "size") },
  render: (args) => (
    <div style={{ maxInlineSize: "32rem" }}>
      <Demo variant={args.variant} size={args.size} overflow="menu" initialTabs={manyTabs} initialValue="file-3" />
    </div>
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.overflowMenu } } },
};

export const PresetMenu: Story = {
  name: "The tab menu",
  argTypes: { ...except("variant", "size") },
  render: (args) => <Demo variant={args.variant} size={args.size} presetMenu />,
  parameters: { docs: { source: { code: editorTabsSnippets.presetMenu } } },
};

export const Status: Story = {
  name: "Busy, error and warning tabs",
  argTypes: { ...except("variant", "size") },
  render: (args) => <Demo variant={args.variant} size={args.size} initialTabs={statusTabs} initialValue="build" addable={false} />,
  parameters: { docs: { source: { code: editorTabsSnippets.status } } },
};

export const Tooltips: Story = {
  name: "Tooltips on tabs",
  argTypes: { ...except("variant", "size") },
  render: (args) => <Demo variant={args.variant} size={args.size} initialTabs={pathTabs} initialValue="a" addable={false} />,
  parameters: { docs: { source: { code: editorTabsSnippets.tooltips } } },
};

export const Shortcuts: Story = {
  name: "Keyboard shortcuts",
  argTypes: { ...except("variant", "size") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
      <p style={{ margin: 0 }}>Press Control and Option (Ctrl and Alt) with the left or right arrow to change tab, W to close it and T to add one.</p>
      <Demo
        variant={args.variant}
        size={args.size}
        hotkeys={{ next: "ctrl+alt+ArrowRight", previous: "ctrl+alt+ArrowLeft", close: "ctrl+alt+w", add: "ctrl+alt+t" }}
      />
    </div>
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.shortcuts } } },
};

export const Vertical: Story = {
  name: "Vertical",
  argTypes: { ...except("variant", "size") },
  render: (args) => (
    <div style={{ maxInlineSize: "20rem" }}>
      <Demo variant={args.variant} size={args.size} orientation="vertical" style={{ blockSize: "18rem" }} initialTabs={manyTabs.slice(0, 12)} initialValue="file-2" />
    </div>
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.vertical } } },
};

export const TabMenu: Story = {
  name: "A menu on each tab",
  argTypes: { ...except("variant", "size") },
  render: (args) => <Demo variant={args.variant} size={args.size} withMenu />,
  parameters: { docs: { source: { code: editorTabsSnippets.tabContextMenu } } },
};

export const WithPanels: Story = {
  name: "With panels",
  argTypes: { ...except("variant") },
  render: (args) => (
    <EditorTabs
      aria-label="Open files"
      variant={args.variant}
      tabs={demoTabs.slice(0, 3)}
      defaultValue="index"
    >
      <EditorTabs.Panel value="index" forceMount>
        The contents of index.ts. It stays mounted when another tab is selected.
      </EditorTabs.Panel>
      <EditorTabs.Panel value="app">The contents of App.tsx.</EditorTabs.Panel>
      <EditorTabs.Panel value="styles">The contents of styles.css.</EditorTabs.Panel>
    </EditorTabs>
  ),
  parameters: { docs: { source: { code: editorTabsSnippets.panels } } },
};

export const RightToLeft: Story = {
  name: "Right to left",
  argTypes: { ...except("variant") },
  render: (args) => <Demo variant={args.variant} dir="rtl" />,
  parameters: { docs: { source: { code: editorTabsSnippets.rightToLeft } } },
};
