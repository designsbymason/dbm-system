import { useEffect } from "react";
import type { MultiSelectOption, MultiSelectProps } from "./MultiSelect.types";

interface Options {
  /** The field's once-per-message development warning. */
  warn: (message: string) => void;
  options: MultiSelectOption[];
  onSelectAll: MultiSelectProps["onSelectAll"];
  selectAll: boolean;
  allowCustomValue: boolean;
  validate: MultiSelectProps["validate"];
  maxTagLength: number | undefined;
  pasteList: boolean;
  separators: string[];
  /** The default for `separators`, so a value that is not it is known to have been passed. */
  defaultSeparators: string[];
  reorderable: boolean;
  overflow: NonNullable<MultiSelectProps["overflow"]>;
  readOnly: boolean;
  disabled: boolean;
  maxVisible: number | undefined;
  selectGroups: boolean;
}

/** Props that do nothing together, said once in development rather than left to be wondered about. */
export function useMultiSelectWarnings({
  warn,
  options,
  onSelectAll,
  selectAll,
  allowCustomValue,
  validate,
  maxTagLength,
  pasteList,
  separators,
  defaultSeparators,
  reorderable,
  overflow,
  readOnly,
  disabled,
  maxVisible,
  selectGroups,
}: Options) {
  useEffect(() => {
    if (onSelectAll && !selectAll) {
      warn("MultiSelect: `onSelectAll` has no effect without `selectAll`, which is what adds the row it answers. Pass `selectAll`.");
    }
    if (!allowCustomValue && validate) {
      warn("MultiSelect: `validate` checks typed values, which only become chips with `allowCustomValue`. Pass `allowCustomValue`, or remove `validate`.");
    }
    if (!allowCustomValue && maxTagLength !== undefined) {
      warn("MultiSelect: `maxTagLength` limits typed values, which only become chips with `allowCustomValue`. Pass `allowCustomValue`, or remove `maxTagLength`.");
    }
    if (!allowCustomValue && !pasteList && separators !== defaultSeparators) {
      warn("MultiSelect: `separators` split typed and pasted text, which only happens with `allowCustomValue` or `pasteList`. Pass one, or remove `separators`.");
    }
    if (reorderable && (overflow === "summary" || readOnly || disabled)) {
      warn(
        `MultiSelect: \`reorderable\` has no effect ${overflow === "summary" ? 'with `overflow="summary"`, which draws no chips to move' : "while the field is read-only or disabled"}.`,
      );
    }
    if (maxVisible !== undefined && overflow === "summary") {
      warn('MultiSelect: `maxVisible` has no effect with `overflow="summary"`, which draws no chips. Remove `maxVisible`, or use `overflow="wrap"` or `"collapse"`.');
    }
    if (selectGroups && options.length > 0 && !options.some((option) => option.group !== undefined)) {
      warn("MultiSelect: `selectGroups` adds a row under each group's heading, and no option has a `group`. Give options a `group`, or remove `selectGroups`.");
    }
  }, [
    warn,
    options,
    onSelectAll,
    selectAll,
    allowCustomValue,
    validate,
    maxTagLength,
    pasteList,
    separators,
    defaultSeparators,
    reorderable,
    overflow,
    readOnly,
    disabled,
    maxVisible,
    selectGroups,
  ]);
}
