import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A template is named in Title Case, a page ends with "Page", and its name is never a component's (`04-component-inventory.md`, Templates).
// A story's `title` is `{Tier}/{Group}/{Name}`; the names are read from the main story of each component and each template. (The tests
// run from the package's own folder.)
const root = join(process.cwd(), "src");

function storiesFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return storiesFiles(path);
    return entry.endsWith(".stories.tsx") && !entry.includes(".checks.") ? [path] : [];
  });
}

const normalised = (name: string) => name.toLowerCase().replace(/\s+/g, "");

const components = new Set<string>();
const templates: { name: string; page: boolean; file: string }[] = [];
for (const file of storiesFiles(root)) {
  const source = readFileSync(file, "utf8");
  const match = /^\s*title:\s*"(Atoms|Molecules|Organisms|Templates)\/[^/"]+\/([^/"]+)"/m.exec(source);
  if (!match) continue;
  const [, tier, name] = match;
  if (tier === "Templates") templates.push({ name: name as string, page: /tags:\s*\[[^\]]*"example-page"/.test(source), file });
  else components.add(normalised(name as string));
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

  it.each(templates.map((template) => [template.name, template] as const))("%s is not the name of a component", (_name, template) => {
    expect(components.has(normalised(template.name)), `${template.name} is also a component's name`).toBe(false);
  });
});
