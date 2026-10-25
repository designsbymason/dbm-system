import { describe, expect, it } from "vitest";
import { buildRows, CREATE_VALUE, firstEnabled, isDisabled, lastEnabled, stepEnabled } from "./optionList.rows";
import type { ListOption } from "./optionList.types";

const option = (value: string, extra: Partial<ListOption> = {}): ListOption => ({ value, label: value.toUpperCase(), ...extra });

describe("isDisabled", () => {
  it("is true for true and for a reason, false otherwise", () => {
    expect(isDisabled(option("a", { disabled: true }))).toBe(true);
    expect(isDisabled(option("a", { disabled: "Not yet" }))).toBe(true);
    expect(isDisabled(option("a", { disabled: false }))).toBe(false);
    expect(isDisabled(option("a"))).toBe(false);
  });
});

describe("buildRows", () => {
  it("lists options in order with no heading when there are no groups", () => {
    const { rows, flat } = buildRows([option("a"), option("b")]);
    expect(rows.map((row) => row.kind)).toEqual(["option", "option"]);
    expect(flat.map((item) => item.value)).toEqual(["a", "b"]);
  });

  it("gathers options by group, groups in the order they first appear, with a heading before each", () => {
    const { rows, flat } = buildRows([
      option("a", { group: "One" }),
      option("b", { group: "Two" }),
      option("c", { group: "One" }),
      option("d"),
    ]);
    expect(rows.map((row) => (row.kind === "group" ? `# ${row.label}` : row.option.value))).toEqual(["# One", "a", "c", "# Two", "b", "d"]);
    expect(flat.map((item) => item.value)).toEqual(["a", "c", "b", "d"]);
  });

  it("numbers options by their place among options, not among rows", () => {
    const { rows } = buildRows([option("a", { group: "One" }), option("b", { group: "One" })]);
    expect(rows.flatMap((row) => (row.kind === "option" ? [row.index] : []))).toEqual([0, 1]);
  });

  it("gives every row a key that differs from the others'", () => {
    const { rows } = buildRows([option("a", { group: "x" }), option("b", { group: "x" }), option("c")]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it("returns nothing for nothing", () => {
    expect(buildRows([])).toEqual({ rows: [], flat: [] });
  });
});

describe("moving through enabled options", () => {
  const list = [option("a", { disabled: true }), option("b"), option("c", { disabled: true }), option("d"), option("e", { disabled: "no" })];

  it("finds the first and the last enabled option", () => {
    expect(firstEnabled(list)).toBe(1);
    expect(lastEnabled(list)).toBe(3);
  });

  it("steps over disabled ones, wrapping at the ends", () => {
    expect(stepEnabled(list, 1, 1)).toBe(3);
    expect(stepEnabled(list, 3, 1)).toBe(1);
    expect(stepEnabled(list, 1, -1)).toBe(3);
    expect(stepEnabled(list, 3, -1)).toBe(1);
  });

  it("reports -1 when nothing is enabled, and for an empty list", () => {
    const none = [option("a", { disabled: true })];
    expect(firstEnabled(none)).toBe(-1);
    expect(lastEnabled(none)).toBe(-1);
    expect(stepEnabled(none, 0, 1)).toBe(-1);
    expect(stepEnabled([], 0, 1)).toBe(-1);
    expect(firstEnabled([])).toBe(-1);
  });

  it("stays on the only enabled option", () => {
    const one = [option("a"), option("b", { disabled: true })];
    expect(stepEnabled(one, 0, 1)).toBe(0);
  });
});

describe("CREATE_VALUE", () => {
  it("is not a value an option is likely to have", () => {
    expect(CREATE_VALUE).toContain("\u0000");
  });
});
