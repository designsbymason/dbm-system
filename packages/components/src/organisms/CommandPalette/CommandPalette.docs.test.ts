import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds
// the two together for every token the stylesheet reads, and the other way round. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/organisms/CommandPalette");
// The rows are drawn by the option-list stylesheet `CommandPalette` shares with `Combobox` and `MultiSelect`.
const css = ["CommandPalette.module.css", "../../internal/optionList/OptionList.module.css"]
  .map((file) => readFileSync(join(folder, file), "utf8"))
  .join("\n");
const mdx = readFileSync(join(folder, "CommandPalette.mdx"), "utf8");

const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("CommandPalette's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(12);
    expect(listedTokens.size).toBeGreaterThan(12);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it.each([...listedTokens])("the row for %s is a token the stylesheet reads", (token) => {
    expect(usedTokens.includes(token)).toBe(true);
  });
});
