import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CATALOG_PATH, placementOf, readCatalog } from "./catalog";

let root: string;
const dir = (...parts: string[]) => join(root, "src", ...parts);

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "dbm-catalog-"));
  mkdirSync(dir("atoms", "Button"), { recursive: true });
  mkdirSync(dir("atoms", "Tooltip"), { recursive: true });
  mkdirSync(dir("atoms", "Orphan"), { recursive: true });
  mkdirSync(dir("atoms", "Misplaced"), { recursive: true });
  mkdirSync(dir("templates", "AppShell"), { recursive: true });
  mkdirSync(dir("templates", "Untitled"), { recursive: true });
  mkdirSync(dir("internal", "thing"), { recursive: true });
  writeFileSync(
    join(root, CATALOG_PATH),
    JSON.stringify({
      Button: { tier: "atom", category: "Inputs" },
      Tooltip: { tier: "atom", category: "Overlay" },
      Misplaced: { tier: "molecule", category: "Layout" },
      AppShell: { tier: "template", category: "Shells" },
    }),
  );
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("readCatalog", () => {
  it("reads the components package's catalog", () => {
    expect(readCatalog(root).Button).toEqual({ tier: "atom", category: "Inputs" });
  });
});

describe("placementOf", () => {
  const catalog = () => readCatalog(root);

  it("puts a component where the catalog says, by the name of its folder", () => {
    expect(placementOf(root, catalog(), dir("atoms", "Button"), "Button")).toEqual({ placement: { tier: "atom", category: "Inputs" } });
  });

  it("gives a helper that shares a folder the entry of the folder", () => {
    expect(placementOf(root, catalog(), dir("atoms", "Tooltip"), "TooltipProvider")).toEqual({ placement: { tier: "atom", category: "Overlay" } });
  });

  it("reports a component the catalog does not list", () => {
    const result = placementOf(root, catalog(), dir("atoms", "Orphan"), "Orphan");
    expect(result.placement).toBeUndefined();
    expect(result.problem).toBe(`no entry for "Orphan" in ${CATALOG_PATH}`);
  });

  it("reports an entry whose tier is not the tier of its folder", () => {
    const result = placementOf(root, catalog(), dir("atoms", "Misplaced"), "Misplaced");
    expect(result.placement).toBeUndefined();
    expect(result.problem).toContain(`puts "Misplaced" in the molecule tier, but its folder is in src/atoms`);
  });

  it("puts a template-level component where the catalog says, like any other", () => {
    expect(placementOf(root, catalog(), dir("templates", "AppShell"), "AppShell")).toEqual({ placement: { tier: "template", category: "Shells" } });
  });

  it("reports a template-level component the catalog does not list", () => {
    const result = placementOf(root, catalog(), dir("templates", "Untitled"), "Untitled");
    expect(result.placement).toBeUndefined();
    expect(result.problem).toBe(`no entry for "Untitled" in ${CATALOG_PATH}`);
  });

  it("reports a component outside the four folders", () => {
    const result = placementOf(root, catalog(), dir("internal", "thing"), "Thing");
    expect(result.placement).toBeUndefined();
    expect(result.problem).toContain("is not in src/atoms, src/molecules, src/organisms or src/templates");
  });
});
