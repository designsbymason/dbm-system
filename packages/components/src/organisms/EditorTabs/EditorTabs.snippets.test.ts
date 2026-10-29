import { describe, expect, it } from "vitest";
import { editorTabsPlaygroundSnippet } from "./EditorTabs.snippets";

describe("the Playground's snippet", () => {
  it("writes only what differs from the defaults", () => {
    const snippet = editorTabsPlaygroundSnippet({ variant: "underline", size: "md", rounded: false, closeSelects: "neighbor", overflow: "scroll", dir: "ltr" });
    for (const word of ["variant=", "size=", "rounded", "closeSelects=", "overflow=", "dir="]) expect(snippet).not.toContain(word);
  });

  it("writes the options that are set", () => {
    const snippet = editorTabsPlaygroundSnippet({ variant: "solid", size: "lg", rounded: true, closeSelects: "none", overflow: "menu", dir: "rtl" });
    for (const part of ['variant="solid"', 'size="lg"', "rounded", 'closeSelects="none"', 'overflow="menu"', 'dir="rtl"']) {
      expect(snippet).toContain(part);
    }
  });

  it("names the strip, quoting a label that needs it", () => {
    expect(editorTabsPlaygroundSnippet({})).toContain('aria-label="Open files"');
    expect(editorTabsPlaygroundSnippet({ "aria-label": 'The "main" files' })).toContain('aria-label={"The \\"main\\" files"}');
  });
});
