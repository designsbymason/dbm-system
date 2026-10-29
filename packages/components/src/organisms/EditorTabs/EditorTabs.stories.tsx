import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { EditorTabs } from "./EditorTabs";
import { Demo, demoTabs, manyTabs } from "./EditorTabsStoryKit";
import { editorTabsPlaygroundSnippet, editorTabsSnippets } from "./EditorTabs.snippets";
import type { EditorTabsCloseSelects, EditorTabsOverflow, EditorTabsProps } from "./EditorTabs.types";
import type { TabsSize, TabsVariant } from "../../molecules/Tabs/Tabs.types";

// `EditorTabs.Panel` gets its own Properties table via a hidden docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  variant: TabsVariant;
  size: TabsSize;
  rounded: boolean;
  closeSelects: EditorTabsCloseSelects;
  overflow: EditorTabsOverflow;
  dir: "ltr" | "rtl";
  "aria-label": string;
  tabs: EditorTabsProps["tabs"];
  value: EditorTabsProps["value"];
  defaultValue: EditorTabsProps["defaultValue"];
  onValueChange: EditorTabsProps["onValueChange"];
  onClose: EditorTabsProps["onClose"];
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
    onAdd: { control: false, description: "Called when the add button is pressed. The button appears only when this is given." },
    onReorder: {
      control: false,
      description: "Called when a tab is asked to move, with the position it has now and the one it should have. Reordering is off when this is left out. Apply it by changing the array.",
    },
    closeSelects: {
      control: "radio",
      options: ["neighbor", "none"],
      description: "What closing the selected tab selects once it is gone: neighbor (the next tab, or the one before it when it was last) or none (you choose).",
      table: { defaultValue: { summary: '"neighbor"' } },
    },
    tabContextMenu: {
      control: false,
      description:
        "The items of the menu a right-click, a long press or the context-menu key opens on a tab, as ContextMenu items. The way to close or move a tab with a single press, so a person who can't drag can still move one.",
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
    overflow: "scroll",
    dir: "ltr",
    "aria-label": "Open files",
  },
  render: (args) => (
    <Demo
      // Keyed by the direction, so changing it restarts the demo's list.
      key={args.dir}
      variant={args.variant}
      size={args.size}
      rounded={args.rounded}
      closeSelects={args.closeSelects}
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
  argTypes: { ...except("variant") },
  render: (args) => <Demo variant={args.variant} closeSelects="none" initialValue="app" />,
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
