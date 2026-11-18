#!/usr/bin/env node
/**
 * Assembles the site with Storybook beside it in `_artifact/`, the way the Pages workflow does, so the `site-preview` server (and the
 * gates) look at current files. The folder is deleted and rebuilt each time, so it cannot be a stale copy.
 *
 *   pnpm assemble-local [--skip-storybook]
 *
 * 1. builds the home page (`dist/`); 2. builds Storybook (`storybook-static/`; `--skip-storybook` reuses the one that is there, for a
 * change to the home page alone, and builds it when there is none); 3. copies both into `_artifact/`; 4. writes the root `robots.txt` and `sitemap.xml` and the agent
 * files; 5. runs the agent-files and CSS checks. It starts no server and touches no git state: `_artifact/`, `dist/` and
 * `storybook-static/` are all ignored. The workspace packages must already be built (`pnpm build` at the root).
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a CLI's progress lines */

const docs = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(docs, "..", "..");
const skipStorybook = process.argv.includes("--skip-storybook");
const artifact = join(docs, "_artifact");
const storybookStatic = join(repo, "packages", "components", "storybook-static");

function run(label, command, args, cwd = repo) {
  console.log(`\nassemble-local: ${label}`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\nassemble-local: "${label}" failed; the folder ${artifact} is not complete`);
    process.exit(result.status ?? 1);
  }
}

run("building the home page", "pnpm", ["--filter", "@dbm-system/docs", "build"]);
if (skipStorybook && existsSync(join(storybookStatic, "index.json"))) {
  console.log("\nassemble-local: reusing the Storybook already built (--skip-storybook)");
} else {
  if (skipStorybook) console.log("\nassemble-local: --skip-storybook, but no Storybook has been built yet, so building it");
  run("building Storybook", "pnpm", ["--filter", "@dbm-system/components", "build-storybook"]);
}

console.log("\nassemble-local: assembling _artifact/");
rmSync(artifact, { recursive: true, force: true });
mkdirSync(artifact, { recursive: true });
cpSync(join(docs, "dist"), artifact, { recursive: true });
cpSync(storybookStatic, join(artifact, "storybook"), { recursive: true });

run("writing robots.txt and sitemap.xml", "node", ["scripts/assemble-seo.mjs", "_artifact", "--home"], docs);
run("writing the agent files", "pnpm", ["generate-agent-files", "_artifact"], docs);
run("checking the agent files", "pnpm", ["check-agent-files", "_artifact"], docs);
run("checking the built CSS", "pnpm", ["check-css", "_artifact"], docs);

console.log(`\nassemble-local: ready in ${artifact}; serve it with \`node scripts/serve.mjs _artifact 4322\` (the site-preview entry in .claude/launch.json)`);
