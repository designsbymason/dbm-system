#!/usr/bin/env node
/**
 * Checks that a change to a published package comes with a changeset, so the next Version Packages pull request
 * ships it (RELEASING.md step 1). It looks at the commits in a range, `--base` (default `origin/main`) to `--head`
 * (default `HEAD`): when any of them changes a file a consumer receives (the source of `@dbm-system/components`,
 * `tokens`, `utils`, `icons` or `mcp`, not its tests, stories, docs pages or tooling), the range must also add a file
 * to `.changeset/`. A change that needs no release says so with an empty changeset (`pnpm changeset --empty`), which
 * this accepts. The release commits Changesets makes ("chore: version packages") are skipped.
 *
 * Exits non-zero when a published package changed with no changeset in the range. Run from the repository root:
 * `pnpm check-changeset`. CI runs it on every push and pull request, and `.githooks/pre-push` runs it before a push.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACKAGES = ["components", "tokens", "utils", "icons", "mcp"];

/** Files under a package's `src/` that are not shipped: tests, stories, docs pages, snippets, story kits and the Storybook-only pages. */
const NOT_SHIPPED = [
  /\.test\.[cm]?[jt]sx?$/,
  /\.stories\.[jt]sx?$/,
  /\.mdx?$/,
  /\.snippets\.[jt]s$/,
  /\.snippetScope\.txt$/,
  /StoryKit\.[jt]sx?$/,
  /(^|\/)(foundations|guides|__tests__|__snapshots__)\//,
];

/** True when this path is a file a consumer of a published package receives (so a change to it is a change to release). */
export function shipsToConsumers(path) {
  const match = /^packages\/([^/]+)\/src\//.exec(path);
  if (!match || !PACKAGES.includes(match[1])) return false;
  return !NOT_SHIPPED.some((pattern) => pattern.test(path));
}

/** True when this path is a changeset (a Markdown file in `.changeset/` other than its README). */
export function isChangeset(path) {
  return /^\.changeset\/[^/]+\.md$/.test(path) && path !== ".changeset/README.md";
}

/** True for the commit Changesets makes when it versions the packages, which consumes changesets rather than needing one. */
export function isReleaseCommit(subject) {
  return /^chore: version packages/i.test(subject);
}

/**
 * Reads the commits in `base..head` (a subject and the files each changed) and returns what is wrong, or an empty list.
 * `log` is the output of `git log --name-status --format=%x00%s base..head`.
 */
export function problems(log) {
  const shipped = new Set();
  let addedChangeset = false;
  for (const block of log.split("\0").slice(1)) {
    const [subject, ...lines] = block.split("\n");
    if (isReleaseCommit(subject)) continue;
    for (const line of lines) {
      const [status, ...paths] = line.split("\t");
      if (!status || !paths.length) continue;
      const path = paths[paths.length - 1];
      if (isChangeset(path) && status[0] !== "D") addedChangeset = true;
      if (shipsToConsumers(path)) shipped.add(path);
    }
  }
  if (!shipped.size || addedChangeset) return [];
  return [...shipped].sort();
}

function arg(name, fallback) {
  const at = process.argv.indexOf(name);
  return at > 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
}

function main() {
  const base = arg("--base", "origin/main");
  const head = arg("--head", "HEAD");
  if (/^0+$/.test(base)) {
    console.log("check-changeset: a new branch has no base to compare with, skipped.");
    return;
  }
  const log = execFileSync("git", ["log", "--name-status", "--format=%x00%s", `${base}..${head}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const shipped = problems(log);
  if (!shipped.length) {
    console.log(`check-changeset: ok (${base}..${head})`);
    return;
  }
  console.error(`check-changeset: ${base}..${head} changes a published package and adds no changeset:`);
  for (const path of shipped.slice(0, 12)) console.error(`  ${path}`);
  if (shipped.length > 12) console.error(`  and ${shipped.length - 12} more`);
  console.error(
    "Add one with `pnpm changeset` (patch, or minor for a breaking change before 1.0, written for a reader), or `pnpm changeset --empty` when the change needs no release. RELEASING.md step 1.",
  );
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
