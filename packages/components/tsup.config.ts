import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "tsup";

// One ES module per export of `src/index.ts` (ADR-0219): `export * from "./atoms/Button"` becomes its own entry,
// and code splitting puts what two entries share in one chunk, so a bundler can leave out every component an app
// doesn't import (`"sideEffects": ["*.css"]` tells it the JavaScript has none). `dist/index.js` still exports
// everything, so `import { Button } from "@dbm-system/components"` is unchanged. Read from the index file so a new
// export can't be forgotten here.
const sourceOf = (path: string) => {
  const found = [`src/${path}.ts`, `src/${path}.tsx`, `src/${path}/index.ts`, `src/${path}/index.tsx`].find((file) => existsSync(file));
  if (!found) throw new Error(`tsup.config.ts: no source for the export "./${path}" in src/index.ts`);
  return found;
};
const componentEntries = Object.fromEntries(
  [...readFileSync("src/index.ts", "utf8").matchAll(/^export \* from "\.\/(.+)";$/gm)].map(([, path]) => [path, sourceOf(path)]),
);

// esbuild's built-in CSS Modules support: this package only ever contains
// *.module.css files, so scoping every .css import is safe (tsup's own CSS
// plugin intercepts all .css files via one loader — it can't discriminate
// by the ".module.css" vs ".css" suffix, only by top-level ".css" key).
const loader = { ".css": "local-css" } as const;

// `dist/` is emptied by the build script before tsup runs (scripts/dist-files.mjs): the two configurations below run at
// once, so neither cleans it.
export default defineConfig([
  // ES modules: an entry per component and a shared chunk for common code. The types come from the index only.
  {
    entry: { index: "src/index.ts", ...componentEntries },
    format: ["esm"],
    splitting: true,
    dts: { entry: { index: "src/index.ts" } },
    sourcemap: true,
    treeshake: true,
    external: ["react", "react-dom"],
    loader,
  },
  // CommonJS: one file, as before; `require` has no tree shaking to gain from more files.
  {
    entry: { index: "src/index.ts" },
    format: ["cjs"],
    dts: { entry: { index: "src/index.ts" } },
    sourcemap: true,
    treeshake: true,
    external: ["react", "react-dom"],
    loader,
  },
]);
