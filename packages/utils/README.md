# @dbm-system/utils

Small framework-agnostic utilities and shared hooks for the DBM System: class-name and ref merging, responsive-value helpers, and hooks for announcements, scroll edges, sortable lists and persistent dismissal.

`@dbm-system/components` re-exports the parts an app is meant to call (`usePersistentDismiss`, `useRecentCommands`, `formatRelativeTime` and the `Responsive`, `SpaceValue` and `Breakpoint` types), so an app that uses the components needs no separate install.

## Install

```bash
pnpm add @dbm-system/utils
```

React 18 or newer is a peer dependency.

## Use

```ts
import { cx, formatRelativeTime } from "@dbm-system/utils";
```

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
