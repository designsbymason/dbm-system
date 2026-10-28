import { describe, expect, it } from "vitest";
import { timelinePlaygroundSnippet } from "./Timeline.snippets";

describe("the Playground's snippet", () => {
  it("writes only what differs from the defaults", () => {
    const snippet = timelinePlaygroundSnippet({ size: "md", variant: "filled", tone: "neutral", connector: "solid", timePlacement: "top", maxVisible: "All" });
    expect(snippet).toMatch(/^<Timeline aria-label="Order history">/);
  });

  it("writes the options that are set", () => {
    const snippet = timelinePlaygroundSnippet({
      size: "lg",
      variant: "outlined",
      tone: "brand",
      connector: "dashed",
      timePlacement: "side",
      maxVisible: 2,
      defaultExpanded: true,
    });
    for (const part of ['size="lg"', 'variant="outlined"', 'tone="brand"', 'connector="dashed"', 'timePlacement="side"', "maxVisible={2}", "defaultExpanded"]) {
      expect(snippet).toContain(part);
    }
  });

  it("leaves defaultExpanded out when there is no cap, and the cap out for 'All'", () => {
    const snippet = timelinePlaygroundSnippet({ maxVisible: "All", defaultExpanded: true });
    expect(snippet).not.toContain("defaultExpanded");
    expect(snippet).not.toContain("maxVisible");
  });

  it("quotes a name that holds a quote", () => {
    expect(timelinePlaygroundSnippet({ "aria-label": 'The "best" one' })).toContain('aria-label={"The \\"best\\" one"}');
  });
});
