# @dbm-system/manifest

The build tool of the DBM System repository that generates the machine-readable JSON component manifest. **It is a private tool and is not published.** An app does not use it: the manifest it makes ships inside `@dbm-system/components`, as `@dbm-system/components/manifest/index.json` and one file per component and per helper (a component written in another's folder, such as `TooltipProvider`, which is listed apart; see that package's README).

It reads the TypeScript types and JSDoc of the components package, its catalog of each component's tier and category (`src/componentCatalog.json`, keyed by the component's folder name), and, for templates, the titles of their stories (`Templates/Shells/AppShell`), so it expects this repository's layout: a package with a `src/index.ts` barrel, a `tsconfig.json`, components with JSDoc in `src/atoms`, `src/molecules`, `src/organisms` or `src/templates`, and the catalog.

## Use

The components build runs it. To run it by hand, after `pnpm build`:

```bash
node packages/manifest/dist/cli.js --root packages/components --out manifest.json
```

It writes the manifest described by `schema/manifest.schema.json` and lists what it found missing (props without a description, components without an `@example`) after the summary line, exiting 1 if there is any; `--quiet` leaves the list out. `--with-schema` also writes the schema, `--split <folder>` the index and the per-component files, and `--agents <file>` rewrites the generated list in `AGENTS.md` (`pnpm sync-agents` does that).

```ts
import { generateManifest } from "@dbm-system/manifest";

const { manifest, diagnostics } = generateManifest({ packageRoot: "packages/components" });
```

## License

MIT
