import type { Manifest, ManifestComponent, ManifestIndex, ManifestUtilitiesFile } from "./types";

// A sentence ends at ., ! or ? followed by a space and a capital letter or a backtick; these end in a full stop without ending one.
const ABBREVIATIONS = /(?:\be\.g|\bi\.e|\betc|\bvs|\bcf)\.$/i;

/**
 * The first sentence of a summary, for the index. A summary that is one sentence comes back whole. It stops at the first full stop
 * (or `!`, `?`) that is followed by a space and a capital letter or a backtick and is not `e.g.`, `i.e.`, `etc.`, `vs.` or `cf.`.
 */
export function firstSentence(summary: string): string {
  const text = summary.trim();
  for (const match of text.matchAll(/[.!?](?=\s+[A-Z`])/g)) {
    const end = (match.index ?? 0) + 1;
    if (!ABBREVIATIONS.test(text.slice(0, end))) return text.slice(0, end);
  }
  return text;
}

/** The files of the split layout, by path relative to the `manifest` folder, each the object to write as JSON. */
export type SplitFiles = Record<string, ManifestIndex | ManifestUtilitiesFile | ManifestComponent>;

/**
 * The split layout of ADR-0206: an index, one file per component (its entry in the manifest, unchanged) and one file for the hooks,
 * functions and constants. Nothing here adds information; it is the same manifest cut into parts.
 */
export function splitManifest(manifest: Manifest): SplitFiles {
  const { schemaVersion, package: name, version } = manifest;
  const files: SplitFiles = {
    "index.json": {
      schemaVersion,
      package: name,
      version,
      components: manifest.components.map((component) => ({
        name: component.name,
        tier: component.tier,
        category: component.category,
        summary: firstSentence(component.summary),
        file: `components/${component.name}.json`,
      })),
      utilities: manifest.utilities.map((utility) => ({ name: utility.name, kind: utility.kind, summary: firstSentence(utility.summary) })),
      utilitiesFile: "utilities.json",
    },
    "utilities.json": { schemaVersion, package: name, version, utilities: manifest.utilities, constants: manifest.constants },
  };
  for (const component of manifest.components) files[`components/${component.name}.json`] = component;
  return files;
}
