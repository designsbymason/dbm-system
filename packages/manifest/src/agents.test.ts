import { describe, expect, it } from "vitest";
import { AGENTS_END, AGENTS_START, CLAUDE_INDEX_END, CLAUDE_INDEX_START, agentsProblems, renderAgentsList, updateAgentsBlock, updateClaudeIndex } from "./agents";
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

describe("updateClaudeIndex", () => {
  it("rewrites the block between its own markers and leaves AGENTS.md's alone", () => {
    const file = `intro\n\n${CLAUDE_INDEX_START}\nold\n${CLAUDE_INDEX_END}\n\n${AGENTS_START}\nkept\n${AGENTS_END}\noutro\n`;
    expect(updateClaudeIndex(file, "list")).toBe(`intro\n\n${CLAUDE_INDEX_START}\n\nlist\n\n${CLAUDE_INDEX_END}\n\n${AGENTS_START}\nkept\n${AGENTS_END}\noutro\n`);
  });
  it("refuses a file without them", () => {
    expect(() => updateClaudeIndex("# none", "x")).toThrow(/exactly one/);
  });
});

describe("agentsProblems", () => {
  const withProps = (name: string, props: string[], parts: { name: string; props: string[] }[] = []): ManifestComponent => ({
    ...component(name, "atom", "Inputs"),
    props: props.map((prop) => ({ name: prop, type: "string", required: false, description: "x" })),
    parts: parts.map((part) => ({ name: part.name, summary: "x", extends: [], props: part.props.map((prop) => ({ name: prop, type: "string", required: false, description: "x" })) })),
  });
  const known: Manifest = {
    ...manifest,
    components: [withProps("Button", ["asChild", "leadingIcon", "className", "aria-label"]), withProps("Menu", [], [{ name: "Menu.Item", props: ["onSelect"] }])],
    utilities: [{ name: "useTheme", kind: "hook", summary: "x", signature: "", params: [], returns: "", examples: [] }],
  };
  const tokens = new Set(["--dbm-bg-brand"]);
  const check = (text: string) => agentsProblems(text, known, tokens);

  it("accepts text whose names, props, tokens and examples the manifest backs", () => {
    expect(check("Use `Button` and `Menu.Item` with `asChild`, `useTheme`, `aria-label` and `var(--dbm-bg-brand)`: `<Button asChild leadingIcon={X}>Go</Button>` and `Nunito`.")).toEqual([]);
  });
  it("leaves the generated block alone", () => {
    expect(check(`${AGENTS_START}\n\n\`Imaginary\`\n\n${AGENTS_END}`)).toEqual([]);
  });
  it("names a component or part that is not in the manifest", () => {
    expect(check("`Imaginary` and `Menu.Nope`")).toEqual([
      "`Imaginary` is not a component or part in the manifest, or a name another package exports",
      "`Menu.Nope` is not a component or part in the manifest, or a name another package exports",
    ]);
  });
  it("names a camelCase prop or hook that nothing has", () => {
    expect(check("`asChildd` and `useNope`")).toEqual(["`asChildd` is not a prop of any component or a hook or function in the manifest", "`useNope` is not a prop of any component or a hook or function in the manifest"]);
  });
  it("names an aria or data attribute that nothing takes, and a token the CSS lacks", () => {
    expect(check("`aria-nope` and `var(--dbm-bg-nope)`")).toEqual(["`aria-nope` is not a prop of any component in the manifest", "`--dbm-bg-nope` is not a token the token CSS declares"]);
  });
  it("checks the components and camelCase props in an example, in a span or a fence", () => {
    expect(check("`<Nope />` and `<Button asChildd>`")).toEqual(["<Nope> in the examples is not a component or part in the manifest", "<Button asChildd=…> in the examples: asChildd is not a prop of Button in the manifest"]);
    expect(check("```tsx\n<Menu.Item onSelects={f} />\n```")).toEqual(["<Menu.Item onSelects=…> in the examples: onSelects is not a prop of Menu.Item in the manifest"]);
  });
  it("reads past expressions in braces and spread props", () => {
    expect(check("`<Button leadingIcon={{ isOpen }} {...rest}>x</Button>`")).toEqual([]);
  });
  it("accepts a camelCase name that another package exports, when it is given", () => {
    expect(agentsProblems("`purpleLight`", known, tokens, new Set(["purpleLight"]))).toEqual([]);
    expect(check("`purpleLight`")).toEqual(["`purpleLight` is not a prop of any component or a hook or function in the manifest"]);
  });
  it("accepts a PascalCase name another package or a type export gives, and a token family", () => {
    expect(agentsProblems("`PlusIcon`, `Responsive` and `--dbm-bg-*`", known, tokens, new Set(["PlusIcon", "Responsive"]))).toEqual([]);
    expect(check("`--dbm-nope-*`")).toEqual(["`--dbm-nope-` is not a token the token CSS declares"]);
  });
  it("lets the manifest's own field names through", () => {
    expect(check("`forwardsRef` and `refElement` in a component's file")).toEqual([]);
  });
  it("lets the <Name> placeholder in a path through", () => {
    expect(check("`manifest/components/<Name>.json`")).toEqual([]);
  });
  it("lets the page's own data-theme attribute through", () => {
    expect(check("`data-theme` on the root element")).toEqual([]);
  });
  it("does not check plain lower-case words", () => {
    expect(check("`size` is `xs`, `light` or `ref`")).toEqual([]);
  });
});
