import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheets: tokens they used
// were missing from it. This holds them together. The ends and the panel are drawn with DatePicker's stylesheet, so it is read
// too, less the rules of the in-field clear and calendar buttons, which the ends never draw here (the pair's two buttons are
// `IconButton`s, whose tokens belong to that atom's own page).
// (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/organisms");
// A rule that mentions the button classes, up to its closing brace (none of those rules is nested).
const unusedButtonRules = /[^{}]*\.(iconButton|button(Xs|Sm|Md|Lg|Xl))\b[^{}]*\{[^}]*\}/g;
const css =
  readFileSync(join(folder, "DateRangePicker/DateRangePicker.module.css"), "utf8") +
  readFileSync(join(folder, "DatePicker/DatePicker.module.css"), "utf8").replace(unusedButtonRules, "");
const mdx = readFileSync(join(folder, "DateRangePicker/DateRangePicker.mdx"), "utf8");

/** `--dbm-icon-button-size-sm` -> `icon-button.size.sm`, the way a token row writes it (the category is a prefix). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("DateRangePicker's Docs page", () => {
  it("finds the tokens the stylesheets use, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(15);
    expect(listedTokens.size).toBeGreaterThan(15);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token the stylesheets no longer use", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});
