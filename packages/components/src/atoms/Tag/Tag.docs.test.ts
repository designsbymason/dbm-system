import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet (Tag's lacked the padding, the hit area and
// the icon sizes). This holds the two together for every token the stylesheet uses, and for the icon tones the component picks, in both
// directions. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/atoms/Tag");
const css = readFileSync(join(folder, "Tag.module.css"), "utf8");
const tsx = readFileSync(join(folder, "Tag.tsx"), "utf8");
const mdx = readFileSync(join(folder, "Tag.mdx"), "utf8");

/** The tokens the stylesheet reads: `--dbm-bg-surface` -> `bg-surface`, the way a token row writes it (dots, not dashes). */
const cssTokens = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string);

/** The icon colours `Tag.tsx` passes to `Icon` as a `tone`: the values of its two tone maps, as the `icon.*` tokens they resolve to. */
const iconTokens = [...tsx.matchAll(/const (?:onToneIcon|standaloneToneIcon)[^{]*\{([^}]*)\}/g)].flatMap((block) =>
  [...(block[1] as string).matchAll(/:\s*"([a-z-]+)"/g)].map((match) => `icon-${match[1] as string}`),
);

const usedTokens = [...new Set([...cssTokens, ...iconTokens])];

/** One row may name a run of steps (`icon-size.xs–icon-size.md`); it stands for every step from the first to the last. */
function expand(token: string): string[] {
  const range = /^(.+)\.(xs|sm|base|md|lg|xl)–\1\.(xs|sm|base|md|lg|xl)$/.exec(token);
  if (!range) return [token.replace(/\./g, "-")];
  const steps = (range[1] as string) === "font-size" ? ["xs", "sm", "base", "md", "lg", "xl"] : ["xs", "sm", "md", "lg", "xl"];
  const from = steps.indexOf(range[2] as string);
  const to = steps.indexOf(range[3] as string);
  return steps.slice(from, to + 1).map((step) => `${(range[1] as string).replace(/\./g, "-")}-${step}`);
}
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) => expand(match[1] as string)));

describe("Tag's Docs page", () => {
  it("finds the tokens the stylesheet uses, the icon tones, and the rows that list them", () => {
    expect(cssTokens.length).toBeGreaterThan(10);
    expect(iconTokens).toContain("icon-on-neutral");
    expect(listedTokens.size).toBeGreaterThan(10);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it.each([...listedTokens])("only lists the token %s if the component uses it", (token) => {
    expect(usedTokens.includes(token), `--dbm-${token} is listed but not used`).toBe(true);
  });
});
