# 0207 — The shipped token CSS drops the token descriptions, the bundles are named `<brand>-<mode>.bundled.css`, and the components package marks its CSS as having side effects, over shipping the descriptions or leaving the stylesheet to a bundler's tree-shaking

**Status:** Accepted · **Date:** 2026-11-14

## Context
[ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md) decided that a consumer imports one explicit stylesheet and one bundled theme file. Building it showed three details the ADR left open:
- Style Dictionary copies each token's `$description` into the CSS as a comment. Those descriptions are long and hold internal history ("usage redefined", "at explicit direction"), and they are 85% of the token CSS: the six files are 307 KB, and 38 KB without them. A bundled theme file would be about 135 KB instead of about 19 KB.
- `@dbm-system/components` declares `"sideEffects": false`. A bare `import "@dbm-system/components/styles.css"` is then an import with nothing used from it, which webpack and esbuild may drop from a production build, leaving the app unstyled with no error.
- ADR-0175 gave `css/purple-light.bundled.css` only as an example of a name.

## Decision
- **The token descriptions are not in any shipped CSS**, the bundles or the separate files. They live in the source JSON and are shown by Storybook's Foundations pages. The build removes them before the CSS is written, so no output has to be cleaned up afterwards.
- **The bundles are `css/<brand>-<mode>.bundled.css`** (`purple-light`, `purple-dark`, `emerald-light`, `emerald-dark`): the primitives, the component tokens and that theme's semantic tokens, in that order, under their own selectors. The separate files (`primitives.css`, `component-tokens.css` and one per theme) stay exported for an app that switches themes and loads the shared parts once.
- **`@dbm-system/components/styles.css` is `dist/index.css`**, and the package's `sideEffects` lists its CSS (`["*.css"]`) instead of being `false`, so an import of it is kept. The tokens package declares no `sideEffects`, so its CSS imports are kept already.
- **A consumer sets `data-theme` on the root element in the HTML** to choose a theme without a flash on first paint; `ThemeProvider` is for switching it at runtime.
- **A check keeps this true:** the bundles are self-contained (every `var(--dbm-…)` in one is defined in it), they hold exactly the declarations of the three files they are made from, and no description comment is left.

## Alternatives considered
- **Ship the descriptions.** The bundle would be seven times larger and would carry internal notes into every consumer's page. Rejected.
- **Strip the comments from the bundles only.** The separate files would still carry about 270 KB of them. Rejected.
- **Strip with a regular expression after the build.** It would have to understand comments inside values. Removing the descriptions before the CSS is generated has nothing to misread. Rejected.
- **Keep `sideEffects: false` and tell consumers to configure their bundler.** Every consumer would have to know, and the failure is silent. Rejected.

## Consequences
- The token CSS in the package falls from 307 KB to about 38 KB, and a bundled theme file is about 19 KB.
- Someone reading the built CSS no longer sees a token's description beside it; they read it in the source or in Storybook.
- The components package's other files are unaffected by the `sideEffects` change: a module that has none still tree-shakes.

## Related
[ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md). `03-token-system-spec.md`. `01-vision-and-goals.md` §12 and §13.
