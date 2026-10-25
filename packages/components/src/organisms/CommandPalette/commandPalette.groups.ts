/** The prefix of the value of a "Show more" row, which no command's value starts with. */
export const MORE_PREFIX = "\u0000more:";

interface Groupable {
  value: string;
  group?: string;
}

/**
 * Keeps the first `max` commands of each group and puts a row after them that shows the rest, for a group that is not
 * `expanded` or `exempt`. Groups keep the order they first appear in, so the list reads as it did uncapped.
 * `more` says, for each of those rows, which group it opens and the first command it will reveal.
 */
export function capGroups<T extends Groupable>(
  list: T[],
  max: number,
  expanded: ReadonlySet<string>,
  exempt: ReadonlySet<string>,
  makeRow: (group: string | undefined, hidden: number) => T,
): { list: T[]; more: Map<string, { group: string; first: string }> } {
  const groups = new Map<string | undefined, T[]>();
  for (const item of list) groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  const out: T[] = [];
  const more = new Map<string, { group: string; first: string }>();
  for (const [group, members] of groups) {
    const key = group ?? "";
    if (max <= 0 || members.length <= max || expanded.has(key) || exempt.has(key)) {
      out.push(...members);
      continue;
    }
    out.push(...members.slice(0, max));
    const row = makeRow(group, members.length - max);
    const value = `${MORE_PREFIX}${key}`;
    out.push({ ...row, value });
    more.set(value, { group: key, first: (members[max] as T).value });
  }
  return { list: out, more };
}
