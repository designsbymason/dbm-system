import { describe, expect, it } from "vitest";
import { filterTree } from "./filterTree";
import type { TreeNode } from "./Tree.types";

const nodes: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "app", label: "App.tsx" },
      { id: "lib", label: "lib", children: [{ id: "util", label: "util.ts" }, { id: "math", label: "math.ts" }] },
    ],
  },
  { id: "docs", label: "docs", children: [{ id: "guide", label: "guide.md" }] },
  { id: "remote", label: "remote", hasChildren: true },
  { id: "readme", label: "README.md" },
];

const ids = (list: readonly TreeNode[]): string[] => list.flatMap((node) => [node.id, ...ids(node.children ?? [])]);

describe("filterTree", () => {
  it("returns the tree as it is, with nothing to open, when there is nothing to search for", () => {
    for (const options of [undefined, {}, { query: "" }, { query: "   " }]) {
      const result = filterTree(nodes, options);
      expect(result.nodes).toBe(nodes);
      expect(result.matchIds).toEqual([]);
      expect(result.expandedIds).toEqual([]);
    }
  });

  it("keeps a match and the rows above it, and says which rows to open", () => {
    const result = filterTree(nodes, { query: "util" });
    expect(ids(result.nodes)).toEqual(["src", "lib", "util"]);
    expect(result.matchIds).toEqual(["util"]);
    expect([...result.expandedIds].sort()).toEqual(["lib", "src"]);
  });

  it("ignores case and the spaces round the query", () => {
    expect(ids(filterTree(nodes, { query: "  README " }).nodes)).toEqual(["readme"]);
    expect(filterTree(nodes, { query: "app.TSX" }).matchIds).toEqual(["app"]);
  });

  it("keeps everything under a row that matches, without opening it, unless keepDescendants is off", () => {
    const kept = filterTree(nodes, { query: "lib" });
    expect(ids(kept.nodes)).toEqual(["src", "lib", "util", "math"]);
    expect(kept.expandedIds).toEqual(["src"]);
    const cut = filterTree(nodes, { query: "lib", keepDescendants: false });
    expect(ids(cut.nodes)).toEqual(["src", "lib"]);
    expect(cut.expandedIds).toEqual(["src"]);
  });

  it("opens a matching row that also has a matching row under it", () => {
    const result = filterTree([{ id: "a", label: "ab", children: [{ id: "b", label: "abc" }] }], { query: "ab" });
    expect(result.matchIds).toEqual(["a", "b"]);
    expect(result.expandedIds).toEqual(["a"]);
  });

  it("drops rows with no match in them or under them, and returns an empty list when nothing matches", () => {
    expect(ids(filterTree(nodes, { query: "ts" }).nodes)).toEqual(["src", "app", "lib", "util", "math"]);
    const none = filterTree(nodes, { query: "zzz" });
    expect(none.nodes).toEqual([]);
    expect(none.matchIds).toEqual([]);
  });

  it("keeps a row waiting for its children only if it matches itself", () => {
    expect(ids(filterTree(nodes, { query: "remote" }).nodes)).toEqual(["remote"]);
    expect(ids(filterTree(nodes, { query: "util" }).nodes)).not.toContain("remote");
  });

  it("takes a match function in place of the query, and calls it with each node", () => {
    const result = filterTree(nodes, { match: (node) => node.id === "guide" });
    expect(ids(result.nodes)).toEqual(["docs", "guide"]);
    expect(result.expandedIds).toEqual(["docs"]);
    const seen: string[] = [];
    filterTree(nodes, { match: (node) => (seen.push(node.id), false) });
    expect(seen).toEqual(ids(nodes));
  });

  it("never changes the nodes it is given, and shares a row whose children are all kept", () => {
    const before = JSON.stringify(nodes);
    const result = filterTree(nodes, { query: "docs" });
    expect(JSON.stringify(nodes)).toBe(before);
    expect(result.nodes[0]).toBe(nodes[1]);
    const narrowed = filterTree(nodes, { query: "util" });
    expect(narrowed.nodes[0]).not.toBe(nodes[0]);
    expect(narrowed.nodes[0]?.children?.map((child) => child.id)).toEqual(["lib"]);
    expect(nodes[0]?.children).toHaveLength(2);
  });

  it("keeps the order of the rows it keeps", () => {
    expect(filterTree(nodes, { query: ".md" }).matchIds).toEqual(["guide", "readme"]);
  });

  it("takes a missing list as nothing to search, and a label that is not text as no match", () => {
    expect(filterTree(undefined, { query: "a" }).nodes).toEqual([]);
    expect(filterTree(null, { query: "a" }).nodes).toEqual([]);
    const messy = [{ id: "x" }, { id: "y", label: 5 }, { id: "z", label: "az" }] as unknown as TreeNode[];
    expect(filterTree(messy, { query: "a" }).matchIds).toEqual(["z"]);
  });

  it("does not walk the characters of children that are text, and skips a node that is not an object", () => {
    const messy = [null, { id: "p", label: "p", children: "ab" }, { id: "q", label: "q" }] as unknown as TreeNode[];
    const result = filterTree(messy, { query: "q" });
    expect(ids(result.nodes)).toEqual(["q"]);
  });
});
