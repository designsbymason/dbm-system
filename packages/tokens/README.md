# @dbm-system/tokens

The design tokens for the DBM System: primitive, semantic and component layers, built from one source into CSS custom properties and typed TypeScript constants.

Components reference semantic tokens (`color.bg.brand`, `space.4`), never primitives, so switching a theme changes no component code.

## Install

```bash
pnpm add @dbm-system/tokens
```

It comes with `@dbm-system/components`, so install it directly only to use the tokens on their own.

## Use

Two brands (`purple`, `emerald`), each in `light` and `dark`. Import one theme and set `data-theme` on the root element:

```ts
import "@dbm-system/tokens/css/purple-light.bundled.css";
```

```html
<html data-theme="purple-light">
```

Each bundled file holds the primitives, the component tokens and that theme's semantic tokens. The separate files (`primitives.css`, `component-tokens.css` and one file per theme) are also available under `@dbm-system/tokens/css/`. A theme switcher imports more than one theme file.

The package ships no fonts. The tokens name `Nunito` and `Lora`, which the app loads.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
