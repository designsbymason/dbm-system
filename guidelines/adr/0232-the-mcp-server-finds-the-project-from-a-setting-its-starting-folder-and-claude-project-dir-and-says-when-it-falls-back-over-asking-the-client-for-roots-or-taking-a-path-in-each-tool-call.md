# 0232 — The MCP server finds the project from a setting, its starting folder and CLAUDE_PROJECT_DIR, and says when it falls back, over asking the client for roots or taking a path in each tool call

**Status:** Accepted · **Date:** 2026-11-19

## Context
[ADR-0229](./0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md) has the server read the packages installed in the project it is started in, and fall back to the copies it depends on. It looked only in its working folder. A client decides where a local server starts, and many do not start it in the project: a desktop app opened from an icon starts it from an unrelated folder, and Claude Code's documentation does not say which folder it uses. Started elsewhere, the server answers from the bundled copies without any sign that they are not the project's, so an agent can describe props that are not the ones in the code.

## Decision
- **The folders searched, in order,** are: the explicit setting (the `DBM_SYSTEM_PROJECT_DIR` environment variable, or `--project <folder>` in the server's arguments), the working folder, and `CLAUDE_PROJECT_DIR` (which Claude Code sets to the project root for the servers it starts). For each package the first folder it resolves from wins, and the copies the server depends on come last. Trying the working folder before `CLAUDE_PROJECT_DIR` keeps a monorepo working, where the packages may be installed only in a nested folder.
- **The server says when it falls back.** When the components or tokens come from the bundled copy, each result that carries a `source` (and `dbm_search`) also carries a `note` that names the folders searched, the version used and how to fix it (start from the project's root, or set `DBM_SYSTEM_PROJECT_DIR`). A setting that is not a folder is named in the same note.
- **No new tool arguments, and no roots.** The server does not ask the client for its roots, and no tool takes a path.

## Alternatives considered
- **Ask the client for its roots (`roots/list`).** It is the protocol's own way for a client to name its folders, but the 2026-07-28 revision deprecates it with nothing in its place, and the SDK's documentation sends servers to configuration and tool arguments instead. Rejected.
- **A project path argument on every tool.** An agent knows its project's path, but any caller could then point the server at any folder, every tool's schema grows, and the path has to be repeated in every call. Rejected.
- **Leave it to the user's working folder.** It is correct only for clients that start the server in the project, and the failure is silent. Rejected.

## Consequences
- A client that cannot set a working folder can still be configured: through an `env` entry or an argument, which is host configuration.
- An answer from the wrong copy is now visible to the agent and to a person reading the result.
- The server reads one more environment variable, `CLAUDE_PROJECT_DIR`, which is specific to one client but harmless where it is not set.
- It ships as a patch release of the fixed group.

## Related
`01-vision-and-goals.md` §13 (Phase 10). [ADR-0229](./0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md), [ADR-0230](./0230-the-mcp-server-is-a-fifth-public-package-in-the-fixed-version-group-over-folding-it-into-the-components-package-or-leaving-it-outside-the-group.md).
