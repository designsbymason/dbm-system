// The manifest entry of each demo component, as the JSON an agent reads, cut into segments so the island can highlight the entries the
// example uses. The entries are the real ones, read here at build from the manifest the package ships: the props whole, the parts without
// their own props (a part is a component of its own, with its own file's worth of them). A name the demo uses that the manifest does not have
// fails the build.
import manifest from "@dbm-system/components/manifest.json" with { type: "json" };
import { agentDemos } from "./agentDemos";

/** A run of the JSON: plain, or the entry of one prop or part (which the example uses) when `key` is set. */
export interface Segment {
  text: string;
  key?: string;
}

export interface Excerpt {
  name: string;
  jsx: string;
  /** The names the example uses, to highlight in the code. */
  used: string[];
  /** The manifest file this is an entry of, as an agent opens it. */
  file: string;
  segments: Segment[];
  propsUsed: number;
  propsTotal: number;
  partsUsed: number;
  partsTotal: number;
}

const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => " ".repeat(spaces) + line)
    .join("\n");

type Prop = { name: string };
type Part = { name: string; summary: string; forwardsRef: boolean; refElement?: string };

function build(demo: (typeof agentDemos)[number]): Excerpt {
  const component = manifest.components.find((candidate) => candidate.name === demo.name);
  if (!component) throw new Error(`agentExcerpts: no component ${demo.name} in the manifest`);
  const props = component.props as unknown as Prop[];
  const parts = (component.parts ?? []) as unknown as Part[];

  const usedProps = demo.props.map((name) => {
    const prop = props.find((candidate) => candidate.name === name);
    if (!prop) throw new Error(`agentExcerpts: ${demo.name} has no prop "${name}" in the manifest`);
    return prop;
  });
  const usedParts = demo.parts.map((name) => {
    const part = parts.find((candidate) => candidate.name === name);
    if (!part) throw new Error(`agentExcerpts: ${demo.name} has no part "${name}" in the manifest`);
    return { name: part.name, summary: part.summary, forwardsRef: part.forwardsRef, refElement: part.refElement };
  });

  const segments: Segment[] = [];
  const plain = (text: string) => segments.push({ text });
  const entries = (items: object[], names: string[], omitted: number, noun: string) => {
    items.forEach((item, index) => {
      const last = index === items.length - 1 && omitted === 0;
      segments.push({ key: names[index], text: `${indent(JSON.stringify(item, null, 2), 4)}${last ? "" : ","}\n` });
    });
    if (omitted > 0) plain(`    … ${omitted} more ${noun}\n`);
  };

  plain(
    `{\n  "name": ${JSON.stringify(component.name)},\n  "tier": ${JSON.stringify(component.tier)},\n  "category": ${JSON.stringify(component.category)},\n  "summary": ${JSON.stringify(component.summary)},\n`,
  );
  if (usedProps.length === 0) {
    plain(`  "props": [\n    … ${props.length} props\n  ]${usedParts.length ? "," : ""}\n`);
  } else {
    plain(`  "props": [\n`);
    entries(usedProps, demo.props, props.length - usedProps.length, "props");
    plain(`  ]${usedParts.length ? "," : ""}\n`);
  }
  if (usedParts.length > 0) {
    plain(`  "parts": [\n`);
    entries(usedParts, demo.parts, parts.length - usedParts.length, "parts");
    plain(`  ]\n`);
  }
  plain(`}`);

  return {
    name: demo.name,
    jsx: demo.jsx,
    used: [...demo.props, ...demo.parts],
    file: `manifest/components/${component.name}.json`,
    segments,
    propsUsed: usedProps.length,
    propsTotal: props.length,
    partsUsed: usedParts.length,
    partsTotal: parts.length,
  };
}

export const agentExcerpts: Excerpt[] = agentDemos.map(build);
