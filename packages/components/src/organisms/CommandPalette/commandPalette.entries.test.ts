import { describe, expect, it, vi } from "vitest";
import type { CommandItem, CommandPaletteLabels } from "./CommandPalette.types";
import { ARGUMENT_VALUE, NESTED_SEPARATOR, buildEntries, buildVisible, modeFor, problemWith } from "./commandPalette.entries";

const labels = {
  recent: "Recent",
  suggested: "Suggested",
  showMore: (count: number) => `Show ${count} more`,
  runWith: (text: string) => `Run with “${text}”`,
  argumentEmpty: "Type a value",
  argumentInvalid: "Can't use that",
} as unknown as CommandPaletteLabels;

const commands: CommandItem[] = [
  { value: "a", label: "Alpha", group: "G" },
  { value: "b", label: "Beta", group: "G" },
  { value: "t", label: "Theme", items: [{ value: "a", label: "Dark", keywords: ["night"] }, { value: "l", label: "Light" }] },
  { value: "x", label: "Locked", disabled: true, items: [{ value: "y", label: "Hidden" }] },
];

type VisibleArgs = Parameters<typeof buildVisible>[0];
const base: Omit<VisibleArgs, "entries"> = {
  argument: undefined,
  filter: undefined,
  searchText: "",
  hasQuery: false,
  topLevel: true,
  recent: undefined,
  suggested: undefined,
  maxPerGroup: 0,
  expanded: new Set<string>(),
  labels,
  warn: () => undefined,
};

describe("buildEntries", () => {
  it("lists one level by value, with no nested commands unless asked", () => {
    expect([...buildEntries(commands, false).keys()]).toEqual(["a", "b", "t", "x"]);
  });

  it("adds the commands inside lists under their parent's label with a key of their own, leaving out a parent that can't run", () => {
    const map = buildEntries(commands, true);
    const nested = map.get(`t${NESTED_SEPARATOR}a`);
    expect(nested?.parent?.value).toBe("t");
    expect(nested?.item.label).toBe("Dark");
    expect(nested?.shown).toMatchObject({ value: `t${NESTED_SEPARATOR}a`, group: "Theme", keywords: ["night", "Theme"], items: undefined });
    expect(map.get("a")?.item.label).toBe("Alpha");
    expect([...map.keys()].some((key) => key.startsWith(`x${NESTED_SEPARATOR}`))).toBe(false);
  });
});

describe("buildVisible", () => {
  const visibleLabels = (extra: Partial<VisibleArgs> = {}, list = commands) =>
    buildVisible({ ...base, ...extra, entries: buildEntries(list, false) }).visible.map((item) => item.label);

  it("ranks by the search, and lists everything as given for filter={false}", () => {
    expect(visibleLabels({ searchText: "bet", hasQuery: true })).toEqual(["Beta"]);
    expect(visibleLabels({ searchText: "zzz", hasQuery: true, filter: false })).toEqual(["Alpha", "Beta", "Theme", "Locked"]);
  });

  it("keeps what a filter function keeps, in the order given", () => {
    expect(visibleLabels({ searchText: "x", hasQuery: true, filter: (item: CommandItem) => item.value !== "a" })).toEqual(["Beta", "Theme", "Locked"]);
  });

  it("treats a filter that throws as no match, and says so", () => {
    const warn = vi.fn();
    const result = visibleLabels({ searchText: "x", hasQuery: true, filter: () => { throw new Error("boom"); }, warn });
    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("puts recent then suggested commands first, once each, only at the top level while nothing is typed", () => {
    expect(visibleLabels({ recent: ["b"], suggested: ["b", "t"] })).toEqual(["Beta", "Theme", "Alpha", "Locked"]);
    expect(visibleLabels({ recent: ["b"], topLevel: false })).toEqual(["Alpha", "Beta", "Theme", "Locked"]);
    expect(visibleLabels({ recent: ["b"], searchText: "a", hasQuery: true })).not.toContain("Recent");
  });

  it("cuts each group and says how many are hidden, leaving the recent group whole", () => {
    const many: CommandItem[] = Array.from({ length: 5 }, (_, index) => ({ value: `c${index}`, label: `C${index}`, group: "Many" }));
    expect(visibleLabels({ maxPerGroup: 2 }, many)).toEqual(["C0", "C1", "Show 3 more"]);
    expect(visibleLabels({ maxPerGroup: 2, recent: ["c3", "c4", "c2"] }, many)).toEqual(["C3", "C4", "C2", "C0", "C1"]);
  });

  it("is one row that runs the command while a value is asked for, saying why it can't when it can't", () => {
    const item: CommandItem = { value: "r", label: "Rename", argument: {} };
    const entries = buildEntries([item], false);
    const run = buildVisible({ ...base, entries, argument: { item, text: "x", problem: undefined } });
    expect(run.visible).toEqual([{ value: ARGUMENT_VALUE, label: "Run with “x”", icon: undefined, disabled: false }]);
    const refused = buildVisible({ ...base, entries, argument: { item, text: "x", problem: "No" } });
    expect(refused.visible[0]).toMatchObject({ label: "No", disabled: true });
  });
});

describe("problemWith", () => {
  const item = (validate?: (text: string) => string | undefined): CommandItem => ({ value: "r", label: "Rename", argument: { validate } });

  it("refuses empty text, accepts text with no validate, and returns what validate says", () => {
    expect(problemWith(item(), "", labels, () => undefined)).toBe("Type a value");
    expect(problemWith(item(), "x", labels, () => undefined)).toBeUndefined();
    expect(problemWith(item((text) => (text === "bad" ? "Not that" : undefined)), "bad", labels, () => undefined)).toBe("Not that");
  });

  it("refuses text when validate throws, and says so", () => {
    const warn = vi.fn();
    expect(problemWith(item(() => { throw new Error("boom"); }), "x", labels, warn)).toBe("Can't use that");
    expect(warn).toHaveBeenCalled();
  });
});

describe("modeFor", () => {
  const modes = [{ prefix: ">", label: "Actions", commands: [] }, { prefix: "", label: "Empty", commands: [] }];

  it("finds the mode whose prefix starts the text, never an empty prefix, and none inside a list", () => {
    expect(modeFor(modes, ">go", false)?.label).toBe("Actions");
    expect(modeFor(modes, "go", false)).toBeUndefined();
    expect(modeFor(modes, ">go", true)).toBeUndefined();
    expect(modeFor(undefined, ">go", false)).toBeUndefined();
  });
});
