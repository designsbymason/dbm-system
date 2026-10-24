import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheets. This holds
// them together. The panel, items and labels are drawn with `Menu`'s stylesheet, which this component imports, so the
// table covers both. A row may name several tokens, separated by " / ". (The tests run from the package's own folder.)
const organisms = join(process.cwd(), "src/organisms");
const css = ["Menu/Menu.module.css", "ContextMenu/ContextMenu.module.css"]
  .map((file) => readFileSync(join(organisms, file), "utf8"))
  .join("\n");
const mdx = readFileSync(join(organisms, "ContextMenu/ContextMenu.mdx"), "utf8");

const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set(
  [...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) =>
    (match[1] as string).split("/").map((token) => token.trim().replace(/\./g, "-")),
  ),
);

describe("ContextMenu's Docs page", () => {
  it("finds the tokens the stylesheets use, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(20);
    expect(listedTokens.size).toBeGreaterThan(20);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token the stylesheets don't use", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});
