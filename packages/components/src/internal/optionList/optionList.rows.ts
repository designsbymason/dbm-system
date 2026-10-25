import type { ListOption } from "./optionList.types";

// The values of the rows a list adds for the field's own actions ("Create …", "Select all"). Each starts with a
// character no option's value will, so it never collides with one, and `isActionValue` tells them from options.
export const CREATE_VALUE = "\u0000create";
export const SELECT_ALL_VALUE = "\u0000select-all";

export const isActionValue = (value: string): boolean => value.startsWith("\u0000");

export const isDisabled = (option: ListOption): boolean => Boolean(option.disabled);

export type Row<O extends ListOption = ListOption> =
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; option: O; index: number };

/** Orders the options by group (groups in the order they first appear) and adds a heading row before each group. */
export function buildRows<O extends ListOption>(visible: O[]): { rows: Row<O>[]; flat: O[] } {
  const groups = new Map<string | undefined, O[]>();
  for (const option of visible) {
    const members = groups.get(option.group);
    if (members) members.push(option);
    else groups.set(option.group, [option]);
  }
  const rows: Row<O>[] = [];
  const flat: O[] = [];
  for (const [group, members] of groups) {
    if (group !== undefined) rows.push({ kind: "group", key: `group:${group}`, label: group });
    for (const option of members) {
      rows.push({ kind: "option", key: `option:${option.value}`, option, index: flat.length });
      flat.push(option);
    }
  }
  return { rows, flat };
}

export const firstEnabled = (flat: ListOption[]): number => flat.findIndex((option) => !isDisabled(option));

export const lastEnabled = (flat: ListOption[]): number => {
  for (let index = flat.length - 1; index >= 0; index -= 1) {
    const option = flat[index];
    if (option && !isDisabled(option)) return index;
  }
  return -1;
};

/** The next enabled option from `from` in `direction`, wrapping round the ends, or `-1` when none is enabled. */
export function stepEnabled(flat: ListOption[], from: number, direction: 1 | -1): number {
  const count = flat.length;
  for (let step = 1; step <= count; step += 1) {
    const index = (((from + direction * step) % count) + count) % count;
    const option = flat[index];
    if (option && !isDisabled(option)) return index;
  }
  return -1;
}
