# @dbm-system/mcp

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server for the DBM System. An AI coding agent starts it over stdio and asks about components, hooks, functions and design tokens, and gets answers read from the files the packages already ship: the component manifest, the token index and `AGENTS.md`.

It writes nothing, calls no network service and runs no project code.

It reads the copies of `@dbm-system/components` and `@dbm-system/tokens` installed in the folder it is started from, so the props an agent sees are those of the version the project has. When the project has neither installed, it falls back to the copies it depends on.

This package is under construction and not yet published.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
