import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as match from "../../internal/optionList/optionList.match";
import { fold } from "../../internal/optionList/optionList.match";
import type { MultiSelectLabels, MultiSelectOption } from "./MultiSelect.types";
import { useTypedValues } from "./useTypedValues";

// Counts how often a label or a word is folded, so the test is about the work done and not a clock.
vi.mock("../../internal/optionList/optionList.match", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../internal/optionList/optionList.match")>();
  return { ...original, fold: vi.fn(original.fold) };
});

const labels = {
  duplicate: (text: string) => `${text} dup`,
  limitReached: () => "limit",
  notFound: (text: string) => `${text} nf`,
  tooLong: (text: string, max: number) => `${text} too long ${max}`,
  noResults: "none",
  pasted: (added: number, refused: number) => `${added}/${refused}`,
  added: (label: string) => `${label} added`,
  selectedCount: (count: number) => `${count} selected`,
} as unknown as MultiSelectLabels;

function setup(options: MultiSelectOption[], extra: Partial<Parameters<typeof useTypedValues>[0]> = {}) {
  const commit = vi.fn();
  const optionsByLabel = new Map<string, MultiSelectOption>();
  for (const option of options) if (!optionsByLabel.has(fold(option.label))) optionsByLabel.set(fold(option.label), option);
  const { result } = renderHook(() =>
    useTypedValues({
      values: [],
      options,
      optionsByLabel,
      labels,
      allowCustomValue: true,
      maxSelected: undefined,
      maxTagLength: undefined,
      validate: undefined,
      separators: [","],
      commit,
      announce: () => undefined,
      warn: () => undefined,
      ...extra,
    }),
  );
  return { result, commit };
}

describe("useTypedValues", () => {
  it("refuses a typed value longer than maxTagLength, and never limits an option's own label", () => {
    const { result, commit } = setup([{ value: "x", label: "A very long option label indeed" }], { maxTagLength: 5 });
    const outcome = result.current.addTyped(["tiny", "much too long", "a very long option label indeed"]);
    expect(outcome.refused).toEqual(["much too long too long 5"]);
    expect(commit.mock.lastCall?.[0]).toEqual(["tiny", "x"]);
  });

  it("checks the length after the duplicate and the option, and before validate", () => {
    const validate = vi.fn(() => undefined);
    const { result } = setup([], { maxTagLength: 3, validate });
    result.current.addTyped(["abcd"]);
    expect(validate).not.toHaveBeenCalled();
    result.current.addTyped(["abc"]);
    expect(validate).toHaveBeenCalledWith("abc");
  });

  it("counts a refused piece in a pasted list, and ignores blanks", () => {
    const { result } = setup([], { maxTagLength: 2 });
    const outcome = result.current.addTyped(["ab", " ", "abc", "xyz"], true);
    expect(outcome).toEqual({ added: 1, refused: ["abc too long 2", "xyz too long 2"] });
  });

  it("treats the same word twice in one paste as a duplicate", () => {
    const { result, commit } = setup([]);
    result.current.addTyped(["one", "two", "one"]);
    expect(commit.mock.lastCall?.[0]).toEqual(["one", "two"]);
  });

  it("folds each pasted word once, however many options there are, so the cost is proportional to the paste", () => {
    const folded = (lines: number, optionCount: number) => {
      const options = Array.from({ length: optionCount }, (_, index) => ({ value: `v${index}`, label: `Option number ${index}` }));
      const { result } = setup(options, { allowCustomValue: false });
      const pieces = Array.from({ length: lines }, (_, index) => `option number ${index % optionCount}`);
      vi.mocked(match.fold).mockClear();
      result.current.addTyped(pieces, true);
      return vi.mocked(match.fold).mock.calls.length;
    };
    expect(folded(1000, 2000)).toBeLessThanOrEqual(1000);
    // twice the options, the same paste: the same work
    expect(folded(1000, 4000)).toBe(folded(1000, 2000));
    // four times the paste, four times the work
    expect(folded(4000, 2000)).toBeLessThanOrEqual(4 * folded(1000, 2000));
  });
});
