import { describe, expect, it } from "vitest";
import { defaultFilter, findMatches, fold, foldCharacters, queryWords } from "./optionList.match";

describe("fold", () => {
  it("lower-cases and drops accents", () => {
    expect(fold("Curaçao")).toBe("curacao");
    expect(fold("ÅNGSTRÖM")).toBe("angstrom");
  });

  it("maps every folded character back to a place in the original", () => {
    const { folded, origin } = foldCharacters("Curaçao");
    expect(origin).toHaveLength(folded.length + 1);
    expect(origin[folded.indexOf("a", 4)]).toBe(5);
    expect(origin[folded.length]).toBe("Curaçao".length);
  });

  it("keeps a character that expands (a ligature or a letter with two parts) pointing at one original place", () => {
    const { folded, origin } = foldCharacters("ﬁne");
    expect(folded.length).toBeGreaterThanOrEqual(3);
    expect(new Set(origin.slice(0, folded.indexOf("n"))).size).toBe(1);
  });

  it("copes with astral characters and the empty string", () => {
    expect(fold("😀a")).toBe("😀a");
    expect(foldCharacters("").origin).toEqual([0]);
  });
});

describe("queryWords", () => {
  it("splits on any run of space, drops empties and folds", () => {
    expect(queryWords("  New   YORK\t")).toEqual(["new", "york"]);
    expect(queryWords("   ")).toEqual([]);
  });
});

describe("defaultFilter", () => {
  const option = { value: "gb", label: "United Kingdom", keywords: ["UK", "Britain"] };

  it("keeps everything for an empty query", () => {
    expect(defaultFilter(option, "")).toBe(true);
    expect(defaultFilter(option, "   ")).toBe(true);
  });

  it("needs every word, in any order, anywhere", () => {
    expect(defaultFilter(option, "king uni")).toBe(true);
    expect(defaultFilter(option, "king xyz")).toBe(false);
  });

  it("matches keywords and textValue as well as the label", () => {
    expect(defaultFilter(option, "brit")).toBe(true);
    expect(defaultFilter({ value: "a", label: "Alpha", textValue: "first letter" }, "letter")).toBe(true);
    expect(defaultFilter({ value: "a", label: "Alpha", textValue: "first letter" }, "alpha")).toBe(false);
  });

  it("does not let words run across the join between the label and a keyword", () => {
    expect(defaultFilter({ value: "a", label: "ab", keywords: ["cd"] }, "bc")).toBe(false);
  });
});

describe("findMatches", () => {
  it("marks every occurrence of every word", () => {
    expect(findMatches("Ant and Anne", "an")).toEqual([[0, 2], [4, 6], [8, 10]]);
  });

  it("joins stretches that touch or overlap", () => {
    expect(findMatches("New York", "new york")).toEqual([[0, 3], [4, 8]]);
    expect(findMatches("Banana", "an")).toEqual([[1, 5]]);
    expect(findMatches("abcd", "abc bcd")).toEqual([[0, 4]]);
  });

  it("returns ranges in the original text, through accents and case", () => {
    expect(findMatches("Curaçao", "CURA")).toEqual([[0, 4]]);
    expect(findMatches("Curaçao", "cao")).toEqual([[4, 7]]);
  });

  it("returns nothing for an empty query or no match", () => {
    expect(findMatches("Canada", "")).toEqual([]);
    expect(findMatches("Canada", "zz")).toEqual([]);
  });

  it("scales with the length of the text, not its square (a long single word)", () => {
    const word = "a".repeat(20000);
    const started = performance.now();
    findMatches(word, "aaa");
    expect(performance.now() - started).toBeLessThan(500);
  });
});
