import { describe, expect, it } from "vitest";
import { treePlaygroundSnippet } from "./Tree.snippets";

describe("the Playground's snippet", () => {
  it("writes only what differs from the defaults", () => {
    const snippet = treePlaygroundSnippet({ size: "md", selectionMode: "none", checkable: false, windowed: "auto", dir: "ltr" });
    expect(snippet).toMatch(/<Tree aria-label="Project files" nodes=\{\[[\s\S]*\]\} \/>$/);
  });

  it("writes the options that are set", () => {
    const snippet = treePlaygroundSnippet({
      size: "lg",
      selectionMode: "multiple",
      expandOnClick: true,
      selectOnFocus: true,
      checkable: true,
      defaultExpandAll: true,
      windowed: true,
      maxHeight: 240,
      highlightQuery: "app",
      dir: "rtl",
      loading: true,
      loadingCount: 5,
      renamable: true,
    });
    for (const part of ['size="lg"', 'selectionMode="multiple"', "checkable", "expandOnClick", "selectOnFocus", "defaultExpandAll", "windowed", "maxHeight={240}", 'highlightQuery="app"', 'dir="rtl"', "loading", "loadingCount={5}", "renamable"]) {
      expect(snippet).toContain(part);
    }
  });

  it("writes loadingCount only for a loading tree that differs from the default, and nothing for a tree that is not loading", () => {
    expect(treePlaygroundSnippet({ loading: true, loadingCount: 3 })).not.toContain("loadingCount");
    expect(treePlaygroundSnippet({ loading: false, loadingCount: 5 })).not.toContain("loading");
    expect(treePlaygroundSnippet({ renamable: false })).not.toContain("renamable");
  });

  it("writes windowed={false} and a text height", () => {
    const snippet = treePlaygroundSnippet({ windowed: false, maxHeight: "20rem" });
    expect(snippet).toContain("windowed={false}");
    expect(snippet).toContain('maxHeight="20rem"');
  });

  it("quotes a name that holds a quote", () => {
    expect(treePlaygroundSnippet({ "aria-label": 'The "best" one' })).toContain('aria-label={"The \\"best\\" one"}');
  });
});
