# 0219 — The components package builds one ES module per component, with shared chunks, so a bundler keeps only what an app imports, over one bundled file or marking every statement pure

**Status:** Accepted · **Date:** 2026-11-15

## Context
`@dbm-system/components` was built by `tsup` into one ES module, `dist/index.js` (1.6 MB unminified). The file holds every component, and with it about 314 `X.displayName = "X"` assignments and an `Object.assign(Root, { Part })` per compound component. A bundler can't prove those statements free of side effects, so it kept all of them, and with them every component: an app that imported only `Button` shipped 328 KB of gzipped JavaScript, the same as an app that imported `DataTable`. The package's `"sideEffects": ["*.css"]` could not help, because a bundler drops whole files and there was one. Found while building the docs website, whose header (four components) carried the whole library.

`check-component-bundle-size` did not see it: it measures each component built alone from its source, not imported through the shipped entry.

## Decision
- **The ES module build has one entry per `export * from "./…"` line in `src/index.ts`** (read from that file, so a new export can't be missed), with code splitting: what two entries share goes into one chunk, so a module with state (a registry, a context) still exists once. `dist/index.js` re-exports them all, so `import { Button } from "@dbm-system/components"` and every other import are unchanged.
- **The CommonJS build stays one file** (`dist/index.cjs`); `require` gains nothing from more files.
- **One stylesheet still ships**, `dist/index.css` (`./styles.css`, [ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)); the per-entry stylesheets esbuild writes beside each entry are deleted after the build, since nothing imports them. The types still come from `src/index.ts` alone.
- **The build script cleans `dist/` itself** (`scripts/dist-files.mjs clean`), because the two tsup configurations run at once and neither may clean it.
- **A guard:** `check-component-bundle-size` also bundles four components (`Button`, `Badge`, `Navbar`, `DataTable`) through the built `dist/index.js` and fails one that costs more than 1.25 times its isolated size plus 1 KB. Against the old build it fails all four (234 KB each against 1 to 39 KB alone).

## Alternatives considered
- **Mark every top-level statement pure** (`/*#__PURE__*/` on each `Object.assign`, moving `displayName` into the definitions). Keeps one file, but there are hundreds of sites, and the next new component quietly undoes it.
- **Subpath exports per component** (`@dbm-system/components/button`). Works without splitting, but changes how every consumer imports, and the manifest, `AGENTS.md` and the docs all name the package entry.
- **Leave it, since bundlers may improve.** Every app pays the whole library today.
- **Build the CommonJS output per component too.** More files for no gain: CommonJS consumers don't tree-shake.

## Consequences
- An app's cost now follows what it imports: `Button` alone 3 KB gzipped (was 328 KB), a header of `Button`, `IconButton`, `Navbar` and `Menu` 66 KB, `DataTable` 97 KB, measured with esbuild with React external. The docs site's browser JavaScript fell from about 390 KB to 152 KB gzipped, React included.
- The published tarball holds more files (685, with source maps); its exports, types and stylesheet are unchanged, and `check-publish` (publint and attw) and `check-fresh-app` pass on it.
- The change needs no consumer action and ships as a patch release.

## Related
`packages/components/tsup.config.ts`, `scripts/dist-files.mjs`, `scripts/check-component-bundle-size.mjs`. `06-engineering-standards.md` (the bundle-size tripwires). [ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md), [ADR-0207](./0207-the-shipped-token-css-drops-the-token-descriptions-the-bundles-are-named-brand-mode-bundled-and-the-components-package-marks-its-css-as-having-side-effects-over-shipping-the-descriptions-or-leaving-the-stylesheet-to-a-bundlers-tree-shaking.md).
