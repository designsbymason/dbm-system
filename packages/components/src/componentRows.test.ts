import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toRows } from "./componentRows";
import type { Catalog, RawEntry } from "./componentRows";

// `toRows` turns Storybook's index into the rows of the All components table. A component's tier and category are the
// catalog's, whatever the title says, so the sidebar can group components however it likes.
const catalog: Catalog = {
  Button: { tier: "atom", category: "Inputs" },
  Card: { tier: "molecule", category: "Data Display" },
  Sidebar: { tier: "organism", category: "Navigation" },
};

const docs = (title: string, tags: string[] = []): [string, RawEntry] => {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [id, { id, title, type: "docs", tags }];
};
const index = (...entries: [string, RawEntry][]) => Object.fromEntries(entries);

describe("toRows", () => {
  it("takes a component's tier and category from the catalog, for a Components title", () => {
    const rows = toRows(index(docs("Components/Button"), docs("Components/Card"), docs("Components/Sidebar")), catalog);
    expect(rows.map(({ name, tier, category }) => [name, tier, category])).toEqual([
      ["Button", "Atoms", "Inputs"],
      ["Card", "Molecules", "Data Display"],
      ["Sidebar", "Organisms", "Navigation"],
    ]);
  });

  it("gives the same row for the title a component had before the sidebar was flat", () => {
    const flat = toRows(index(docs("Components/Button")), catalog);
    const tiered = toRows(index(docs("Atoms/Inputs/Button")), catalog);
    expect(tiered.map(({ name, tier, category }) => [name, tier, category])).toEqual(flat.map(({ name, tier, category }) => [name, tier, category]));
  });

  it("trusts the catalog over the title", () => {
    const rows = toRows(index(docs("Organisms/Layout/Button")), catalog);
    expect(rows.map(({ tier, category }) => [tier, category])).toEqual([["Atoms", "Inputs"]]);
  });

  it("leaves out a page that is not a component's own: a part, a component's checks, a guide, a Foundations page", () => {
    const rows = toRows(
      index(docs("Components/Button/Checks"), docs("Components/Tabs/Content"), docs("Guides/Theming"), docs("Foundations/Color"), docs("Getting started/Introduction")),
      catalog,
    );
    expect(rows).toEqual([]);
  });

  it("leaves out a title that is in a component group but not in the catalog", () => {
    expect(toRows(index(docs("Components/Mystery")), catalog)).toEqual([]);
  });

  it("leaves out a story, as only Docs pages are rows", () => {
    const story: [string, RawEntry] = ["components-button--playground", { id: "components-button--playground", title: "Components/Button", type: "story" }];
    expect(toRows(index(story), catalog)).toEqual([]);
  });

  it("lists a template by its title, marks an example page by its tag, and ignores the catalog for it", () => {
    const rows = toRows(index(docs("Templates/Shells/AppShell"), docs("Templates/Data pages/Data Table List Page", ["example-page"])), catalog);
    expect(rows.map(({ name, tier, category, examplePage }) => [name, tier, category, examplePage])).toEqual([
      ["AppShell", "Templates", "Shells", false],
      ["Data Table List Page", "Templates", "Data pages", true],
    ]);
  });

  it("sorts by name, whatever the case", () => {
    const rows = toRows(index(docs("Components/Sidebar"), docs("Templates/Shells/AppShell"), docs("Components/Button")), catalog);
    expect(rows.map((row) => row.name)).toEqual(["AppShell", "Button", "Sidebar"]);
  });

  it("gives every component in the real catalog exactly one row", () => {
    const real = JSON.parse(readFileSync(join(process.cwd(), "src", "componentCatalog.json"), "utf8")) as Catalog;
    const names = Object.keys(real);
    const rows = toRows(index(...names.map((name) => docs(`Components/${name}`))), real);
    expect(rows.map((row) => row.name).sort()).toEqual([...names].sort());
    expect(rows.every((row) => row.tier !== "Templates")).toBe(true);
  });
});
