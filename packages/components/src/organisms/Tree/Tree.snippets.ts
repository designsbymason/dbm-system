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

  highlight: `{/* highlightQuery marks the match in every label. It does not hide rows: filter nodes yourself. */}
${tree('highlightQuery="tsx"\n  defaultExpandAll')}`,

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
  if (args.checkable) attributes.push("checkable");
  if (args.defaultExpandAll) attributes.push("defaultExpandAll");
  if (args.windowed === true) attributes.push("windowed");
  if (args.windowed === false) attributes.push("windowed={false}");
  if (args.maxHeight !== undefined && args.maxHeight !== "") attributes.push(typeof args.maxHeight === "number" ? `maxHeight={${args.maxHeight}}` : `maxHeight=${quote(args.maxHeight)}`);
  if (args.highlightQuery) attributes.push(`highlightQuery=${quote(args.highlightQuery)}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return `${icons}\n<Tree aria-label=${quote(args["aria-label"] || "Project files")} nodes={${rows}}${attributes.length ? ` ${attributes.join(" ")}` : ""} />`;
}
