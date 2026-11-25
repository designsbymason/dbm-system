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

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
/** A smaller chunk for the icons, whose path data is long, so each payload stays easy to send and to retry. */
const ICON_CHUNK = 12000;
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
    } else if (token.group === "opacity") {
      // Figma reads an opacity variable as a percentage, so 0.4 is held as 40 (a bound opacity of 0.4 would draw at 0.4%).
      item = { ...base(token, "FLOAT", scopes), v: { Value: Math.round(Number(token.value) * 10000) / 100 } };
    } else item = { ...base(token, "FLOAT", scopes), v: { Value: Number(token.value) } };
    add("Primitives", item);
  }
}

// ---- Order ----------------------------------------------------------------------------------------------------------
// Figma lists a collection's variables in the order they were created and has no call to move one, so the order is
// decided here and the payloads create in it: scales climb (50 to 950, xs to 3xl), related tokens sit together.

const SIZE_STEPS = ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"];
const GROUPS = ["color", "space", "radius", "border-width", "opacity", "icon-size", "breakpoint", "font-family", "font-weight", "line-height", "letter-spacing", "z-index"];
const HUES = ["neutral", "gray", "purple", "emerald", "red", "amber", "yellow", "green", "blue"];
const SPECIAL = {
  space: ["0", "px"],
  radius: ["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"],
  "font-family": ["primary", "secondary", "mono"],
  "font-weight": ["regular", "medium", "semibold", "bold"],
  "line-height": ["tight", "snug", "normal", "relaxed"],
  "letter-spacing": ["tight", "normal", "wide"],
  "z-index": ["base", "dropdown", "sticky", "fixed", "overlay", "modal", "popover", "toast", "tooltip"],
  "color/neutral": ["white", "black"],
};
const TONES = ["brand", "neutral", "info", "success", "warning", "danger", "highlight"];
const VARIANTS = ["base", "hover", "subtle", "subtle-hover", "strong", "on"];
const SEMANTIC = {
  bg: { lead: ["surface", "canvas", "scrim", "overlay", "track", "track-strong", "skeleton"], trail: ["code", "code-block", "code-highlight"] },
  text: { lead: ["primary", "secondary", "tertiary", "disabled", "link", "white"], trail: [] },
  border: { lead: ["default", "strong", "focus", "white", "black"], trail: ["code"] },
  icon: { lead: ["default", "secondary", "disabled", "white"], trail: [] },
};

const rankIn = (list, key) => (list.includes(key) ? list.indexOf(key) : list.length);
const numberOr = (key) => (/^\d+$/.test(key) ? Number(key) : Number.POSITIVE_INFINITY);

/** A sortable key (an array compared element by element) for one variable's Figma name. */
function sortKey(collection, name) {
  const [group, ...parts] = name.split("/");
  const rest = parts.join("/");
  if (collection === "Primitives") {
    const g = rankIn(GROUPS, group);
    if (group === "color") {
      const [hue, step] = parts;
      const special = SPECIAL[`color/${hue}`];
      return [g, rankIn(HUES, hue), special ? rankIn(special, step) : numberOr(step)];
    }
    if (group === "icon-size" || group === "breakpoint") return [g, rankIn(SIZE_STEPS, rest)];
    if (group === "border-width" || group === "opacity") return [g, numberOr(rest)];
    if (group === "space") return [g, SPECIAL.space.includes(rest) ? rankIn(SPECIAL.space, rest) : 2 + numberOr(rest)];
    return [g, rankIn(SPECIAL[group] ?? [], rest)];
  }
  if (collection === "Viewport") return [rankIn(SIZE_STEPS, rest)];
  if (collection === "Component") {
    const [token, step] = parts;
    return [group, token, rankIn(SIZE_STEPS, step ?? "")];
  }
  // Semantic: a few general tokens first, then each tone with its variants, then the specialised ones.
  const spec = SEMANTIC[group];
  const g = ["bg", "text", "border", "icon"].indexOf(group);
  if (spec.lead.includes(rest)) return [g, 0, spec.lead.indexOf(rest), 0];
  if (spec.trail.includes(rest) || rest.startsWith("syntax-")) return [g, 3, spec.trail.indexOf(rest), rest];
  const on = /^on-(.+)$/.exec(rest);
  const tone = on ? on[1] : TONES.find((t) => rest === t || rest.startsWith(`${t}-`));
  if (!tone) throw new Error(`Semantic token without a place in the order: ${name}`);
  const variant = on ? "on" : rest === tone ? "base" : rest.slice(tone.length + 1);
  return [g, 1, TONES.indexOf(tone), rankIn(VARIANTS, variant)];
}

function compare(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    if (typeof a[i] === "number" && typeof b[i] === "number") return a[i] - b[i];
    return String(a[i]).localeCompare(String(b[i]), "en", { numeric: true });
  }
  return 0;
}

for (const [name, collection] of Object.entries(collections)) {
  collection.items.sort((x, y) => compare(sortKey(name, x.n), sortKey(name, y.n)));
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

// ---- Styles (Phase 2) -----------------------------------------------------------------------------------------------
// Text styles bind their size to the Viewport font-size variable and their family and weight to the Primitives ones, so a
// frame's Viewport mode resizes the type. The roles below are a design decision (guidelines/figma/01-plan.md §5): the
// tokens hold the sizes, families, weights and ratios, not which role uses which. Line height and letter spacing are set
// as the token ratios in percent, because Figma binds those only to pixel variables.
const ROLES = [
  { role: "Display", family: "secondary", weight: "medium", lh: "tight", ls: "tight", sizes: ["6xl", "5xl", "4xl", "3xl"], note: "Editorial display headings in Lora" },
  { role: "Heading", family: "primary", weight: "bold", lh: "snug", ls: "normal", sizes: ["2xl", "xl", "lg", "md", "base", "sm"], note: "Headings in Nunito" },
  { role: "Body", family: "primary", weight: "regular", lh: "normal", ls: "normal", sizes: ["lg", "md", "base", "sm", "xs"], note: "Running text in Nunito" },
  { role: "Label", family: "primary", weight: "semibold", lh: "snug", ls: "normal", sizes: ["md", "base", "sm", "xs"], note: "Labels and controls in Nunito" },
  { role: "Control", group: "Components", family: "primary", weight: "semibold", lh: "tight", ls: "normal", sizes: ["xs", "sm", "base", "md", "lg"], note: "Buttons and other controls in Nunito, with the tight line height the components use" },
  { role: "Field", group: "Components", family: "primary", weight: "regular", lh: "tight", ls: "normal", sizes: ["xs", "sm", "base", "md", "lg"], note: "The text inside a text field in Nunito, regular weight with the tight line height the components use" },
  { role: "Textarea", group: "Components", family: "primary", weight: "regular", lh: "auto", ls: "normal", sizes: ["xs", "sm", "base", "md", "lg"], note: "The text inside a multi-line field in Nunito, regular weight with the browser's own normal line height, which a textarea falls back to when no line height is set" },
  { role: "FieldLabel", group: "Components", family: "primary", weight: "medium", lh: "normal", ls: "normal", sizes: ["xs", "sm", "base", "md", "lg"], note: "The label above a form field in Nunito, medium weight with the normal line height the component uses" },
  { role: "IconButton", group: "Components", family: "primary", weight: "medium", lh: "tight", ls: "normal", sizes: ["xs", "sm"], note: "The caption under an icon button's icon in Nunito, medium weight with the tight line height" },
  { role: "IconButtonPressed", group: "Components", family: "primary", weight: "bold", lh: "tight", ls: "normal", sizes: ["xs", "sm"], note: "The caption under a pressed icon button's icon in Nunito, bold, so the same box holds it" },
  { role: "Overline", family: "primary", weight: "semibold", lh: "snug", ls: "wide", sizes: ["sm", "xs"], upper: true, note: "Small upper-case captions and table headings in Nunito" },
];
const FAMILY_NAME = { primary: "Nunito", secondary: "Lora" };
const WEIGHT_STYLE = { regular: "Regular", medium: "Medium", semibold: "SemiBold", bold: "Bold" };
const ratio = (group, name) => Number(tokens.find((t) => t.name === `${PREFIX}${group}-${name}`).value);
const textStyles = ROLES.flatMap((r) =>
  r.sizes.map((size) => ({
    n: `${r.group ? `${r.group}/` : ""}${r.role}/${size}`,
    fam: FAMILY_NAME[r.family],
    famVar: `font-family/${r.family}`,
    style: WEIGHT_STYLE[r.weight],
    weightVar: `font-weight/${r.weight}`,
    sizeVar: `font-size/${size}`,
    lh: r.lh === "auto" ? "AUTO" : Math.round(ratio("line-height", r.lh) * 100),
    ls: Math.round(Number.parseFloat(tokens.find((t) => t.name === `${PREFIX}letter-spacing-${r.ls}`).value) * 10000) / 100,
    upper: Boolean(r.upper),
    d: `${r.note}. Size ${size}, line height ${r.lh}.`,
  })),
);
function parseShadow(css) {
  return css.split(/,\s*(?=\d+px)/).map((layer) => {
    const m = /^(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(layer.trim());
    if (!m) throw new Error(`Cannot read shadow layer: ${layer}`);
    return { x: Number(m[1]), y: Number(m[2]), blur: Number(m[3]), r: m[4] / 255, g: m[5] / 255, b: m[6] / 255, a: Number(m[7]) };
  });
}
const effectStyles = ["light", "dark"].flatMap((theme) =>
  ["xs", "sm", "md", "lg", "xl"].map((size) => ({
    n: `Elevation/${theme}/${size}`,
    layers: parseShadow(tokens.find((t) => t.name === `${PREFIX}shadow-${theme}-${size}`).value),
    d: `The shadow-${theme}-${size} token, for a surface in ${theme} mode.`,
  })),
);
const gridStyles = [
  { n: "Grid/mobile", count: 4, gutter: 16, offset: 16, d: "Four columns for a phone, 16 px gutters and margins." },
  { n: "Grid/tablet", count: 8, gutter: 24, offset: 32, d: "Eight columns for a tablet, 24 px gutters, 32 px margins." },
  { n: "Grid/desktop", count: 12, gutter: 24, offset: 48, d: "Twelve columns for a desktop, 24 px gutters, 48 px margins." },
];
const stylesPayload = `const D = ${JSON.stringify({ text: textStyles, effect: effectStyles, grid: gridStyles })};
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const V = (c, n) => vars.find((v) => v.variableCollectionId === colls.find((x) => x.name === c).id && v.name === n);
for (const [family, style] of new Set(D.text.map((t) => t.fam + "|" + t.style).map((k) => k.split("|")))) await figma.loadFontAsync({ family, style });
const desktop = colls.find((c) => c.name === "Viewport").modes.find((m) => m.name === "desktop").modeId;
const textById = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
const effectById = new Map((await figma.getLocalEffectStylesAsync()).map((s) => [s.name, s]));
const gridById = new Map((await figma.getLocalGridStylesAsync()).map((s) => [s.name, s]));
const out = { text: 0, effect: 0, grid: 0, boundFields: {}, errors: [] };
for (const t of D.text) {
  const s = textById.get(t.n) ?? figma.createTextStyle();
  s.name = t.n; s.description = t.d;
  s.fontName = { family: t.fam, style: t.style };
  s.fontSize = V("Viewport", t.sizeVar).valuesByMode[desktop];
  s.lineHeight = t.lh === "AUTO" ? { unit: "AUTO" } : { unit: "PERCENT", value: t.lh };
  s.letterSpacing = { unit: "PERCENT", value: t.ls };
  s.textCase = t.upper ? "UPPER" : "ORIGINAL";
  for (const [field, name, coll] of [["fontSize", t.sizeVar, "Viewport"], ["fontFamily", t.famVar, "Primitives"], ["fontWeight", t.weightVar, "Primitives"]]) {
    try { s.setBoundVariable(field, V(coll, name)); out.boundFields[field] = (out.boundFields[field] || 0) + 1; } catch (e) { if (out.errors.length < 4) out.errors.push(t.n + " " + field + ": " + String(e.message || e).slice(0, 120)); }
  }
  out.text++;
}
for (const e of D.effect) {
  const s = effectById.get(e.n) ?? figma.createEffectStyle();
  s.name = e.n; s.description = e.d;
  s.effects = e.layers.map((l) => ({ type: "DROP_SHADOW", color: { r: l.r, g: l.g, b: l.b, a: l.a }, offset: { x: l.x, y: l.y }, radius: l.blur, spread: 0, visible: true, blendMode: "NORMAL" }));
  out.effect++;
}
for (const g of D.grid) {
  const s = gridById.get(g.n) ?? figma.createGridStyle();
  s.name = g.n; s.description = g.d;
  s.layoutGrids = [{ pattern: "COLUMNS", alignment: "STRETCH", gutterSize: g.gutter, count: g.count, offset: g.offset, visible: true }];
  out.grid++;
}
return out;
`;
writeFileSync(join(outDir, "06-styles.js"), stylesPayload);
written.push(`06-styles.js (${textStyles.length} text, ${effectStyles.length} effect, ${gridStyles.length} grid styles, ${stylesPayload.length} characters)`);

// ---- Icons (Phase 3) -----------------------------------------------------------------------------------------------
// The icons the component source imports from `@dbm-system/icons`, drawn from the installed Phosphor package (MIT) in three
// weights (bold, the library's default, regular and fill). Each becomes a component set `Icon/<Name>` with a `weight`
// property, its shape filled with the `icon/default` variable and scaling with the instance. Only the used subset is drawn.
const ICON_GROUPS = {
  "Arrows and carets": ["ArrowBendDownLeft", "ArrowClockwise", "ArrowCounterClockwise", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowSquareOut", "ArrowUp", "CaretDoubleLeft", "CaretDoubleRight", "CaretDown", "CaretLeft", "CaretRight", "CaretUpDown", "CaretUp"],
  "Status and feedback": ["CheckCircle", "Check", "Circle", "Info", "Warning", "WarningCircle", "WarningOctagon", "TrendDown", "TrendUp", "Star"],
  Actions: ["Copy", "DotsThree", "Eye", "EyeSlash", "Eyedropper", "FlipHorizontal", "MagnifyingGlass", "MagnifyingGlassMinus", "MagnifyingGlassPlus", "Minus", "PencilSimple", "Plus", "PushPin", "Play", "Pause", "UploadSimple", "X", "CornersIn", "CornersOut"],
  "Objects and layout": ["CalendarBlank", "Clock", "Columns", "File", "FileArrowUp", "Image", "ImageBroken", "List", "ListChecks", "Note", "SidebarSimple", "Tray", "User", "Users"],
};
function usedIcons() {
  const found = new Set();
  const skip = /\.(stories|test|snippets|types)\.|StoryKit|\/(stories|guides|foundations)\//;
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, e.name);
      if (e.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(e.name) && !skip.test(path)) {
        const text = readFileSync(path, "utf8");
        for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@dbm-system\/icons"/g))
          for (const n of m[1].split(",")) {
            const name = n.trim().split(/\s+as\s+/)[0];
            if (/Icon$/.test(name)) found.add(name.slice(0, -4));
          }
      }
    }
  })(join(root, "packages/components/src"));
  return [...found].sort();
}
const iconDir = join(root, "packages/icons/node_modules/@phosphor-icons/react/dist/defs");
function iconShapes(name) {
  const text = readFileSync(join(iconDir, `${name}.es.js`), "utf8");
  const out = {};
  for (const weight of ["bold", "regular", "fill"]) {
    const block = new RegExp(`"${weight}",([\\s\\S]*?)\\n  \\]`).exec(text);
    if (!block) throw new Error(`${name}: no ${weight} weight`);
    out[weight] = [...block[1].matchAll(/createElement\("path", \{ d: "([^"]+)"\s*\}/g)].map((m) => m[1]);
    if (!out[weight].length) throw new Error(`${name}: no path in ${weight}`);
  }
  return out;
}
const used = usedIcons();
const grouped = Object.values(ICON_GROUPS).flat();
const ungrouped = used.filter((n) => !grouped.includes(n));
const missing = grouped.filter((n) => !used.includes(n));
if (ungrouped.length || missing.length) throw new Error(`Icon groups are out of step with the source. Add a group for: ${ungrouped.join(", ") || "none"}; no longer used: ${missing.join(", ") || "none"}`);
const iconItems = Object.entries(ICON_GROUPS).flatMap(([group, names]) => names.map((n) => ({ n, g: group, w: iconShapes(n) })));
{
  let part = [], size = 0, index = 1;
  const flush = () => {
    if (!part.length) return;
    const code = `const D = ${JSON.stringify(part)};
const page = figma.root.children.find((p) => p.name.replace(/^[^\\p{L}\\p{N}]+/u, "") === "Icons");
await figma.setCurrentPageAsync(page);
const sem = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === "Semantic");
const iconDefault = (await figma.variables.getLocalVariablesAsync()).find((v) => v.variableCollectionId === sem.id && v.name === "icon/default");
let maxX = 0;
for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
const existing = new Set(page.children.filter((c) => c.type === "COMPONENT_SET").map((c) => c.name));
const made = [];
let x = maxX + 400, y = 0;
for (const icon of D) {
  if (existing.has("Icon/" + icon.n)) continue;
  const variants = [];
  for (const weight of ["bold", "regular", "fill"]) {
    const c = figma.createComponent();
    c.name = "weight=" + weight;
    c.resize(24, 24);
    c.fills = [];
    c.clipsContent = false;
    const svg = '<svg width="24" height="24" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">' + icon.w[weight].map((d) => '<path d="' + d + '" fill="#000"/>').join("") + "</svg>";
    const frame = figma.createNodeFromSvg(svg);
    for (const v of [...frame.children]) {
      if ("fills" in v) v.fills = [figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", iconDefault)];
      if ("constraints" in v) v.constraints = { horizontal: "SCALE", vertical: "SCALE" };
      c.appendChild(v);
    }
    frame.remove();
    page.appendChild(c);
    variants.push(c);
  }
  const set = figma.combineAsVariants(variants, page);
  set.name = "Icon/" + icon.n;
  set.description = "Phosphor icon " + icon.n + ", " + icon.g + ". Weight: bold (the library default), regular or fill.";
  set.layoutMode = "HORIZONTAL"; set.itemSpacing = 16;
  for (const k of ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"]) set[k] = 8;
  set.primaryAxisSizingMode = "AUTO"; set.counterAxisSizingMode = "AUTO";
  set.x = x; set.y = y; y += 120;
  made.push([set.id, icon.n]);
}
return { made: made.length, ids: made };
`;
    writeFileSync(join(outDir, `07-icons-${index}.js`), code);
    written.push(`07-icons-${index}.js (${part.length} icons, ${code.length} characters)`);
    index++; part = []; size = 0;
  };
  for (const item of iconItems) {
    const len = JSON.stringify(item).length;
    if (size + len > ICON_CHUNK && part.length) flush();
    part.push(item); size += len;
  }
  flush();
}
// `tone` variant on every icon set (ADR-0238): each icon set also has one variant per icon tone, so a component can set an icon's
// colour as a variant property, and the colour survives swapping the icon. Run after the 07 payloads; it skips a set that already has
// its tones. START and END pick which sets (sorted by name) a call handles, to keep each call short.
const ICON_TONES = ["default", "secondary", "disabled", "brand", "danger", "warning", "success", "info", "highlight", "on-brand", "on-danger", "on-warning", "on-success", "on-info", "on-highlight", "white"];
writeFileSync(
  join(outDir, "08-icon-tones.js"),
  `const START = 0, END = 20;
const TONES = ${JSON.stringify(ICON_TONES)};
const page = figma.root.children.find((p) => p.name.replace(/^[^\\p{L}\\p{N}]+/u, "") === "Icons");
await figma.setCurrentPageAsync(page);
const sem = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === "Semantic");
const vars = await figma.variables.getLocalVariablesAsync();
const V = (n) => vars.find((v) => v.variableCollectionId === sem.id && v.name === n);
const paint = (t) => figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V("icon/" + t));
const all = page.findAllWithCriteria({ types: ["COMPONENT_SET"] }).filter((s) => s.name.startsWith("Icon/")).sort((a, b) => a.name.localeCompare(b.name));
let sets = 0, variants = 0;
for (const set of all.slice(START, END)) {
  if (set.children.length >= 3 * TONES.length) continue;
  for (const b of set.children.filter((c) => /^weight=\\w+$/.test(c.name))) b.name = b.name + ", tone=default";
  const have = new Set(set.children.map((c) => c.name));
  for (const b of set.children.filter((c) => /, tone=default$/.test(c.name))) for (const t of TONES.slice(1)) {
    const name = b.name.replace("tone=default", "tone=" + t);
    if (have.has(name)) continue;
    const c = b.clone(); c.name = name;
    for (const vec of c.findAll((x) => x.type === "VECTOR")) vec.fills = [paint(t)];
    set.appendChild(c); variants++;
  }
  const ORDER = (n) => { const o = Object.fromEntries(n.split(", ").map((p) => p.split("="))); return ["bold", "regular", "fill"].indexOf(o.weight) * 100 + TONES.indexOf(o.tone); };
  [...set.children].sort((a, b) => ORDER(a.name) - ORDER(b.name)).forEach((c, i) => set.insertChild(i, c));
  set.layoutMode = "HORIZONTAL"; set.layoutWrap = "WRAP"; set.itemSpacing = 16; set.counterAxisSpacing = 16;
  set.primaryAxisSizingMode = "FIXED"; set.resize(16 * 40 + 8, 100); set.counterAxisSizingMode = "AUTO";
  sets++;
}
return { sets, variants, totalSets: all.length };
`,
);
written.push("08-icon-tones.js (the tone variants; set START and END per call)");

writeFileSync(join(root, ".local", "figma", "icons.json"), JSON.stringify({ groups: ICON_GROUPS, count: iconItems.length }, null, 2));

// ---- The Components page (index of what is drawn and what is not) ------------------------------------------------------
// Generated from the component catalog, so a component that is added or removed in code appears here or fails this script;
// nothing is typed by hand. Which components are drawn is read from the Figma file when the payload runs: a component is drawn
// when a category page ("↳ ...") holds a spec frame instance named "Spec: <Name>", and that instance is where its index row links.
const catalog = JSON.parse(readFileSync(join(root, "packages/components/src/componentCatalog.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "packages/components/dist/manifest.json"), "utf8"));
const NOT_DRAWN = {
  AppShell: ["Template", "Templates are not drawn."],
  PageShell: ["Template", "Templates are not drawn."],
  ClientOnly: ["Utility", "No interface: it only controls where a component renders."],
  DirectionProvider: ["Utility", "No interface: it sets the text direction for a subtree."],
  FocusTrap: ["Utility", "No interface: it keeps keyboard focus inside a region."],
  Portal: ["Utility", "No interface: it renders content elsewhere in the page."],
  ThemeProvider: ["Utility", "No interface: the theme is a variable mode in Figma."],
  VisuallyHidden: ["Utility", "No interface: it hides content visually and keeps it for assistive technology."],
  Box: ["Layout primitive", "Auto layout does this in Figma."],
  Stack: ["Layout primitive", "Auto layout does this in Figma."],
  Grid: ["Layout primitive", "Auto layout and the grid styles do this in Figma."],
  GridItem: ["Layout primitive", "Auto layout does this in Figma."],
  Center: ["Layout primitive", "Auto layout alignment does this in Figma."],
  Container: ["Layout primitive", "A frame with a maximum width does this in Figma."],
  Bleed: ["Layout primitive", "A negative margin has no Figma equivalent."],
  Affix: ["Layout primitive", "Absolute positioning does this in Figma."],
  AspectRatio: ["Layout primitive", "Aspect-ratio lock does this in Figma."],
  Spacer: ["Layout primitive", "Auto layout spacing does this in Figma."],
  Collapse: ["Behaviour", "It animates a height change and has no visual of its own."],
};
const gone = Object.keys(NOT_DRAWN).filter((n) => !(n in catalog));
if (gone.length) throw new Error(`NOT_DRAWN names components that no longer exist: ${gone.join(", ")}`);
/** The components built in Figma so far; add a name here when its component set and spec frame are built. */
// A component's Storybook address is its stories file's own `id` (`atoms-inputs-button`), so a link never depends on a naming guess.
const storyFiles = new Map();
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(dir, e.name));
    else if (e.name.endsWith(".stories.tsx") && !e.name.includes(".checks.")) storyFiles.set(e.name.replace(".stories.tsx", ""), join(dir, e.name));
  }
})(join(root, "packages", "components", "src"));
const storyId = (name) => {
  const file = storyFiles.get(name);
  const id = file && /^\s+id: "([^"]+)"/m.exec(readFileSync(file, "utf8"))?.[1];
  if (!id) throw new Error(`no Storybook id found for ${name}`);
  return id;
};
const tiers = { atom: [], molecule: [], organism: [] };
for (const [name, { tier, category }] of Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b))) {
  if (name in NOT_DRAWN || !(tier in tiers)) continue;
  tiers[tier].push({ n: name, c: category, i: storyId(name) });
}
const notDrawn = [
  ...Object.entries(NOT_DRAWN).map(([n, [k, r]]) => ({ n, k, r, i: storyId(n), l: true })),
  ...manifest.helpers.map((h) => ({ n: h.name, k: "Helper", r: "A supporting piece of another component, with no page of its own.", l: false })),
  ...manifest.utilities.filter((x) => x.kind === "hook").map((h) => ({ n: h.name, k: "Hook", r: "Nothing to draw: it is code.", l: false })),
  ...manifest.utilities.filter((x) => x.kind === "function").map((h) => ({ n: h.name, k: "Function", r: "Nothing to draw: it is code.", l: false })),
];
const componentsCode = `const D = ${JSON.stringify({ tiers, notDrawn, counts: Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, v.length])) })};
const page = figma.root.children.find((p) => p.name.replace(/^[^\\p{L}\\p{N}]+/u, "") === "Components");
await figma.setCurrentPageAsync(page);
for (const c of [...page.children]) c.remove();
// What is drawn is what the file holds: a spec frame instance named "Spec: <Name>" on a category page.
const specs = new Map();
for (const p of figma.root.children) { if (!p.name.startsWith("\u21b3")) continue; await p.loadAsync(); for (const n of p.findAllWithCriteria({ types: ["INSTANCE"] })) if (n.name.startsWith("Spec: ")) specs.set(n.name.slice(6), n.id); }
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const C = Object.fromEntries(colls.map((c) => [c.name, c]));
const V = (c, n) => { const v = allVars.find((x) => x.variableCollectionId === C[c].id && x.name === n); if (!v) throw new Error("missing " + c + ":" + n); return v; };
const fillOf = (n, c = "Semantic") => figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", V(c, n));
const S = (n) => V("Primitives", "space/" + n);
const radius = (f, n) => { for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) f.setBoundVariable(k, V("Primitives", "radius/" + n)); };
const mode = (f, c, m) => f.setExplicitVariableModeForCollection(C[c], C[c].modes.find((x) => x.name === m).modeId);
const styles = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
for (const [family, style] of [["Lora", "Medium"], ["Nunito", "Regular"], ["Nunito", "SemiBold"], ["Nunito", "Bold"]]) await figma.loadFontAsync({ family, style });
const box = (dir, name) => { const f = figma.createAutoLayout(dir); f.name = name; f.fills = []; return f; };
const T = async (str, styleName, fill, name) => { const t = figma.createText(); t.name = name || str.slice(0, 24); t.fontName = { family: "Nunito", style: "Regular" }; t.characters = str; await t.setTextStyleIdAsync(styles.get(styleName).id); t.fills = [fillOf(fill || "text/primary")]; return t; };
const put = (parent, node) => { parent.appendChild(node); node.layoutSizingHorizontal = "FILL"; return node; };
const wrap = (t, w) => { t.textAutoResize = "HEIGHT"; t.resize(w, t.height); return t; };
const card = (name) => { const f = box("VERTICAL", name); f.fills = [fillOf("bg/surface")]; f.strokes = [fillOf("border/default")]; f.strokeWeight = 1; radius(f, "xl"); for (const k of ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"]) f.setBoundVariable(k, S("6")); f.setBoundVariable("itemSpacing", S("3")); return f; };
const fixed = (child, w) => { const a = box("HORIZONTAL", "Cell"); a.resize(w, 16); a.primaryAxisSizingMode = "FIXED"; a.counterAxisSizingMode = "AUTO"; a.appendChild(child); return a; };
const shell = async (name, eyebrow, title, desc) => {
  const f = figma.createAutoLayout("VERTICAL"); f.name = name; f.resize(1440, 100); f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "FIXED";
  f.fills = [fillOf("bg/surface")];
  for (const k of ["paddingLeft", "paddingRight"]) f.setBoundVariable(k, S("24")); for (const k of ["paddingTop", "paddingBottom"]) f.setBoundVariable(k, S("20"));
  f.setBoundVariable("itemSpacing", S("12")); mode(f, "Semantic", "purple-light"); mode(f, "Viewport", "desktop");
  const head = box("VERTICAL", "Header"); head.setBoundVariable("itemSpacing", S("3")); put(f, head);
  head.appendChild(await T(eyebrow, "Overline/sm", "text/brand", "Eyebrow")); head.appendChild(await T(title, "Display/3xl", "text/primary", "Title"));
  head.appendChild(wrap(await T(desc, "Body/md", "text/secondary", "Description"), 720));
  const content = box("VERTICAL", "Content"); content.setBoundVariable("itemSpacing", S("10")); put(f, content);
  return { f, content };
};
const rowRule = (r) => { r.strokes = [fillOf("border/default")]; r.strokeTopWeight = 1; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.setBoundVariable("paddingTop", S("2")); r.setBoundVariable("paddingBottom", S("2")); };
const TIER = { atom: ["Atoms", "The smallest pieces: a button, an input, a badge, an icon."], molecule: ["Molecules", "Pieces built from atoms: a card, a select, a tabs bar."], organism: ["Organisms", "Larger pieces built from molecules and atoms: a dialog, a data table, a navbar."] };
// An index name links inside the file: to the component's spec frame once it is drawn, else to its category page when that page exists
// (a planned component has no frame yet). Its Storybook page is its own column, so both are one click away.
const pageBy = (name) => figma.root.children.find((p) => p.name.replace(/^[^\\p{L}\\p{N}]+/u, "") === name);
const inside = (c) => specs.get(c.n) || pageBy(c.c)?.id || null;
const url = (c) => "https://dbm-system.com/storybook/?path=/docs/" + c.i + "--docs";
const frames = [];

// Overview
const ov = await shell("Components: Overview", "Components", "How components are structured", "Components are built in three tiers, each from the one before. Every one is a component set with variant and boolean properties, and a spec frame that lists them.");
const tiersRow = box("HORIZONTAL", "Tiers"); tiersRow.setBoundVariable("itemSpacing", S("6")); put(ov.content, tiersRow);
for (const t of ["atom", "molecule", "organism"]) { const c = card("Tier: " + t); put(tiersRow, c); c.layoutSizingVertical = "FILL"; c.appendChild(await T(String(D.counts[t]), "Display/3xl", "text/brand", "Count")); c.appendChild(await T(TIER[t][0], "Heading/md", "text/primary", "Name")); put(c, wrap(await T(TIER[t][1], "Body/sm", "text/secondary", "Text"), 300)); }
const how = box("HORIZONTAL", "How"); how.setBoundVariable("itemSpacing", S("6")); put(ov.content, how);
for (const [t, d] of [["A component set", "Every combination of its variant properties and states is drawn, so any real combination can be set on an instance."], ["Properties are props", "Variant properties are named as the code's props. A prop that is behaviour or passthrough is not modelled, and the spec frame names it."], ["A spec frame", "Each component has one: its variants, properties, tokens used, anatomy, what it is built from, and accessibility notes. Storybook stays the full reference."]]) { const c = card("Note: " + t); put(how, c); c.layoutSizingVertical = "FILL"; c.appendChild(await T(t, "Heading/md", "text/primary", "Title")); put(c, wrap(await T(d, "Body/sm", "text/secondary", "Text"), 300)); }
const stat = await T(specs.size + " of " + (D.counts.atom + D.counts.molecule + D.counts.organism) + " components are drawn so far. The rest are planned, in tier order.", "Body/md", "text/secondary", "Progress"); ov.content.appendChild(stat);
frames.push(ov.f);

// Index, one frame per tier
for (const t of ["atom", "molecule", "organism"]) {
  const s = await shell("Components: " + TIER[t][0], "Index", TIER[t][0], D.counts[t] + " components. " + TIER[t][1] + " A name opens its spec frame, or its category page until it is drawn; Docs opens its Storybook page.");
  const tb = box("VERTICAL", "Table"); put(s.content, tb);
  const th = box("HORIZONTAL", "Header"); th.setBoundVariable("itemSpacing", S("6")); th.setBoundVariable("paddingBottom", S("2")); put(tb, th);
  for (const [h, w] of [["Component", 260], ["Category", 200], ["Storybook", 120], ["In Figma", 0]]) { const x = await T(h, "Overline/xs", "text/tertiary", "Head"); if (w) th.appendChild(fixed(x, w)); else put(th, x); }
  for (const c of D.tiers[t]) {
    const r = box("HORIZONTAL", "Row: " + c.n); r.setBoundVariable("itemSpacing", S("6")); r.counterAxisAlignItems = "MIN"; rowRule(r); put(tb, r);
    const dest = inside(c); const nm = await T(c.n, "Label/sm", dest ? "text/link" : "text/primary", "Name"); if (dest) nm.hyperlink = { type: "NODE", value: dest }; r.appendChild(fixed(nm, 260));
    r.appendChild(fixed(await T(c.c, "Body/sm", "text/secondary", "Category"), 200));
    const sb = await T("Docs", "Label/sm", "text/link", "Storybook"); sb.hyperlink = { type: "URL", value: url(c) }; r.appendChild(fixed(sb, 120));
    const st = await T(specs.has(c.n) ? "Drawn" : "Planned", "Label/sm", specs.has(c.n) ? "text/success" : "text/tertiary", "Status"); if (specs.has(c.n)) st.hyperlink = { type: "NODE", value: specs.get(c.n) }; r.appendChild(st);
  }
  frames.push(s.f);
}

// Not in Figma
const nf = await shell("Components: Not in Figma", "Not in Figma", "Not drawn in Figma", "What the code library has that this file does not draw, and why. A component name links to its Storybook page.");
const tb = box("VERTICAL", "Table"); put(nf.content, tb);
const th = box("HORIZONTAL", "Header"); th.setBoundVariable("itemSpacing", S("6")); th.setBoundVariable("paddingBottom", S("2")); put(tb, th);
for (const [h, w] of [["Name", 300], ["Kind", 180], ["Why", 0]]) { const x = await T(h, "Overline/xs", "text/tertiary", "Head"); if (w) th.appendChild(fixed(x, w)); else put(th, x); }
for (const c of D.notDrawn) {
  const r = box("HORIZONTAL", "Row: " + c.n); r.setBoundVariable("itemSpacing", S("6")); r.counterAxisAlignItems = "MIN"; rowRule(r); put(tb, r);
  const nm = await T(c.n, "Label/sm", c.l ? "text/link" : "text/primary", "Name"); if (c.l) nm.hyperlink = { type: "URL", value: url(c) }; r.appendChild(fixed(nm, 300));
  r.appendChild(fixed(await T(c.k, "Body/sm", "text/secondary", "Kind"), 180)); put(r, await T(c.r, "Body/sm", "text/secondary", "Reason"));
}
frames.push(nf.f);

const section = figma.createSection(); section.name = "Components";
let x = 160, h = 0;
for (const f of frames) { section.appendChild(f); f.x = x; f.y = 160; x += f.width + 160; h = Math.max(h, f.height); }
section.resizeWithoutConstraints(x, h + 320); section.fills = [fillOf("bg/canvas")];
return { frames: frames.map((f) => [f.name, Math.round(f.height)]), notDrawn: D.notDrawn.length };
`;
writeFileSync(join(outDir, "09-components-page.js"), componentsCode);
written.push(`09-components-page.js (${Object.values(tiers).flat().length} components, ${notDrawn.length} not drawn, ${componentsCode.length} characters)`);

// A collection that is already in Figma but in the wrong order is rebuilt in place by `95-reorder.js`: it copies each
// variable (type, scopes, code syntax, description, every mode's value, an alias pointed at the copy of its primitive) in
// the new order, deletes the old ones and renames the copies. Only needed when the order itself changes.
const orderPayload = `const ORDER = ${JSON.stringify(Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, v.items.map((e) => e.n)])))};
const all = await figma.variables.getLocalVariablesAsync();
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const byId = new Map(all.map((v) => [v.id, v]));
const TMP = "~";
const copies = new Map();
const made = {};
for (const name of ["Primitives", "Viewport", "Component", "Semantic"]) {
  const col = colls.find((c) => c.name === name);
  const mine = new Map(all.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
  if (mine.size !== ORDER[name].length) throw new Error(name + ": " + mine.size + " variables, expected " + ORDER[name].length);
  made[name] = [];
  for (const n of ORDER[name]) {
    const old = mine.get(n);
    if (!old) throw new Error("Missing " + n);
    const nv = figma.variables.createVariable(TMP + n, col, old.resolvedType);
    nv.scopes = old.scopes;
    nv.setVariableCodeSyntax("WEB", old.codeSyntax.WEB);
    nv.description = old.description;
    for (const [modeId, val] of Object.entries(old.valuesByMode)) {
      if (val && val.type === "VARIABLE_ALIAS") nv.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: copies.get(val.id).id });
      else nv.setValueForMode(modeId, val);
    }
    copies.set(old.id, nv);
    made[name].push([old, nv, n]);
  }
}
for (const name of Object.keys(made)) for (const [old] of made[name]) old.remove();
for (const name of Object.keys(made)) for (const [, nv, n] of made[name]) nv.name = n;
return Object.fromEntries(Object.entries(made).map(([k, v]) => [k, v.length]));
`;
writeFileSync(join(outDir, "95-reorder.js"), orderPayload);
written.push(`95-reorder.js (${orderPayload.length} characters)`);

// The check compares every variable in Figma with the tokens: its type, its value in each mode (an alias is followed to
// its primitive), its code syntax, and that no variable is left on the default "all scopes". Figma stores a number as a
// 32-bit float, so a number matches to a millionth.
const expected = Object.fromEntries(
  Object.entries(collections).map(([name, { modes, items }]) => [
    name,
    { m: modes, x: Object.fromEntries(items.map((e) => [e.n, modes.map((mode) => e.v[mode])])) },
  ]),
);
// The styles are checked by name too: every text, effect and grid style must exist under the name the script gives it (a text style
// also with its weight, line height and a size bound to a variable), and a style the script does not make is reported as extra, so a
// renamed or regrouped style is caught instead of a second one being made beside it.
const expectedStyles = {
  text: textStyles.map((t) => ({ n: t.n, style: t.style, lh: t.lh })),
  effect: effectStyles.map((e) => e.n),
  grid: gridStyles.map((g) => g.n),
};
const verify = `const X = ${JSON.stringify(expected)};
const ST = ${JSON.stringify(expectedStyles)};
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
    out.orderOk = JSON.stringify(col.variableIds.map((id) => byId.get(id).name)) === JSON.stringify(Object.keys(spec.x));
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
const styleReport = { missing: [], wrong: [], extra: [] };
const tHave = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
const eHave = new Map((await figma.getLocalEffectStylesAsync()).map((s) => [s.name, s]));
const gHave = new Map((await figma.getLocalGridStylesAsync()).map((s) => [s.name, s]));
for (const e of ST.text) {
  const s = tHave.get(e.n);
  if (!s) { styleReport.missing.push(e.n); continue; }
  if (s.fontName.style !== e.style) styleReport.wrong.push(e.n + ": weight " + s.fontName.style + " != " + e.style);
  if (e.lh === "AUTO" ? s.lineHeight.unit !== "AUTO" : s.lineHeight.unit !== "PERCENT" || Math.abs(s.lineHeight.value - e.lh) > 0.01) styleReport.wrong.push(e.n + ": line height");
  if (!(s.boundVariables && s.boundVariables.fontSize)) styleReport.wrong.push(e.n + ": size not bound");
}
for (const n of ST.effect) if (!eHave.has(n)) styleReport.missing.push(n);
for (const n of ST.grid) if (!gHave.has(n)) styleReport.missing.push(n);
for (const [have, want] of [[tHave, ST.text.map((e) => e.n)], [eHave, ST.effect], [gHave, ST.grid]]) for (const n of have.keys()) if (!want.includes(n)) styleReport.extra.push(n);
report.styles = { expected: ST.text.length + ST.effect.length + ST.grid.length, missing: styleReport.missing, wrong: styleReport.wrong, extra: styleReport.extra };
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
