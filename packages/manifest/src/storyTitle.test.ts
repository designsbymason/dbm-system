import { describe, expect, it } from "vitest";
import { parseStoryTitle } from "./storyTitle";

describe("parseStoryTitle", () => {
  it("reads the tier and category of a template title", () => {
    expect(parseStoryTitle("Templates/Shells/AppShell")).toEqual({ tier: "template", category: "Shells" });
    expect(parseStoryTitle("Templates/Data pages/Data Table List Page")).toEqual({ tier: "template", category: "Data pages" });
  });
  it("refuses a title that is not Templates/Category/Name", () => {
    expect(parseStoryTitle("Delete project?")).toBeUndefined();
    expect(parseStoryTitle("Foundations/Color/Docs")).toBeUndefined();
    expect(parseStoryTitle("Templates/AppShell")).toBeUndefined();
    // A component is placed by the catalog, so a tier in a title is not read.
    expect(parseStoryTitle("Atoms/Inputs/Button")).toBeUndefined();
    expect(parseStoryTitle("Components/Button")).toBeUndefined();
  });
});
