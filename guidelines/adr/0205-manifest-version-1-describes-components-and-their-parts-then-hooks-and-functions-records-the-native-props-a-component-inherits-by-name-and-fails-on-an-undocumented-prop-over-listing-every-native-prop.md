# 0205 — Manifest version 1 describes components and their parts, records the native props a component inherits by name, and fails on an undocumented prop, over listing every native prop or covering hooks in the first version

**Status:** Accepted · **Date:** 2026-11-14

## Context
The manifest has to be complete enough that an agent can use a component without reading its source, and small enough to read. A component such as `Button` extends the native `button` props (about 200), which the docgen library can list or leave out. Compound components (`Menu.Item`) are separate exported parts. The docgen library reads components, not hooks. A probe over the 120 component files found 30 of 2,596 props without a description and 47 components without an `@example`.

## Decision
- **Version 1 describes components and, in a second pass, hooks and functions.** Per component: name, tier, category, summary, import name, source path, whether it takes `asChild` or `as`, its props, its parts (with their own props), and its examples. Hooks and functions are an additive `utilities` section (name, kind, summary, signature, parameters, return type, examples), added without raising the schema version ([ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md)); constants such as the code-language grammars are not in it.
- **Inherited native props are recorded by name** in an `extends` list (for example `ComponentPropsWithoutRef<"button">`), and `props` lists only what this system declares or overrides.
- **Each prop** carries its type as a string, whether it is required, its default, its description, and the allowed values when its type is a union of literals.
- **Props come from react-docgen-typescript, except for a part its file does not export**, which the library cannot see; those are read from the TypeScript checker the same way (declared in this repository, with the JSDoc description and `@default`). A `ref` prop is left out of every entry: every component forwards it and none documents it.
- **`source` is a path in the repository** (`src/atoms/Button/Button.tsx`, relative to `packages/components`), kept so the docs website can link to the code. The package ships only `dist`, so an installed copy does not have the file; the schema says so.
- **Tier and category come from the story title** (`Atoms/Inputs/Button`), and the summary from the first paragraph of the component's JSDoc, so nothing is written twice.
- **Documentation is checked, and any gap fails.** `pnpm check-manifest` (and the `dbm-manifest` CLI) exits non-zero for a prop, component, part or function without a description, a component without an `@example`, an export the manifest cannot place, a component folder that reaches the manifest nowhere, or a manifest that breaks its schema. The gaps were filled first, so there is no warning-only stage. Every other exported value (the code-language grammars) is a `constants` entry, so nothing the package exports is left out.
- **The output is deterministic**: stable key order, no timestamps, so two builds are byte-identical.

## Alternatives considered
- **List every native prop.** About 200 extra entries per component that nobody reads, and they change with the TypeScript version. Rejected.
- **Read hooks with the same library as components.** It reads components, not functions. Rejected; the TypeScript API reads them.
- **Warn only on missing documentation.** It would stay unfixed. Rejected for props.
- **A hand-written summary file** (the docs-only `componentDescriptions.ts`). A second source that drifts. Rejected as the source.

## Consequences
- The undocumented props were fixed before the check could fail the build.
- A test compares the manifest with Storybook's own docgen (`react-docgen`, a dev dependency of the manifest package at the version Storybook uses): every prop it shows for a component is in the manifest, which is how the two are kept from disagreeing the wrong way (the first run found none missing).
- A component's JSDoc first paragraph becomes its public summary, so it is written for a reader of the manifest.
- `componentDescriptions.ts` stays: it holds the one short line of the Getting started table, and a JSDoc summary runs to a paragraph, so the manifest does not replace it.

## Related
`01-vision-and-goals.md` §13.1. `05-component-api-conventions.md` §7. [ADR-0174](./0174-the-manifest-generator-extracts-props-itself-with-react-docgen-typescript-over-reusing-storybooks-docgen-output.md), [ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md).
