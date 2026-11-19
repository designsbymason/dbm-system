import { defineConfig } from "tsup";

/** One ESM program: `src/index.ts` starts with the shebang the `bin` needs, and tsup keeps it and marks the output executable. */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  sourcemap: true,
  clean: true,
});
