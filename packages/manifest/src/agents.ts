import type { Manifest, ManifestTier } from "./types";

/** The two lines that fence the generated block in `AGENTS.md`; nothing outside them is touched (ADR-0208). */
export const AGENTS_START = "<!-- components:start -->";
export const AGENTS_END = "<!-- components:end -->";

const TIERS: { tier: ManifestTier; heading: string }[] = [
  { tier: "atom", heading: "Atoms" },
  { tier: "molecule", heading: "Molecules" },
  { tier: "organism", heading: "Organisms" },
  { tier: "template", heading: "Templates" },
];

const sorted = (names: string[]): string[] => [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/**
 * The generated list for `AGENTS.md`: every component by tier and category, then every hook and function, names only. The one-sentence
 * summaries are in `manifest/index.json`, so this stays small enough to read on every use. Deterministic: the same manifest gives the same text.
 */
export function renderAgentsList(manifest: Manifest): string {
  const lines: string[] = [];
  for (const { tier, heading } of TIERS) {
    const inTier = manifest.components.filter((component) => component.tier === tier);
    if (inTier.length === 0) continue;
    lines.push(`**${heading}**`, "");
    const categories = [...new Set(inTier.map((component) => component.category))].sort();
    for (const category of categories) {
      const names = sorted(inTier.filter((component) => component.category === category).map((component) => component.name));
      lines.push(`- ${category}: ${names.join(", ")}`);
    }
    lines.push("");
  }
  for (const [heading, kind] of [["Hooks", "hook"], ["Functions", "function"]] as const) {
    const names = sorted(manifest.utilities.filter((utility) => utility.kind === kind).map((utility) => utility.name));
    if (names.length > 0) lines.push(`**${heading}:** ${names.join(", ")}`, "");
  }
  return lines.join("\n").trimEnd();
}

/**
 * `file` with the text between the two markers replaced by `list`, and everything outside them left exactly as it was. Throws when the
 * markers are missing, repeated or out of order, so a damaged file is never guessed at.
 */
export function updateAgentsBlock(file: string, list: string): string {
  const start = file.indexOf(AGENTS_START);
  const end = file.indexOf(AGENTS_END);
  if (start === -1 || end === -1 || end < start || file.indexOf(AGENTS_START, start + 1) !== -1 || file.indexOf(AGENTS_END, end + 1) !== -1) {
    throw new Error(`AGENTS.md needs exactly one ${AGENTS_START} followed by one ${AGENTS_END}`);
  }
  return `${file.slice(0, start + AGENTS_START.length)}\n\n${list}\n\n${file.slice(end)}`;
}
