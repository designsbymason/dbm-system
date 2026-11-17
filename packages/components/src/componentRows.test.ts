import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { toRows } from "./componentRows";
import type { Catalog, RawEntry } from "./componentRows";

// `toRows` turns Storybook's index into the rows of the Index page's table. A component's tier and category are the
// catalog's, whatever the title says, so the sidebar can group components however it likes.
const catalog: Catalog = {
  Button: { tier: "atom", category: "Inputs" },
  Card: { tier: "molecule", category: "Data Display" },
  Sidebar: { tier: "organism", category: "Navigation" },
  AppShell: { tier: "template", category: "Shells" },
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

  it("trusts the catalog, not the title, for a component's tier and category", () => {
    const rows = toRows(index(docs("Components/Button")), { Button: { tier: "organism", category: "Layout" } });
    expect(rows.map(({ tier, category }) => [tier, category])).toEqual([["Organisms", "Layout"]]);
  });

  it("leaves out a title in a tier group, as components are no longer grouped by tier", () => {
    expect(toRows(index(docs("Atoms/Inputs/Button")), catalog)).toEqual([]);
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

  it("lists an application shell with the components, in the template tier, and an example page by its Templates title", () => {
    const rows = toRows(index(docs("Components/AppShell"), docs("Templates/Data Table List Page", ["example-page"])), catalog);
    expect(rows.map(({ name, tier, category, component, examplePage }) => [name, tier, category, component, examplePage])).toEqual([
      ["AppShell", "Templates", "Shells", true, false],
      ["Data Table List Page", "Templates", "Pages", false, true],
    ]);
  });

  it("marks an example page by its tag, and leaves out a title nested deeper under Templates", () => {
    const rows = toRows(index(docs("Templates/Landing page"), docs("Templates/Landing page/Checks"), docs("Templates/Shells/Old")), catalog);
    expect(rows.map(({ name, examplePage }) => [name, examplePage])).toEqual([["Landing page", false]]);
  });

  it("does not list the Templates Index page, which is the page of the table, as a template", () => {
    const rows = toRows(index(docs("Templates/Index"), docs("Components/AppShell"), docs("Components/Index")), catalog);
    expect(rows.map((row) => row.name)).toEqual(["AppShell"]);
  });

  it("sorts by name, whatever the case", () => {
    const rows = toRows(index(docs("Components/Sidebar"), docs("Components/AppShell"), docs("Components/Button")), catalog);
    expect(rows.map((row) => row.name)).toEqual(["AppShell", "Button", "Sidebar"]);
  });

  it("gives every component in the real catalog exactly one row", () => {
    const real = JSON.parse(readFileSync(join(process.cwd(), "src", "componentCatalog.json"), "utf8")) as Catalog;
    const names = Object.keys(real);
    const rows = toRows(index(...names.map((name) => docs(`Components/${name}`))), real);
    expect(rows.map((row) => row.name).sort()).toEqual([...names].sort());
    expect(rows.filter((row) => row.tier === "Templates").map((row) => row.name)).toEqual(["AppShell", "PageShell"]);
  });
});
