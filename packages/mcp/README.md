# @dbm-system/mcp

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server for the DBM System. An AI coding agent starts it over stdio and asks about components, hooks, functions and design tokens, and gets answers read from the files the packages already ship: the component manifest, the token index and `AGENTS.md`.

It writes nothing, calls no network service and runs no project code.

It reads the copies of `@dbm-system/components` and `@dbm-system/tokens` installed in the folder it is started from, so the props an agent sees are those of the version the project has. When the project has neither installed, it falls back to the copies it depends on.

## Tools

All are read-only. Lists take `limit` and `offset` and say where the next page starts; a result never exceeds 25,000 characters, so a long list or a large component is returned in parts, with what was left out named.

| Tool | Answers |
|---|---|
| `dbm_list_components` | What components exist: name, tier, category and a one-sentence summary, filterable by tier and category |
| `dbm_get_component` | One component's manifest entry: props, parts and examples, or a single part |
| `dbm_list_utilities` | The hooks and functions the components package exports |
| `dbm_get_utility` | One hook, function or constant in full |
| `dbm_get_tokens` | Design tokens by name, layer, group or the component that uses them, with one theme's value on request |
| `dbm_search` | Components, hooks, functions, constants and tokens by name and by what they do |
| `dbm_get_agent_guide` | The consumer guide (`AGENTS.md`) that ships with the components package |

## Use it

Add it to an agent from the root of the project that uses DBM System, so it reads the versions that project has installed:

```bash
claude mcp add dbm-system -- npx -y @dbm-system/mcp
```

or, for a client that takes a JSON configuration:

```json
{
  "mcpServers": {
    "dbm-system": { "command": "npx", "args": ["-y", "@dbm-system/mcp"] }
  }
}
```

It looks for `@dbm-system/components` and `@dbm-system/tokens` in the folder it is started in. If your client starts it somewhere else, name your project's root with the `DBM_SYSTEM_PROJECT_DIR` environment variable or a `--project <folder>` argument (Claude Code also sets `CLAUDE_PROJECT_DIR`, which it reads), for example `"env": { "DBM_SYSTEM_PROJECT_DIR": "/path/to/your/project" }` in the JSON entry. With none of them it answers from the copies this package depends on: every answer says which with `source.origin`, and a result that comes from the bundled copy carries a `note` that says so and what to do.

The repository's `packages/mcp/evaluation/` holds ten questions with verified answers for measuring how well an agent uses the tools.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
