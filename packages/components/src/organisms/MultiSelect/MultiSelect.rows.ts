import type { Row } from "../../internal/optionList/optionList.rows";
import type { MultiSelectOption } from "./MultiSelect.types";

// The prefix of the row that chooses a whole group. It starts with the character the list's other action rows start with
// (`isActionValue`), so it never collides with an option's value, and the group's name follows it.
export const GROUP_PREFIX = "\u0000group:";

export const groupRowValue = (group: string): string => `${GROUP_PREFIX}${group}`;

/** The group a row's value names, or `undefined` when it is not a group's row. */
export const groupOfRowValue = (value: string): string | undefined =>
  value.startsWith(GROUP_PREFIX) ? value.slice(GROUP_PREFIX.length) : undefined;

interface Extras {
  /** A row put first, before every heading and option ("Select all"). */
  top?: MultiSelectOption;
  /** The row put under a group's heading ("Select all in …"), or `undefined` for a group with none. */
  group?: (name: string) => MultiSelectOption | undefined;
  /** A row put last ("Create …"). */
  bottom?: MultiSelectOption;
}

/**
 * The list's rows with the field's own action rows among them, and every option's index renumbered to match, since the
 * keys and `aria-activedescendant` count the options and action rows together, in the order they are drawn.
 */
export function composeRows(
  built: { rows: Row<MultiSelectOption>[]; flat: MultiSelectOption[] },
  { top, group, bottom }: Extras,
): { rows: Row<MultiSelectOption>[]; flat: MultiSelectOption[] } {
  const rows: Row<MultiSelectOption>[] = [];
  const flat: MultiSelectOption[] = [];
  const add = (key: string, option: MultiSelectOption) => {
    rows.push({ kind: "option", key, option, index: flat.length });
    flat.push(option);
  };
  if (top) add("select-all", top);
  for (const row of built.rows) {
    if (row.kind === "group") {
      rows.push(row);
      const action = group?.(row.label);
      if (action) add(`group-action:${row.label}`, action);
    } else {
      rows.push({ ...row, index: flat.length });
      flat.push(row.option);
    }
  }
  if (bottom) add("create", bottom);
  return { rows, flat };
}
