import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, 'src');
const BUILD_DIR = join(__dirname, 'build');

const PRIMITIVE_SOURCE = join(SRC_DIR, 'primitive/*.json');
const COMPONENT_SOURCE = join(SRC_DIR, 'component/*.json');

// Primitive source files have no self-namespacing top-level key (radius.json and
// breakpoint.json both use "sm"/"md"/"lg"/"xl", for example), so merging them as-is
// collides. This parser wraps each file's content under the namespace semantic tokens
// already reference via DTCG aliases (e.g. `{color.purple.600}` expects a top-level
// "color" key). typography.json and other.json are left unwrapped since their own
// top-level groups (font-family, font-size, icon-size, z-index, ...) are already
// distinct and don't collide with anything.
const NAMESPACE_BY_FILENAME = {
  'color.json': 'color',
  'spacing.json': 'space',
  'radius.json': 'radius',
  'shadow.json': 'shadow',
  'breakpoint.json': 'breakpoint',
  'motion.json': 'motion',
};

StyleDictionary.registerParser({
  name: 'dbm/namespace-primitives',
  pattern: /primitive[\\/][^\\/]+\.json$/,
  parser: ({ filePath, contents }) => {
    const data = JSON.parse(contents);
    const filename = basename(filePath);
    // "_note" is a human-readable annotation on shadow.json, not a token — DTCG
    // parsing expects every leaf to resolve to a $value, so it must be stripped.
    if (filename === 'shadow.json') delete data._note;
    const namespace = NAMESPACE_BY_FILENAME[filename];
    return namespace ? { [namespace]: data } : data;
  },
});

// A token's `$description` is long and holds internal history, and Style Dictionary copies it into the CSS as a comment (85% of the
// token CSS, ADR-0207). The descriptions live in the source JSON and are shown by Storybook's Foundations pages, so they are removed
// before anything is generated and no output carries them.
StyleDictionary.registerPreprocessor({
  name: 'dbm/drop-descriptions',
  preprocessor: (dictionary) => {
    const strip = (node) => {
      if (node === null || typeof node !== 'object') return node;
      if (Array.isArray(node)) return node.map(strip); // a font stack or a cubic-bezier value is an array
      const copy = {};
      for (const [key, value] of Object.entries(node)) {
        if (key === '$description' || key === 'description' || key === 'comment') continue;
        copy[key] = strip(value);
      }
      return copy;
    };
    return strip(dictionary);
  },
});

// The four semantic-layer categories (bg/text/border/icon) are the only tokens that
// belong in a theme's CSS/TS output — primitive tokens are emitted once, separately,
// and the theme files reference them via CSS var() / already-resolved TS values.
const SEMANTIC_GROUPS = ['bg', 'text', 'border', 'icon'];
const isSemanticToken = (token) => SEMANTIC_GROUPS.includes(token.path[0]);

// Component-layer tokens (packages/tokens/src/component/*.json) are theme-independent
// (dimensions, not colors) and self-namespaced by their own top-level key (e.g. "avatar"),
// same convention as typography.json/other.json. Filtering on filePath rather than a
// hardcoded namespace list means a new component/*.json file needs no config change here.
const isComponentToken = (token) => token.filePath?.includes(`${SRC_DIR}/component/`) ?? false;

const CSS_TRANSFORMS = ['attribute/cti', 'name/kebab', 'color/css', 'fontFamily/css', 'cubicBezier/css'];

function toCamelCase(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// Builds a plain nested object (token path -> resolved $value) for a set of tokens,
// e.g. path ["bg", "brand"] with value "#358278" becomes { bg: { brand: "#358278" } }.
//
// cubicBezier tokens (motion.easing.*) additionally get a raw-array sibling export —
// e.g. motion.easingArray.standard = [0.2, 0, 0, 1] next to motion.easing.standard =
// "cubic-bezier(0.2, 0, 0, 1)" — since the `motion` library's own `easing` prop wants
// the raw [x1,y1,x2,y2] array, not a CSS string, while existing CSS-string consumers
// (Foundations' MotionScale demo builds a `transition` shorthand string from it) need
// the string form unchanged. Additive only, generic to any cubicBezier-typed token
// wherever it lives, not hardcoded to "motion" specifically. token.original.$value is
// the untransformed DTCG source value (the array); token.$value is post-transform
// (the CSS-string `cubicBezier/css` output) — confirmed via a one-off Style Dictionary
// dump, not assumed (`original.$value` isn't otherwise documented in these terms).
function buildNestedObject(tokens) {
  const root = {};
  for (const token of tokens) {
    let node = root;
    for (const segment of token.path.slice(0, -1)) {
      node[segment] ??= {};
      node = node[segment];
    }
    node[token.path.at(-1)] = token.$value;

    if (token.$type === 'cubicBezier') {
      let arrayNode = root;
      const arrayPath = token.path.map((segment) =>
        segment === 'easing' ? 'easingArray' : segment,
      );
      for (const segment of arrayPath.slice(0, -1)) {
        arrayNode[segment] ??= {};
        arrayNode = arrayNode[segment];
      }
      arrayNode[arrayPath.at(-1)] = token.original.$value;
    }
  }
  return root;
}

StyleDictionary.registerFormat({
  name: 'dbm/typescript-const',
  format: ({ dictionary, file }) => {
    const exportName = file.options?.exportName ?? 'tokens';
    const nested = buildNestedObject(dictionary.allTokens);
    const body = JSON.stringify(nested, null, 2);
    return [
      '/**',
      ' * Do not edit directly — generated by Style Dictionary from packages/tokens/src.',
      ' */',
      '',
      `export const ${exportName} = ${body} as const;`,
      '',
      `export type ${exportName[0].toUpperCase()}${exportName.slice(1)} = typeof ${exportName};`,
      '',
    ].join('\n');
  },
});

const THEMES = ['purple-light', 'purple-dark', 'emerald-light', 'emerald-dark'];

async function buildPrimitives() {
  const sd = new StyleDictionary({
    parsers: ['dbm/namespace-primitives'],
    preprocessors: ['dbm/drop-descriptions'],
    source: [PRIMITIVE_SOURCE],
    platforms: {
      css: {
        transforms: CSS_TRANSFORMS,
        prefix: 'dbm',
        buildPath: join(BUILD_DIR, 'css') + '/',
        files: [
          {
            destination: 'primitives.css',
            format: 'css/variables',
            options: { outputReferences: true, selector: ':root' },
          },
        ],
      },
      ts: {
        transforms: CSS_TRANSFORMS,
        buildPath: join(BUILD_DIR, 'ts') + '/',
        files: [
          {
            destination: 'primitives.ts',
            format: 'dbm/typescript-const',
            options: { exportName: 'primitives' },
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();
}

// Component tokens may alias primitives (e.g. a future `{color.purple.100}` reference),
// so the primitive source is included for resolution — same pattern as buildTheme() below
// — but the filter keeps only the component-namespaced tokens in the actual output.
async function buildComponents() {
  const sd = new StyleDictionary({
    parsers: ['dbm/namespace-primitives'],
    preprocessors: ['dbm/drop-descriptions'],
    source: [PRIMITIVE_SOURCE, COMPONENT_SOURCE],
    platforms: {
      css: {
        transforms: CSS_TRANSFORMS,
        prefix: 'dbm',
        buildPath: join(BUILD_DIR, 'css') + '/',
        files: [
          {
            destination: 'component-tokens.css',
            format: 'css/variables',
            filter: isComponentToken,
            options: { outputReferences: true, selector: ':root' },
          },
        ],
      },
      ts: {
        transforms: CSS_TRANSFORMS,
        buildPath: join(BUILD_DIR, 'ts') + '/',
        files: [
          {
            destination: 'component-tokens.ts',
            format: 'dbm/typescript-const',
            filter: isComponentToken,
            options: { exportName: 'componentTokens' },
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();
}

async function buildTheme(theme) {
  const exportName = toCamelCase(theme);

  const sd = new StyleDictionary({
    parsers: ['dbm/namespace-primitives'],
    preprocessors: ['dbm/drop-descriptions'],
    source: [PRIMITIVE_SOURCE, join(SRC_DIR, 'semantic', `${theme}.json`)],
    platforms: {
      css: {
        transforms: CSS_TRANSFORMS,
        prefix: 'dbm',
        buildPath: join(BUILD_DIR, 'css') + '/',
        files: [
          {
            destination: `${theme}.css`,
            format: 'css/variables',
            filter: isSemanticToken,
            options: { outputReferences: true, selector: `:root[data-theme="${theme}"]` },
          },
        ],
      },
      ts: {
        transforms: CSS_TRANSFORMS,
        buildPath: join(BUILD_DIR, 'ts') + '/',
        files: [
          {
            destination: `${theme}.ts`,
            format: 'dbm/typescript-const',
            filter: isSemanticToken,
            options: { exportName },
          },
        ],
      },
    },
  });

  await sd.buildAllPlatforms();
}

// One file per brand and mode (ADR-0175, ADR-0207): the primitives, the component tokens and that theme's semantic tokens, in that order,
// under their own selectors. Each source file starts with the same generated-file header, which is kept once at the top.
const GENERATED_HEADER = /^\/\*\*\n \* Do not edit directly, this file was auto-generated\.\n \*\/\n\n/;
function writeBundles() {
  const cssDir = join(BUILD_DIR, 'css');
  const body = (file) => readFileSync(join(cssDir, file), 'utf8').replace(GENERATED_HEADER, '').trimEnd();
  for (const theme of THEMES) {
    const bundle = [
      '/**',
      ' * Do not edit directly, this file was auto-generated.',
      ` * ${theme}: the primitives, the component tokens and this theme's tokens in one file.`,
      ' */',
      '',
      body('primitives.css'),
      '',
      body('component-tokens.css'),
      '',
      body(`${theme}.css`),
      '',
    ].join('\n');
    writeFileSync(join(cssDir, `${theme}.bundled.css`), bundle);
  }
}

function writeTsBarrel() {
  // Extensionless specifiers match the "Bundler" moduleResolution used across this
  // monorepo's tsconfig (see packages/tsconfig/tsconfig.base.json).
  const lines = ["export * from './primitives';", "export * from './component-tokens';"];
  for (const theme of THEMES) {
    lines.push(`export * from './${theme}';`);
  }
  lines.push('');
  writeFileSync(join(BUILD_DIR, 'ts', 'index.ts'), lines.join('\n'));
}

// The token index (ADR-0210): one JSON file listing every token with its layer, group, type, resolved value in each theme, the primitive
// it aliases and a one-sentence purpose, so an agent can choose a token without reading the CSS. It is built from sources that still hold
// the descriptions (the CSS builds drop them). A description ships only as its first sentence and only when that sentence carries no
// dated or historical note; the rest is internal history that stays in the source.
const HISTORY = /\b20\d\d-\d\d-\d\d\b|\b(moved from|new token|token consolidation|redefined|retired|renamed|consolidat\w*|explicit direction|replaces?|replaced|previously|formerly|was)\b/i;
function purposeOf(description) {
  if (typeof description !== 'string') return undefined;
  const text = description.replace(/\s+/g, ' ').trim();
  const sentence = text.split(/(?<=[.!?])\s+(?=[A-Z`"(])/)[0];
  if (!sentence || sentence.length > 200 || HISTORY.test(sentence)) return undefined;
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
}

const cssName = (path) => `--dbm-${path.join('-')}`;
const aliasOf = (value) => {
  const match = typeof value === 'string' ? /^\{([^{}]+)\}$/.exec(value) : null;
  return match ? cssName(match[1].split('.')) : undefined;
};

// Which components use a token: the components whose own stylesheets reference it. The shared internals (src/internal) are not attributed to a
// component, so a token only they use has no list. This is a fact read from the code, so it does not go stale the way a description does.
const COMPONENTS_SRC = join(__dirname, '..', 'components', 'src');
function usageByToken() {
  const usedBy = new Map();
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (entry !== 'node_modules') visit(path);
        continue;
      }
      if (!entry.endsWith('.css')) continue;
      const owner = /[\\/](?:atoms|molecules|organisms|templates)[\\/]([^\\/]+)[\\/]/.exec(path.slice(COMPONENTS_SRC.length))?.[1];
      if (!owner) continue;
      for (const [, name] of readFileSync(path, 'utf8').matchAll(/var\((--dbm-[a-z0-9-]+)/g)) {
        if (!usedBy.has(name)) usedBy.set(name, new Set());
        usedBy.get(name).add(owner);
      }
    }
  };
  if (existsSync(COMPONENTS_SRC)) visit(COMPONENTS_SRC);
  return usedBy;
}

async function writeIndex() {
  const usedBy = usageByToken();
  const index = new Map();
  for (const theme of THEMES) {
    const sd = new StyleDictionary({
      parsers: ['dbm/namespace-primitives'],
      source: [PRIMITIVE_SOURCE, COMPONENT_SOURCE, join(SRC_DIR, 'semantic', `${theme}.json`)],
      platforms: { css: { transforms: CSS_TRANSFORMS, prefix: 'dbm' } },
    });
    const { allTokens } = await sd.getPlatformTokens('css');
    for (const token of allTokens) {
      const name = cssName(token.path);
      const layer = isSemanticToken(token) ? 'semantic' : isComponentToken(token) ? 'component' : 'primitive';
      if (layer !== 'semantic' && theme !== THEMES[0]) continue;
      let entry = index.get(name);
      if (!entry) {
        const purpose = purposeOf(token.original.$description);
        entry = { name, layer, group: token.path[0], type: token.$type, ...(purpose ? { purpose } : {}) };
        index.set(name, entry);
      }
      const alias = aliasOf(token.original.$value);
      if (layer === 'semantic') {
        (entry.values ??= {})[theme] = token.$value;
        if (alias) (entry.aliases ??= {})[theme] = alias;
      } else {
        entry.value = token.$value;
        if (alias) entry.alias = alias;
      }
    }
  }
  for (const entry of index.values()) {
    const users = usedBy.get(entry.name);
    if (users) entry.usedBy = [...users].sort();
  }
  const tokens = [...index.values()];
  const order = { semantic: 0, component: 1, primitive: 2 };
  tokens.sort((a, b) => order[a.layer] - order[b.layer] || a.name.localeCompare(b.name));
  writeFileSync(join(BUILD_DIR, 'tokens.json'), `${JSON.stringify({ version: 1, themes: THEMES, tokens }, null, 2)}\n`);
}

async function buildAll() {
  await buildPrimitives();
  await buildComponents();
  for (const theme of THEMES) {
    await buildTheme(theme);
  }
  writeBundles();
  writeTsBarrel();
  await writeIndex();
}

await buildAll();
