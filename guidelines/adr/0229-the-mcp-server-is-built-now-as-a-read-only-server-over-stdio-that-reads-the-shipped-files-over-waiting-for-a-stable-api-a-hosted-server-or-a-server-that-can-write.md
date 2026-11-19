# 0229 — The MCP server is built now, as a read-only server over stdio that reads the shipped files, over waiting for a stable API, a hosted server, or a server that can write

**Status:** Accepted · **Date:** 2026-11-19

## Context
`01-vision-and-goals.md` §13 (Phase 10) deferred the MCP server "until the API is proven stable", so agent tooling would not be built against a shifting target. The API is still pre-1.0 (0.2.1). What the server would read, though, is already a versioned contract: the manifest (`schemaVersion` 1) with its split files ([ADR-0206](./0206-the-manifest-is-also-shipped-as-an-index-and-one-file-per-component-beside-the-whole-file-over-the-single-file-alone-or-waiting-for-an-mcp-server.md)), the token index ([ADR-0210](./0210-the-manifest-says-whether-a-ref-reaches-an-element-and-the-tokens-package-ships-a-token-index-over-leaving-both-to-be-read-from-source.md)) and `AGENTS.md` ([ADR-0208](./0208-the-agents-md-is-a-committed-file-with-a-marked-generated-list-that-a-sync-command-rewrites-and-a-check-keeps-in-step-over-writing-it-in-the-build-or-generating-it-into-dist.md)). A server that only reads those files does not break when a component's props change; it breaks only when a file's shape changes, which is already a new ADR.

## Decision
- **Phase 10's MCP server starts now.** The CLI scaffolder stays deferred.
- **The server is read-only.** It writes nothing, calls no network service and runs no project code. Every tool is annotated `readOnlyHint: true`.
- **The transport is stdio only.** An agent starts it with a command (`npx`) on the developer's machine. A hosted HTTP server is not planned; it would be a new ADR.
- **It reads the files the packages already ship,** and is never a second source: the manifest index and per-component files, `utilities.json`, `tokens.json` and `AGENTS.md`. Tool results keep the shape of those files instead of reformatting them. It resolves the packages from the project it is started in first, so an agent sees the props of the version that project has installed, and falls back to the copies it depends on ([ADR-0230](./0230-the-mcp-server-is-a-fifth-public-package-in-the-fixed-version-group-over-folding-it-into-the-components-package-or-leaving-it-outside-the-group.md)).
- **The docs pages are out of the first version.** They are generated into the website and are in no package; `llms.txt` and the Markdown copies already serve that need.

## Alternatives considered
- **Wait for a stable API.** The deferral's reason does not apply to a server that reads a versioned file contract, and the server would give the manifest a real consumer to expose its gaps. Rejected.
- **A hosted HTTP server as well.** Needs a host that is not GitHub Pages, a public endpoint to secure and rate-limit, and serves whatever version was last deployed, not the one an app has installed. Rejected for now; the tool code could serve a second transport later.
- **A server that can write** (scaffold a component, edit a file). Far larger surface and security risk, and the CLI scaffolder is the place for it. Rejected.
- **Serve the docs pages too.** They are in no package, so the server would depend on the website's build. Rejected for the first version.

## Consequences
- A change to the shape of the manifest, the token index or `AGENTS.md` is now also a change to the server, so those ADRs name it.
- The server's tests and an evaluation set (read-only questions with fixed answers) become part of its definition of done.
- The website copy that calls the server "in development" stays until it is published ([`docs-site/03`](../docs-site/03-landing-page-brief.md)).

## Related
`01-vision-and-goals.md` §13 (Phase 10) and §13.1. [ADR-0230](./0230-the-mcp-server-is-a-fifth-public-package-in-the-fixed-version-group-over-folding-it-into-the-components-package-or-leaving-it-outside-the-group.md), [ADR-0231](./0231-the-mcp-package-depends-on-the-mcp-typescript-sdk-and-zod-over-a-hand-written-protocol-layer.md).
