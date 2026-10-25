import { isDisabled } from "../../internal/optionList/optionList.rows";
import type { CommandItem, CommandPaletteLabels, CommandPaletteMode, CommandPaletteProps } from "./CommandPalette.types";
import { capGroups } from "./commandPalette.groups";
import { rankCommands } from "./commandPalette.rank";

/** Joins a parent command's value and a child's into the key a nested search hit is listed under. */
export const NESTED_SEPARATOR = "\u0001";

/** The value of the one row that runs a command with an `argument`. */
export const ARGUMENT_VALUE = "\u0000run";

/** A command as listed: the command itself, the one it was found inside (for a nested search hit), and the row drawn for it. */
export interface Entry {
  item: CommandItem;
  parent?: CommandItem;
  shown: CommandItem;
}

/** For each "Show more" row, the group it opens and the first command it will reveal. */
export type MoreRows = Map<string, { group: string; first: string }>;

const NO_MORE_ROWS: MoreRows = new Map();

/**
 * The commands of one list by value, and, while a search at the top level also looks inside lists, the commands inside
 * them: each under its parent's label with a key of its own (a child's value may repeat a top-level one), the parent's
 * label among its keywords, and nothing for a parent that can't run.
 */
export function buildEntries(level: CommandItem[], searchingNested: boolean): Map<string, Entry> {
  const map = new Map<string, Entry>();
  for (const item of level) map.set(item.value, { item, shown: item });
  if (!searchingNested) return map;
  for (const parent of level) {
    if (!parent.items || isDisabled(parent)) continue;
    for (const child of parent.items) {
      const value = `${parent.value}${NESTED_SEPARATOR}${child.value}`;
      const shown: CommandItem = { ...child, value, group: parent.label, items: undefined, keywords: [...(child.keywords ?? []), parent.label] };
      map.set(value, { item: child, parent, shown });
    }
  }
  return map;
}

interface VisibleInput {
  /** The command being asked for a value, if one is: the list is then the one row that runs it. */
  argument: { item: CommandItem; text: string; problem: string | undefined } | undefined;
  entries: Map<string, Entry>;
  filter: CommandPaletteProps["filter"];
  searchText: string;
  hasQuery: boolean;
  /** Whether the top level is on show (not a list, not a mode), where recent and suggested commands come first. */
  topLevel: boolean;
  recent: string[] | undefined;
  suggested: string[] | undefined;
  maxPerGroup: number;
  expanded: ReadonlySet<string>;
  labels: CommandPaletteLabels;
  /** Told, in development, when a function of the caller's threw. */
  warn: (message: string) => void;
}

/** What `filter` does with a command, treating a throw as "no match": a function of the caller's is untrusted. */
function keeps(filter: (item: CommandItem, query: string) => boolean, item: CommandItem, query: string, warn: (message: string) => void): boolean {
  try {
    return Boolean(filter(item, query));
  } catch (error) {
    warn(`CommandPalette: \`filter\` threw for the search "${query}", so no command was kept. A \`filter\` must not throw.`);
    if (process.env.NODE_ENV !== "production") console.warn(error);
    return false;
  }
}

/** What an `argument`'s `validate` says about the text, treating a throw as a refusal: a function of the caller's is untrusted. */
export function problemWith(
  command: CommandItem,
  text: string,
  labels: Pick<CommandPaletteLabels, "argumentEmpty" | "argumentInvalid">,
  warn: (message: string) => void,
): string | undefined {
  if (text === "") return labels.argumentEmpty;
  try {
    return command.argument?.validate?.(text);
  } catch (error) {
    warn(`CommandPalette: \`argument.validate\` of "${command.label}" threw, so the text was refused. A \`validate\` must not throw.`);
    if (process.env.NODE_ENV !== "production") console.warn(error);
    return labels.argumentInvalid;
  }
}

/**
 * The commands to draw, in order: for a command that asks for a value, the one row that runs it; otherwise the matches
 * (ranked, kept by the caller's `filter`, or as given), with recent and suggested commands first while the search is
 * empty, and each group cut to `maxPerGroup` with a row that shows the rest.
 */
export function buildVisible(input: VisibleInput): { visible: CommandItem[]; moreRows: MoreRows } {
  const { argument, entries, filter, searchText, hasQuery, topLevel, recent, suggested, maxPerGroup, expanded, labels, warn } = input;
  if (argument) {
    const row: CommandItem = {
      value: ARGUMENT_VALUE,
      label: argument.problem ?? labels.runWith(argument.text),
      icon: argument.item.icon,
      disabled: argument.problem !== undefined,
    };
    return { visible: [row], moreRows: NO_MORE_ROWS };
  }
  const all = [...entries.values()].map((entry) => entry.shown);
  let list: CommandItem[];
  if (filter === false) list = all;
  else if (typeof filter === "function") list = all.filter((shown) => keeps(filter, (entries.get(shown.value) as Entry).item, searchText, warn));
  else list = rankCommands(all, searchText);
  const exempt = new Set<string>();
  if (!hasQuery && topLevel) {
    // The groups of commands put first: recent ones, then suggested ones. A command shows once, in the first that names it.
    const taken = new Set<string>();
    const promote = (values: string[] | undefined, heading: string) => {
      const present = [...new Set(values ?? [])]
        .filter((value) => !taken.has(value))
        .map((value) => list.find((item) => item.value === value))
        .filter((item): item is CommandItem => item !== undefined);
      if (present.length === 0) return [];
      for (const item of present) taken.add(item.value);
      exempt.add(heading);
      return present.map((item) => ({ ...item, group: heading }));
    };
    const first = promote(recent, labels.recent);
    const second = promote(suggested, labels.suggested);
    if (taken.size > 0) list = [...first, ...second, ...list.filter((item) => !taken.has(item.value))];
  }
  if (!hasQuery && maxPerGroup > 0) {
    const capped = capGroups(list, maxPerGroup, expanded, exempt, (group, hidden) => ({ value: "", label: labels.showMore(hidden), group }));
    return { visible: capped.list, moreRows: capped.more };
  }
  return { visible: list, moreRows: NO_MORE_ROWS };
}

/** The mode a text switches to, if it starts with one's prefix: the first listed wins. Not in a list or an entry. */
export function modeFor(modes: CommandPaletteMode[] | undefined, query: string, inside: boolean): CommandPaletteMode | undefined {
  if (inside) return undefined;
  return modes?.find((candidate) => candidate.prefix !== "" && query.startsWith(candidate.prefix));
}
