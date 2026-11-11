import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds
// the two together for every token the stylesheet uses, in both directions. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/templates/MarketingPage");
const css = readFileSync(join(folder, "MarketingPage.module.css"), "utf8");
const mdx = readFileSync(join(folder, "MarketingPage.mdx"), "utf8");

/** `--dbm-bg-brand-subtle` -> `bg-brand-subtle`, the way a token row writes it (dots, not dashes). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("the Marketing Page's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(0);
    expect(listedTokens.size).toBeGreaterThan(0);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it.each([...listedTokens])("only lists the token %s if the stylesheet uses it", (token) => {
    expect(usedTokens.includes(token), `--dbm-${token} is listed but not used`).toBe(true);
  });
});
