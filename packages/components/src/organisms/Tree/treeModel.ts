import type { TreeNode } from "./Tree.types";

/** One drawn row: a node, where it sits and how it is announced. */
export interface TreeRow {
  node: TreeNode;
  /** `1` for a top-level row. */
  level: number;
  /** Position among its siblings, from `1`. */
  posinset: number;
  /** How many siblings it has, itself included. */
  setsize: number;
  parentId: string | undefined;
  /** Set on the row that stands in for the children of an open row that loaded none: it is not a node of the caller's. */
  placeholder?: "empty";
}

export interface TreeIndex {
  /** Every node by id. */
  byId: Map<string, TreeNode>;
  /** The parent of every nested node. */
  parentOf: Map<string, string>;
  /** Ids of the nodes that can be expanded (children, or `hasChildren`), in tree order. */
  expandable: string[];
  /** Ids of the nodes that have rows to show when open (loaded children), in tree order: what "expand all" opens. */
  openable: string[];
  /** Ids used by more than one node, each once. */
  duplicates: string[];
}

export const canExpand = (node: TreeNode): boolean => Boolean(node.children?.length) || Boolean(node.hasChildren);

/** A row that was fetched (`hasChildren`) and came back with nothing under it (`children: []`). */
export const isLoadedEmpty = (node: TreeNode): boolean => Boolean(node.hasChildren) && node.children?.length === 0;

/** The id of the row that stands in for the missing children of an empty, open row. It cannot clash with a caller's id. */
export const emptyRowId = (parentId: string): string => `${parentId}\u0000empty`;

/**
 * What `nodes` becomes before anything reads it: the array itself when every node is sound, so memoised work is kept, and
 * otherwise a copy that draws what it can. A value that is not an array is an empty tree; a node that is not an object with a
 * string `id` is dropped; a `label` that is not a string becomes text (empty for `null` and `undefined`); `children` that is
 * not an array is ignored. What was wrong is listed, for a development warning.
 */
export function sanitizeNodes(input: unknown): { nodes: TreeNode[]; problems: string[] } {
  const problems = new Set<string>();
  if (!Array.isArray(input)) {
    problems.add(input === undefined || input === null ? "`nodes` is missing" : "`nodes` is not an array");
    return { nodes: [], problems: [...problems] };
  }
  const clean = (list: readonly unknown[]): TreeNode[] => {
    let changed = false;
    const result: TreeNode[] = [];
    for (const item of list) {
      if (typeof item !== "object" || item === null || typeof (item as TreeNode).id !== "string") {
        problems.add("a node is not an object with a string `id`, so it is not drawn");
        changed = true;
        continue;
      }
      const node = item as TreeNode;
      let next = node;
      if (typeof node.label !== "string") {
        problems.add("a node has no string `label`");
        next = { ...next, label: node.label === undefined || node.label === null ? "" : String(node.label) };
      }
      if (node.children !== undefined) {
        if (!Array.isArray(node.children)) {
          problems.add("a node's `children` is not an array");
          next = { ...next, children: undefined };
        } else {
          const kids = clean(node.children);
          if (kids !== node.children) next = { ...next, children: kids };
        }
      }
      if (next !== node) changed = true;
      result.push(next);
    }
    return changed ? result : (list as TreeNode[]);
  };
  return { nodes: clean(input), problems: [...problems] };
}

/** Looks every node up once, so the rest of the work is map reads. */
export function indexTree(nodes: readonly TreeNode[]): TreeIndex {
  const byId = new Map<string, TreeNode>();
  const parentOf = new Map<string, string>();
  const expandable: string[] = [];
  const openable: string[] = [];
  const duplicates = new Set<string>();
  const visit = (list: readonly TreeNode[], parent: string | undefined) => {
    for (const node of list) {
      if (byId.has(node.id)) duplicates.add(node.id);
      byId.set(node.id, node);
      if (parent !== undefined) parentOf.set(node.id, parent);
      if (canExpand(node)) expandable.push(node.id);
      if (node.children?.length) openable.push(node.id);
      if (isLoadedEmpty(node)) parentOf.set(emptyRowId(node.id), node.id);
      if (node.children) visit(node.children, node.id);
    }
  };
  visit(nodes, undefined);
  return { byId, parentOf, expandable, openable, duplicates: [...duplicates] };
}

/**
 * The rows that are drawn: every top-level node, and the children of each open node, in reading order. An open row that was
 * fetched and has nothing under it gets one placeholder row saying so, unless it is loading again.
 */
export function visibleRows(nodes: readonly TreeNode[], expanded: ReadonlySet<string>, loading: ReadonlySet<string> = new Set()): TreeRow[] {
  const rows: TreeRow[] = [];
  const visit = (list: readonly TreeNode[], level: number, parentId: string | undefined) => {
    list.forEach((node, index) => {
      rows.push({ node, level, posinset: index + 1, setsize: list.length, parentId });
      if (!expanded.has(node.id)) return;
      if (node.children?.length) visit(node.children, level + 1, node.id);
      else if (isLoadedEmpty(node) && !loading.has(node.id)) {
        rows.push({ node: { id: emptyRowId(node.id), label: "", disabled: true }, level: level + 1, posinset: 1, setsize: 1, parentId: node.id, placeholder: "empty" });
      }
    });
  };
  visit(nodes, 1, undefined);
  return rows;
}

/** The leaves under a node (the node itself when it has none), as nodes. */
export function leavesOf(node: TreeNode): TreeNode[] {
  if (!node.children?.length) return [node];
  return node.children.flatMap(leavesOf);
}

export type CheckState = boolean | "indeterminate";

/**
 * What a node's check box shows, given the checked leaves: a leaf shows its own state, a parent what is under it. A leaf a
 * person cannot change (disabled) is left out of the count unless every leaf under the node is disabled, so a row whose
 * changeable leaves are all checked reads as checked and one a person can clear reads as cleared.
 */
export function checkStateOf(node: TreeNode, checkedLeaves: ReadonlySet<string>): CheckState {
  const all = leavesOf(node);
  const changeable = all.filter((leaf) => !leaf.disabled);
  const leaves = changeable.length > 0 ? changeable : all;
  const checked = leaves.filter((leaf) => checkedLeaves.has(leaf.id)).length;
  if (checked === 0) return false;
  return checked === leaves.length ? true : "indeterminate";
}

/**
 * What every row's check box shows, worked out for the whole tree in one pass: each node's counts come from its children's,
 * so the cost is the number of nodes however many leaves sit under each one. It gives the same answer as
 * {@link checkStateOf} for every node.
 */
export function checkStates(nodes: readonly TreeNode[], checkedLeaves: ReadonlySet<string>): Map<string, CheckState> {
  const states = new Map<string, CheckState>();
  /** `[changeable leaves, of them checked, all leaves, of them checked]` */
  type Counts = [number, number, number, number];
  const visit = (node: TreeNode): Counts => {
    let counts: Counts;
    if (!node.children?.length) {
      const checked = checkedLeaves.has(node.id) ? 1 : 0;
      counts = node.disabled ? [0, 0, 1, checked] : [1, checked, 1, checked];
    } else {
      counts = [0, 0, 0, 0];
      for (const child of node.children) {
        const [changeable, changeableChecked, all, allChecked] = visit(child);
        counts[0] += changeable;
        counts[1] += changeableChecked;
        counts[2] += all;
        counts[3] += allChecked;
      }
    }
    const [changeable, changeableChecked, all, allChecked] = counts;
    const total = changeable > 0 ? changeable : all;
    const checked = changeable > 0 ? changeableChecked : allChecked;
    states.set(node.id, checked === 0 ? false : checked === total ? true : "indeterminate");
    return counts;
  };
  for (const node of nodes) visit(node);
  return states;
}

/**
 * The checked leaves after a person toggles a node: if any leaf a person can change is unchecked they all become checked, and
 * otherwise they all clear. A disabled leaf keeps the state it had, and is not counted in deciding which way to go, so a row
 * with a disabled leaf under it can still be cleared.
 */
export function toggleChecked(node: TreeNode, checkedLeaves: readonly string[]): string[] {
  const current = new Set(checkedLeaves);
  const changeable = leavesOf(node).filter((leaf) => !leaf.disabled);
  const turnOn = changeable.some((leaf) => !current.has(leaf.id));
  for (const leaf of changeable) {
    if (turnOn) current.add(leaf.id);
    else current.delete(leaf.id);
  }
  return [...current];
}

/** The ancestors of a node, nearest first. */
export function ancestorsOf(id: string, parentOf: ReadonlyMap<string, string>): string[] {
  const result: string[] = [];
  for (let parent = parentOf.get(id); parent !== undefined; parent = parentOf.get(parent)) result.push(parent);
  return result;
}
