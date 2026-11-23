# 0244 — The Figma map ships in the components package and the MCP server serves it, over leaving it in the repository or adding it to the manifest

**Status:** Accepted · **Date:** 2026-11-22

## Context
`guidelines/figma/component-map.json` says, for each component drawn in the Figma library, which Figma property and value is which code prop and value, what is not drawn and why, and where each differs from the code ([ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md)). It is checked against the built manifest in CI. It lives in the repository's `guidelines/`, which is not published, so an agent working from a copy of the library in a project that installed `@dbm-system/components` cannot read it unless it also has our repository. Code Connect does not fill the gap: it holds a path and a name, not the prop mapping ([ADR-0243](./0243-code-connect-mappings-are-entered-in-figmas-own-screen-as-a-path-and-a-name-and-the-prop-mapping-stays-in-the-map-over-generating-and-sending-them-from-the-map.md)), and it needs a Figma plan and a team library.

## Decision
- **The map is shipped in `@dbm-system/components`,** copied unchanged into `dist` at build and exported as `@dbm-system/components/figma-map.json`, beside the manifest. The build fails if the map is missing or does not pass `check-figma-map`, so what ships is what CI checked.
- **`@dbm-system/mcp` serves it** with a read-only tool that returns the map, or one component's entry, from the installed package, like its other tools ([ADR-0229](./0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md)). Its name and shape are set when it is built, with the docs test that holds the README, the Storybook page and `AGENTS.md` to the registered tools.
- **It carries nothing about the Figma file:** no key, address or node id, which the map already forbids and its check enforces. It names a Figma component set by its name, as the library shows it.
- This ADR decides that it ships and where. Building it is a separate change that touches published packages and carries a changeset.

## Alternatives considered
- **Leave it in the repository.** Rejected: an agent that works from the installed package, which is every consumer, never sees it.
- **Put it in the manifest as a `figma` field on each component.** Rejected: the manifest is the code's facts, built from TypeScript and JSDoc, with a `schemaVersion` that tools depend on; Figma's naming and what is drawn are design facts that change on a different schedule, and this would couple two checks.
- **A separate published package.** Rejected: a sixth package to version and release for one JSON file, with the same readers as the components package.
- **Rely on Code Connect alone.** Rejected: it holds no prop mapping and needs a Figma plan, a seat and a team library ([ADR-0243](./0243-code-connect-mappings-are-entered-in-figmas-own-screen-as-a-path-and-a-name-and-the-prop-mapping-stays-in-the-map-over-generating-and-sending-them-from-the-map.md)).

## Consequences
- The map becomes part of the public contract: its shape (`version` in the file) is versioned like the manifest, and a change to it that a consumer would see is a changeset. The API is pre-1.0, so a breaking change is a `minor`.
- The published package grows by the size of one JSON file, which the bundle-size checks should be shown to tolerate when it is built.
- Components not yet drawn are not in it, and a consumer must treat a missing entry as "not drawn", not "not mapped".
- Nothing here needs a Figma account, plan or file.

## Related
[ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md), [ADR-0243](./0243-code-connect-mappings-are-entered-in-figmas-own-screen-as-a-path-and-a-name-and-the-prop-mapping-stays-in-the-map-over-generating-and-sending-them-from-the-map.md), [ADR-0229](./0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md), `guidelines/figma/07-community-and-code-connect.md`, `guidelines/open-items.md`.
