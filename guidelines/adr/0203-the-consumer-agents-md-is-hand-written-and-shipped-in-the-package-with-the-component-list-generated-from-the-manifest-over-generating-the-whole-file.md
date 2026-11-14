# 0203 — The consumer `AGENTS.md` is hand-written and shipped in the package, with the component list generated from the manifest, over generating the whole file

**Status:** Accepted · **Date:** 2026-11-13

## Context
`CLAUDE.md` and `guidelines/` are internal and never published (`01-vision-and-goals.md` §13.1). An agent building an app with the library needs its own short guide: how to import, which rules to follow, how to load the stylesheet and a theme. §13.1 lists this as recommended and left open whether it is written by hand or generated.

## Decision
- **`AGENTS.md` is written by hand** and ships at the root of `@dbm-system/components`. It states the consumption rules in the maintainer's wording: import patterns, reference semantic tokens and never hardcode a value, `as` and `asChild` composition, and loading the stylesheet, one theme and the fonts ([ADR-0175](./0175-a-consumer-imports-an-explicit-stylesheet-and-one-bundled-theme-file-and-supplies-the-fonts-over-implicit-css-or-shipped-fonts.md)).
- **The list of components inside it is generated from the manifest** at release, so it never names a component that does not ship. Nothing else in the file is generated.
- It is written once the manifest and the consumer stylesheet export exist, so it describes what is real. Until then it does not exist, and `README.md` per package carries the install and import basics.

## Alternatives considered
- **Generate the whole file from the manifest.** Never drifts, but the rules are prose a person has to word and the manifest has no place for them. Rejected.
- **Hand-write everything, including the component list.** The list would drift from what ships on the first release. Rejected.
- **Ship `CLAUDE.md` or the guidelines.** They describe contributing to this repository, not building with it. Rejected.

## Consequences
- The release step that writes the component list is a Phase 8 task that depends on the manifest.
- The rules are maintained in two places, the internal guidelines and this file, so a change to a consumption rule updates both.

## Related
`01-vision-and-goals.md` §13.1. [ADR-0174](./0174-the-manifest-generator-extracts-props-itself-with-react-docgen-typescript-over-reusing-storybooks-docgen-output.md).
