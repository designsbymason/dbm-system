# 0210 — The manifest says whether a ref reaches an element and the tokens package ships a token index, over leaving both to be read from source

**Status:** Accepted · **Date:** 2026-11-14

## Context
An agent composing an app needs two facts it could only get by reading source: whether a component's `ref` reaches a DOM element (and which), and what each token is for and what it resolves to. Token descriptions in the source are mostly dated history (80 of 117 semantic ones), and the CSS carries no descriptions at all (ADR-0207).

## Decision
- **The manifest gives each component and part `forwardsRef` and, when it does, `refElement`** (for example `HTMLButtonElement`), read from the type of the `ref` prop. Both are optional and additive to schema v1.
- **The tokens package ships `tokens.json`**, built with the CSS and exported as `@dbm-system/tokens/tokens.json`: every token's name, layer, group, type, resolved value (per theme for semantic tokens), the primitive it aliases, `usedBy` (the components whose own stylesheets reference it) and a `purpose`. A purpose is the first sentence of the source description and is kept only when it has no date or history wording; otherwise it is left out. `check-css` checks the index lists exactly the tokens the CSS defines.

## Alternatives considered
- **Ship the descriptions as they are.** They are history, not guidance. Rejected.
- **Write a purpose for every token by hand.** It would drift from the CSS with no check. Rejected; `usedBy` is read from the code and cannot go stale.

## Consequences
- Purpose coverage is partial (74 of 451 tokens); `usedBy` covers 328. Cleaning the source descriptions raises coverage with no other change.
- Shared internal stylesheets are not attributed to a component, so a token used only there has no `usedBy`.

## Related
[ADR-0206](./0206-the-manifest-is-also-shipped-as-an-index-and-one-file-per-component-beside-the-whole-file-over-the-single-file-alone-or-waiting-for-an-mcp-server.md), [ADR-0207](./0207-the-shipped-token-css-drops-the-token-descriptions-the-bundles-are-named-brand-mode-bundled-and-the-components-package-marks-its-css-as-having-side-effects-over-shipping-the-descriptions-or-leaving-the-stylesheet-to-a-bundlers-tree-shaking.md), [ADR-0208](./0208-the-agents-md-is-a-committed-file-with-a-marked-generated-list-that-a-sync-command-rewrites-and-a-check-keeps-in-step-over-writing-it-in-the-build-or-generating-it-into-dist.md).
