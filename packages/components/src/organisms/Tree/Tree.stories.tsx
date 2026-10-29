import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { FolderIcon } from "@dbm-system/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { ContextMenu } from "../ContextMenu";
import type { ContextMenuController } from "../ContextMenu";
import { Tree } from "./Tree";
import { filterTree } from "./filterTree";
import { allSizes, Demo, manyNodes, projectFiles } from "./TreeStoryKit";
import { treePlaygroundSnippet, treeSnippets } from "./Tree.snippets";
import type { TreeController, TreeNode, TreeProps, TreeSelectionMode, TreeSize } from "./Tree.types";

// `Tree` has no sub-parts, so there is no hidden docs-only stories file (guidelines/adr/0013).
interface PlaygroundArgs {
  size: TreeSize;
  selectionMode: TreeSelectionMode;
  expandOnClick: boolean;
  selectOnFocus: boolean;
  checkable: boolean;
  defaultExpandAll: boolean;
  windowed: "auto" | "on" | "off";
  maxHeight: number | string;
  highlightQuery: string;
  dir: "ltr" | "rtl";
  "aria-label": string;
  nodes: TreeNode[];
  value: TreeProps["value"];
  defaultValue: TreeProps["defaultValue"];
  onValueChange: TreeProps["onValueChange"];
  checkedIds: TreeProps["checkedIds"];
  defaultCheckedIds: TreeProps["defaultCheckedIds"];
  onCheckedChange: TreeProps["onCheckedChange"];
  expandedIds: TreeProps["expandedIds"];
  defaultExpandedIds: TreeProps["defaultExpandedIds"];
  onExpandedChange: TreeProps["onExpandedChange"];
  loading: boolean;
  loadingCount: number;
  loadingIds: TreeProps["loadingIds"];
  errorIds: TreeProps["errorIds"];
  onRetry: TreeProps["onRetry"];
  onItemActivate: TreeProps["onItemActivate"];
  onItemContextMenu: TreeProps["onItemContextMenu"];
  renamable: TreeProps["renamable"];
  onRename: TreeProps["onRename"];
  validateRename: TreeProps["validateRename"];
  renderLabel: TreeProps["renderLabel"];
  empty: TreeProps["empty"];
  formatNumber: TreeProps["formatNumber"];
  labels: TreeProps["labels"];
  controllerRef: TreeProps["controllerRef"];
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const off = { control: false } as const;
const noControls = {
  size: off,
  selectionMode: off,
  expandOnClick: off,
  selectOnFocus: off,
  checkable: off,
  defaultExpandAll: off,
  windowed: off,
  maxHeight: off,
  highlightQuery: off,
  dir: off,
  "aria-label": off,
} as const;
/** The same, except the axes a story does draw from its own args. */
const except = (...keys: Array<keyof typeof noControls>) =>
  Object.fromEntries(Object.entries(noControls).filter(([key]) => !keys.includes(key as keyof typeof noControls)));

const windowedProp = (value: PlaygroundArgs["windowed"]): TreeProps["windowed"] => (value === "on" ? true : value === "off" ? false : "auto");

const meta: Meta<PlaygroundArgs> = {
  title: "Organisms/Data Display/Tree",
  parameters: { layout: "padded" },
  argTypes: {
    nodes: { control: false, description: "The top-level rows, each with an id, a label and optionally children. Required; an empty list draws the empty message." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the rows, text and icons.",
      table: { defaultValue: { summary: "md" } },
    },
    selectionMode: {
      control: "select",
      options: ["none", "single", "multiple"],
      description: "Whether rows can be selected: none, one at a time, or several (Ctrl or ⌘ with a click adds a row, Shift extends).",
      table: { defaultValue: { summary: "none" } },
    },
    expandOnClick: {
      control: "boolean",
      description: "A plain click on a row that has rows under it also opens or closes it, as in a navigation pane. A click with Ctrl, ⌘, Shift or Alt held only selects.",
      table: { defaultValue: { summary: "false" } },
    },
    selectOnFocus: {
      control: "boolean",
      description: "In single mode, moving focus with the keys selects the row it lands on, as in a navigation pane. Ignored in the other modes.",
      table: { defaultValue: { summary: "false" } },
    },
    value: { control: false, description: "The ids of the selected rows. Makes the selection controlled: it changes only when this does." },
    defaultValue: { control: false, description: "The ids selected to begin with, when value is not given." },
    onValueChange: { control: false, description: "Called with the ids the person wants selected." },
    checkable: {
      control: "boolean",
      description: "Draws a check box on every row; a row with others under it shows checked, unchecked or indeterminate from them.",
      table: { defaultValue: { summary: "false" } },
    },
    checkedIds: { control: false, description: "The ids of the checked leaves; a parent is worked out from them. Makes the checks controlled." },
    defaultCheckedIds: { control: false, description: "The leaves checked to begin with, when checkedIds is not given." },
    onCheckedChange: { control: false, description: "Called with the leaves the person wants checked." },
    expandedIds: { control: false, description: "The ids of the open rows. Makes the expansion controlled: it changes only when this does." },
    defaultExpandedIds: { control: false, description: "The ids open to begin with, when expandedIds is not given." },
    defaultExpandAll: {
      control: "boolean",
      description: "Starts with every row that has children open, when expandedIds and defaultExpandedIds are not given.",
      table: { defaultValue: { summary: "false" } },
    },
    onExpandedChange: { control: false, description: "Called with the ids that should be open when a person opens or closes a row." },
    loadingIds: { control: false, description: "The ids of rows whose children are being fetched: a spinner in place of the arrow, and aria-busy on the row." },
    loading: { control: false, description: "Shows that the rows are being fetched: placeholder rows, and aria-busy on the tree. With no rows they stand in for the tree; with rows they follow the last one.", table: { defaultValue: { summary: "false" } } },
    loadingCount: { control: false, description: "How many placeholder rows loading draws, held between 0 and 20.", table: { defaultValue: { summary: "3" } } },
    onItemContextMenu: { control: false, description: "Called when a row's menu is asked for: a right-click on it, the context-menu key or Shift+F10 on the focused row. It says which row and where; the tree draws no menu, so open a ContextMenu of your own." },
    renamable: { control: false, description: "Lets a row be renamed: F2 turns its label into a field. true allows every row that is not disabled; a function chooses by node.", table: { defaultValue: { summary: "false" } } },
    onRename: { control: false, description: "Called with the row's id and the new text (trimmed) when a person commits a name that differs from the label. The tree changes nothing itself: change nodes." },
    validateRename: { control: false, description: "Checks a name before it is committed: return a message to refuse it, and the field stays open and shows it." },
    errorIds: { control: false, description: "The ids of rows whose children could not be loaded: a warning mark and words on the row, and a screen reader is told. Opening such a row again calls onRetry." },
    onRetry: { control: false, description: "Called with the id of an open row listed in errorIds when a person asks to try again: its mark, Right or Enter." },
    onItemActivate: { control: false, description: "Called when a row is activated: Enter on it or a double click. A row with children and no handler is opened or closed instead." },
    renderLabel: { control: false, description: "Draws a row's label in place of its text, given the row and its state." },
    highlightQuery: { control: "text", description: "Text to find in each label and mark. It marks the match only; filter nodes yourself to hide rows." },
    windowed: {
      control: "select",
      options: ["auto", "on", "off"],
      description: "Draws only the rows in view of a long tree. auto does it from 200 visible rows, and only when maxHeight is set (true and false are on and off here).",
      table: { defaultValue: { summary: "auto" } },
    },
    maxHeight: { control: "text", description: "The most height the tree takes before it scrolls: a number is pixels, a string any CSS length." },
    empty: { control: false, description: "What to draw when there are no rows, in place of the words in labels.empty. false draws nothing." },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "The direction the tree reads. Mirrors the indent, the arrows and the Left and Right keys.",
      table: { defaultValue: { summary: "ltr" } },
    },
    formatNumber: { control: false, description: "Writes a digit for a number the component says. Callbacks keep plain numbers.", table: { defaultValue: { summary: "String" } } },
    labels: { control: false, description: "Text the component writes itself, such as the empty message. Any entry left out keeps its English default." },
    controllerRef: { control: false, description: "Hands expandAll(), collapseAll(), expand(id), collapse(id) and scrollToNode(id) to code outside the tree." },
    "aria-label": { control: "text", description: "Accessible name for the tree. One of this and aria-labelledby is needed." },
    "aria-labelledby": { control: false, description: "Id of an element that names the tree (a heading above it)." },
    id: { control: false, description: "Standard DOM id, put on the element with role tree." },
    className: { control: false, description: "Additional CSS classes, added to the outer box that scrolls." },
    style: { control: false, description: "Inline styles, merged onto the outer box that scrolls." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
    selectionMode: "none",
    expandOnClick: false,
    selectOnFocus: false,
    checkable: false,
    defaultExpandAll: false,
    windowed: "auto",
    maxHeight: "",
    highlightQuery: "",
    dir: "ltr",
    "aria-label": "Project files",
  },
  render: (args) => (
    <Tree
      // Keyed by the settings that only set how it begins, so changing one restarts the (uncontrolled) tree.
      key={`${args.defaultExpandAll}-${args.selectionMode}-${args.checkable}-${args.expandOnClick}`}
      aria-label={args["aria-label"]}
      nodes={projectFiles}
      size={args.size}
      selectionMode={args.selectionMode}
      expandOnClick={args.expandOnClick}
      selectOnFocus={args.selectOnFocus}
      checkable={args.checkable}
      defaultExpandAll={args.defaultExpandAll}
      windowed={windowedProp(args.windowed)}
      maxHeight={args.maxHeight === "" ? undefined : args.maxHeight}
      highlightQuery={args.highlightQuery || undefined}
      dir={args.dir}
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
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) =>
          treePlaygroundSnippet({ ...context.args, windowed: windowedProp(context.args.windowed), maxHeight: context.args.maxHeight === "" ? undefined : context.args.maxHeight }),
      },
    },
  },
};

/** The five size steps. */
export const Sizes: Story = {
  name: "All sizes",
  argTypes: { ...noControls },
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}>
      {allSizes.map((size) => (
        <Demo key={size} size={size} aria-label={`Size ${size}`} defaultExpandAll />
      ))}
    </div>
  ),
  parameters: { docs: { source: { code: treeSnippets.sizes } } },
};

export const Expansion: Story = {
  name: "Open and closed rows, held by you",
  argTypes: { ...except("size") },
  render: (args) => {
    const Controlled = () => {
      const [open, setOpen] = useState<string[]>(["src"]);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <Text size="sm">Open: {open.join(", ") || "none"}</Text>
          <Demo size={args.size} expandedIds={open} onExpandedChange={setOpen} />
        </div>
      );
    };
    return <Controlled />;
  },
  parameters: { docs: { source: { code: treeSnippets.expansion } } },
};

export const SingleSelection: Story = {
  name: "Selecting one row",
  argTypes: { ...except("size") },
  render: (args) => {
    const Selecting = () => {
      const [selected, setSelected] = useState<string[]>(["app"]);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <Text size="sm">Selected: {selected.join(", ") || "none"}</Text>
          <Demo size={args.size} selectionMode="single" value={selected} onValueChange={setSelected} defaultExpandAll />
        </div>
      );
    };
    return <Selecting />;
  },
  parameters: { docs: { source: { code: treeSnippets.single } } },
};

export const MultipleSelection: Story = {
  name: "Selecting several rows",
  argTypes: { ...except("size") },
  render: (args) => <Demo size={args.size} selectionMode="multiple" defaultValue={["app", "index"]} defaultExpandAll />,
  parameters: { docs: { source: { code: treeSnippets.multiple } } },
};

export const Picker: Story = {
  name: "A picker: folders open, files are chosen",
  argTypes: { ...except("size") },
  render: (args) => {
    const Choosing = () => {
      const [selected, setSelected] = useState<string[]>([]);
      const folders = projectFiles.map((node) => (node.children ? { ...node, selectable: false, children: node.children.map((child) => (child.children ? { ...child, selectable: false } : child)) } : node));
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <Text size="sm">Chosen: {selected.join(", ") || "none"}</Text>
          <Demo size={args.size} nodes={folders} selectionMode="multiple" expandOnClick value={selected} onValueChange={setSelected} />
        </div>
      );
    };
    return <Choosing />;
  },
  parameters: { docs: { source: { code: treeSnippets.picker } } },
};

export const SelectionFollowsFocus: Story = {
  name: "Selection that follows the arrow keys",
  argTypes: { ...except("size") },
  render: (args) => {
    const Navigating = () => {
      const [selected, setSelected] = useState<string[]>(["app"]);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <Text size="sm">Open: {selected.join(", ") || "none"}</Text>
          <Demo size={args.size} selectionMode="single" selectOnFocus expandOnClick value={selected} onValueChange={setSelected} defaultExpandedIds={["src"]} />
        </div>
      );
    };
    return <Navigating />;
  },
  parameters: { docs: { source: { code: treeSnippets.followFocus } } },
};

export const Checkable: Story = {
  name: "Check boxes with a mixed parent",
  argTypes: { ...except("size") },
  render: (args) => {
    const Checking = () => {
      const [checked, setChecked] = useState<string[]>(["button", "guide"]);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <Text size="sm">Checked leaves: {checked.join(", ") || "none"}</Text>
          <Demo size={args.size} checkable checkedIds={checked} onCheckedChange={setChecked} defaultExpandAll />
        </div>
      );
    };
    return <Checking />;
  },
  parameters: { docs: { source: { code: treeSnippets.checkable } } },
};

export const Lazy: Story = {
  name: "Children fetched when a row is opened",
  argTypes: { ...except("size") },
  render: (args) => {
    const Fetching = () => {
      const [nodes, setNodes] = useState<TreeNode[]>([
        { id: "remote", label: "remote", icon: FolderIcon, hasChildren: true },
        { id: "flaky", label: "flaky (fails the first time)", icon: FolderIcon, hasChildren: true },
        { id: "bare", label: "empty folder", icon: FolderIcon, hasChildren: true },
      ]);
      const [loading, setLoading] = useState<string[]>([]);
      const [failed, setFailed] = useState<string[]>([]);
      const attempts = useRef<Record<string, number>>({});
      const timer = useRef(0);
      useEffect(() => () => window.clearTimeout(timer.current), []);
      const load = (id: string) => {
        attempts.current[id] = (attempts.current[id] ?? 0) + 1;
        setFailed((current) => current.filter((entry) => entry !== id));
        setLoading((current) => [...current, id]);
        timer.current = window.setTimeout(() => {
          setLoading((current) => current.filter((entry) => entry !== id));
          if (id === "flaky" && attempts.current[id] === 1) {
            setFailed((current) => [...current, id]);
            return;
          }
          const children: TreeNode[] = id === "bare" ? [] : [{ id: `${id}-1`, label: "report.csv" }, { id: `${id}-2`, label: "photo.jpg" }];
          setNodes((current) => current.map((node) => (node.id === id ? { ...node, children } : node)));
        }, 900);
      };
      return (
        <Tree
          aria-label="Remote files"
          size={args.size}
          nodes={nodes}
          loadingIds={loading}
          errorIds={failed}
          onRetry={load}
          onExpandedChange={(open) => {
            for (const id of open) {
              const node = nodes.find((entry) => entry.id === id);
              if (node && !node.children && !loading.includes(id) && !failed.includes(id)) load(id);
            }
          }}
        />
      );
    };
    return <Fetching />;
  },
  parameters: { docs: { source: { code: treeSnippets.lazy } } },
};

export const LongTree: Story = {
  name: "Thousands of rows",
  argTypes: { ...except("size") },
  render: (args) => <Tree aria-label="Folders" size={args.size} nodes={manyNodes(500)} maxHeight={320} defaultExpandAll windowed />,
  parameters: { docs: { source: { code: treeSnippets.long } } },
};

export const Loading: Story = {
  name: "Loading the rows",
  argTypes: { ...except("size") },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}>
      <Tree aria-label="First load" size={args.size} nodes={[]} loading />
      <Demo aria-label="More on the way" size={args.size} defaultExpandedIds={["docs"]} loading loadingCount={2} />
    </div>
  ),
  parameters: { docs: { source: { code: treeSnippets.loading } } },
};

export const RowMenu: Story = {
  name: "A menu for a row",
  argTypes: { ...except("size") },
  render: (args) => {
    const WithMenu = () => {
      const menu = useRef<ContextMenuController>(null);
      const [target, setTarget] = useState<{ id: string; label: string } | undefined>();
      const [last, setLast] = useState("Nothing chosen yet");
      const find = (id: string): string => {
        const search = (list: TreeNode[]): string | undefined => {
          for (const node of list) {
            if (node.id === id) return node.label;
            const inside = node.children && search(node.children);
            if (inside) return inside;
          }
          return undefined;
        };
        return search(projectFiles) ?? id;
      };
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <Text size="sm" data-testid="chosen">
            {last}
          </Text>
          <ContextMenu controllerRef={menu}>
            <ContextMenu.Trigger asChild>
              <div>
                <Demo
                  size={args.size}
                  defaultExpandedIds={["src"]}
                  onItemContextMenu={({ id, via, point }) => {
                    setTarget({ id, label: find(id) });
                    // A right-click is the trigger's own; a key has to be turned into a menu at a point.
                    if (via === "keyboard") menu.current?.openAt(point);
                  }}
                />
              </div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Label>{target?.label}</ContextMenu.Label>
              <ContextMenu.Item onSelect={() => setLast(`Copied the path of ${target?.label}`)}>Copy path</ContextMenu.Item>
              <ContextMenu.Item onSelect={() => setLast(`Renamed ${target?.label}`)}>Rename</ContextMenu.Item>
              <ContextMenu.Separator />
              <ContextMenu.Item tone="danger" onSelect={() => setLast(`Deleted ${target?.label}`)}>
                Delete
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu>
        </div>
      );
    };
    return <WithMenu />;
  },
  parameters: { docs: { source: { code: treeSnippets.rowMenu } } },
};

export const Rename: Story = {
  name: "Renaming a row",
  argTypes: { ...except("size") },
  render: (args) => {
    const Renaming = () => {
      const [nodes, setNodes] = useState<TreeNode[]>(projectFiles);
      const [renamed, setRenamed] = useState("Press F2 on a row");
      const controller = useRef<TreeController>(null);
      const rename = (list: TreeNode[], id: string, label: string): TreeNode[] =>
        list.map((node) => (node.id === id ? { ...node, label } : node.children ? { ...node, children: rename(node.children, id, label) } : node));
      const taken = new Set<string>();
      const collect = (list: TreeNode[]) => list.forEach((node) => (taken.add(node.label), node.children && collect(node.children)));
      collect(nodes);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <div style={{ display: "flex", gap: "var(--dbm-space-3)", alignItems: "center" }}>
            <Button size="sm" variant="secondary" onClick={() => controller.current?.rename("card")}>
              Rename Card.tsx
            </Button>
            <Text size="sm" data-testid="renamed">
              {renamed}
            </Text>
          </div>
          <Demo
            size={args.size}
            nodes={nodes}
            controllerRef={controller}
            defaultExpandedIds={["src", "components"]}
            renamable
            onRename={(id, label) => {
              setNodes((current) => rename(current, id, label));
              setRenamed(`Renamed to ${label}`);
            }}
            validateRename={(_id, label) => (taken.has(label) ? "A file with that name already exists" : undefined)}
          />
        </div>
      );
    };
    return <Renaming />;
  },
  parameters: { docs: { source: { code: treeSnippets.rename } } },
};

export const Disabled: Story = {
  name: "A disabled row",
  argTypes: { ...except("size") },
  render: (args) => (
    <Tree
      aria-label="Project files"
      size={args.size}
      selectionMode="single"
      defaultExpandAll
      nodes={[
        { id: "a", label: "Editable.ts" },
        { id: "b", label: "Locked.ts", disabled: true, description: "Read only" },
        { id: "c", label: "Other.ts" },
      ]}
    />
  ),
  parameters: { docs: { source: { code: treeSnippets.disabled } } },
};

export const Trailing: Story = {
  name: "Description and trailing content",
  argTypes: { ...except("size") },
  render: (args) => (
    <Tree
      aria-label="Files"
      size={args.size}
      nodes={[
        { id: "a", label: "Button.tsx", description: "component", trailing: "3 KB" },
        { id: "b", label: "Card.tsx", trailing: <Badge tone="warning">changed</Badge> },
      ]}
    />
  ),
  parameters: { docs: { source: { code: treeSnippets.trailing } } },
};

export const Highlight: Story = {
  name: "Filtering and marking a search",
  argTypes: { ...except("size") },
  render: (args) => {
    const Searching = () => {
      const [query, setQuery] = useState("tsx");
      const [open, setOpen] = useState<string[]>(() => filterTree(projectFiles, { query: "tsx" }).expandedIds);
      const result = useMemo(() => filterTree(projectFiles, { query }), [query]);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)", maxInlineSize: "24rem" }}>
          <input
            aria-label="Search the files"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              // Show every match: open the rows above them. With nothing typed, close everything again.
              setOpen(filterTree(projectFiles, { query: event.target.value }).expandedIds);
            }}
            style={{ font: "inherit", padding: "var(--dbm-space-2)" }}
          />
          <Demo size={args.size} nodes={result.nodes} expandedIds={open} onExpandedChange={setOpen} highlightQuery={query} empty={<Text color="secondary">Nothing matched.</Text>} />
        </div>
      );
    };
    return <Searching />;
  },
  parameters: { docs: { source: { code: treeSnippets.highlight } } },
};

export const CustomLabel: Story = {
  name: "Your own label",
  argTypes: { ...except("size") },
  render: (args) => (
    <Demo
      size={args.size}
      selectionMode="single"
      defaultValue={["app"]}
      defaultExpandAll
      renderLabel={(node, { selected }) => <em>{selected ? `${node.label} (open)` : node.label}</em>}
    />
  ),
  parameters: { docs: { source: { code: treeSnippets.customLabel } } },
};

export const Controller: Story = {
  name: "Expand all and collapse all from outside",
  argTypes: { ...except("size") },
  render: (args) => {
    const Driven = () => {
      const tree = useRef<TreeController>(null);
      return (
        <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
          <div style={{ display: "flex", gap: "var(--dbm-space-2)" }}>
            <Button size="sm" variant="secondary" onClick={() => tree.current?.expandAll()}>
              Expand all
            </Button>
            <Button size="sm" variant="secondary" onClick={() => tree.current?.collapseAll()}>
              Collapse all
            </Button>
          </div>
          <Demo size={args.size} controllerRef={tree} />
        </div>
      );
    };
    return <Driven />;
  },
  parameters: { docs: { source: { code: treeSnippets.controller } } },
};

export const RightToLeft: Story = {
  name: "Right to left",
  argTypes: { ...except("size") },
  render: (args) => <Demo size={args.size} dir="rtl" defaultExpandAll />,
  parameters: { docs: { source: { code: treeSnippets.rtl } } },
};

export const Empty: Story = {
  name: "No rows",
  argTypes: { ...except("size") },
  render: (args) => <Tree aria-label="Search results" size={args.size} nodes={[]} empty={<Text color="secondary">Nothing matched your search.</Text>} />,
  parameters: { docs: { source: { code: treeSnippets.empty } } },
};
