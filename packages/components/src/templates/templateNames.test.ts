import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A template is named in Title Case, a page ends with "Page", and an example page's name is never a component's (`04-component-inventory.md`,
// Templates). The template-level components (the shells) are under Components in the sidebar, and the example pages are `Templates/{Name}`;
// the title is read from the main story of each template, and the components are the names in `src/componentCatalog.json`. (The tests run
// from the package's own folder.)
const root = join(process.cwd(), "src");

function storiesFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return storiesFiles(path);
    return entry.endsWith(".stories.tsx") && !entry.includes(".checks.") ? [path] : [];
  });
}

const normalised = (name: string) => name.toLowerCase().replace(/\s+/g, "");

const components = new Set<string>(
  Object.keys(JSON.parse(readFileSync(join(root, "componentCatalog.json"), "utf8")) as Record<string, unknown>).map(normalised),
);
const templates: { name: string; page: boolean; file: string }[] = [];
for (const file of storiesFiles(join(root, "templates"))) {
  const source = readFileSync(file, "utf8");
  const match = /^\s*title:\s*"(Components|Templates)\/([^/"]+)"/m.exec(source);
  if (match?.[2]) templates.push({ name: match[2], page: match[1] === "Templates", file });
}

describe("template names", () => {
  it("finds the templates and components it is meant to cover", () => {
    expect(templates.length).toBeGreaterThan(1);
    expect(components.size).toBeGreaterThan(100);
  });

  it.each(templates.map((template) => [template.name, template] as const))("%s is in Title Case", (_name, template) => {
    // Every word starts with a capital (an application shell keeps its component name, such as AppShell).
    expect(template.name.split(" ").every((word) => /^[A-Z]/.test(word)), `${template.name}: every word starts with a capital`).toBe(true);
  });

  it.each(templates.filter((template) => template.page).map((template) => [template.name, template] as const))(
    "the page %s ends with the word Page",
    (_name, template) => {
      expect(template.name.endsWith(" Page"), `${template.name} is an example page, so its name ends with "Page"`).toBe(true);
    },
  );

  it.each(templates.filter((template) => template.page).map((template) => [template.name, template] as const))("the page %s is not the name of a component", (_name, template) => {
    expect(components.has(normalised(template.name)), `${template.name} is also a component's name`).toBe(false);
  });

  it.each(templates.filter((template) => !template.page).map((template) => [template.name, template] as const))("the shell %s is a component, in the catalog", (_name, template) => {
    expect(components.has(normalised(template.name)), `${template.name} is under Components, so it needs an entry in src/componentCatalog.json`).toBe(true);
  });
});
