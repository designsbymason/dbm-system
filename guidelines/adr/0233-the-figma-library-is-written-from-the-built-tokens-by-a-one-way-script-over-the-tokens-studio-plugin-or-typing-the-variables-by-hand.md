# 0233 — The Figma library is written from the built tokens by a one-way script over the Tokens Studio plugin or typing the variables by hand

**Status:** Accepted · **Date:** 2026-11-19

## Context
Phase 11 (`01-vision-and-goals.md` §13) plans a Figma library whose variables mirror the CSS custom properties 1:1. `03-token-system-spec.md` named the Tokens Studio plugin for this, before the plan was made. The tokens are about 380 primitives, four theme files and 35 component files, so a copy typed by hand would drift at the first token change.

## Decision
- A script outside `packages/*` (a private tool, never published) reads `packages/tokens/build/tokens.json` and writes the variables, styles and modes through the Figma MCP. It is re-runnable and idempotent, and reports counts per collection and mode against the token files.
- The flow is one way: the repository is the source, Figma is the copy. A value is never changed in Figma and brought back.
- No package changes, and no Figma access token is stored in the repository.

## Alternatives considered
- **Tokens Studio plugin.** Mentioned in `03`, but it adds a plugin and a second format to maintain, and its free tier limits themes and sync. Rejected.
- **One-time build through the MCP, then by hand.** Fast, and then it drifts. Rejected.
- **Typing the variables in Figma.** Rejected for the size of the token set.

## Consequences
- A token change reaches Figma by re-running the script, and the Changelog page records the version it matches.
- The script is new code to maintain, outside the published packages, and needs the MCP to be signed in.
- `03`'s mention of the plugin is replaced by a pointer to this record.

## Related
`guidelines/figma/01-plan.md` §2 and §5. `03-token-system-spec.md`.
