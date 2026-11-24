import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds the two together for every
// token the stylesheet uses, in both directions. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/atoms/CloseButton");
const css = readFileSync(join(folder, "CloseButton.module.css"), "utf8");
const mdx = readFileSync(join(folder, "CloseButton.mdx"), "utf8");

/** `--dbm-bg-surface` -> `bg-surface`, the way a token row writes it (dots, not dashes). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];

/** One row may name a run of sizes (`icon-button.size.xs–icon-button.size.xl`); it stands for every step from the first to the last. */
const steps = ["xs", "sm", "md", "lg", "xl"];
function expand(token: string): string[] {
  const range = /^(.+)\.(xs|sm|md|lg|xl)–\1\.(xs|sm|md|lg|xl)$/.exec(token);
  if (!range) return [token.replace(/\./g, "-")];
  const from = steps.indexOf(range[2] as string);
  const to = steps.indexOf(range[3] as string);
  return steps.slice(from, to + 1).map((step) => `${(range[1] as string).replace(/\./g, "-")}-${step}`);
}
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) => expand(match[1] as string)));

describe("CloseButton's Docs page", () => {
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
