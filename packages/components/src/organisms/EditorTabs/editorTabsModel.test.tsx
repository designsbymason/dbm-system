import { describe, expect, it } from "vitest";
import {
  chooseAfterClose,
  clampToGroup,
  closableAfter,
  closableAll,
  closableOthers,
  isClosable,
  neighbourId,
  pinnedCount,
  recordRecent,
  tabName,
} from "./editorTabsModel";
import type { EditorTab } from "./EditorTabs.types";

const tabs: EditorTab[] = [
  { id: "p", label: "Pinned", pinned: true },
  { id: "a", label: "A" },
  { id: "b", label: "B", disabled: true },
  { id: "c", label: "C" },
  { id: "d", label: "D", pinned: false, closable: false },
  { id: "e", label: "E" },
];

describe("editorTabsModel", () => {
  it("names a tab from its aria-label, a text label, its title or its id", () => {
    expect(tabName({ id: "x", label: <b>x</b> as never, "aria-label": "Named" })).toBe("Named");
    expect(tabName({ id: "x", label: "Text" })).toBe("Text");
    expect(tabName({ id: "x", label: 3 as never })).toBe("3");
    expect(tabName({ id: "x", label: <b>x</b> as never, title: "Titled" })).toBe("Titled");
    expect(tabName({ id: "x", label: <b>x</b> as never })).toBe("x");
  });

  it("closes pinned tabs only when they say closable, never a disabled one", () => {
    expect(isClosable(tabs[0]!)).toBe(false);
    expect(isClosable({ id: "x", label: "x", pinned: true, closable: true })).toBe(true);
    expect(isClosable(tabs[2]!)).toBe(false);
    expect(isClosable(tabs[4]!)).toBe(false);
  });

  it("counts the leading pinned tabs, and clamps a move to its group", () => {
    expect(pinnedCount(tabs)).toBe(1);
    expect(clampToGroup(tabs, 3, 0)).toBe(1);
    expect(clampToGroup(tabs, 0, 4)).toBe(0);
    expect(clampToGroup(tabs, 1, 99)).toBe(5);
  });

  it("finds the enabled neighbour, after and then before", () => {
    expect(neighbourId(tabs, 1)).toBe("c");
    expect(neighbourId(tabs, 5)).toBe("d");
    expect(neighbourId([{ id: "only", label: "x" }], 0)).toBeNull();
  });

  it("lists what close others, close after and close all would close", () => {
    expect(closableOthers(tabs, "a").map((tab) => tab.id)).toEqual(["c", "e"]);
    expect(closableAfter(tabs, "a").map((tab) => tab.id)).toEqual(["c", "e"]);
    expect(closableAfter(tabs, "c").map((tab) => tab.id)).toEqual(["e"]);
    expect(closableAfter(tabs, "nope")).toEqual([]);
    expect(closableAll(tabs).map((tab) => tab.id)).toEqual(["a", "c", "e"]);
  });

  it("records the most recent id last, once, and caps the list", () => {
    expect(recordRecent(["a", "b"], "a")).toEqual(["b", "a"]);
    expect(recordRecent(["a", "b", "c"], "d", 3)).toEqual(["b", "c", "d"]);
  });

  describe("chooseAfterClose", () => {
    const order = ["a", "b", "c", "d"];
    const enabled = new Set(order);
    it("chooses the next, else the previous, in neighbor mode", () => {
      expect(chooseAfterClose({ order, selectedId: "b", remaining: ["a", "c", "d"], enabled, recent: [], mode: "neighbor" })).toBe("c");
      expect(chooseAfterClose({ order, selectedId: "d", remaining: ["a", "b", "c"], enabled, recent: [], mode: "neighbor" })).toBe("c");
    });
    it("chooses the one used before, in previous mode, and falls back to a neighbour", () => {
      expect(chooseAfterClose({ order, selectedId: "b", remaining: ["a", "c", "d"], enabled, recent: ["d", "a", "b"], mode: "previous" })).toBe("a");
      expect(chooseAfterClose({ order, selectedId: "b", remaining: ["a", "c", "d"], enabled, recent: ["b"], mode: "previous" })).toBe("c");
    });
    it("skips a recent tab that is gone or disabled", () => {
      expect(
        chooseAfterClose({ order, selectedId: "b", remaining: ["c", "d"], enabled: new Set(["c", "d"]), recent: ["a", "d", "b"], mode: "previous" }),
      ).toBe("d");
      expect(chooseAfterClose({ order, selectedId: "b", remaining: ["a", "d"], enabled: new Set(["d"]), recent: [], mode: "neighbor" })).toBe("d");
    });
    it("chooses nothing when nothing is left", () => {
      expect(chooseAfterClose({ order, selectedId: "a", remaining: [], enabled, recent: [], mode: "neighbor" })).toBeNull();
    });
    it("works out the neighbour when many close at once", () => {
      expect(chooseAfterClose({ order, selectedId: "b", remaining: ["a"], enabled, recent: [], mode: "neighbor" })).toBe("a");
    });
  });
});
