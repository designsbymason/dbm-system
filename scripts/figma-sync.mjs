#!/usr/bin/env node
// Builds the Figma variable payloads from the built tokens (ADR-0233, guidelines/figma/01-plan.md §5).
//
// It reads packages/tokens/build/tokens.json (run `pnpm --filter @dbm-system/tokens build` first) and writes one
// self-contained JavaScript body per chunk into .local/figma/payloads/. Each body is the `code` of one Figma MCP
// `use_figma` call. A payload creates or updates by name, so running it again changes nothing that is already right.
// The `9N-verify-*.js` payloads, one per collection, compare what is in Figma with the tokens and returns only the differences.
//
// Nothing here talks to Figma and nothing here is published; the output folder is gitignored (.local/).
//
// Usage: node scripts/figma-sync.mjs

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".local", "figma", "payloads");
const { tokens, themes } = JSON.parse(readFileSync(join(root, "packages/tokens/build/tokens.json"), "utf8"));

const PREFIX = "--dbm-";
const REM = 16;
/** Viewport widths for the three Viewport modes: the width a design is drawn at, not a token. */
const VIEWPORTS = { mobile: 375, tablet: 768, desktop: 1280 };
const MAX_CHUNK = 36000;
const SCALE_STEP = /^(.+)-(xs|sm|md|lg|xl|2xl|3xl)$/;

const strip = (css) => css.slice(PREFIX.length);

/** The Figma name of a token: its group, then the rest of the CSS name, a colour as hue/step, a size step as its own segment. */
function figmaName(token) {
  const bare = strip(token.name);
  const rest = bare.slice(token.group.length + 1);
  if (token.layer === "primitive" && token.group === "color") {
    const [hue, ...step] = rest.split("-");
    return `color/${hue}/${step.join("-")}`;
  }
  const scaled = token.layer === "component" ? SCALE_STEP.exec(rest) : null;
  return scaled ? `${token.group}/${scaled[1]}/${scaled[2]}` : `${token.group}/${rest}`;
}

function toPixels(value) {
  const m = /^(-?[\d.]+)(rem|px)$/.exec(String(value));
  if (!m) return null;
  return Math.round(Number(m[1]) * (m[2] === "rem" ? REM : 1) * 1000) / 1000;
}

/** Evaluates `clamp(min, a + b vw, max)` or a plain length at one viewport width, in pixels. */
function fluidPixels(value, viewport) {
  const m = /^clamp\(\s*([\d.]+)rem,\s*([\d.]+)rem \+ ([\d.]+)vw,\s*([\d.]+)rem\)$/.exec(value);
  if (!m) return toPixels(value);
  const [min, base, slope, max] = [m[1] * REM, m[2] * REM, Number(m[3]), m[4] * REM];
  const px = base + (slope * viewport) / 100;
  return Math.round(Math.min(max, Math.max(min, px)) * 100) / 100;
}

const PRIMITIVE_SCOPES = {
  color: [],
  space: ["GAP", "WIDTH_HEIGHT"],
  radius: ["CORNER_RADIUS"],
  "border-width": ["STROKE_FLOAT"],
  opacity: ["OPACITY"],
  "icon-size": ["WIDTH_HEIGHT"],
  breakpoint: ["WIDTH_HEIGHT"],
  "font-family": ["FONT_FAMILY"],
  "font-weight": ["FONT_WEIGHT"],
  "letter-spacing": [],
  "line-height": [],
  "z-index": [],
};
const SEMANTIC_SCOPES = {
  bg: ["FRAME_FILL", "SHAPE_FILL"],
  text: ["TEXT_FILL"],
  border: ["STROKE_COLOR"],
  icon: ["SHAPE_FILL", "STROKE_COLOR"],
};

const skipped = [];
const collections = {
  Primitives: { modes: ["Value"], items: [] },
  Viewport: { modes: Object.keys(VIEWPORTS), items: [] },
  Component: { modes: ["Value"], items: [] },
  Semantic: { modes: themes, items: [] },
};
const seen = new Set();
const add = (collection, item) => {
  const key = `${collection}:${item.n}`;
  if (seen.has(key)) throw new Error(`Duplicate Figma name ${key}`);
  seen.add(key);
  collections[collection].items.push(item);
};
const base = (token, type, scopes) => ({
  n: figmaName(token),
  t: type,
  s: scopes,
  ...(token.purpose ? { d: token.purpose } : {}),
});

for (const token of tokens) {
  if (token.layer === "semantic") {
    add("Semantic", {
      ...base(token, "COLOR", SEMANTIC_SCOPES[token.group]),
      // `a` lists the primitive each theme points at, in the order of the modes; `v` is kept for the check only.
      a: themes.map((mode) => figmaName(tokens.find((p) => p.name === token.aliases[mode]))),
      v: token.values,
    });
  } else if (token.layer === "component") {
    if (token.type === "number") {
      add("Component", { ...base(token, "FLOAT", []), v: { Value: Number(token.value) } });
    } else {
      const px = toPixels(token.value);
      if (px === null) skipped.push(`${figmaName(token)} = ${token.value}`);
      else add("Component", { ...base(token, "FLOAT", ["WIDTH_HEIGHT"]), v: { Value: px } });
    }
  } else if (token.group === "shadow" || token.group === "motion") {
    // Shadows become effect styles (Phase 2); motion is documented, not a variable (ADR-0236).
  } else if (token.group === "font-size") {
    add("Viewport", {
      ...base(token, "FLOAT", ["FONT_SIZE"]),
      v: Object.fromEntries(Object.entries(VIEWPORTS).map(([mode, width]) => [mode, fluidPixels(token.value, width)])),
    });
  } else {
    const scopes = PRIMITIVE_SCOPES[token.group];
    if (!scopes) throw new Error(`No scopes for primitive group ${token.group}`);
    let item;
    if (token.type === "color") item = { ...base(token, "COLOR", scopes), v: { Value: token.value } };
    else if (token.type === "fontFamily") {
      const first = token.value.split(",")[0].trim().replace(/['"]/g, "");
      item = { ...base(token, "STRING", scopes), v: { Value: first } };
    } else if (token.type === "dimension" && token.group === "letter-spacing") {
      item = { ...base(token, "FLOAT", scopes), v: { Value: Number.parseFloat(token.value) } };
    } else if (token.type === "dimension") {
      item = { ...base(token, "FLOAT", scopes), v: { Value: toPixels(token.value) } };
    } else item = { ...base(token, "FLOAT", scopes), v: { Value: Number(token.value) } };
    add("Primitives", item);
  }
}

// ---- Payload text -------------------------------------------------------------------------------------------------

const RUNTIME = `
const hex = (h) => { const n = parseInt(h.slice(1, 7), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
const all = await figma.variables.getLocalVariablesAsync();
const colls = await figma.variables.getLocalVariableCollectionsAsync();
let col = colls.find((c) => c.name === D.collection) ?? figma.variables.createVariableCollection(D.collection);
if (!col.modes.some((m) => m.name === D.modes[0])) col.renameMode(col.modes[0].modeId, D.modes[0]);
for (const m of D.modes) if (!col.modes.some((x) => x.name === m)) col.addMode(m);
const modeId = Object.fromEntries(col.modes.map((m) => [m.name, m.modeId]));
const mine = new Map(all.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
const targets = new Map();
if (D.aliasCollection) {
  const pc = colls.find((c) => c.name === D.aliasCollection);
  for (const v of all) if (v.variableCollectionId === pc.id) targets.set(v.name, v);
}
let created = 0, updated = 0;
for (const e of D.items) {
  let v = mine.get(e.n);
  if (!v) { v = figma.variables.createVariable(e.n, col, e.t); mine.set(e.n, v); created++; }
  else { if (v.resolvedType !== e.t) throw new Error("Type changed for " + e.n); updated++; }
  v.scopes = e.s;
  v.setVariableCodeSyntax("WEB", "var(--dbm-" + e.n.replace(/\\//g, "-") + ")");
  v.description = e.d || "";
  if (e.a) {
    for (const [i, target] of e.a.entries()) {
      const mode = D.modes[i];
      const tv = targets.get(target);
      if (!tv) throw new Error("Missing alias target " + target + " for " + e.n);
      v.setValueForMode(modeId[mode], { type: "VARIABLE_ALIAS", id: tv.id });
    }
  } else {
    for (const [mode, val] of Object.entries(e.v)) v.setValueForMode(modeId[mode], e.t === "COLOR" ? hex(val) : val);
  }
}
return { collection: col.name, collectionId: col.id, modes: modeId, created, updated, total: col.variableIds.length };
`;

function chunks(items) {
  const out = [];
  let cur = [];
  let size = 0;
  for (const item of items) {
    const len = JSON.stringify(item).length;
    if (size + len > MAX_CHUNK && cur.length) {
      out.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(item);
    size += len;
  }
  if (cur.length) out.push(cur);
  return out;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
let step = 1;
const written = [];
for (const name of ["Primitives", "Viewport", "Component", "Semantic"]) {
  const { modes, items } = collections[name];
  chunks(items).forEach((part, i, all) => {
    const D = { collection: name, modes, items: part.map(({ v, ...rest }) => (rest.a ? rest : { v, ...rest })), ...(name === "Semantic" ? { aliasCollection: "Primitives" } : {}) };
    const file = `${String(step++).padStart(2, "0")}-${name.toLowerCase()}-${i + 1}of${all.length}.js`;
    const body = `const D = ${JSON.stringify(D)};\n${RUNTIME}`;
    writeFileSync(join(outDir, file), body);
    written.push(`${file} (${part.length} variables, ${body.length} characters)`);
  });
}

// The check compares every variable in Figma with the tokens: its type, its value in each mode (an alias is followed to
// its primitive), its code syntax, and that no variable is left on the default "all scopes". Figma stores a number as a
// 32-bit float, so a number matches to a millionth.
const expected = Object.fromEntries(
  Object.entries(collections).map(([name, { modes, items }]) => [
    name,
    { m: modes, x: Object.fromEntries(items.map((e) => [e.n, modes.map((mode) => e.v[mode])])) },
  ]),
);
const verify = `const X = ${JSON.stringify(expected)};
const all = await figma.variables.getLocalVariablesAsync();
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const byId = new Map(all.map((v) => [v.id, v]));
const hexOf = (c) => "#" + [c.r, c.g, c.b].map((n) => Math.round(n * 255).toString(16).padStart(2, "0")).join("");
const finalValue = (v, modeId) => {
  let val = v.valuesByMode[modeId];
  while (val && val.type === "VARIABLE_ALIAS") { const t = byId.get(val.id); val = t.valuesByMode[Object.keys(t.valuesByMode)[0]]; }
  return val;
};
const report = {};
for (const [name, spec] of Object.entries(X)) {
  const col = colls.find((c) => c.name === name);
  const out = { expected: Object.keys(spec.x).length, found: col ? col.variableIds.length : 0, modes: col ? col.modes.map((m) => m.name).join(",") : "missing", bad: [] };
  if (col) {
    out.modesOk = out.modes === spec.m.join(",");
    const mine = new Map(all.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
    for (const [n, vals] of Object.entries(spec.x)) {
      const v = mine.get(n);
      if (!v) { out.bad.push(n + ": missing"); continue; }
      if (v.codeSyntax.WEB !== "var(--dbm-" + n.replace(/\\//g, "-") + ")") out.bad.push(n + ": code syntax");
      if (v.scopes.includes("ALL_SCOPES")) out.bad.push(n + ": all scopes");
      spec.m.forEach((mode, i) => {
        const got = finalValue(v, col.modes.find((m) => m.name === mode).modeId);
        const want = vals[i];
        const same = v.resolvedType === "COLOR" ? hexOf(got) === want.toLowerCase() : typeof want === "number" ? Math.abs(got - want) <= Math.abs(want) * 1e-6 + 1e-9 : got === want;
        if (!same) out.bad.push(n + " [" + mode + "]: " + JSON.stringify(got) + " != " + want);
      });
    }
  }
  out.badCount = out.bad.length;
  out.bad = out.bad.slice(0, 12);
  report[name] = out;
}
return report;
`;
writeFileSync(join(outDir, "90-verify.js"), verify);
written.push(`90-verify.js (${verify.length} characters)`);

writeFileSync(
  join(root, ".local", "figma", "expected.json"),
  JSON.stringify(
    {
      counts: Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, { modes: v.modes, variables: v.items.length }])),
      skipped,
    },
    null,
    2,
  ),
);

console.log(written.join("\n"));
for (const [k, v] of Object.entries(collections)) console.log(`${k}: ${v.items.length} variables, modes ${v.modes.join(", ")}`);
console.log(`Not representable as a Figma number (font-relative or percentage): ${skipped.length}`);
for (const s of skipped) console.log(`  ${s}`);
