#!/usr/bin/env node
/**
 * Checks `guidelines/figma/component-map.json`, the map from each drawn Figma component to the code (ADR-0240), against what the
 * packages ship, so two agents (one designing in Figma, one building the code from the design) cannot drift apart:
 *
 * - every component in the map is in the catalog, with the same tier and category, and its Storybook id is the one in its stories file;
 * - every code prop a Figma property maps to is a prop in the built manifest (a slot maps to one of its parts, `Card.Header`), and every literal value is one the prop's type allows
 *   (a prop a consumer supplies, a node or a handler, is written `"<provided>"`);
 * - a Figma property's default maps to the code's default, and for an enumerated property (a size, a tone) the drawn values and the `undrawn` ones, each with a recipe, add up to every value the code's type allows (ADR-0242);
 * - a set of more than 250 variants has a recorded `coverage.exception`;
 * - every prop in the manifest is mapped by a Figma property or named in `notModelled`, and nothing is both;
 * - each component has its decisions file in `guidelines/figma/components/`, and the status table there is the one the map generates;
 * - the map holds no file key, address or node id.
 *
 * `--write` rewrites the status table in `guidelines/figma/components/README.md`. Needs the built manifest (`pnpm build`).
 * Run from the repository root: `pnpm check-figma-map`.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROVIDED = "<provided>";
/** The most variants a set has without a recorded exception (ADR-0242). */
export const BUDGET = 250;
const START = "<!-- figma-status:start -->";
const END = "<!-- figma-status:end -->";

const unquote = (s) => String(s).trim().replace(/^['"]|['"]$/g, "");

/** The string literals a type allows: an inline union in the manifest's type text, or an alias declared in the types file. */
export function literalsOf(type, typesText = "") {
  const inner = /^\w+<(\w+)>$/.exec(type);
  if (inner) type = inner[1];
  const fromText = (text) => [...text.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
  if (/["']/.test(type)) return fromText(type);
  const alias = new RegExp(`export type ${type.replace(/\W/g, "")}\\s*=\\s*([^;]+);`).exec(typesText);
  return alias && /["']/.test(alias[1]) ? fromText(alias[1]) : null;
}

/** Every problem with one component's entry; `ctx` is { manifest, catalog, storyId, typesText, hasDecisionsFile }. */
export function validateEntry(name, entry, ctx) {
  const errors = [];
  const fail = (msg) => errors.push(`${name}: ${msg}`);
  const props = new Map(ctx.manifest.props.map((p) => [p.name, p]));
  if (!ctx.catalog) return [`${name}: not in the component catalog`];
  if (entry.tier !== ctx.catalog.tier || entry.category !== ctx.catalog.category) fail(`tier or category differs from the catalog (${ctx.catalog.tier}, ${ctx.catalog.category})`);
  if (entry.storybook !== ctx.storyId) fail(`storybook id is ${entry.storybook}, the stories file says ${ctx.storyId}`);
  if (entry.figma?.set !== name || entry.figma?.spec !== `Spec: ${name}`) fail("figma.set or figma.spec does not name the component");
  if (!ctx.hasDecisionsFile) fail(`guidelines/figma/components/${name}.md is missing`);
  if (entry.variants > BUDGET && !entry.coverage?.exception) fail(`${entry.variants} variants is over the budget of ${BUDGET}; record the reason in coverage.exception`);
  const state = entry.status?.state;
  if (!["drawn", "reviewed", "approved"].includes(state)) fail(`status.state is ${state}; it must be drawn, reviewed or approved`);
  if ((state === "approved") !== Boolean(entry.status?.approved)) fail("status.approved is a date exactly when the state is approved");
  const mapped = new Set();
  const checkProp = (prop, value, where) => {
    if (prop === "children") {
      mapped.add("children");
      return;
    }
    const p = props.get(prop);
    if (!p) return fail(`${where}: "${prop}" is not a prop in the manifest`);
    mapped.add(prop);
    const lits = literalsOf(p.type, ctx.typesText);
    if (value === PROVIDED) {
      if (p.type === "boolean" || lits) fail(`${where}: ${prop} is ${p.type}; write its value, not ${PROVIDED}`);
    } else if (typeof value === "boolean") {
      if (!/\bboolean\b/.test(p.type)) fail(`${where}: ${prop} is ${p.type}, not boolean`);
    } else if (typeof value === "string") {
      if (!lits) fail(`${where}: ${prop} (${p.type}) has no literal values; write ${PROVIDED}`);
      else if (!lits.includes(value)) fail(`${where}: "${value}" is not a value of ${prop} (${lits.join(", ")})`);
    } else fail(`${where}: unsupported value ${JSON.stringify(value)}`);
  };
  const checkDefault = (propsObj, where) => {
    for (const [prop, value] of Object.entries(propsObj)) {
      const p = props.get(prop);
      if (!p || p.default == null || p.default === "None") continue;
      const def = unquote(p.default);
      if (String(value) !== def && value !== PROVIDED) fail(`${where}: the default maps ${prop} to ${value}, the code's default is ${def}`);
    }
  };
  for (const [fname, prop] of Object.entries(entry.properties ?? {})) {
    const where = `property ${fname}`;
    if (prop.kind === "variant") {
      const keys = Object.keys(prop.values ?? {});
      if (!keys.includes(prop.default)) fail(`${where}: default "${prop.default}" is not one of its values`);
      for (const [v, def] of Object.entries(prop.values ?? {})) for (const [cp, cv] of Object.entries(def.props ?? {})) checkProp(cp, cv, `${where}=${v}`);
      if (prop.values?.[prop.default]) checkDefault(prop.values[prop.default].props ?? {}, where);
      for (const [v, def] of Object.entries(prop.undrawn ?? {})) {
        if (keys.includes(v)) fail(`${where}: "${v}" is both drawn and undrawn`);
        if (!def.recipe) fail(`${where}: undrawn "${v}" has no recipe`);
        for (const [cp, cv] of Object.entries(def.props ?? {})) checkProp(cp, cv, `${where} undrawn ${v}`);
      }
      // an enumerated property maps every value to one prop: the drawn and undrawn values must be every value the type allows
      const defs = Object.values(prop.values ?? {});
      const codeProps = new Set(defs.flatMap((d) => Object.keys(d.props ?? {})));
      const simple = codeProps.size === 1 && defs.every((d) => Object.keys(d.props ?? {}).length === 1 && typeof Object.values(d.props)[0] === "string");
      if (simple) {
        const target = [...codeProps][0];
        const lits = props.has(target) ? literalsOf(props.get(target).type, ctx.typesText) : null;
        if (lits) {
          const covered = new Set([...defs.map((d) => d.props[target]), ...Object.values(prop.undrawn ?? {}).map((d) => d.props?.[target])]);
          const gone = lits.filter((l) => !covered.has(l));
          if (gone.length) fail(`${where}: values of ${target} neither drawn nor listed as undrawn: ${gone.join(", ")}`);
        }
      }
    } else if (prop.kind === "boolean") {
      if (typeof prop.default !== "boolean") fail(`${where}: default must be a boolean`);
      for (const [cp, cv] of Object.entries(prop.on?.props ?? {})) checkProp(cp, cv, where);
    } else if (prop.kind === "text") {
      if (!(prop.maps || prop.native || prop.derived)) fail(`${where}: a text property needs maps, native or derived`);
      if (prop.maps) checkProp(prop.maps, PROVIDED, where);
      if (prop.maps && prop.maps !== "children" && props.get(prop.maps) && props.get(prop.maps).type === "boolean") fail(`${where}: maps to a boolean`);
    } else if (prop.kind === "slot") {
      const parts = new Set((ctx.manifest.parts ?? []).map((p) => p.name));
      if (!parts.has(prop.maps)) fail(`${where}: "${prop.maps}" is not a part in the manifest (${[...parts].join(", ") || "none"})`);
    } else fail(`${where}: kind must be variant, boolean, text or slot`);
    for (const a of prop.also ?? []) {
      if (!props.has(a)) fail(`${where}: also "${a}" is not a prop in the manifest`);
      else mapped.add(a);
    }
  }
  if (Object.values(entry.properties ?? {}).some((p) => p.kind === "slot")) mapped.add("children");
  const notModelled = new Set(entry.notModelled ?? []);
  for (const n of notModelled) {
    if (!props.has(n)) fail(`notModelled "${n}" is not a prop in the manifest`);
    if (mapped.has(n)) fail(`"${n}" is both mapped and in notModelled`);
  }
  const uncovered = [...props.keys()].filter((p) => !mapped.has(p) && !notModelled.has(p));
  if (uncovered.length) fail(`props neither mapped nor in notModelled: ${uncovered.join(", ")}`);
  return errors;
}

/** The status table the map generates, between the markers in `components/README.md`. */
export function statusTable(map) {
  const rows = Object.entries(map.components)
    .sort(([an, a], [bn, b]) => ["atom", "molecule", "organism"].indexOf(a.tier) - ["atom", "molecule", "organism"].indexOf(b.tier) || an.localeCompare(bn))
    .map(([n, c]) => `| [${n}](./${n}.md) | ${c.tier} | ${c.category} | ${c.variants} | ${c.status.state} | ${c.status.reviewed ?? "not yet"} | ${c.status.approved ?? "not yet"} |`);
  return [`${START}`, "| Component | Tier | Category | Variants | State | Reviewed | Approved |", "|---|---|---|---|---|---|---|", ...rows, `${END}`].join("\n");
}

function storyIdOf(name) {
  let found = null;
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(dir, e.name));
      else if (e.name === `${name}.stories.tsx`) found = join(dir, e.name);
    }
  })(join(root, "packages", "components", "src"));
  return found && /^\s+id: "([^"]+)"/m.exec(readFileSync(found, "utf8"))?.[1];
}

function main() {
  const write = process.argv.includes("--write");
  const mapFile = join(root, "guidelines", "figma", "component-map.json");
  const mapText = readFileSync(mapFile, "utf8");
  const map = JSON.parse(mapText);
  const catalog = JSON.parse(readFileSync(join(root, "packages", "components", "src", "componentCatalog.json"), "utf8"));
  const manifestDir = join(root, "packages", "components", "dist", "manifest", "components");
  if (!existsSync(manifestDir)) {
    console.error("check-figma-map: build the components package first (`pnpm build`).");
    process.exit(2);
  }
  const errors = [];
  if (/figma\.com|node-id/i.test(mapText)) errors.push("the map holds a Figma address or node id; it must not");
  const local = join(root, ".local", "figma.json");
  if (existsSync(local)) {
    const key = JSON.parse(readFileSync(local, "utf8")).fileKey;
    if (key && mapText.includes(key)) errors.push("the map holds the Figma file key; it must not");
  }
  for (const [name, entry] of Object.entries(map.components)) {
    const manifestFile = join(manifestDir, `${name}.json`);
    if (!existsSync(manifestFile)) { errors.push(`${name}: no manifest entry`); continue; }
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    const dir = dirname(join(root, "packages", "components", manifest.source ?? ""));
    const typesFile = existsSync(dir) ? readdirSync(dir).find((f) => f.endsWith(".types.ts")) : null;
    const ownTypes = typesFile ? readFileSync(join(dir, typesFile), "utf8") : "";
    // a type imported from a sibling component (Spinner's `IconTone` is Icon's) is read from that component's types file
    const siblingTypes = [...ownTypes.matchAll(/from "\.\.\/(\w+)"/g)]
      .map((m) => join(dir, "..", m[1]))
      .filter((d) => existsSync(d))
      .map((d) => {
        const f = readdirSync(d).find((name) => name.endsWith(".types.ts"));
        return f ? readFileSync(join(d, f), "utf8") : "";
      })
      .join("\n");
    errors.push(
      ...validateEntry(name, entry, {
        manifest,
        catalog: catalog[name],
        storyId: storyIdOf(name),
        typesText: `${ownTypes}\n${siblingTypes}`,
        hasDecisionsFile: existsSync(join(root, "guidelines", "figma", "components", `${name}.md`)),
      }),
    );
  }
  const readme = join(root, "guidelines", "figma", "components", "README.md");
  const text = readFileSync(readme, "utf8");
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a < 0 || b < 0) errors.push("components/README.md has no status table markers");
  else {
    const fresh = text.slice(0, a) + statusTable(map) + text.slice(b + END.length);
    if (write) writeFileSync(readme, fresh);
    else if (fresh !== text) errors.push("the status table in components/README.md is out of date; run `pnpm check-figma-map --write`");
  }
  if (errors.length) {
    console.error(`check-figma-map: ${errors.length} problem${errors.length === 1 ? "" : "s"}:`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-figma-map: ok (${Object.keys(map.components).length} components)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
