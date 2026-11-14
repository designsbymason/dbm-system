import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
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

async function buildAll() {
  await buildPrimitives();
  await buildComponents();
  for (const theme of THEMES) {
    await buildTheme(theme);
  }
  writeBundles();
  writeTsBarrel();
}

await buildAll();
