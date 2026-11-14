import { describe, expect, it } from "vitest";
import { parseStoryTitle } from "./storyTitle";

describe("parseStoryTitle", () => {
  it("reads the tier and category of a component title", () => {
    expect(parseStoryTitle("Atoms/Inputs/Button")).toEqual({ tier: "atom", category: "Inputs" });
    expect(parseStoryTitle("Organisms/Navigation/Menu")).toEqual({ tier: "organism", category: "Navigation" });
    expect(parseStoryTitle("Templates/Shells/AppShell")).toEqual({ tier: "template", category: "Shells" });
  });
  it("refuses a title that is not Tier/Category/Name", () => {
    expect(parseStoryTitle("Delete project?")).toBeUndefined();
    expect(parseStoryTitle("Foundations/Color/Docs")).toBeUndefined();
    expect(parseStoryTitle("Atoms/Button")).toBeUndefined();
  });
});
