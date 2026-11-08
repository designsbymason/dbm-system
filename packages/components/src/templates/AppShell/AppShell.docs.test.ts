import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds
// the two together for every token the stylesheet uses, in both directions. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/templates/AppShell");
const css = readFileSync(join(folder, "AppShell.module.css"), "utf8");
const mdx = readFileSync(join(folder, "AppShell.mdx"), "utf8");

/** `--dbm-bg-brand-subtle` -> `bg-brand-subtle`, the way a token row writes it (dots, not dashes). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("AppShell's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(1);
    expect(listedTokens.size).toBeGreaterThan(1);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it.each([...listedTokens])("only lists the token %s if the stylesheet uses it", (token) => {
    expect(usedTokens.includes(token), `--dbm-${token} is listed but not used`).toBe(true);
  });
});

// One order for a prop everywhere it is listed: the part's own props in the order the types declare them, then the standard four (`id`, `className`,
// `style`, `data-testid`). A prop in the types but missing from a Properties table or a Controls panel, or listed in another order, is the drift this
// holds off: the types, the Docs page's `order` arrays and each part's stories all list the same props in the same order.
const types = readFileSync(join(folder, "AppShell.types.ts"), "utf8");
const standard = ["id", "className", "style", "data-testid"];

function ownProps(interfaceName: string): string[] {
  const body = new RegExp(`export interface ${interfaceName}[^{]*\\{(.*?)\\n\\}\\n`, "s").exec(types)?.[1] ?? "";
  return [...body.matchAll(/^ {2}("?[A-Za-z][\w-]*"?)\??:/gm)].map((match) => (match[1] as string).replace(/"/g, ""));
}

function argTypeKeys(file: string): string[] {
  const source = readFileSync(join(folder, file), "utf8");
  const body = /argTypes: \{\n(.*?)\n {2}\},\n/s.exec(source)?.[1] ?? "";
  return [...body.matchAll(/^ {4}("?[A-Za-z][\w-]*"?): /gm)].map((match) => (match[1] as string).replace(/"/g, ""));
}

/** The `order` arrays of the Docs page's Properties tables, by the stories file each one draws from. A named array (`propOrder`) is read from its export. */
function tableOrders(): Map<string, string[]> {
  const orders = new Map<string, string[]>();
  for (const match of mdx.matchAll(/<PropertiesTable\s+of=\{(\w+)\}\s+order=(?:\{\[(.*?)\]\}|\{(\w+)\})/gs)) {
    const inline = match[2];
    const named = match[3] === undefined ? undefined : new RegExp(`export const ${match[3]} = \\[(.*?)\\];`, "s").exec(mdx)?.[1];
    const list = inline ?? named ?? "";
    orders.set(match[1] as string, [...list.matchAll(/"([^"]+)"/g)].map((item) => item[1] as string));
  }
  return orders;
}

// The Playground's own switch is not a prop of the shell: it is listed beside them in the root's meta.
const storybookOnly = ["showAside"];
const parts: Array<[string, string, string]> = [
  ["AppShellProps", "AppShellStories", "AppShell.stories.tsx"],
  ["AppShellSkipLinkProps", "AppShellSkipLinkStories", "AppShellSkipLink.stories.tsx"],
  ["AppShellBannerProps", "AppShellBannerStories", "AppShellBanner.stories.tsx"],
  ["AppShellHeaderProps", "AppShellHeaderStories", "AppShellHeader.stories.tsx"],
  ["AppShellSidebarProps", "AppShellSidebarStories", "AppShellSidebar.stories.tsx"],
  ["AppShellMainProps", "AppShellMainStories", "AppShellMain.stories.tsx"],
  ["AppShellStateProps", "AppShellStateStories", "AppShellState.stories.tsx"],
  ["AppShellContentProps", "AppShellContentStories", "AppShellContent.stories.tsx"],
  ["AppShellAsideProps", "AppShellAsideStories", "AppShellAside.stories.tsx"],
  ["AppShellAsideToggleProps", "AppShellAsideToggleStories", "AppShellAsideToggle.stories.tsx"],
  ["AppShellFooterProps", "AppShellFooterStories", "AppShellFooter.stories.tsx"],
];

describe("AppShell's props, in the types, the Docs tables and the Controls panels", () => {
  it.each(parts)("%s: the types, the Docs table's order and the stories list the same props in the same order", (name, namespace, file) => {
    const expected = [...ownProps(name).filter((prop) => !standard.includes(prop)), ...standard];
    expect(ownProps(name).length).toBeGreaterThan(0);
    expect(tableOrders().get(namespace)).toEqual(expected);
    const demoOnly = name === "AppShellProps" ? storybookOnly : [];
    expect(argTypeKeys(file).filter((key) => !demoOnly.includes(key))).toEqual(expected);
  });
});
