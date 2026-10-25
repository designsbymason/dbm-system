import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheets. This holds
// the two together for every token the field reads, and the other way round. The field is drawn with its own
// stylesheet and the three it imports: `TagsInput`'s box and chips, and the list and buttons it shares with
// `Combobox`. (The tests run from the package's own folder.)
const root = join(process.cwd(), "src");
const css = [
  "organisms/MultiSelect/MultiSelect.module.css",
  "molecules/TagsInput/TagsInput.module.css",
  "internal/optionList/OptionList.module.css",
  "internal/optionList/AdornmentButton.module.css",
]
  .map((file) => readFileSync(join(root, file), "utf8"))
  .join("\n");
const mdx = readFileSync(join(root, "organisms/MultiSelect/MultiSelect.mdx"), "utf8");

const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("MultiSelect's Docs page", () => {
  it("finds the tokens the stylesheets use, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(12);
    expect(listedTokens.size).toBeGreaterThan(12);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it.each([...listedTokens])("the row for %s is a token the stylesheets read", (token) => {
    expect(usedTokens.includes(token)).toBe(true);
  });
});
