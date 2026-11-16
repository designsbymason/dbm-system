// The consumer agent guide at a stable root address (ADR-0213): the `AGENTS.md` that ships in
// @dbm-system/components, copied at build so the two never differ.
import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export const GET: APIRoute = () => {
  const packageDir = dirname(createRequire(import.meta.url).resolve("@dbm-system/components/package.json"));
  return new Response(readFileSync(join(packageDir, "AGENTS.md"), "utf8"), { headers: { "content-type": "text/markdown; charset=utf-8" } });
};
