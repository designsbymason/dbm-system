# 0241 — Code Connect mappings are generated from the map and sent with the user's own sign-in, over committing Figma files in the repository or publishing from CI with a token

**Status:** Accepted · **Date:** 2026-11-22

## Context
Figma's Code Connect links a Figma component to a code component with a prop mapping, so Dev Mode and the tools that read a design show the real component (`<Badge dot tone="danger" />`) instead of generated markup. [ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md) deferred it and made `guidelines/figma/component-map.json` the source of the mapping. The usual way to use Code Connect is a `*.figma.tsx` file per component in the repository, each naming the Figma file and node it maps, published to Figma from a machine with a personal access token. Two standing rules rule that out for this repository: it is public and MIT licensed, and `guidelines/figma/01-plan.md` §3 keeps the Figma file's key, address and node ids out of it and keeps any Figma token out of the repository and out of its secrets. A fork or a duplicate of the Figma file has different keys and ids as well, so files that name them would be wrong for everyone but us.

## Decision
When Code Connect is used, its mappings are generated from `component-map.json` at the time they are sent. A command (`/figma-connect`, not yet written) reads the map, looks the file's node ids up at run time, keeps them in the gitignored `.local/`, and sends the mappings with the Figma tools the session already has (`add_code_connect_map`, `send_code_connect_mappings`), under the sign-in of the person running it. No `*.figma.tsx` file is committed, no token is created or stored, and no dependency is added to any package. The command is public, so a fork or anyone with a copy of the library file can run it on their own file.

This decides how mappings are made if Code Connect is used. Whether and when it is used depends on checks listed in `guidelines/figma/07-community-and-code-connect.md`.

## Alternatives considered
- **Committed `*.figma.tsx` files.** Rejected: each holds the file key and node ids, which the plan keeps out of a public repository, and they would not work in a fork or a duplicate.
- **Publishing from CI with a personal access token.** Rejected: the plan forbids a Figma token in the repository or its secrets, as it does an npm token (`CLAUDE.md`, security practices).
- **Not using Code Connect, keeping only the map.** Not rejected: the map stays the source and works without it. This ADR is about how Code Connect is added, not a commitment to add it.

## Consequences
- Code Connect and the map cannot drift apart, because the first is derived from the second.
- A mapping has to be sent again after the map or the file's node ids change; the command is the place that does it.
- It does not reach people who install the packages or cannot open our file. A map shipped with the package would; that is a separate decision, listed in `guidelines/open-items.md`.

## Related
[ADR-0240](./0240-a-machine-readable-map-from-each-drawn-figma-component-to-the-code-is-checked-against-the-manifest-over-the-spec-frame-alone-or-waiting-for-code-connect.md), `guidelines/figma/07-community-and-code-connect.md`, `guidelines/figma/01-plan.md` §3 and §8.
