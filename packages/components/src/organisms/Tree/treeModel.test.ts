import { describe, expect, it, vi } from "vitest";
import type { TreeNode } from "./Tree.types";
import { ancestorsOf, checkStateOf, indexTree, leavesOf, toggleChecked, visibleRows } from "./treeModel";

const nodes: TreeNode[] = [
  {
    id: "a",
    label: "A",
    children: [
      { id: "a1", label: "A1" },
      { id: "a2", label: "A2", children: [{ id: "a2x", label: "A2x" }, { id: "a2y", label: "A2y", disabled: true }] },
    ],
  },
  { id: "b", label: "B", hasChildren: true },
  { id: "c", label: "C" },
];

describe("indexTree", () => {
  it("looks every node up, records parents and lists what can be expanded in order", () => {
    const index = indexTree(nodes);
    expect([...index.byId.keys()]).toEqual(["a", "a1", "a2", "a2x", "a2y", "b", "c"]);
    expect(index.parentOf.get("a2x")).toBe("a2");
    expect(index.parentOf.has("a")).toBe(false);
    expect(index.expandable).toEqual(["a", "a2", "b"]);
  });

  it("warns once per repeated id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    indexTree([{ id: "x", label: "One" }, { id: "x", label: "Two" }]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('"x"');
    warn.mockRestore();
  });
});

describe("visibleRows", () => {
  it("draws only the top level when nothing is open", () => {
    expect(visibleRows(nodes, new Set()).map((row) => row.node.id)).toEqual(["a", "b", "c"]);
  });

  it("draws the children of open rows, with level, position and size", () => {
    const rows = visibleRows(nodes, new Set(["a", "a2"]));
    expect(rows.map((row) => [row.node.id, row.level, row.posinset, row.setsize, row.parentId])).toEqual([
      ["a", 1, 1, 3, undefined],
      ["a1", 2, 1, 2, "a"],
      ["a2", 2, 2, 2, "a"],
      ["a2x", 3, 1, 2, "a2"],
      ["a2y", 3, 2, 2, "a2"],
      ["b", 1, 2, 3, undefined],
      ["c", 1, 3, 3, undefined],
    ]);
  });

  it("does not draw the children of a closed row, even when the parent is open", () => {
    expect(visibleRows(nodes, new Set(["a2"])).map((row) => row.node.id)).toEqual(["a", "b", "c"]);
  });

  it("draws nothing under a row that is open but has no children yet", () => {
    expect(visibleRows(nodes, new Set(["b"])).map((row) => row.node.id)).toEqual(["a", "b", "c"]);
  });
});

describe("checking", () => {
  const a = nodes[0] as TreeNode;

  it("finds the leaves, counting a row that waits for children as one", () => {
    expect(leavesOf(a).map((leaf) => leaf.id)).toEqual(["a1", "a2x", "a2y"]);
    expect(leavesOf(nodes[1] as TreeNode).map((leaf) => leaf.id)).toEqual(["b"]);
  });

  it("works a row's state out from its leaves", () => {
    expect(checkStateOf(a, new Set())).toBe(false);
    expect(checkStateOf(a, new Set(["a1"]))).toBe("indeterminate");
    expect(checkStateOf(a, new Set(["a1", "a2x", "a2y"]))).toBe(true);
    // a disabled leaf is not counted, so the leaves a person can change decide
    expect(checkStateOf(a, new Set(["a1", "a2x"]))).toBe(true);
    expect(checkStateOf(a, new Set(["a2y"]))).toBe(false);
    expect(checkStateOf({ id: "d", label: "D", children: [{ id: "d1", label: "D1", disabled: true }] }, new Set(["d1"]))).toBe(true);
    expect(checkStateOf(nodes[2] as TreeNode, new Set(["c"]))).toBe(true);
  });

  it("checks every leaf that is not disabled when one that can change is unchecked", () => {
    expect(toggleChecked(a, []).sort()).toEqual(["a1", "a2x"]);
    expect(toggleChecked(a, ["a1"]).sort()).toEqual(["a1", "a2x"]);
  });

  it("clears them when every leaf that can change is checked, so a row with a disabled leaf can still be cleared", () => {
    expect(toggleChecked(a, ["a1", "a2x"])).toEqual([]);
    expect(toggleChecked(a, ["a1", "a2x", "a2y"])).toEqual(["a2y"]);
  });

  it("toggles a leaf on its own", () => {
    expect(toggleChecked(nodes[2] as TreeNode, ["x"])).toEqual(["x", "c"]);
    expect(toggleChecked(nodes[2] as TreeNode, ["x", "c"])).toEqual(["x"]);
  });
});

describe("ancestorsOf", () => {
  it("lists the rows above a node, nearest first", () => {
    expect(ancestorsOf("a2x", indexTree(nodes).parentOf)).toEqual(["a2", "a"]);
    expect(ancestorsOf("c", indexTree(nodes).parentOf)).toEqual([]);
  });
});
