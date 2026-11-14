# @dbm-system/icons

The typed icon set for the DBM System, a wrapper over [Phosphor Icons](https://phosphoricons.com) (MIT): every Phosphor icon, named like `PlusIcon`, with the `Icon` and `IconWeight` types. The components use it for every icon of their own, so an app gets one icon family.

## Install

```bash
pnpm add @dbm-system/icons
```

Install it beside `@dbm-system/components`, which does not re-export it: the components take icons as references (`<Button leadingIcon={PlusIcon}>`), and an app that passes one imports it from here. React 18 or newer is a peer dependency, and `@phosphor-icons/react` is installed with it.

## Use

```tsx
import { PlusIcon } from "@dbm-system/icons";

export function Example() {
  return <PlusIcon size={16} aria-hidden />;
}
```

An icon that carries meaning on its own needs an accessible name; a decorative one is hidden from assistive technology.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
