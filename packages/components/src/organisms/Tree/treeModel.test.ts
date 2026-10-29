import { describe, expect, it, vi } from "vitest";
import type { TreeNode } from "./Tree.types";
import { ancestorsOf, checkStateOf, checkStates, emptyRowId, indexTree, isLoadedEmpty, leavesOf, toggleChecked, visibleRows } from "./treeModel";

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

describe("checkStates", () => {
  const every = (list: readonly TreeNode[]): TreeNode[] => list.flatMap((node) => [node, ...every(node.children ?? [])]);

  it("gives the same answer as checkStateOf for every node, for several sets of checked leaves", () => {
    const all = every(nodes);
    for (const checked of [[], ["a1"], ["a1", "a2x"], ["a2y"], ["a1", "a2x", "a2y", "b", "c"], ["b"], ["c"]]) {
      const set = new Set(checked);
      const states = checkStates(nodes, set);
      for (const node of all) expect(states.get(node.id), `${node.id} with ${checked.join(",")}`).toBe(checkStateOf(node, set));
    }
  });

  it("counts a node whose leaves are all disabled by all of them", () => {
    const only: TreeNode[] = [{ id: "d", label: "D", children: [{ id: "d1", label: "D1", disabled: true }, { id: "d2", label: "D2", disabled: true }] }];
    expect(checkStates(only, new Set(["d1"])).get("d")).toBe("indeterminate");
    expect(checkStates(only, new Set(["d1", "d2"])).get("d")).toBe(true);
    expect(checkStates(only, new Set()).get("d")).toBe(false);
  });

  it("is one pass over the nodes however many leaves sit under one of them", () => {
    const leaves: TreeNode[] = Array.from({ length: 100_000 }, (_, position) => ({ id: `l${position}`, label: "x" }));
    const big: TreeNode[] = [{ id: "root", label: "Root", children: leaves }];
    const started = performance.now();
    const states = checkStates(big, new Set(leaves.slice(0, 50_000).map((leaf) => leaf.id)));
    expect(states.get("root")).toBe("indeterminate");
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe("a row that was fetched and came back empty", () => {
  const fetched: TreeNode[] = [{ id: "f", label: "F", hasChildren: true, children: [] }, { id: "g", label: "G", hasChildren: true }];

  it("is told apart from one that has not been fetched", () => {
    expect(isLoadedEmpty(fetched[0] as TreeNode)).toBe(true);
    expect(isLoadedEmpty(fetched[1] as TreeNode)).toBe(false);
    expect(isLoadedEmpty({ id: "h", label: "H", children: [] })).toBe(false);
  });

  it("gets one placeholder row under it when it is open, which is disabled, one level down and the only child", () => {
    const rows = visibleRows(fetched, new Set(["f", "g"]));
    expect(rows.map((row) => row.node.id)).toEqual(["f", emptyRowId("f"), "g"]);
    expect(rows[1]).toMatchObject({ placeholder: "empty", level: 2, posinset: 1, setsize: 1, parentId: "f" });
    expect(rows[1]?.node.disabled).toBe(true);
  });

  it("gets none while closed or while it is loading again", () => {
    expect(visibleRows(fetched, new Set()).map((row) => row.node.id)).toEqual(["f", "g"]);
    expect(visibleRows(fetched, new Set(["f"]), new Set(["f"])).map((row) => row.node.id)).toEqual(["f", "g"]);
  });

  it("puts the placeholder under its row in the index, so a focus on it can fall back to that row", () => {
    expect(ancestorsOf(emptyRowId("f"), indexTree(fetched).parentOf)).toEqual(["f"]);
  });
});
