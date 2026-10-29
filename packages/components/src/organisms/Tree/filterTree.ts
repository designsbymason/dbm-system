import type { TreeNode } from "./Tree.types";

export interface FilterTreeOptions {
  /** Text to find in each node's `label`, ignoring case. Nothing is filtered while it is empty. */
  query?: string;
  /** Decides whether a node matches by itself, in place of `query`. It is called with each node, not with its parents. */
  match?: (node: TreeNode) => boolean;
  /**
   * Whether every row under a row that matches is kept, so a matching folder still shows what is in it.
   * @default true
   */
  keepDescendants?: boolean;
}

export interface FilteredTree {
  /** The rows that match, the rows above them, and (with `keepDescendants`) everything under a match. Pass it as `nodes`. */
  nodes: TreeNode[];
  /** The ids of the rows that match by themselves, in tree order. */
  matchIds: string[];
  /** The rows above a match, which must be open for it to show. Pass it as `expandedIds` (or into it). */
  expandedIds: string[];
}

/**
 * Narrows a tree to what matches a search, for `Tree`'s `nodes`. A row is kept when it matches, when a row under it is kept,
 * or (with `keepDescendants`) when a row above it matches. It never changes the nodes it is given: a row whose children are
 * all kept is the same object, so the tree's memoised work survives, and a row whose children are cut is a copy.
 *
 * It also says which rows to open, since a match under a closed folder cannot be seen: `expandedIds` holds the rows above a
 * match, not the matches themselves. A row waiting for its children (`hasChildren` with none yet) is kept only if it matches,
 * since there is nothing to search in it. With no `query` and no `match` the tree is returned as it is.
 *
 * @example
 * ```tsx
 * const { nodes: shown, expandedIds } = filterTree(nodes, { query });
 * <Tree aria-label="Files" nodes={shown} expandedIds={query ? expandedIds : open} highlightQuery={query} />
 * ```
 */
export function filterTree(nodes: readonly TreeNode[] | undefined | null, { query = "", match, keepDescendants = true }: FilterTreeOptions = {}): FilteredTree {
  const list = Array.isArray(nodes) ? nodes : [];
  const needle = query.trim().toLowerCase();
  if (!match && needle === "") return { nodes: list, matchIds: [], expandedIds: [] };
  // A label that is not text (data on its way) matches nothing rather than throwing.
  const matches = match ?? ((node: TreeNode) => typeof node.label === "string" && node.label.toLowerCase().includes(needle));

  const matchIds: string[] = [];
  const expandedIds: string[] = [];

  /** The node as it stays, or `undefined` when nothing of it does. `underMatch` is whether a row above it matched. */
  const visit = (node: TreeNode, underMatch: boolean): TreeNode | undefined => {
    const itself = matches(node);
    if (itself) matchIds.push(node.id);
    const keepAll = keepDescendants && (itself || underMatch);
    const children = Array.isArray(node.children) ? node.children : undefined;
    if (!children?.length) return itself || keepAll ? node : undefined;

    const kept: TreeNode[] = [];
    let allKept = true;
    const idsBefore = matchIds.length;
    for (const child of children) {
      const result = visit(child, keepAll);
      if (result) kept.push(result);
      if (result !== child) allKept = false;
    }
    // Is there a match somewhere beneath this row, which this row has to be open to show?
    const matchBeneath = matchIds.length > idsBefore;
    if (kept.length === 0 && !itself && !keepAll) return undefined;
    if (matchBeneath) expandedIds.push(node.id);
    return allKept ? node : { ...node, children: kept };
  };

  const kept: TreeNode[] = [];
  for (const node of list) {
    if (typeof node !== "object" || node === null) continue;
    const result = visit(node, false);
    if (result) kept.push(result);
  }
  return { nodes: kept, matchIds, expandedIds };
}
