# 0205 — Manifest version 1 describes components and their parts, records the native props a component inherits by name, and fails on an undocumented prop, over listing every native prop or covering hooks in the first version

**Status:** Accepted · **Date:** 2026-11-14

## Context
The manifest has to be complete enough that an agent can use a component without reading its source, and small enough to read. A component such as `Button` extends the native `button` props (about 200), which the docgen library can list or leave out. Compound components (`Menu.Item`) are separate exported parts. The docgen library reads components, not hooks. A probe over the 120 component files found 30 of 2,596 props without a description and 47 components without an `@example`.

## Decision
- **Version 1 describes components.** Per component: name, tier, category, summary, import name, source path, whether it takes `asChild` or `as`, its props, its parts (with their own props), and its examples. Hooks and utilities are a later, additive section.
- **Inherited native props are recorded by name** in an `extends` list (for example `ComponentPropsWithoutRef<"button">`), and `props` lists only what this system declares or overrides.
- **Each prop** carries its type as a string, whether it is required, its default, its description, and the allowed values when its type is a union of literals.
- **Tier and category come from the story title** (`Atoms/Inputs/Button`), and the summary from the first paragraph of the component's JSDoc, so nothing is written twice.
- **Documentation is checked.** A prop without a description fails the build; a component without a description or an `@example` warns until the gaps are filled, then fails.
- **The output is deterministic**: stable key order, no timestamps, so two builds are byte-identical.

## Alternatives considered
- **List every native prop.** About 200 extra entries per component that nobody reads, and they change with the TypeScript version. Rejected.
- **Cover hooks in version 1.** Needs a second extractor (the TypeScript API) before the component half is proven. Rejected; it is additive later.
- **Warn only on missing documentation.** It would stay unfixed. Rejected for props.
- **A hand-written summary file** (the docs-only `componentDescriptions.ts`). A second source that drifts. Rejected as the source.

## Consequences
- The 30 undocumented props are fixed before the check can fail the build.
- A component's JSDoc first paragraph becomes its public summary, so it is written for a reader of the manifest.
- `componentDescriptions.ts` can be removed or generated from the manifest once this lands.

## Related
`01-vision-and-goals.md` §13.1. `05-component-api-conventions.md` §7. [ADR-0174](./0174-the-manifest-generator-extracts-props-itself-with-react-docgen-typescript-over-reusing-storybooks-docgen-output.md), [ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md).
