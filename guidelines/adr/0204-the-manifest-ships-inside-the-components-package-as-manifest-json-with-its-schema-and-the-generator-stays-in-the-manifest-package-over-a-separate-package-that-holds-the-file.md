# 0204 — The manifest ships inside the components package as `manifest.json` with its schema, and the generator stays in the manifest package, over a separate package that holds the file

**Status:** Accepted · **Date:** 2026-11-14

## Context
`packages/manifest` is the build tool that reads the component source and writes the agent-readable JSON manifest ([ADR-0174](./0174-the-manifest-generator-extracts-props-itself-with-react-docgen-typescript-over-reusing-storybooks-docgen-output.md)). Nothing says where the generated file lives once published. An agent or a person building an app needs the manifest for the version of the components they installed, not for the latest one.

## Decision
- **`@dbm-system/components` ships `manifest.json` and `manifest.schema.json`**, written into its `dist` by its own build and exposed through `exports` (`@dbm-system/components/manifest.json` and `@dbm-system/components/manifest.schema.json`). The file's `version` is the components package's version.
- **`@dbm-system/manifest` stays the generator**: a build tool the components package uses at build time and anyone can run, not where the file is read from. It owns the schema and its TypeScript types.
- **The docs website copies the file** to `/manifest.json` at build; it does not generate its own.
- **The schema is versioned by a `schemaVersion` number.** An additive change (a new optional field, a new array) keeps the number; a change that removes or renames a field, or changes what one means, raises it and is a new ADR.

## Alternatives considered
- **A separate package that holds the file.** One more install, and its version can drift from the components a consumer has. Rejected.
- **Publish only the generator and let each consumer run it.** Needs the source, which the package does not ship. Rejected.

## Consequences
- The components package's `files`, `exports` and `check-publish` must include the two JSON files (Phase 8, M4).
- The components build depends on the manifest package building first.
- The manifest is read at the same version as the code, so a consumer on an older release reads the older API.

## Related
`01-vision-and-goals.md` §13 and §13.1. [ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md), [ADR-0203](./0203-the-consumer-agents-md-is-hand-written-and-shipped-in-the-package-with-the-component-list-generated-from-the-manifest-over-generating-the-whole-file.md).
