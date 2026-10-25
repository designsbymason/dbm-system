import { describe, expect, it } from "vitest";
import { modeWarnings, valueWarnings } from "./commandPalette.warnings";

describe("valueWarnings", () => {
  it("says a value used twice in one list, wherever the list is, and not one shared by different lists", () => {
    expect(valueWarnings([{ value: "a", label: "One" }, { value: "b", label: "Two" }], undefined)).toEqual([]);
    expect(valueWarnings([{ value: "a", label: "One" }, { value: "a", label: "Two" }], undefined)).toHaveLength(1);
    expect(valueWarnings([{ value: "a", label: "One", items: [{ value: "a", label: "Inside" }] }], undefined)).toEqual([]);
    const inside = valueWarnings([{ value: "p", label: "Parent", items: [{ value: "c", label: "x" }, { value: "c", label: "y" }] }], undefined);
    expect(inside).toHaveLength(1);
    expect(inside[0]).toContain('"Parent"');
    const mode = valueWarnings([], [{ prefix: ">", label: "Actions", commands: [{ value: "z", label: "1" }, { value: "z", label: "2" }] }]);
    expect(mode[0]).toContain('"Actions"'.replace('"Actions"', '">"'));
  });
});

describe("modeWarnings", () => {
  it("says nothing for well-formed modes", () => {
    expect(modeWarnings([{ prefix: ">", label: "A", commands: [] }, { prefix: "@", label: "B", commands: [] }])).toEqual([]);
    expect(modeWarnings(undefined)).toEqual([]);
  });

  it("says an empty or spaced prefix, a repeated one, and one an earlier prefix would always shadow", () => {
    expect(modeWarnings([{ prefix: "", label: "A", commands: [] }])).toHaveLength(1);
    expect(modeWarnings([{ prefix: "a b", label: "A", commands: [] }])).toHaveLength(1);
    expect(modeWarnings([{ prefix: ">", label: "A", commands: [] }, { prefix: ">", label: "B", commands: [] }])[0]).toContain("more than one mode");
    expect(modeWarnings([{ prefix: ">", label: "A", commands: [] }, { prefix: ">>", label: "B", commands: [] }])[0]).toContain("earlier prefix");
    expect(modeWarnings([{ prefix: ">>", label: "B", commands: [] }, { prefix: ">", label: "A", commands: [] }])).toEqual([]);
  });
});
