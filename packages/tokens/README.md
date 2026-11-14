# @dbm-system/tokens

The design tokens for the DBM System: primitive, semantic and component layers, built from one source into CSS custom properties and typed TypeScript constants.

Components reference semantic tokens (`color.bg.brand`, `space.4`), never primitives, so switching a theme changes no component code.

## Install

```bash
pnpm add @dbm-system/tokens
```

`@dbm-system/components` depends on it, but an app that imports its CSS needs it as its own dependency (a strict package manager such as pnpm only lets an app import a package it depends on), so install it beside the components.

## Use

Two brands (`purple`, `emerald`), each in `light` and `dark`. Import one theme once, in your app's entry, and choose it on the root element:

```ts
import "@dbm-system/tokens/css/purple-light.bundled.css";
```

```html
<html data-theme="purple-light">
```

| File | Holds |
|---|---|
| `<brand>-<mode>.bundled.css` (four) | The primitives, the component tokens and that theme's semantic tokens, in one self-contained file, about 19 KB |
| `primitives.css` | The raw scales (colour, spacing, type, radius, motion), the same in every theme |
| `component-tokens.css` | Tokens specific to a component, the same in every theme |
| `<brand>-<mode>.css` (four) | The semantic tokens of one theme, scoped to `:root[data-theme="…"]` |

An app that offers several themes imports `primitives.css` and `component-tokens.css` once and one theme file per theme, or one bundled file per theme and accepts the repeated declarations. Every shipped CSS file is free of the token descriptions, which live in the package's source and in the Storybook Foundations pages.

The package ships no fonts. The tokens name `Nunito` and `Lora`, which the app loads; the components package's README has the snippets.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
