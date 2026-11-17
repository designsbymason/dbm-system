# @dbm-system/components

An agentic React component library for building web and enterprise applications quickly, consistently and accessibly. Every component is typed with TypeScript, documented with JSDoc and driven by design tokens, so people and AI coding agents work against the same predictable API.

- Atoms, molecules, organisms and page shells, built on Radix UI Primitives
- Token-driven: two brands (purple, emerald), each in light and dark
- Accessible to WCAG AA, responsive across the full breakpoint scale
- Pre-1.0: the API can still change between minor versions, and each change is described in the changelog

## Install

```bash
pnpm add @dbm-system/components @dbm-system/tokens @dbm-system/icons
```

React 18 or newer is a peer dependency (`react` and `react-dom`). `@dbm-system/tokens` holds the theme CSS you import below and `@dbm-system/icons` the icons you pass to components (`import { PlusIcon } from "@dbm-system/icons"`), so install both beside the components: the components package does not re-export either, and a strict package manager such as pnpm only lets your app import a package it depends on. Everything else an app calls comes from `@dbm-system/components`, which brings its own dependencies.

## Set it up

Your bundler must support importing CSS (Vite, webpack and esbuild do). The steps below are checked on every change by installing the packed packages into an empty app and building it with esbuild and with webpack.

**1. Import the stylesheet and one theme, once, in your app's entry.**

```ts
import "@dbm-system/components/styles.css";
import "@dbm-system/tokens/css/purple-light.bundled.css";
```

The stylesheet holds the components' styles. A bundled theme file holds the design tokens for one brand and mode, about 19 KB:

| Theme | File |
|---|---|
| Purple, light | `purple-light.bundled.css` |
| Purple, dark | `purple-dark.bundled.css` |
| Emerald, light | `emerald-light.bundled.css` |
| Emerald, dark | `emerald-dark.bundled.css` |

**2. Choose the theme on the root element.**

```html
<html data-theme="purple-light">
```

Writing it into the HTML means the first paint is already themed. To switch at runtime, import the bundles for every theme you offer and set the attribute from your code, or wrap the app in `ThemeProvider` (`brand="purple" mode="system"`), which sets it for you.

**3. Load the fonts.** The components use `Nunito` (the primary family) and `Lora` (the secondary), and the package does not ship them. Without them the browser's fallback fonts are used. Either load them from Google Fonts, in the `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

or host them yourself. Both families are open source (SIL Open Font License); download the variable `.woff2` files and declare them:

```css
@font-face {
  font-family: "Nunito";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("/fonts/nunito-variable.woff2") format("woff2");
}

@font-face {
  font-family: "Lora";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("/fonts/lora-variable.woff2") format("woff2");
}
```

**4. Use a component.**

```tsx
import { Button } from "@dbm-system/components";

export function Example() {
  return <Button>Save</Button>;
}
```

Reference semantic tokens (`color.bg.brand`, `space.4`) and never hardcode a colour, spacing value or duration.

### Offering more than one theme

Each bundled file includes the primitives and the component tokens, so importing two repeats those declarations, which is harmless. To avoid it, import the shared files once and one file per theme:

```ts
import "@dbm-system/tokens/css/primitives.css";
import "@dbm-system/tokens/css/component-tokens.css";
import "@dbm-system/tokens/css/purple-light.css";
import "@dbm-system/tokens/css/purple-dark.css";
```

## For AI agents

The package ships a machine-readable index of every component, its props and parts, and its hooks and functions. It is 1.8 MB in one file, so it is also split:

| File | What it holds |
|---|---|
| `@dbm-system/components/manifest/index.json` | Every component and helper (name, tier, category, one sentence) and the path of its file; read this first, about 35 KB |
| `@dbm-system/components/manifest/components/<Name>.json` | One component in full: its props, parts and examples |
| `@dbm-system/components/manifest/helpers/<Name>.json` | One helper in full (a component that supports another, such as `TooltipProvider`; `helperOf` names it) |
| `@dbm-system/components/manifest/utilities.json` | Every hook, function and constant |
| `@dbm-system/components/manifest.json` | All of the above in one file |
| `@dbm-system/components/manifest.schema.json` | The shape of each file |

`AGENTS.md`, at the root of this package, is the short guide for a coding agent: where to look, how to set up, the rules that hold across components, and every public name. The manifest is for the version you installed.

## Links

- Documentation and Storybook: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
