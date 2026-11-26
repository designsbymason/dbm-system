import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet (Avatar's lacked its size and status-dot
// size tokens, the font family and the focus ring's offset). This holds the two together for every token the stylesheet and the component read,
// and for the icon tones the fallback icon takes, in both directions. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/atoms/Avatar");
const css = readFileSync(join(folder, "Avatar.module.css"), "utf8");
const tsx = readFileSync(join(folder, "Avatar.tsx"), "utf8");
const mdx = readFileSync(join(folder, "Avatar.mdx"), "utf8");

const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The tokens the stylesheet and the component's size maps read: `--dbm-bg-surface` -> `bg-surface`, the way a token row writes it (dots, not dashes). */
const readTokens = [css, tsx].flatMap((text) => [...withoutComments(text).matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string));

/** The icon colours the fallback icon takes: `Avatar.tsx` passes the colour family as the icon's `tone`, so each family is an `icon.*` token. */
const families = /const colorFamilies = \[([^\]]*)\]/.exec(tsx)?.[1] ?? "";
const iconTokens = [...families.matchAll(/"([a-z-]+)"/g)].map((match) => `icon-${match[1] as string}`);

const usedTokens = [...new Set([...readTokens, ...iconTokens])];

/** One row may name a run of steps (`avatar.size.xs–avatar.size.xl`); it stands for every step from the first to the last. */
function expand(token: string): string[] {
  const range = /^(.+)\.(xs|sm|base|md|lg|xl)–\1\.(xs|sm|base|md|lg|xl)$/.exec(token);
  if (!range) return [token.replace(/\./g, "-")];
  const steps = (range[1] as string) === "font-size" ? ["xs", "sm", "base", "md", "lg", "xl"] : ["xs", "sm", "md", "lg", "xl"];
  const from = steps.indexOf(range[2] as string);
  const to = steps.indexOf(range[3] as string);
  return steps.slice(from, to + 1).map((step) => `${(range[1] as string).replace(/\./g, "-")}-${step}`);
}
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].flatMap((match) => expand(match[1] as string)));

describe("Avatar's Docs page", () => {
  it("finds the tokens the component uses, the icon tones, and the rows that list them", () => {
    expect(readTokens.length).toBeGreaterThan(20);
    expect(iconTokens).toContain("icon-danger");
    expect(readTokens).toContain("avatar-status-size-md");
    expect(listedTokens.size).toBeGreaterThan(20);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it.each([...listedTokens])("only lists the token %s if the component uses it", (token) => {
    expect(usedTokens.includes(token), `--dbm-${token} is listed but not used`).toBe(true);
  });
});
