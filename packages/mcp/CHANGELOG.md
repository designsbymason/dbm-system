# @dbm-system/mcp

## 0.3.2

No changes in this release.

## 0.3.1

No changes in this release.

## 0.3.0

No changes in this release.

## 0.2.3

No changes in this release.

## 0.2.2

### Patch Changes

- 3b9a03b: The MCP server now finds your project when a client starts it in another folder. Set `DBM_SYSTEM_PROJECT_DIR` to your project's root, or pass `--project <folder>`; it also reads `CLAUDE_PROJECT_DIR`, which Claude Code sets. When an answer comes from the copy bundled with the server and not from your project, the result now carries a `note` that says so and how to fix it.
