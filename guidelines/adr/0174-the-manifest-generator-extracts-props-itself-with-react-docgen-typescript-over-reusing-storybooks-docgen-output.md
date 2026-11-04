# 0174 — The manifest generator extracts props itself with react-docgen-typescript, over reusing Storybook's docgen output

**Status:** Accepted · **Date:** 2026-11-04

## Context
Storybook uses `react-docgen` (Babel-based) for the Properties table, which drops inherited native props; components work around that by hand (`05-component-api-conventions.md` §3). `packages/manifest` is planned around `react-docgen-typescript`, which reads the real TypeScript types. Whether the manifest should reuse Storybook's output or extract on its own had to be settled before Phase 8.

## Decision
`packages/manifest` runs `react-docgen-typescript` over the component source itself. It does not read Storybook's docgen output. Story-derived facts (examples, snippets) can be added later by reading the stories directly, not through Storybook's build.

## Alternatives considered
- **Reuse Storybook's docgen output.** Less code, but it inherits the missing native props, and the agent contract would depend on Storybook's build. Rejected.
- **Both, merged.** Richest result, but two sources to keep consistent. Rejected for now; it can be added by a new ADR.

## Consequences
- The manifest is built from types and JSDoc alone, so it stays valid when Storybook changes.
- The manifest and the Properties table can disagree where the workarounds differ; the manifest is the one agents read, so a check that compares them is worth adding in Phase 8.

## Related
`01-vision-and-goals.md` §13.1. `02-tech-stack-and-structure.md` (Manifest generation). [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md).
