# 0230 — The MCP server is a fifth public package in the fixed version group, over folding it into the components package or leaving it outside the group

**Status:** Accepted · **Date:** 2026-11-19

## Context
[ADR-0209](./0209-four-packages-are-published-and-versioned-together-and-the-manifest-generator-is-a-private-tool-over-publishing-it-as-a-fifth-package.md) fixed four public packages. The MCP server ([ADR-0229](./0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md)) is run by an agent with `npx`, has its own dependencies, and reads the files of two other packages, so which versions belong together matters as it did in [ADR-0202](./0202-the-five-public-packages-are-versioned-together-and-the-first-release-is-0-1-0-over-independent-versions-or-a-first-release-at-1-0-0.md). Unlike the manifest generator (ADR-0209), it has a use outside this repository.

## Decision
- **`@dbm-system/mcp` is published,** from `packages/mcp`, with a `bin` an agent runs. Five packages are public: `components`, `tokens`, `utils`, `icons` and `mcp`.
- **It joins the fixed Changesets group,** so every release carries one version and a given server version reads files of the same version.
- **An app does not install it as a dependency;** it is run by the agent's tooling. An app still installs three packages: components, tokens and icons.
- **The rest of ADR-0209 stands:** `@dbm-system/manifest` stays private, and `utils` stays published because the components depend on it.
- **It reuses the release pipeline:** `check-publish`, `check-fresh-app` and trusted publishing cover it, with its trusted publisher set up before its first release.

## Alternatives considered
- **A subpath of the components package** (`@dbm-system/components/mcp`). No new package, but the server's dependencies would sit in the components package, which has none outside Radix and icons, and a UI library would ship a program. Rejected.
- **A package outside the fixed group.** The server could then be released alone, but a consumer would have to work out which server version reads which manifest. Rejected, as in ADR-0202.
- **Keep it private and run it from a clone.** An app's agent could not use it. Rejected.

## Consequences
- `check-publish`, the fixed group in `.changeset/config.json`, `check-fresh-app`, the trusted publisher and the repository-structure notes change when the package is added.
- A release with no change to the server still bumps its version and writes an empty changelog entry.

## Related
`01-vision-and-goals.md` §13. [ADR-0202](./0202-the-five-public-packages-are-versioned-together-and-the-first-release-is-0-1-0-over-independent-versions-or-a-first-release-at-1-0-0.md), [ADR-0209](./0209-four-packages-are-published-and-versioned-together-and-the-manifest-generator-is-a-private-tool-over-publishing-it-as-a-fifth-package.md).
