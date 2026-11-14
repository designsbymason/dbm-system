# @dbm-system/manifest

The build tool that generates the agent-readable JSON component manifest for the DBM System: a structured, typed index of every component's props, variants and constraints, extracted from the TypeScript types and JSDoc, so an agent can query the API instead of parsing prose.

## Install

```bash
pnpm add -D @dbm-system/manifest
```

## Use

```bash
dbm-manifest --root path/to/components-package --out manifest.json
```

It reads the package's `src/index.ts`, the TypeScript types and JSDoc, and the stories' titles, and writes the manifest described by `@dbm-system/manifest/manifest.schema.json`. It lists what it found missing (props without a description, components without an `@example`) after the summary line; `--quiet` leaves that list out.

```ts
import { generateManifest } from "@dbm-system/manifest";

const { manifest, diagnostics } = generateManifest({ packageRoot: "path/to/components-package" });
```

`typescript` 5 or newer is a peer dependency.

## Links

- Documentation: https://dbm-system.com
- Issues: https://github.com/designsbymason/dbm-system/issues

## License

MIT
