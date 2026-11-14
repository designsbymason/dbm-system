# 0206 — The manifest is also shipped as an index and one file per component, beside the whole file, over the single file alone or waiting for an MCP server

**Status:** Accepted · **Date:** 2026-11-14

## Context
[ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md) ships one `manifest.json`. It is 1.8 MB (about 1.4 MB without indentation): the median component is 8 KB, the largest 46 KB, and the whole file is far more than an agent can read in one go. An agent that needs `Button` has to search a 1.8 MB file. The shared props (`className`, `id`, `style` and similar) are about 14% of it, so trimming would not fix the size.

## Decision
- **The package also ships a split layout**, generated from the same data as `manifest.json` in the same build:
  - `manifest/index.json`: one row per component (name, tier, category, the summary's first sentence, the path of its file) and one per hook or function (name, kind, first sentence), with the package and version;
  - `manifest/components/<Name>.json`: one component, exactly its entry in `manifest.json`;
  - `manifest/utilities.json`: every hook, function and constant, in full.
- **The split files are written without indentation**, because they are read by agents and indentation costs them tokens; `manifest.json` keeps its indentation for people.
- **`manifest.json` stays**, whole and unchanged, for the docs website and for anything that wants everything. The split files are a view of it, never a second source: a check requires them to match what the source generates.
- **`exports` exposes the folder** (`@dbm-system/components/manifest/*`), and the schema describes each file under `$defs` (`index`, `component`, `utilitiesFile`). This is additive, so `schemaVersion` stays 1 ([ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md)).
- **`AGENTS.md` tells an agent to read the index, then the one file it needs** ([ADR-0203](./0203-the-consumer-agents-md-is-hand-written-and-shipped-in-the-package-with-the-component-list-generated-from-the-manifest-over-generating-the-whole-file.md)).

## Alternatives considered
- **The single file alone.** One thing to ship, but too large to read. Rejected.
- **Compact JSON.** 1.8 MB falls to 1.4 MB, still far too large. Rejected.
- **Trimming the shared props.** An agent needs to know they exist, and they are about 14% of the file. Rejected.
- **Waiting for the MCP server (Phase 10).** It would solve this, but it is deferred until the API is stable, and it would sit on top of these same files. Rejected as the only answer.
- **Replace `manifest.json` with the split files.** The docs website and tools that want everything would have to reassemble it. Rejected.

## Consequences
- About 125 more small files in the package (the index is about 35 KB, a component file 8 KB at the median and 46 KB at most, `utilities.json` 17 KB).
- The generator, `check-manifest` and `check-publish` cover the split files, and the docs website can read one file per component page ([ADR-0171](./0171-docs-website-content-comes-from-the-manifest-for-facts-and-mdx-for-prose-and-the-guides-move-out-of-storybook-which-keeps-the-component-pages.md)).
- A change to how the files are split is a change to the contract an agent reads, so it is a new ADR.

## Related
`01-vision-and-goals.md` §13.1. [ADR-0205](./0205-manifest-version-1-describes-components-and-their-parts-then-hooks-and-functions-records-the-native-props-a-component-inherits-by-name-and-fails-on-an-undocumented-prop-over-listing-every-native-prop.md).
