/**
 * What the blocks read when a page is converted (convert.mjs): Storybook's built `index.json`, the components package's catalog and
 * descriptions, the token values, and the stories and snippets a `Canvas` shows. Everything is read from the built output or the
 * package's own files, never typed here, so the copies move with the source. The package's TypeScript is loaded as it is, through the
 * module hooks in ts-source-hooks.mjs.
 */
import "./register.mjs";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { absolutize } from "./convert.mjs";

const TIER_LABEL = { Atoms: "Atom", Molecules: "Molecule", Organisms: "Organism", Templates: "Template" };

/** The components package's folder, found from the docs app's own dependency on it. */
export function componentsPackageDir() {
  return dirname(createRequire(import.meta.url).resolve("@dbm-system/components/package.json"));
}

/**
 * @param {{ storybookDir: string, packageDir?: string, origin?: string }} options
 *   `storybookDir` is the built Storybook (`storybook-static`, or `storybook/` in the assembled site).
 */
export async function buildContext({ storybookDir, packageDir = componentsPackageDir(), origin = "https://dbm-system.com/" }) {
  const storybookBase = `${origin}storybook/`;
  const entries = JSON.parse(readFileSync(join(storybookDir, "index.json"), "utf8")).entries;
  const all = Object.values(entries);
  // The pages that get a copy are the ones a reader sees in the sidebar, as for the sitemap (the `dev` tag).
  const pages = all.filter((entry) => entry.type === "docs" && entry.tags?.includes("dev"));
  const copies = new Set(pages.map((entry) => entry.id));
  const stories = all.filter((entry) => entry.type === "story");

  const catalog = JSON.parse(readFileSync(join(packageDir, "src", "componentCatalog.json"), "utf8"));
  const { toRows } = await import(pathToFileURL(join(packageDir, "src", "componentRows.ts")).href);
  const { componentDescriptions } = await import(pathToFileURL(join(packageDir, "src", "componentDescriptions.ts")).href);
  const tokenModule = await import("@dbm-system/tokens");
  const { primitives } = tokenModule;
  const themes = { purple: { light: tokenModule.purpleLight, dark: tokenModule.purpleDark }, emerald: { light: tokenModule.emeraldLight, dark: tokenModule.emeraldDark } };

  const primitiveByHex = {};
  for (const [family, steps] of Object.entries(primitives.color)) {
    for (const [step, hex] of Object.entries(steps)) primitiveByHex[String(hex).toLowerCase()] = `color.${family}.${step}`;
  }

  const ctx = { origin, storybookBase, copies, catalog, tokens: { primitives } };

  /** A semantic token's value in a brand and mode, named by the primitive it resolves to where it is one (as the page's swatch grid does). */
  ctx.semanticValue = (token, brand, mode) => {
    const [category, field] = token.split(".");
    const hex = themes[brand][mode][category]?.[field];
    if (!hex) return "—";
    return primitiveByHex[String(hex).toLowerCase()] ?? hex;
  };

  ctx.componentRows = (section) => {
    const rows = toRows(Object.fromEntries(all.filter((entry) => entry.type === "docs").map((entry) => [entry.id, entry])), catalog);
    return rows
      .filter((row) => (section === "templates" ? !row.component : section === "components" ? row.component : true))
      .map((row) => {
        const description = componentDescriptions[row.name];
        if (!description) throw new Error(`${row.name} has no line in componentDescriptions.ts`);
        return { name: row.name, tier: TIER_LABEL[row.tier] ?? row.tier, category: row.category, description, url: absolutize(`?path=/docs/${row.id}`, ctx) };
      });
  };

  ctx.foundationCards = () => {
    const source = readFileSync(join(packageDir, ".storybook", "blocks", "FoundationsCards.tsx"), "utf8");
    const cards = [...source.matchAll(/<RelatedCard\b([^>]*)>/g)].map((match) => {
      const read = (name) => new RegExp(`${name}="([^"]*)"`).exec(match[1])?.[1];
      return { name: read("name"), description: read("description"), href: read("href") };
    });
    if (cards.length === 0 || cards.some((card) => !card.name || !card.description || !card.href)) throw new Error("FoundationsCards.tsx has no RelatedCard cards the copies can read");
    return cards;
  };

  ctx.iconNames = () => {
    const source = readFileSync(join(packageDir, ".storybook", "blocks", "IconGallery.tsx"), "utf8");
    const list = /const MOST_USED[^=]*=\s*\[([\s\S]*?)\n\];/.exec(source)?.[1] ?? "";
    const names = [...list.matchAll(/\["(\w+Icon)"/g)].map((match) => match[1]);
    if (names.length === 0) throw new Error("IconGallery.tsx has no MOST_USED list the copies can read");
    return names;
  };

  const snippetModules = new Map();
  /** A story a `Canvas` shows: its name, its address in Storybook, and the hand-written snippet under its "Show code" button, if it has one. */
  ctx.canvas = async ({ entry, imports, moduleName, story }) => {
    const importSource = imports.get(moduleName);
    if (!importSource) throw new Error(`${moduleName} is not imported by the page`);
    if (!story) throw new Error(`${moduleName} is a stories module, not one story`);
    const base = resolve(dirname(join(packageDir, entry.importPath)), importSource);
    const file = [".tsx", ".ts"].map((extension) => base + extension).find((candidate) => existsSync(candidate));
    if (!file) throw new Error(`no stories file at ${importSource}`);
    const key = `./${relative(packageDir, file)}`;
    const found = stories.find((candidate) => candidate.importPath === key && candidate.exportName === story);
    if (!found) throw new Error(`${story} is not a story in ${key}`);
    const url = `${storybookBase}?path=/story/${found.id}`;

    const text = readFileSync(file, "utf8");
    const start = text.indexOf(`export const ${story}`);
    const next = text.indexOf("\nexport const ", start + 1);
    const block = text.slice(start, next === -1 ? undefined : next);
    const reference = /source:\s*\{\s*code:\s*([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*\}/.exec(block);
    let snippet;
    if (reference) {
      const [, object, property] = reference;
      const from = new RegExp(`import\\s*\\{[^}]*\\b${object}\\b[^}]*\\}\\s*from\\s*"([^"]+)"`).exec(text)?.[1];
      if (!from) throw new Error(`the snippet ${object}.${property} of ${story} is not imported by ${key}`);
      const moduleFile = [".ts", ".tsx"].map((extension) => resolve(dirname(file), from) + extension).find((candidate) => existsSync(candidate));
      if (!moduleFile) throw new Error(`no snippets file at ${from}`);
      if (!snippetModules.has(moduleFile)) snippetModules.set(moduleFile, await import(pathToFileURL(moduleFile).href));
      snippet = snippetModules.get(moduleFile)[object]?.[property];
      if (typeof snippet !== "string") throw new Error(`${object}.${property} is not a string in ${from}`);
    }
    return { name: found.name, url, snippet };
  };

  return Object.assign(ctx, { pages, stories });
}
