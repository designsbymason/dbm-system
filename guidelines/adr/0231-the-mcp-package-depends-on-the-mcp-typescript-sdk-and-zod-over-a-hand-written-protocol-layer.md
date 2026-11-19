# 0231 — The MCP package depends on the MCP TypeScript SDK and Zod, over a hand-written protocol layer

**Status:** Accepted · **Date:** 2026-11-19

## Context
The project takes no dependency without a reason (`CLAUDE.md`, `02-tech-stack-and-structure.md`). Until now the approved runtime dependencies are Radix UI Primitives and Phosphor Icons. A server that speaks the Model Context Protocol over stdio needs the protocol's message handling, schema validation for tool input and output, and a transport.

## Decision
- **`packages/mcp` depends on the official MCP TypeScript SDK** (the v2 line, `@modelcontextprotocol/server`, which is the current stable line for new servers) **and on Zod,** which the SDK uses to describe tool input and output.
- **Both are runtime dependencies of that package only.** No other package takes them, and the components package stays free of dependencies outside Radix and icons.
- **Exact versions are chosen at install,** checked against the registry then, and pinned like the others ([`02`](../02-tech-stack-and-structure.md) §3).
- **No other MCP dependency** (an HTTP framework, a second schema library) is approved.

## Alternatives considered
- **A hand-written JSON-RPC and stdio layer.** Removes two dependencies, but the protocol, its versions and its error shapes become code this project maintains and keeps in step with clients. Rejected.
- **Plain JSON Schema instead of Zod.** The SDK expects Zod schemas, so this would mean converting by hand. Rejected.
- **The v1 SDK (`@modelcontextprotocol/sdk`).** It receives only bug and security fixes. Rejected for a new server.

## Consequences
- `pnpm audit`, the manual refresh pass ([`02`](../02-tech-stack-and-structure.md) §3.2) and `check-publish` cover the two packages like any other.
- A new dependency in the MCP package is a new ADR.

## Related
[ADR-0229](./0229-the-mcp-server-is-built-now-as-a-read-only-server-over-stdio-that-reads-the-shipped-files-over-waiting-for-a-stable-api-a-hosted-server-or-a-server-that-can-write.md), [ADR-0230](./0230-the-mcp-server-is-a-fifth-public-package-in-the-fixed-version-group-over-folding-it-into-the-components-package-or-leaving-it-outside-the-group.md). [ADR-0022](./0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md).
