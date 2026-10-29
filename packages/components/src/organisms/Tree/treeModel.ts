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
}

export interface TreeIndex {
  /** Every node by id. */
  byId: Map<string, TreeNode>;
  /** The parent of every nested node. */
  parentOf: Map<string, string>;
  /** Ids of the nodes that can be expanded (children, or `hasChildren`), in tree order. */
  expandable: string[];
}

export const canExpand = (node: TreeNode): boolean => Boolean(node.children?.length) || Boolean(node.hasChildren);

/** Looks every node up once, so the rest of the work is map reads. */
export function indexTree(nodes: readonly TreeNode[]): TreeIndex {
  const byId = new Map<string, TreeNode>();
  const parentOf = new Map<string, string>();
  const expandable: string[] = [];
  const visit = (list: readonly TreeNode[], parent: string | undefined) => {
    for (const node of list) {
      if (process.env.NODE_ENV !== "production" && byId.has(node.id)) {
        console.warn(`Tree: the id "${node.id}" is used by more than one node. Ids must be unique across the whole tree.`);
      }
      byId.set(node.id, node);
      if (parent !== undefined) parentOf.set(node.id, parent);
      if (canExpand(node)) expandable.push(node.id);
      if (node.children) visit(node.children, node.id);
    }
  };
  visit(nodes, undefined);
  return { byId, parentOf, expandable };
}

/** The rows that are drawn: every top-level node, and the children of each open node, in reading order. */
export function visibleRows(nodes: readonly TreeNode[], expanded: ReadonlySet<string>): TreeRow[] {
  const rows: TreeRow[] = [];
  const visit = (list: readonly TreeNode[], level: number, parentId: string | undefined) => {
    list.forEach((node, index) => {
      rows.push({ node, level, posinset: index + 1, setsize: list.length, parentId });
      if (node.children?.length && expanded.has(node.id)) visit(node.children, level + 1, node.id);
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
