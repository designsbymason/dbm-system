# @dbm-system/components

An agentic React component library for building web and enterprise applications quickly, consistently and accessibly. Every component is typed with TypeScript, documented with JSDoc and driven by design tokens, so people and AI coding agents work against the same predictable API.

- Atoms, molecules, organisms and page shells, built on Radix UI Primitives
- Token-driven: two brands (purple, emerald), each in light and dark
- Accessible to WCAG AA, responsive across the full breakpoint scale
- Pre-1.0: the API can still change between minor versions, and each change is described in the changelog

## Install

```bash
pnpm add @dbm-system/components
```

React 18 or newer is a peer dependency (`react` and `react-dom`). The package brings `@dbm-system/tokens`, `@dbm-system/utils` and `@dbm-system/icons` with it.

## Use

Import the stylesheet once, import one theme, set `data-theme` on the root element, and supply the fonts:

```ts
import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";
```

```html
<html data-theme="purple-light">
```

The fonts are `Nunito` (primary) and `Lora` (secondary). The package does not ship them, so load them from Google Fonts or self-host them.

```tsx
import { Button } from "@dbm-system/components";

export function Example() {
  return <Button>Save</Button>;
}
```

Reference semantic tokens (`color.bg.brand`, `space.4`) and never hardcode a colour, spacing value or duration.

## For AI agents

The package ships a machine-readable index of every component, its props and parts, and its hooks and functions:

```ts
import manifest from "@dbm-system/components/manifest.json" with { type: "json" };
```

`@dbm-system/components/manifest.schema.json` describes its shape. The manifest is for the version you installed.

## Links

- Documentation and Storybook: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
