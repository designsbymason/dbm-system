import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds the two
// together. A row may name several tokens, separated by " / ". (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/organisms/NavigationMenu");
const css = readFileSync(join(folder, "NavigationMenu.module.css"), "utf8");
const mdx = readFileSync(join(folder, "NavigationMenu.mdx"), "utf8");

const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set(
  [...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) =>
    (match[1] as string).split("/").map((token) => token.trim().replace(/\./g, "-")),
  ),
);

describe("NavigationMenu's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(20);
    expect(listedTokens.size).toBeGreaterThan(20);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token the stylesheet does not use", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});

// A prop that is in the types but missing from a Properties table, or listed in a different order from the types, is the kind of
// drift this holds off: one order for the types and the Docs tables (the `*PropOrder` arrays in the Docs page).
const types = readFileSync(join(folder, "NavigationMenu.types.ts"), "utf8");

function declaredProps(interfaceName: string): string[] {
  const body = new RegExp(`export interface ${interfaceName}[^{]*\\{(.*?)\\n\\}\\n`, "s").exec(types)?.[1] ?? "";
  return [...body.matchAll(/^ {2}(?:"([^"]+)"|([A-Za-z]+))\??:/gm)].map((match) => (match[1] ?? match[2]) as string);
}

function orderIn(name: string): string[] {
  const list = new RegExp(`export const ${name} = \\[(.*?)\\];`, "s").exec(mdx)?.[1] ?? "";
  return [...list.matchAll(/"([^"]+)"/g)].map((match) => match[1] as string);
}

const tables: Array<[string, string]> = [
  ["NavigationMenuProps", "propOrder"],
  ["NavigationMenuListProps", "listPropOrder"],
  ["NavigationMenuItemProps", "itemPropOrder"],
  ["NavigationMenuTriggerProps", "triggerPropOrder"],
  ["NavigationMenuContentProps", "contentPropOrder"],
  ["NavigationMenuLinkProps", "linkPropOrder"],
  ["NavigationMenuGroupProps", "groupPropOrder"],
  ["NavigationMenuFeatureProps", "featurePropOrder"],
  ["NavigationMenuFooterProps", "footerPropOrder"],
];

describe("NavigationMenu's Properties tables", () => {
  it.each(tables)("%s lists every declared prop, in the order of its table", (interfaceName, orderName) => {
    const declared = declaredProps(interfaceName);
    expect(declared.length).toBeGreaterThan(3);
    expect(orderIn(orderName).sort()).toEqual([...declared].sort());
  });
});
