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

/** Names in the hand-written text that are not components: the fonts the guide tells an app to load. */
const NOT_COMPONENTS = new Set(["Nunito", "Lora"]);

/** `<Name>` in a path such as `manifest/components/<Name>.json` stands for a component name; it is not an element. */
const PLACEHOLDERS = new Set(["Name"]);

/** Attributes in the text that belong to the page, not to a component: `data-theme` on the root element chooses a theme. */
const NOT_PROPS = new Set(["data-theme"]);

/**
 * What is wrong with the hand-written text of `AGENTS.md` (ADR-0208): a name, prop, token or example the manifest and the token CSS do not
 * back. The generated block is left out. Checked, in inline code and in fenced code:
 *   - a whole span that is a component or part name (`Menu.Item`) must be one in the manifest;
 *   - a whole span that is a camelCase name (`asChild`, `useTheme`) must be a prop of some component or a hook or function;
 *   - a whole span that is `aria-…` or `data-…` must be a prop of some component;
 *   - every `--dbm-…` token must be declared in the token CSS;
 *   - every JSX tag that names a component or part must exist, and a camelCase attribute on it must be one of its props.
 * Plain lower-case words (`size`, `light`) are not checked: they are words as often as props. `ref` and `children` are React's, not the manifest's.
 */
export function agentsProblems(text: string, manifest: Manifest, tokenNames: ReadonlySet<string>): string[] {
  const start = text.indexOf(AGENTS_START);
  const end = text.indexOf(AGENTS_END);
  const handWritten = start !== -1 && end > start ? `${text.slice(0, start)}${text.slice(end + AGENTS_END.length)}` : text;

  const parts = new Map<string, { name: string; props: Set<string> }>();
  for (const component of manifest.components) {
    parts.set(component.name, { name: component.name, props: new Set(component.props.map((prop) => prop.name)) });
    for (const part of component.parts) parts.set(part.name, { name: part.name, props: new Set(part.props.map((prop) => prop.name)) });
  }
  const everyProp = new Set(manifest.components.flatMap((component) => [...component.props, ...component.parts.flatMap((part) => part.props)].map((prop) => prop.name)));
  const utilities = new Set(manifest.utilities.map((utility) => utility.name));

  const spans = [...handWritten.matchAll(/```[\s\S]*?```|`[^`\n]+`/g)].map((match) => match[0]);
  const problems: string[] = [];
  const problem = (message: string) => {
    if (!problems.includes(message)) problems.push(message);
  };
  for (const span of spans) {
    const inner = span.replace(/^`+|`+$/g, "").trim();
    if (/^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)?$/.test(inner) && !NOT_COMPONENTS.has(inner) && !parts.has(inner)) problem(`\`${inner}\` is not a component or part in the manifest`);
    if (/^[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*$/.test(inner) && !everyProp.has(inner) && !utilities.has(inner)) problem(`\`${inner}\` is not a prop of any component or a hook or function in the manifest`);
    if (/^(aria|data)-[a-z-]+$/.test(inner) && !NOT_PROPS.has(inner) && !everyProp.has(inner)) problem(`\`${inner}\` is not a prop of any component in the manifest`);
    for (const [token] of span.matchAll(/--dbm-[a-z0-9-]+/g)) if (!tokenNames.has(token)) problem(`\`${token}\` is not a token the token CSS declares`);
    for (const [, tag, attributes = ""] of span.matchAll(/<([A-Z][A-Za-z0-9]*(?:\.[A-Z][A-Za-z0-9]*)?)\b([^>]*)>/g)) {
      if (PLACEHOLDERS.has(tag ?? "")) continue;
      const found = parts.get(tag ?? "");
      if (!found) {
        problem(`<${tag}> in the examples is not a component or part in the manifest`);
        continue;
      }
      // What is inside braces is an expression, not an attribute name, so it is taken out first (a few levels deep).
      let bare = attributes;
      for (let level = 0; level < 4; level++) bare = bare.replace(/\{[^{}]*\}/g, "");
      for (const [, attribute] of bare.matchAll(/(?:^|\s)([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)(?=[=\s/]|$)/g)) {
        if (attribute && !found.props.has(attribute)) problem(`<${tag} ${attribute}=…> in the examples: ${attribute} is not a prop of ${tag} in the manifest`);
      }
    }
  }
  return problems;
}
