# DBM System

> **Status: published on npm at `0.1.x`, the API is still pre-1.0.** The component library is substantial — 118 of a planned 118 components are built, and five page-level templates (two shells that ship, `AppShell` and `PageShell`, and three story-only example pages: a data table list page, a documentation page and a marketing page). A breaking change before `1.0.0` bumps the minor version and says how to migrate in its changelog.

An agentic, standalone React component library built for both AI coding agents and human developers to compose web and enterprise applications quickly, consistently, and accessibly. Token-driven, multi-brand, multi-theme (light/dark), and built with a strong TypeScript + JSDoc contract so AI agents can work against a structured, predictable API.

## Packages

This is a monorepo. The packages are published under the `@dbm-system` npm scope, at one version together. An app installs three of them:

- `@dbm-system/components` — the component library, its stylesheet and the machine-readable manifest of every component
- `@dbm-system/tokens` — the design tokens: the theme CSS and typed constants
- `@dbm-system/icons` — the typed Phosphor icon set

`@dbm-system/utils` is published because the components depend on it; an app does not install it. `@dbm-system/manifest` (the manifest generator), `@dbm-system/eslint-config` and `@dbm-system/tsconfig` are private tools of this repository and are not published.

The install steps are in the components package's README, and `RELEASING.md` describes how a release is made.

## Documentation

- `CLAUDE.md` — project orientation for AI coding agents working in this repo
- `guidelines/` — architecture decisions, token spec, component inventory, API conventions, and engineering standards

## License

MIT — see [`LICENSE`](./LICENSE).

## Contributing

This is a solo-maintained project. Issues are open; pull requests are by invitation for now. See [`CONTRIBUTING.md`](./CONTRIBUTING.md). The code is free to use and fork under the MIT license.
