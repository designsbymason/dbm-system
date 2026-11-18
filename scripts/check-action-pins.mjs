#!/usr/bin/env node
/**
 * The workflow pin check: every action a workflow uses is named by the full commit it is, with its version in a comment
 * (`uses: actions/checkout@<40 hex characters> # v7.0.1`), so a tag that is moved later cannot change what runs. It fails on a `uses:`
 * in `.github/workflows/` and `.github/actions/` that names a tag or a branch, and on a container image without a digest. A local action
 * (`./…`) is exempt.
 *
 *   node scripts/check-action-pins.mjs
 *
 * The pins are refreshed in the dependency pass (`guidelines/02-tech-stack-and-structure.md` §3.2, step 3): look up the commit of the
 * tag you want (`gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`) and write the version in the comment.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* eslint-disable no-console -- a CLI check's report */

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The problems in one workflow or action file's text, as `line: message` strings. */
export function unpinned(text) {
  const problems = [];
  text.split("\n").forEach((line, index) => {
    const match = /^\s*(?:-\s+)?uses:\s*(\S+)/.exec(line);
    if (!match) return;
    const ref = match[1].replace(/^["']|["']$/g, "");
    if (ref.startsWith("./")) return;
    if (ref.startsWith("docker://")) {
      if (!/@sha256:[0-9a-f]{64}$/.test(ref)) problems.push(`${index + 1}: ${ref} is a container image with no digest`);
      return;
    }
    if (!/@[0-9a-f]{40}$/.test(ref)) problems.push(`${index + 1}: ${ref} is not pinned to a full commit`);
    else if (!/#\s*v?\d/.test(line)) problems.push(`${index + 1}: ${ref} has no version in a comment`);
  });
  return problems;
}

function* files(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.ya?ml$/.test(entry.name)) yield path;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failures = [];
  let count = 0;
  for (const root of [join(repo, ".github", "workflows"), join(repo, ".github", "actions")]) {
    for (const file of files(root)) {
      const text = readFileSync(file, "utf8");
      count += (text.match(/^\s*(?:-\s+)?uses:/gm) ?? []).length;
      for (const problem of unpinned(text)) failures.push(`${file.slice(repo.length + 1)}:${problem}`);
    }
  }
  if (failures.length > 0) {
    console.error(`check-action-pins: ${failures.length} problem(s)\n${failures.map((line) => `  ${line}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`check-action-pins: all ${count} actions are pinned to a full commit`);
}
