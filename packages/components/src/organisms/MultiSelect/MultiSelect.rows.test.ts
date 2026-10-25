import { describe, expect, it } from "vitest";
import { buildRows } from "../../internal/optionList/optionList.rows";
import { composeRows, groupOfRowValue, groupRowValue } from "./MultiSelect.rows";
import type { MultiSelectOption } from "./MultiSelect.types";

const option = (value: string, group?: string): MultiSelectOption => ({ value, label: value.toUpperCase(), group });
const action = (value: string): MultiSelectOption => ({ value, label: value });

describe("composeRows", () => {
  const built = buildRows([option("a", "G1"), option("b", "G1"), option("c"), option("d", "G2")]);

  it("returns the built rows and options unchanged when there is nothing to add", () => {
    const { rows, flat } = composeRows(built, {});
    expect(rows).toEqual(built.rows);
    expect(flat.map((entry) => entry.value)).toEqual(["a", "b", "c", "d"]);
  });

  it("puts a row first, one under each group's heading and one last, and renumbers every option", () => {
    const { rows, flat } = composeRows(built, {
      top: action("top"),
      group: (name) => action(`row:${name}`),
      bottom: action("bottom"),
    });
    expect(flat.map((entry) => entry.value)).toEqual(["top", "row:G1", "a", "b", "c", "row:G2", "d", "bottom"]);
    const drawn = rows.map((row) => (row.kind === "group" ? `#${row.label}` : `${row.index}:${row.option.value}`));
    expect(drawn).toEqual(["0:top", "#G1", "1:row:G1", "2:a", "3:b", "4:c", "#G2", "5:row:G2", "6:d", "7:bottom"]);
    for (const row of rows) if (row.kind === "option") expect(flat[row.index]).toBe(row.option);
  });

  it("leaves a group without a row when the callback gives none", () => {
    const { flat } = composeRows(built, { group: (name) => (name === "G2" ? action("row:G2") : undefined) });
    expect(flat.map((entry) => entry.value)).toEqual(["a", "b", "c", "row:G2", "d"]);
  });

  it("gives every row a distinct key", () => {
    const { rows } = composeRows(built, { top: action("top"), group: (name) => action(`row:${name}`), bottom: action("bottom") });
    const keys = rows.map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("a group's row value", () => {
  it("round-trips the group's name and is told apart from an option", () => {
    expect(groupOfRowValue(groupRowValue("North"))).toBe("North");
    expect(groupOfRowValue("north")).toBeUndefined();
    expect(groupRowValue("x").startsWith("\u0000")).toBe(true);
  });
});
