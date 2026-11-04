# 0175 — A consumer imports an explicit stylesheet and one bundled theme file and supplies the fonts, over implicit CSS imports or shipped fonts

**Status:** Accepted · **Date:** 2026-11-04

## Context
The component styles compile to `dist/index.css`, but the built `index.js` does not import it and the package's `exports` map exposes only `"."`. The tokens need three files today (`primitives.css`, `component-tokens.css` and one theme file, each theme applying under `:root[data-theme="…"]`), and the `Nunito` and `Lora` fonts are named but not shipped. No consumer document says how to load any of it.

## Decision
- **The component stylesheet is an explicit import.** `@dbm-system/components` exposes it through `exports` (for example `@dbm-system/components/styles.css`) and the app imports it once. The JS does not import its own CSS.
- **The tokens package emits one bundled file per brand and mode** (primitives, component tokens and that theme's semantic tokens together, for example `css/purple-light.bundled.css`). The separate files stay available. The app sets `data-theme` on the root element to choose a theme.
- **Fonts are the app's choice.** The package does not ship them; the consumer guide gives a copy-paste Google Fonts link and a self-hosting `@font-face` snippet.
- The guide and a fresh-app install test (the packed package installed into a new app) are part of Phase 8.

## Alternatives considered
- **Auto-import the CSS from the JS.** Needs bundler CSS support, can break SSR or tree-shaking, and hides what is loaded. Rejected.
- **One all-themes file.** Easiest for a switcher, but every consumer downloads four themes. Rejected as the default; a theme switcher can import more than one bundled file.
- **Keep three imports, documented.** Smallest work, most steps and easiest to get wrong. Rejected.
- **Ship the fonts.** Adds weight and licence handling to the package, against the dependency-light principle. Rejected.

## Consequences
- The tokens build gains a bundled output and its own check; `exports` in both packages change.
- An agent following the consumer guide has one stylesheet import, one theme import and one attribute to set.

## Related
`01-vision-and-goals.md` §12 and §13.1. `03-token-system-spec.md` (Fonts).
