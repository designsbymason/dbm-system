import { describe, expect, it } from "vitest";
import { MORE_PREFIX, capGroups } from "./commandPalette.groups";

interface Item {
  value: string;
  group?: string;
  hidden?: number;
}
const items = (group: string | undefined, count: number, prefix = group ?? "u"): Item[] =>
  Array.from({ length: count }, (_, index) => ({ value: `${prefix}${index}`, group }));
const row = (group: string | undefined, hidden: number): Item => ({ value: "", group, hidden });

describe("capGroups", () => {
  const list = [...items("File", 5), ...items("App", 2), ...items(undefined, 4)];

  it("keeps the first few of each long group and adds a row that shows the rest", () => {
    const { list: capped, more } = capGroups(list, 3, new Set(), new Set(), row);
    expect(capped.map((item) => item.value)).toEqual([
      "File0", "File1", "File2", `${MORE_PREFIX}File`,
      "App0", "App1",
      "u0", "u1", "u2", `${MORE_PREFIX}`,
    ]);
    expect([...more.entries()]).toEqual([
      [`${MORE_PREFIX}File`, { group: "File", first: "File3" }],
      [`${MORE_PREFIX}`, { group: "", first: "u3" }],
    ]);
  });

  it("says how many are hidden", () => {
    const { list: capped } = capGroups(list, 3, new Set(), new Set(), row);
    expect(capped.find((item) => item.value.endsWith("File"))?.hidden).toBe(2);
  });

  it("shows a group in full once it is expanded or exempt, and caps nothing for a max of 0", () => {
    expect(capGroups(list, 3, new Set(["File", ""]), new Set(), row).list).toHaveLength(list.length);
    expect(capGroups(list, 3, new Set(), new Set(["File", ""]), row).list).toHaveLength(list.length);
    expect(capGroups(list, 0, new Set(), new Set(), row).list).toHaveLength(list.length);
  });

  it("keeps the groups in the order they first appear", () => {
    const mixed: Item[] = [{ value: "a1", group: "A" }, { value: "b1", group: "B" }, { value: "a2", group: "A" }];
    expect(capGroups(mixed, 5, new Set(), new Set(), row).list.map((item) => item.value)).toEqual(["a1", "a2", "b1"]);
  });
});
