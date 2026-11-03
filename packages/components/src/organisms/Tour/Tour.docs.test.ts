import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Docs page's "Design tokens used" table is written by hand, so it can drift from the stylesheet. This holds the
// two together. (The tests run from the package's own folder.)
const folder = join(process.cwd(), "src/organisms/Tour");
const css = readFileSync(join(folder, "Tour.module.css"), "utf8");
const mdx = readFileSync(join(folder, "Tour.mdx"), "utf8");
const stories = readFileSync(join(folder, "Tour.stories.tsx"), "utf8");

/** `--dbm-shadow-light-md` -> `shadow-light-md`, the way a token row writes it (a dot stands for each dash). */
const usedTokens = [...new Set([...css.matchAll(/var\(--dbm-([a-z0-9-]+)/g)].map((match) => match[1] as string))];
const listedTokens = new Set([...mdx.matchAll(/<TokenRow token="([^"]+)"/g)].map((match) => (match[1] as string).replace(/\./g, "-")));

describe("Tour's Docs page", () => {
  it("finds the tokens the stylesheet uses, and the rows that list them", () => {
    expect(usedTokens.length).toBeGreaterThan(15);
    expect(listedTokens.size).toBeGreaterThan(15);
  });

  it.each(usedTokens)("lists the token %s in its design-tokens table", (token) => {
    expect(listedTokens.has(token), `add a <TokenRow token="…"> for --dbm-${token}`).toBe(true);
  });

  it("does not list a token the stylesheet no longer uses", () => {
    const used = new Set(usedTokens);
    expect([...listedTokens].filter((token) => !used.has(token))).toEqual([]);
  });
});

// A story that is shown (not tagged `!dev`) has a canvas on the Docs page, in the Playground section or under Variants.
const visibleStories = stories
  .split(/\nexport const /)
  .slice(1)
  .filter((block) => !block.includes('"!dev"'))
  .map((block) => block.slice(0, block.indexOf(":")))
  .filter((name) => /^[A-Z]/.test(name));

describe("Tour's Docs page stories", () => {
  it("finds the stories that are shown", () => {
    expect(visibleStories.length).toBeGreaterThan(10);
    expect(visibleStories).toContain("Playground");
  });

  it.each(visibleStories)("embeds the story %s", (story) => {
    expect(mdx, `add <Canvas of={TourStories.${story}} /> under Variants`).toContain(`<Canvas of={TourStories.${story}} />`);
  });
});
