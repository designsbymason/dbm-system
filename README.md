# DBM System

> **Status: in active development, not yet published.** The component library is substantial — 103 of a planned 115 components (all 48 atoms and 40 of 40 molecules) are built, with the first fifteen organisms, `Dialog`, `AlertDialog`, `ConfirmDialog`, `Drawer`, `Menu`, `Toast`, `Form`, `Combobox`, `DatePicker`, `DataTable`, `Navbar`, `Sidebar`, `FileUpload`, `ContextMenu` and `MultiSelect`, among them; every one is reviewed and Finalized — but nothing has shipped to npm yet; the API can still change before the first publish.

An agentic, standalone React component library built for both AI coding agents and human developers to compose web and enterprise applications quickly, consistently, and accessibly. Token-driven, multi-brand, multi-theme (light/dark), and built with a strong TypeScript + JSDoc contract so AI agents can work against a structured, predictable API.

## Packages

This is a monorepo. Once published, packages will live under the `@dbm-system` npm scope:

- `@dbm-system/tokens` — design tokens (primitive, semantic, and component layers)
- `@dbm-system/utils` — small shared utilities (class-name and ref merging, responsive-value helpers, and shared hooks like `useAnnouncement` and `usePersistentDismiss`)
- `@dbm-system/icons` — Phosphor Icons wrapper
- `@dbm-system/components` — the component library itself
- `@dbm-system/manifest` — agent-readable component manifest generator (not yet built — Phase 8)

None of these are published yet.

## Documentation

- `CLAUDE.md` — project orientation for AI coding agents working in this repo
- `guidelines/` — architecture decisions, token spec, component inventory, API conventions, and engineering standards

## License

MIT — see [`LICENSE`](./LICENSE).

## Contributing

This is a solo-maintained project. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) — external pull requests are not accepted, though the code is free to use and fork under the MIT license.
