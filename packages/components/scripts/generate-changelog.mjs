// Writes Storybook's Changelog page (Resources/Changelog) from the five packages' CHANGELOG.md files, which Changesets
// rewrites on every release (guidelines/docs-site/04-content-inventory.md §1). The page is generated, never committed
// (src/guides/Changelog.generated.mdx is gitignored), so it cannot disagree with the files; `storybook` and
// `build-storybook` run this first. A package whose file has no version section fails the run instead of leaving a blank.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(here, "..", "..");
export const outputPath = join(here, "..", "src", "guides", "Changelog.generated.mdx");

/** The packages in the order the page shows them: the one most readers want first. `short` keeps each version heading unique. */
export const PACKAGES = [
  { dir: "components", short: "components", note: "The components, their stylesheet, the manifest and `AGENTS.md`." },
  { dir: "tokens", short: "tokens", note: "The design tokens, as theme CSS and typed constants." },
  { dir: "icons", short: "icons", note: "The Phosphor icon set, typed." },
  { dir: "utils", short: "utils", note: "Helpers the components are built on; an app does not install it." },
  { dir: "mcp", short: "mcp", note: "A read-only MCP server that answers an agent's questions about the components, hooks and tokens." },
];

/** Escape what MDX would read as JSX or an expression (`<`, `{`), leaving code spans alone. */
function escapeProse(line) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(/[<{]/g, (char) => `\\${char}`)))
    .join("");
}

/** The MDX for one changelog's body: fenced code kept as is, prose escaped, Changesets' `###` headings made bold lines. */
export function convertBody(markdown) {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      const heading = line.match(/^###\s+(.*)$/);
      if (heading) return `**${escapeProse(heading[1])}**`;
      return escapeProse(line);
    })
    .join("\n");
}

/** Split a CHANGELOG.md into `{ version, body }` sections, newest first (the order Changesets writes them). */
export function parseChangelog(markdown) {
  const sections = [];
  let current;
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const version = inFence ? undefined : line.match(/^##\s+(\S+)\s*$/);
    if (version) {
      current = { version: version[1], lines: [] };
      sections.push(current);
    } else current?.lines.push(line);
  }
  return sections.map(({ version, lines }) => ({ version, body: lines.join("\n").trim() }));
}

/** How many releases the page shows; older ones are on GitHub and in each package's `CHANGELOG.md`. */
export const RELEASE_LIMIT = 10;
const REPOSITORY = "https://github.com/designsbymason/dbm-system";
const NO_CHANGES = "No changes in this release.";

/** Orders versions newest first by their numeric parts (`0.10.0` after `0.9.0`). */
function compareVersions(a, b) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (right[index] ?? 0) - (left[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** The release series a version belongs to: `0.2.1` is in `0.2.x`. */
const seriesOf = (version) => `${version.split(".").slice(0, 2).join(".")}.x`;

/**
 * The releases, newest first, each with the packages that changed in it. The five packages are released together at one version, so a
 * release is one entry and a package whose changelog says "No changes in this release." is left out of it. A package that joined later
 * (`mcp` has no section before 0.2.2) simply has nothing in the earlier releases.
 */
export function collectReleases(read) {
  const byVersion = new Map();
  for (const { dir } of PACKAGES) {
    const sections = parseChangelog(read(dir));
    if (sections.length === 0) throw new Error(`generate-changelog: packages/${dir}/CHANGELOG.md has no version section`);
    for (const { version, body } of sections) {
      const release = byVersion.get(version) ?? { version, packages: [] };
      if (body !== NO_CHANGES && body !== "") release.packages.push({ dir, body });
      byVersion.set(version, release);
    }
  }
  return [...byVersion.values()].sort((a, b) => compareVersions(a.version, b.version));
}

/** One release as MDX: its version as a heading (so the page's table of contents lists it) and a section for each package that changed. */
function renderRelease({ version, packages }) {
  const out = [`## ${version}`, ``];
  if (packages.length === 0) out.push(NO_CHANGES, ``);
  for (const { dir, body } of packages) out.push(`### @dbm-system/${dir}`, ``, convertBody(body), ``);
  return out;
}

export function buildPage(read = (dir) => readFileSync(join(packagesDir, dir, "CHANGELOG.md"), "utf8")) {
  const releases = collectReleases(read);
  const shown = releases.slice(0, RELEASE_LIMIT);
  const older = releases.length - shown.length;
  const parts = [
    `{/* Generated by scripts/generate-changelog.mjs from the packages' CHANGELOG.md files. Do not edit; it is gitignored. */}`,
    `import { Meta } from "@storybook/addon-docs/blocks";`,
    `import { ThemeSync } from "../../.storybook/blocks/foundations";`,
    `import { VisuallyHidden } from "../atoms/VisuallyHidden";`,
    ``,
    `{/* The id keeps the address this page had in the Resources group, so links to it still work. */}`,
    `<Meta title="Getting started/Changelog" id="resources-changelog" />`,
    ``,
    `<ThemeSync />`,
    ``,
    `<VisuallyHidden asChild><h2>Intro</h2></VisuallyHidden>`,
    ``,
    `# Changelog`,
    ``,
    `What changed in each release, newest first. The five packages (\`components\`, \`tokens\`, \`icons\`, \`utils\` and \`mcp\`) are released together at one`,
    `version, so each release lists the packages that changed. The API is pre-1.0: a breaking change before \`1.0.0\` bumps the minor`,
    `version, and its entry says how to migrate. The page shows the latest ${RELEASE_LIMIT} releases: the current series is open and`,
    `earlier ones are folded. Every release is on [GitHub](${REPOSITORY}/releases).`,
    ``,
  ];
  // The newest series is open; each earlier series in the window is folded, its releases still in the page.
  const newest = shown.length > 0 ? seriesOf(shown[0].version) : "";
  const series = [];
  for (const release of shown) {
    const name = seriesOf(release.version);
    if (series.at(-1)?.name !== name) series.push({ name, releases: [] });
    series.at(-1).releases.push(release);
  }
  for (const { name, releases: group } of series) {
    if (name === newest) {
      for (const release of group) parts.push(...renderRelease(release));
      continue;
    }
    parts.push(`<details>`, `<summary>Earlier releases: ${name} (${group.length})</summary>`, ``);
    for (const release of group) parts.push(...renderRelease(release));
    parts.push(`</details>`, ``);
  }
  const files = PACKAGES.map(({ dir }) => `[${dir}](${REPOSITORY}/blob/main/packages/${dir}/CHANGELOG.md)`).join(", ");
  parts.push(
    `## Older releases`,
    ``,
    older > 0
      ? `${older} earlier ${older === 1 ? "release is" : "releases are"} not shown here (before ${shown.at(-1).version}). Each is on [GitHub](${REPOSITORY}/releases), and the full history is in each package's \`CHANGELOG.md\`: ${files}.`
      : `This is every release so far. The full history is also in each package's \`CHANGELOG.md\`: ${files}.`,
    ``,
  );
  return `${parts.join("\n").trimEnd()}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const { dir } of PACKAGES) {
    if (!existsSync(join(packagesDir, dir, "CHANGELOG.md"))) throw new Error(`generate-changelog: packages/${dir}/CHANGELOG.md is missing`);
  }
  writeFileSync(outputPath, buildPage());
  process.stdout.write(`generate-changelog: wrote ${outputPath.slice(packagesDir.length - "packages".length)}\n`);
}
