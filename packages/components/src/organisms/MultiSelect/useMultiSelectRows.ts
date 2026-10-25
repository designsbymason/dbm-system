import { useMemo } from "react";
import { ListChecksIcon } from "@dbm-system/icons";
import { defaultFilter, fold } from "../../internal/optionList/optionList.match";
import { buildRows, CREATE_VALUE, isDisabled, SELECT_ALL_VALUE } from "../../internal/optionList/optionList.rows";
import type { MultiSelectLabels, MultiSelectOption, MultiSelectProps } from "./MultiSelect.types";
import { composeRows, groupRowValue } from "./MultiSelect.rows";

const NO_OPTIONS: MultiSelectOption[] = [];

interface Options {
  options: MultiSelectOption[];
  filter: MultiSelectProps["filter"];
  /** What is typed, and the same trimmed. */
  text: string;
  typedText: string;
  values: string[];
  selectedSet: Set<string>;
  labels: MultiSelectLabels;
  maxSelected: number | undefined;
  selectAll: boolean;
  onSelectAll: MultiSelectProps["onSelectAll"];
  selectGroups: boolean;
  canCreate: boolean;
  allowCustomValue: boolean;
  pasteList: boolean;
  /** A promise for "Select all" or for a new option is out, so its row waits. */
  selecting: boolean;
  creating: boolean;
}

/**
 * What the list shows for a `MultiSelect`: the options that match what is typed (with the ones not chosen disabled at the
 * limit), the field's own rows among them ("Select all", a group's row, "Create …"), what each of those covers, and the
 * lookup of options by label that typed and pasted text is matched against.
 */
export function useMultiSelectRows({
  options,
  filter,
  text,
  typedText,
  values,
  selectedSet,
  labels,
  maxSelected,
  selectAll,
  onSelectAll,
  selectGroups,
  canCreate,
  allowCustomValue,
  pasteList,
  selecting,
  creating,
}: Options) {
  // The options on show. At the limit the ones not chosen can't be, and say why.
  const atLimit = maxSelected !== undefined && values.length >= maxSelected;
  const limitReason = atLimit ? labels.limitReached(maxSelected) : undefined;
  const matching = useMemo(() => {
    if (filter === false) return options;
    const matches = filter ?? defaultFilter;
    return options.filter((option) => matches(option, text));
  }, [options, filter, text]);
  const visible = useMemo(
    () =>
      limitReason === undefined
        ? matching
        : matching.map((option) =>
            selectedSet.has(option.value) || isDisabled(option) ? option : { ...option, disabled: limitReason },
          ),
    [matching, limitReason, selectedSet],
  );

  // "Select all" covers the matching options that can be chosen, with or without the limit.
  const coverage = useMemo(
    () => (selectAll ? matching.filter((option) => !isDisabled(option)) : NO_OPTIONS),
    [selectAll, matching],
  );
  const allChosen = coverage.length > 0 && coverage.every((option) => selectedSet.has(option.value));
  // With `onSelectAll` the page answers, so the row is there whenever there is something to search or load.
  const offersSelectAll = selectAll && (onSelectAll ? options.length > 0 || typedText !== "" : coverage.length > 0);

  // A group's "select all" row covers that group's matching options that can be chosen.
  const groupCoverage = useMemo(() => {
    const byGroup = new Map<string, MultiSelectOption[]>();
    if (!selectGroups) return byGroup;
    for (const option of matching) {
      if (option.group === undefined || isDisabled(option)) continue;
      const members = byGroup.get(option.group);
      if (members) members.push(option);
      else byGroup.set(option.group, [option]);
    }
    return byGroup;
  }, [selectGroups, matching]);
  const groupAllChosen = (group: string) => {
    const members = groupCoverage.get(group);
    return Boolean(members && members.length > 0 && members.every((option) => selectedSet.has(option.value)));
  };

  // The options by their folded label (the first one wins), for typed and pasted text and the "Create …" row.
  const optionsByLabel = useMemo(() => {
    const byLabel = new Map<string, MultiSelectOption>();
    if (!canCreate && !allowCustomValue && !pasteList) return byLabel;
    for (const option of options) {
      const key = fold(option.label);
      if (!byLabel.has(key)) byLabel.set(key, option);
    }
    return byLabel;
  }, [options, canCreate, allowCustomValue, pasteList]);
  // The "Create …" row: offered for text that names no option, once the person has typed something.
  const createLabel = canCreate && typedText !== "" && !optionsByLabel.has(fold(typedText)) ? labels.create(typedText) : undefined;

  const { rows, flat } = useMemo(() => {
    const built = buildRows(visible);
    const top: MultiSelectOption | undefined = offersSelectAll
      ? {
          value: SELECT_ALL_VALUE,
          label: !onSelectAll && allChosen ? labels.deselectAll : labels.selectAll,
          icon: ListChecksIcon,
          disabled: selecting || (!allChosen && atLimit ? limitReason : false),
        }
      : undefined;
    const bottom: MultiSelectOption | undefined =
      createLabel !== undefined
        ? { value: CREATE_VALUE, label: createLabel, disabled: creating || (atLimit ? limitReason : false) }
        : undefined;
    return composeRows(built, {
      top,
      group: selectGroups
        ? (group) => {
            const members = groupCoverage.get(group);
            if (!members || members.length === 0) return undefined;
            const everyChosen = members.every((option) => selectedSet.has(option.value));
            return {
              value: groupRowValue(group),
              label: everyChosen ? labels.deselectGroup(group) : labels.selectGroup(group),
              icon: ListChecksIcon,
              disabled: !everyChosen && atLimit ? limitReason : false,
            };
          }
        : undefined,
      bottom,
    });
  }, [
    visible,
    offersSelectAll,
    onSelectAll,
    allChosen,
    selecting,
    atLimit,
    limitReason,
    labels,
    createLabel,
    creating,
    selectGroups,
    groupCoverage,
    selectedSet,
  ]);
  const hasIcons = useMemo(
    () => offersSelectAll || groupCoverage.size > 0 || options.some((option) => option.icon !== undefined),
    [offersSelectAll, groupCoverage, options],
  );

  return {
    atLimit,
    limitReason,
    coverage,
    allChosen,
    offersSelectAll,
    groupCoverage,
    groupAllChosen,
    optionsByLabel,
    rows,
    flat,
    resultCount: visible.length,
    hasIcons,
  };
}
