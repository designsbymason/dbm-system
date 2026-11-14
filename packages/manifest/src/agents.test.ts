import { describe, expect, it } from "vitest";
import { AGENTS_END, AGENTS_START, renderAgentsList, updateAgentsBlock } from "./agents";
import type { Manifest, ManifestComponent } from "./types";

const component = (name: string, tier: ManifestComponent["tier"], category: string): ManifestComponent => ({
  name,
  tier,
  category,
  summary: `${name}.`,
  importName: name,
  source: `src/${name}.tsx`,
  asChild: false,
  as: false,
  extends: [],
  props: [],
  parts: [],
  examples: [],
});

const manifest: Manifest = {
  schemaVersion: 1,
  package: "@dbm-system/components",
  version: "0.1.0",
  components: [component("Select", "molecule", "Inputs"), component("Box", "atom", "Layout"), component("Button", "atom", "Inputs"), component("Menu", "organism", "Navigation")],
  utilities: [
    { name: "useToast", kind: "hook", summary: "Raises toasts.", signature: "(): void", params: [], returns: "void", examples: [] },
    { name: "filterTree", kind: "function", summary: "Narrows a tree.", signature: "(): void", params: [], returns: "void", examples: [] },
    { name: "useTheme", kind: "hook", summary: "Reads the theme.", signature: "(): void", params: [], returns: "void", examples: [] },
  ],
  constants: [],
};

describe("renderAgentsList", () => {
  const list = renderAgentsList(manifest);
  it("lists components by tier and category, names only", () => {
    expect(list).toBe(
      ["**Atoms**", "", "- Inputs: Button", "- Layout: Box", "", "**Molecules**", "", "- Inputs: Select", "", "**Organisms**", "", "- Navigation: Menu", "", "**Hooks:** useTheme, useToast", "", "**Functions:** filterTree"].join("\n"),
    );
  });
  it("is the same text every time", () => {
    expect(renderAgentsList(manifest)).toBe(list);
  });
  it("leaves out a tier with nothing in it", () => {
    expect(list).not.toContain("Templates");
  });
});

describe("updateAgentsBlock", () => {
  const file = `# Title\n\nHand-written.\n\n${AGENTS_START}\n\nold list\n\n${AGENTS_END}\n\nMore hand-written text.\n`;
  it("replaces what is between the markers and nothing else", () => {
    const updated = updateAgentsBlock(file, "new list");
    expect(updated).toBe(`# Title\n\nHand-written.\n\n${AGENTS_START}\n\nnew list\n\n${AGENTS_END}\n\nMore hand-written text.\n`);
  });
  it("is idempotent", () => {
    const once = updateAgentsBlock(file, "new list");
    expect(updateAgentsBlock(once, "new list")).toBe(once);
  });
  it("refuses a file whose markers are missing, repeated or the wrong way round", () => {
    expect(() => updateAgentsBlock("# no markers", "x")).toThrow(/exactly one/);
    expect(() => updateAgentsBlock(`${AGENTS_START}\n${AGENTS_START}\n${AGENTS_END}`, "x")).toThrow(/exactly one/);
    expect(() => updateAgentsBlock(`${AGENTS_END}\n${AGENTS_START}`, "x")).toThrow(/exactly one/);
  });
});
