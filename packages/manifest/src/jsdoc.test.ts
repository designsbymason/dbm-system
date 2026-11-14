import { describe, expect, it } from "vitest";
import { describeProp, parseExamples, splitDescription, unquote } from "./jsdoc";

describe("splitDescription", () => {
  it("takes the first paragraph as the summary and joins its lines", () => {
    expect(splitDescription("A button.\nIt acts.\n\nMore detail.\n\nEven more.")).toEqual({
      summary: "A button. It acts.",
      description: "More detail.\n\nEven more.",
    });
  });
  it("leaves the description out when there is one paragraph", () => {
    expect(splitDescription("Only this.")).toEqual({ summary: "Only this." });
  });
  it("gives an empty summary for no text", () => {
    expect(splitDescription("")).toEqual({ summary: "" });
  });
});

describe("parseExamples", () => {
  it("gives one example per fenced block", () => {
    expect(parseExamples("```tsx\n<A />\n```\n\n```tsx\n<B />\n```")).toEqual([{ code: "<A />" }, { code: "<B />" }]);
  });
  it("takes bare code as one example", () => {
    expect(parseExamples("<A />\n")).toEqual([{ code: "<A />" }]);
  });
  it("drops an empty block", () => {
    expect(parseExamples("```tsx\n\n```")).toEqual([]);
  });
});

describe("describeProp and unquote", () => {
  it("joins a prop's lines", () => {
    expect(describeProp("Visual style,\n  signaling emphasis.")).toBe("Visual style, signaling emphasis.");
    expect(describeProp(undefined)).toBe("");
  });
  it("removes one pair of quotes", () => {
    expect(unquote('"primary"')).toBe("primary");
    expect(unquote("'md'")).toBe("md");
    expect(unquote("12")).toBe("12");
  });
});
