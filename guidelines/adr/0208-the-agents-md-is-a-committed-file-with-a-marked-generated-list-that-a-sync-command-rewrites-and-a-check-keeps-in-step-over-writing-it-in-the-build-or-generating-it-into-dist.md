# 0208 — `AGENTS.md` is a committed file with a marked generated list that a sync command rewrites and a check keeps in step, over writing it in the build or generating it into `dist`

**Status:** Accepted · **Date:** 2026-11-14

## Context
[ADR-0203](./0203-the-consumer-agents-md-is-hand-written-and-shipped-in-the-package-with-the-component-list-generated-from-the-manifest-over-generating-the-whole-file.md) decided that the consumer `AGENTS.md` is written by hand and ships in the package, with only the component list generated from the manifest. It left open how the list gets into the file, how the file stays true as components change, and how long it should be. An agent looks for it at the package's root, and every token of it is read on every use.

## Decision
- **`packages/components/AGENTS.md` is a committed file.** Its hand-written text is the maintainer's; one block between `<!-- components:start -->` and `<!-- components:end -->` is generated from the manifest and holds nothing else.
- **The block is names only,** grouped by tier and category, followed by the names of the hooks and functions. The one-sentence summaries stay in `manifest/index.json`, so the file stays short (about 120 lines in all).
- **`pnpm sync-agents` rewrites the block in place** from a fresh generation. **The components build does not write source files**: a build that edits a committed file leaves the tree dirty and hides a stale list from a check that runs after it.
- **`pnpm check-manifest` fails when the committed block is not what the manifest generates,** and says to run `pnpm sync-agents`.
- **The file ships:** `files` lists it, `check-publish` requires it in the tarball, and the guide check reads its `import` lines and `data-theme` values like the READMEs'.
- **What the hand-written text names must exist.** Every component, part, prop and `--dbm-…` token written in backticks in it is checked against the manifest and the token CSS, so the file cannot describe something that does not ship.

## Alternatives considered
- **The build rewrites the block.** The next check would compare the file with itself and pass whatever it said. Rejected.
- **Generate the whole file into `dist` at build time.** Nothing generated in the repo, but an agent looks at the package root, and the hand-written rules would have to live somewhere else. Rejected.
- **Put the summaries in the file.** About 35 KB, read in full every time. Rejected: the index is for that.
- **Review only, no check of the names.** A file that names a component that does not exist is worse than none. Rejected.

## Consequences
- Adding or removing a component changes `AGENTS.md`, in the same commit, by running one command; CI fails otherwise.
- The rules are maintained here and in the internal guidelines, so a change to a consumption rule updates both ([ADR-0203](./0203-the-consumer-agents-md-is-hand-written-and-shipped-in-the-package-with-the-component-list-generated-from-the-manifest-over-generating-the-whole-file.md)).
- The repository's own `CLAUDE.md` carries the same generated list between its own markers: `pnpm sync-agents` rewrites both files and `pnpm check-manifest` checks both.

## Related
`01-vision-and-goals.md` §13.1. [ADR-0204](./0204-the-manifest-ships-inside-the-components-package-as-manifest-json-with-its-schema-and-the-generator-stays-in-the-manifest-package-over-a-separate-package-that-holds-the-file.md), [ADR-0206](./0206-the-manifest-is-also-shipped-as-an-index-and-one-file-per-component-beside-the-whole-file-over-the-single-file-alone-or-waiting-for-an-mcp-server.md).
