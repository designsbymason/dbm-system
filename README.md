<div align="center">

# DBM System

**Let your agent read the manual.**

An agentic React component library: accessible, token-driven and fully typed, with a manifest, a token index and an `AGENTS.md` in the package, so an application comes together quickly, looks consistent and works for everyone.

[![npm](https://img.shields.io/npm/v/@dbm-system/components?label=npm&color=5548a4)](https://www.npmjs.com/package/@dbm-system/components)
[![CI](https://github.com/designsbymason/dbm-system/actions/workflows/ci.yml/badge.svg)](https://github.com/designsbymason/dbm-system/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/@dbm-system/components?color=1a6e63)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org)

[**Documentation**](https://dbm-system.com) · [**Storybook**](https://dbm-system.com/storybook/) · [**npm**](https://www.npmjs.com/package/@dbm-system/components) · [**Report an issue**](https://github.com/designsbymason/dbm-system/issues)

</div>

---

## Why DBM System

- **Built for agents as well as people.** Every component has full TypeScript types, JSDoc and a snippet for each example. The package ships a machine-readable manifest of every component, an index of every design token and an `AGENTS.md` usage guide, so a coding agent works from structured facts instead of guessing.
- **Token-driven theming.** One semantic token layer carries two brands, Purple and Emerald, each in light and dark. Switching a theme changes no component code.
- **Accessible by default.** WCAG AA is the minimum for every component: contrast, keyboard navigation, focus states and ARIA, with automated checks on each one.
- **Responsive and right-to-left.** Every component works across the whole breakpoint scale and in both text directions.
- **A small dependency surface.** Radix UI Primitives for interaction and Phosphor Icons, nothing else at runtime. Animation is plain CSS driven by motion tokens.
- **More than 100 components.** Atoms, molecules and organisms, plus application shells, from buttons and form fields to data tables, command palettes and date pickers.

## Quick start

```bash
pnpm add @dbm-system/components @dbm-system/tokens @dbm-system/icons
```

React 18 or newer is a peer dependency. Import the stylesheet and one theme once, in your app's entry, and choose the theme on the root element:

```ts
import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";
```

```html
<html data-theme="purple-light">
```

Then use a component:

```tsx
import { Button } from "@dbm-system/components";

export function Example() {
  return <Button>Save</Button>;
}
```

The components' fonts (Nunito and Lora), the other themes and runtime theme switching are covered in the [components package README](./packages/components/README.md).

## For AI coding agents

An agent building with the library should start here:

| Read | For |
|---|---|
| [`AGENTS.md`](./packages/components/AGENTS.md) | The rules for using the library, with a list of every component |
| `@dbm-system/components/manifest/index.json` | Every component in one small file, with the path of its full description |
| `@dbm-system/tokens/tokens.json` | Every design token, its value in each theme and which components use it |

## Packages

The packages are published under the `@dbm-system` npm scope and share one version. An app installs three of them:

| Package | What it is |
|---|---|
| [`@dbm-system/components`](./packages/components) | The component library, its stylesheet and the manifest |
| [`@dbm-system/tokens`](./packages/tokens) | The design tokens: theme CSS, typed constants and the token index |
| [`@dbm-system/icons`](./packages/icons) | The typed Phosphor icon set |

[`@dbm-system/utils`](./packages/utils) is published because the components depend on it; an app does not install it. The manifest generator, the ESLint config and the TypeScript config are private tools of this repository.

The API is pre-1.0: a breaking change before `1.0.0` bumps the minor version, and the changelog of each package says how to migrate.

## Documentation

- [dbm-system.com](https://dbm-system.com) for the documentation site, and [Storybook](https://dbm-system.com/storybook/) for every component with live examples, controls and accessibility checks
- Each package's README for its install and use
- [`guidelines/`](./guidelines) for the architecture decisions, token specification, component inventory, API conventions and engineering standards
- [`CLAUDE.md`](./CLAUDE.md) for orientation when working in this repository with an AI coding agent

## Support the project

If you use DBM System, or would like to support it, please **star the repository** on GitHub: [give it a ⭐](https://github.com/designsbymason/dbm-system). It helps other developers find the project and tells me it is worth continuing. Issues, bug reports and ideas are welcome too.

## Contributing

DBM System is a solo-maintained project. Issues are open, and pull requests are by invitation for now. See [CONTRIBUTING.md](./CONTRIBUTING.md), the [code of conduct](./CODE_OF_CONDUCT.md) and the [security policy](./SECURITY.md). To report a vulnerability, please do it privately and not in a public issue.

## License

[MIT](./LICENSE) © 2026 Designs by Mason. The code is free to use, modify and fork.
