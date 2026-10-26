import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds the
// two together. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/organisms/Stepper");
const css = readFileSync(join(folder, "Stepper.module.css"), "utf8");
const mdx = readFileSync(join(folder, "Stepper.mdx"), "utf8");

/** `--dbm-icon-button-size-sm` -> `icon-button.size.sm`, the way a token row writes it (the category is a prefix). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("Stepper's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(30);
    expect(listedTokens.size).toBeGreaterThan(30);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token the stylesheet no longer uses", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});
