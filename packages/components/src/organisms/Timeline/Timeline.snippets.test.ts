import { describe, expect, it } from "vitest";
import { timelinePlaygroundSnippet } from "./Timeline.snippets";

describe("the Playground's snippet", () => {
  it("writes only what differs from the defaults", () => {
    const snippet = timelinePlaygroundSnippet({ size: "md", variant: "filled", tone: "brand", connector: "solid", timePlacement: "top", maxVisible: "All" });
    expect(snippet).toMatch(/^<Timeline aria-label="Order history">/);
  });

  it("writes the options that are set", () => {
    const snippet = timelinePlaygroundSnippet({
      size: "lg",
      variant: "outlined",
      tone: "info",
      connector: "dashed",
      timePlacement: "side",
      maxVisible: 2,
      defaultExpanded: true,
    });
    for (const part of ['size="lg"', 'variant="outlined"', 'tone="info"', 'connector="dashed"', 'timePlacement="side"', "maxVisible={2}", "defaultExpanded"]) {
      expect(snippet).toContain(part);
    }
  });

  it("writes colorfulConnector only when it is on", () => {
    expect(timelinePlaygroundSnippet({ colorfulConnector: true })).toContain("colorfulConnector");
    expect(timelinePlaygroundSnippet({ colorfulConnector: false })).not.toContain("colorfulConnector");
  });

  it("writes the orientation, and alternate only where it applies", () => {
    expect(timelinePlaygroundSnippet({ orientation: "horizontal" })).toContain('orientation="horizontal"');
    expect(timelinePlaygroundSnippet({ align: "alternate" })).toContain('align="alternate"');
    expect(timelinePlaygroundSnippet({ align: "alternate", orientation: "horizontal" })).not.toContain("align");
    expect(timelinePlaygroundSnippet({ orientation: "vertical", align: "start" })).not.toContain("orientation");
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
