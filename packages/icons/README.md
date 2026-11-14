# @dbm-system/icons

The typed icon set for the DBM System, a wrapper over [Phosphor Icons](https://phosphoricons.com) (MIT). The components use it for every icon, so an app gets one icon family.

## Install

```bash
pnpm add @dbm-system/icons
```

React 18 or newer is a peer dependency. `@phosphor-icons/react` is installed with it.

## Use

```tsx
import { Plus } from "@dbm-system/icons";

export function Example() {
  return <Plus size={16} aria-hidden />;
}
```

An icon that carries meaning on its own needs an accessible name; a decorative one is hidden from assistive technology.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
