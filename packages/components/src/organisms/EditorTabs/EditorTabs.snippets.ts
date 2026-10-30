// The code shown under each story's "Show code" button on EditorTabs' Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers, which can't be pasted anywhere. Each snippet here is the smallest real usage of what its story shows: only
// exports of the package, no demo scaffolding, and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { EditorTabsOverflow } from "./EditorTabs.types";
import type { TabsSize, TabsVariant } from "../../molecules/Tabs/Tabs.types";

// A snippet is JSX and comments only (the checker wraps it in a fragment), so state is named in a comment, as the other
// snippet files do.
const state = `{/* const [tabs, setTabs] = useState([
      { id: "index", label: "index.ts" },
      { id: "app", label: "App.tsx", dirty: true },
      { id: "notes", label: "notes.txt" },
    ]);
    const [open, setOpen] = useState("index");
    const move = (list, from, to) => { const next = [...list]; next.splice(to, 0, next.splice(from, 1)[0]); return next; }; */}`;

const strip = (attributes = "") =>
  `${state}\n<EditorTabs\n  aria-label="Open files"\n  tabs={tabs}\n  value={open}\n  onValueChange={setOpen}\n  onClose={(tab) => setTabs(tabs.filter((t) => t.id !== tab.id))}${
    attributes ? `\n  ${attributes}` : ""
  }\n/>`;

export const editorTabsSnippets = {
  basic: `${state}
<EditorTabs
  aria-label="Open files"
  tabs={tabs}
  value={open}
  onValueChange={setOpen}
  onClose={(tab) => setTabs(tabs.filter((t) => t.id !== tab.id))}
  onReorder={(from, to) => setTabs(move(tabs, from, to))}
  onAdd={() => setTabs([...tabs, { id: crypto.randomUUID(), label: "untitled.ts" }])}
/>`,

  variants: `{/* variant: "underline" (default) | "subtle" | "outlined" | "solid"; rounded rounds every variant but underline */}
${strip('variant="outlined"\n  rounded')}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the tabs and the buttons beside them */}
${strip('size="lg"')}`,

  dirtyAndPinned: `{/* A dirty tab shows a dot until it is hovered, then the close button. A pinned tab goes first, has no close
    button unless it says closable, and is not moved by a drag or the keyboard. */}
<EditorTabs
  aria-label="Open files"
  value="home"
  tabs={[
    { id: "home", label: "Dashboard", pinned: true },
    { id: "report", label: "Q3 report", dirty: true },
    { id: "notes", label: "Notes" },
  ]}
  onClose={(tab) => remove(tab.id)}
/>`,

  closeSelection: `{/* closeSelects: "neighbor" (default) selects the next tab, or the one before it, once the selected tab is
    gone from \`tabs\`; "previous" goes back to the tab that was selected before it; "none" leaves the selection
    to you. The strip never closes anything itself. */}
${strip('closeSelects="previous"')}`,

  presetMenu: `{/* tabMenu draws the strip's own menu on each tab (right-click, long press or the context-menu key): Close,
    and with onCloseMany Close others, Close tabs after this one and Close all; and with onReorder the moves. It is
    the way to close or move a tab without the close button or a drag. onCloseMany gets the tabs to remove together. */}
<EditorTabs
  aria-label="Open files"
  tabs={tabs}
  value={open}
  onValueChange={setOpen}
  onClose={(tab) => setTabs(tabs.filter((t) => t.id !== tab.id))}
  onCloseMany={(closing) => setTabs(tabs.filter((t) => !closing.includes(t)))}
  onReorder={(from, to) => setTabs(move(tabs, from, to))}
  tabMenu
/>`,

  shortcuts: `{/* None is bound by default. A browser keeps some combinations for itself and never lets the page see them
    (Ctrl+Tab and Ctrl+W, and on a Mac ⌘⌥ with the arrow keys or W), so choose ones the page receives: Control and
    Option (Ctrl and Alt) with a key work on both. "mod" is ⌘ on an Apple platform and Ctrl elsewhere. The listener
    is on the document. */}
${strip('hotkeys={{ next: "ctrl+alt+ArrowRight", previous: "ctrl+alt+ArrowLeft", close: "ctrl+alt+w", add: "ctrl+alt+t" }}')}`,

  status: `{/* status: "busy" (a spinner) | "error" | "warning", drawn after the name and spoken after it too; statusText
    replaces the default word. */}
<EditorTabs
  aria-label="Open files"
  value="build"
  tabs={[
    { id: "build", label: "build.log", status: "busy", statusText: "saving" },
    { id: "app", label: "App.tsx", status: "error", statusText: "save failed" },
    { id: "styles", label: "styles.css", status: "warning" },
  ]}
/>`,

  tooltips: `{/* tooltip (or title) is shown in a tooltip on hover and keyboard focus. Without either, a tab shows its whole name
    in one only when the name is cut short with an ellipsis. */}
<EditorTabs
  aria-label="Open files"
  value="index"
  tabs={[
    { id: "index", label: "index.ts", tooltip: "src/organisms/EditorTabs/index.ts" },
    { id: "app", label: "App.tsx", tooltip: "src/App.tsx" },
  ]}
/>`,

  vertical: `{/* orientation="vertical" is a column, for a side panel of open items. Give the root a height and it scrolls.
    Alt + the up and down arrow keys move a tab. */}
${strip('orientation="vertical"\n  style={{ blockSize: "20rem" }}')}`,

  reorder: `{/* Drag a tab with a mouse or pen. With the keyboard: Alt + an arrow key moves the focused tab one place; Space
    picks it up, the arrow keys, Home and End move it, Space or Enter drops it and Escape puts it back. */}
${strip("onReorder={(from, to) => setTabs(move(tabs, from, to))}")}`,

  panels: `{/* Panels are optional. A panel's value is its tab's id; forceMount keeps it, hidden, while its tab is not
    selected, so an editor keeps its state. */}
<EditorTabs aria-label="Open files" tabs={tabs} value={open} onValueChange={setOpen}>
  <EditorTabs.Panel value="index" forceMount>
    The contents of index.ts.
  </EditorTabs.Panel>
  <EditorTabs.Panel value="notes">The contents of notes.txt.</EditorTabs.Panel>
</EditorTabs>`,

  overflowMenu: `{/* overflow="menu" adds a button that lists every tab, for a strip longer than its width */}
${strip('overflow="menu"')}`,

  tabContextMenu: `{/* The way to act on a tab with a single press: a right-click, a long press or the context-menu key. */}
<EditorTabs
  aria-label="Open files"
  tabs={tabs}
  value={open}
  onValueChange={setOpen}
  onReorder={(from, to) => setTabs(move(tabs, from, to))}
  tabContextMenu={({ index, count, close, move: moveTab }) => (
    <>
      <ContextMenu.Item onSelect={() => void close()}>Close</ContextMenu.Item>
      <ContextMenu.Item disabled={index === 0} onSelect={() => void moveTab(index - 1)}>
        Move left
      </ContextMenu.Item>
      <ContextMenu.Item disabled={index === count - 1} onSelect={() => void moveTab(index + 1)}>
        Move right
      </ContextMenu.Item>
    </>
  )}
/>`,

  controller: `{/* const controller = useRef<EditorTabsController>(null) — then controller.current?.select(id), .close(id),
    .add(), .move(id, to) and .focus(id), each returning whether there was something to do */}
${strip("controllerRef={controller}")}`,

  rightToLeft: `{/* dir="rtl" flips the arrow keys, the side a dragged tab lands on and the strip's scroll */}
${strip('dir="rtl"')}`,
};

interface PlaygroundSnippetArgs {
  variant?: TabsVariant;
  size?: TabsSize;
  rounded?: boolean;
  closeSelects?: "neighbor" | "previous" | "none";
  tabMenu?: boolean;
  orientation?: "horizontal" | "vertical";
  overflow?: EditorTabsOverflow;
  dir?: "ltr" | "rtl";
  "aria-label"?: string;
}

/** The Playground's snippet, written from its live controls: only what differs from the defaults. */
export const editorTabsPlaygroundSnippet = (args: PlaygroundSnippetArgs): string => {
  const attributes: string[] = [];
  const label = args["aria-label"];
  attributes.push(`aria-label=${quote(label ? label : "Open files")}`);
  attributes.push("tabs={tabs}", "value={open}", "onValueChange={setOpen}");
  attributes.push("onClose={(tab) => setTabs(tabs.filter((t) => t.id !== tab.id))}");
  attributes.push("onReorder={(from, to) => setTabs(move(tabs, from, to))}");
  attributes.push("onAdd={() => setTabs([...tabs, { id: crypto.randomUUID(), label: \"untitled.ts\" }])}");
  if (args.variant && args.variant !== "underline") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.closeSelects && args.closeSelects !== "neighbor") attributes.push(`closeSelects="${args.closeSelects}"`);
  if (args.overflow && args.overflow !== "scroll") attributes.push(`overflow="${args.overflow}"`);
  if (args.tabMenu) {
    attributes.push("onCloseMany={(closing) => setTabs(tabs.filter((t) => !closing.includes(t)))}", "tabMenu");
  }
  if (args.orientation === "vertical") attributes.push('orientation="vertical"');
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  return `${state}\n<EditorTabs\n  ${attributes.join("\n  ")}\n/>`;
};
