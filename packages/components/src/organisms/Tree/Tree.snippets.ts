// The code shown under each story's "Show code" button on Tree's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers, which can't be pasted anywhere. Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TreeSelectionMode, TreeSize } from "./Tree.types";

// A snippet is JSX and comments only (the checker wraps it in a fragment), so the rows are written inline and state is
// named in a comment, as the other snippet files do.
const rows = `[
    {
      id: "src",
      label: "src",
      icon: FolderIcon,
      children: [
        { id: "app", label: "App.tsx", icon: FileCodeIcon },
        { id: "index", label: "index.ts", icon: FileCodeIcon },
      ],
    },
    { id: "notes", label: "NOTES.txt", icon: FileTextIcon },
  ]`;

const icons = "{/* FolderIcon, FileCodeIcon and FileTextIcon come from @dbm-system/icons */}";

const tree = (attributes = "") => `${icons}\n<Tree\n  aria-label="Project files"\n  nodes={${rows}}${attributes ? `\n  ${attributes}` : ""}\n/>`;

export const treeSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — rows, text and icons */}
${tree('size="lg"\n  defaultExpandAll')}`,

  expansion: `{/* const [open, setOpen] = useState(["src"]) — expandedIds + onExpandedChange make the open rows yours;
    defaultExpandedIds and defaultExpandAll only say how it begins */}
${tree("expandedIds={open}\n  onExpandedChange={setOpen}")}`,

  single: `{/* const [selected, setSelected] = useState<string[]>([]) — a click or Space selects a row; the value is a list
    with at most one id */}
${tree('selectionMode="single"\n  value={selected}\n  onValueChange={setSelected}\n  defaultExpandAll')}`,

  multiple: `{/* Ctrl or ⌘ with a click adds or removes a row, Shift with a click or an arrow key extends it, Ctrl+A selects all */}
${tree('selectionMode="multiple"\n  defaultValue={["app"]}\n  onValueChange={(ids) => save(ids)}\n  defaultExpandAll')}`,

  picker: `{/* selectable: false on a node that only holds others: a click, Space, a Shift range and Ctrl+A skip it (it has no aria-selected),
    and it can still be opened and checked. expandOnClick makes a plain click on a folder open or close it. */}
<Tree
  aria-label="Choose files"
  selectionMode="multiple"
  expandOnClick
  nodes={[
    {
      id: "src",
      label: "src",
      selectable: false,
      children: [
        { id: "app", label: "App.tsx" },
        { id: "index", label: "index.ts" },
      ],
    },
    { id: "readme", label: "NOTES.txt" },
  ]}
/>`,

  followFocus: `{/* selectOnFocus (single mode): moving focus with the arrow keys, Home, End, Page Up and Down or a typed letter selects the row it
    lands on, as in a navigation pane. A row that cannot be selected keeps the old selection. With expandOnClick a click also opens it. */}
{/* const [current, setCurrent] = useState(["app"]) */}
<Tree aria-label="Project files" nodes={files} selectionMode="single" selectOnFocus expandOnClick value={current} onValueChange={setCurrent} />`,

  checkable: `{/* const [checked, setChecked] = useState(["app"]) — checkedIds holds the leaves; a parent shows what is under it
    ("indeterminate" when only some are checked), and checking a parent checks the leaves under it */}
${tree("checkable\n  checkedIds={checked}\n  onCheckedChange={setChecked}\n  defaultExpandAll")}`,

  lazy: `{/* hasChildren marks a row whose children you have not got. Opening it calls onExpandedChange: fetch them, list the
    id in loadingIds meanwhile, then put the result in the row's children. If the fetch fails, list the id in errorIds: the row
    says so, and opening it again (its mark, Right or Enter) calls onRetry. A fetch that finds nothing is children: [], and the
    open row shows an "Empty" row under it.
    const [loading, setLoading] = useState<string[]>([])
    const [failed, setFailed] = useState<string[]>([]) */}
<Tree
  aria-label="Remote files"
  nodes={[{ id: "remote", label: "remote", hasChildren: true }]}
  loadingIds={loading}
  errorIds={failed}
  onExpandedChange={(open) => fetchChildrenOf(open)}
  onRetry={(id) => fetchChildrenOf([id])}
/>`,

  long: `{/* A long tree: with maxHeight set, the default windowed="auto" draws only the rows in view from 200 visible rows
    (windowed forces it). Row heights are fixed by size, so a label is cut with an ellipsis. */}
<Tree aria-label="Folders" nodes={folders} maxHeight={320} windowed />`,

  disabled: `{/* disabled on a node: a person can't select, check or open it, but it stays in the arrow-key order */}
<Tree
  aria-label="Project files"
  selectionMode="single"
  nodes={[
    { id: "a", label: "Editable.ts" },
    { id: "b", label: "Locked.ts", disabled: true, description: "Read only" },
  ]}
/>`,

  trailing: `{/* description sits after the label and trailing at the end of the row. Neither can hold a button: a control
    inside a row would be a second focus stop in a tree. */}
<Tree
  aria-label="Files"
  nodes={[
    { id: "a", label: "Button.tsx", description: "component", trailing: "3 KB" },
    { id: "b", label: "Card.tsx", trailing: <Badge tone="warning">changed</Badge> },
  ]}
/>`,

  highlight: `{/* filterTree(nodes, { query }) keeps the matching rows and the rows above them, and says which rows to open
    ("expandedIds"); highlightQuery marks the match in every label. The tree itself never filters.
    const [query, setQuery] = useState("tsx")
    const [open, setOpen] = useState<string[]>([])
    const result = filterTree(nodes, { query })
    onChange of the search field: setQuery(value); setOpen(filterTree(nodes, { query: value }).expandedIds) */}
<Tree
  aria-label="Project files"
  nodes={result.nodes}
  expandedIds={open}
  onExpandedChange={setOpen}
  highlightQuery={query}
  empty={<Text color="secondary">Nothing matched.</Text>}
/>`,

  loading: `{/* loading: placeholder rows. With no rows yet they stand in for the tree and the empty message; with rows they are
    added after the last one. The tree is aria-busy meanwhile. loadingCount (default 3) is held between 0 and 20. */}
<Tree aria-label="Project files" nodes={[]} loading />
<Tree aria-label="Project files" nodes={files} loading loadingCount={2} />`,

  rowMenu: `{/* onItemContextMenu: the tree says which row a right-click, the context-menu key or Shift+F10 was for, and where; it
    draws no menu. Wrap it in a ContextMenu (the trigger is a div round the tree, so a right-click and a long press open it) and
    build the items from the id. A key has no pointer, so turn it into a menu at the point it gives.
    const menu = useRef<ContextMenuController>(null)
    const [target, setTarget] = useState<string>() */}
<ContextMenu controllerRef={menu}>
  <ContextMenu.Trigger asChild>
    <div>
      <Tree
        aria-label="Project files"
        nodes={files}
        onItemContextMenu={({ id, via, point }) => {
          setTarget(id);
          if (via === "keyboard") menu.current?.openAt(point);
        }}
      />
    </div>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item onSelect={() => copyPath(target)}>Copy path</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.Item tone="danger" onSelect={() => remove(target)}>Delete</ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu>`,

  rename: `{/* renamable: F2 on a row turns its label into a field (the text selected). Enter commits, Escape cancels, leaving
    commits unless the text is refused. The tree changes no label itself: onRename asks, and the new text appears when you change
    nodes. validateRename returns a message to refuse a name; an empty name is always refused.
    controllerRef.current?.rename(id) does the same from code, such as a "Rename" menu item.
    const [files, setFiles] = useState(initialFiles) */}
<Tree
  aria-label="Project files"
  nodes={files}
  renamable
  onRename={(id, label) => setFiles((current) => renameNode(current, id, label))}
  validateRename={(id, label) => (nameTaken(label) ? "A file with that name already exists" : undefined)}
/>`,

  customLabel: `{/* renderLabel replaces the text of a row; the arrow, check box and icon stay. It is told the row's state. */}
${tree('selectionMode="single"\n  defaultExpandAll\n  renderLabel={(node, { selected }) => <em>{selected ? `${node.label} (open)` : node.label}</em>}')}`,

  controller: `{/* const tree = useRef<TreeController>(null) — controllerRef hands expandAll(), collapseAll(), expand(id),
    collapse(id) and scrollToNode(id) to code outside the tree */}
<Button onClick={() => tree.current?.expandAll()}>Expand all</Button>
<Button onClick={() => tree.current?.collapseAll()}>Collapse all</Button>
${tree("controllerRef={tree}")}`,

  rtl: `{/* dir="rtl" mirrors the indent, the arrows and the Left and Right keys */}
${tree('dir="rtl"\n  defaultExpandAll')}`,

  empty: `{/* An empty list draws labels.empty, or whatever empty holds; empty={false} draws nothing */}
<Tree aria-label="Search results" nodes={[]} empty={<Text color="secondary">Nothing matched your search.</Text>} />`,
};

export interface TreePlaygroundSnippetArgs {
  size?: TreeSize;
  selectionMode?: TreeSelectionMode;
  expandOnClick?: boolean;
  selectOnFocus?: boolean;
  checkable?: boolean;
  defaultExpandAll?: boolean;
  windowed?: "auto" | boolean;
  maxHeight?: number | string;
  highlightQuery?: string;
  dir?: "ltr" | "rtl";
  "aria-label"?: string;
}

/** The Playground's snippet, built from its current controls: only the props that differ from their defaults. */
export function treePlaygroundSnippet(args: TreePlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.selectionMode && args.selectionMode !== "none") attributes.push(`selectionMode="${args.selectionMode}"`);
  if (args.expandOnClick) attributes.push("expandOnClick");
  if (args.selectOnFocus) attributes.push("selectOnFocus");
  if (args.checkable) attributes.push("checkable");
  if (args.defaultExpandAll) attributes.push("defaultExpandAll");
  if (args.windowed === true) attributes.push("windowed");
  if (args.windowed === false) attributes.push("windowed={false}");
  if (args.maxHeight !== undefined && args.maxHeight !== "") attributes.push(typeof args.maxHeight === "number" ? `maxHeight={${args.maxHeight}}` : `maxHeight=${quote(args.maxHeight)}`);
  if (args.highlightQuery) attributes.push(`highlightQuery=${quote(args.highlightQuery)}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return `${icons}\n<Tree aria-label=${quote(args["aria-label"] || "Project files")} nodes={${rows}}${attributes.length ? ` ${attributes.join(" ")}` : ""} />`;
}
