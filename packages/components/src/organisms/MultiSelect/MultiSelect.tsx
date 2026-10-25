import { CaretDownIcon, ListChecksIcon, XIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useResolvedResponsiveValue, useSortable } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, ClipboardEvent, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { Button } from "../../atoms/Button";
import { FieldError } from "../../atoms/FieldError";
import { Spinner } from "../../atoms/Spinner";
import { Tag } from "../../atoms/Tag";
import type { TagSize } from "../../atoms/Tag";
import { TooltipProvider } from "../../atoms/Tooltip";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { AdornmentButton, Adornments } from "../../internal/optionList/AdornmentButton";
import { defaultFilter, fold } from "../../internal/optionList/optionList.match";
import {
  buildRows,
  CREATE_VALUE,
  firstEnabled,
  isActionValue,
  isDisabled,
  lastEnabled,
  SELECT_ALL_VALUE,
  stepEnabled,
} from "../../internal/optionList/optionList.rows";
import { OptionListPanel } from "../../internal/optionList/OptionListPanel";
import { useOptionListLayout } from "../../internal/optionList/useOptionListLayout";
import { optionDomId, useOptionListWindow } from "../../internal/optionList/useOptionListWindow";
import { TagsInputChip } from "../../molecules/TagsInput/TagsInputChip";
// The chips and their box must look exactly as `TagsInput`'s do, so the two share its stylesheet.
import chipStyles from "../../molecules/TagsInput/TagsInput.module.css";
import styles from "./MultiSelect.module.css";
import { composeRows, groupOfRowValue, groupRowValue } from "./MultiSelect.rows";
import type {
  MultiSelectChangeSource,
  MultiSelectController,
  MultiSelectInputChangeReason,
  MultiSelectLabels,
  MultiSelectOption,
  MultiSelectProps,
  MultiSelectSize,
} from "./MultiSelect.types";
import { useSelectedChips } from "./useSelectedChips";

// How far the Page Up and Page Down keys move the highlight.
const PAGE_STEP = 10;

const sizeClass: Record<MultiSelectSize, string | undefined> = {
  xs: chipStyles.sizeXs,
  sm: chipStyles.sizeSm,
  md: chipStyles.sizeMd,
  lg: chipStyles.sizeLg,
  xl: chipStyles.sizeXl,
};

// One step below the field, as `TagsInput`'s chips are, so a row of them sits inside the box.
const tagSizeFor: Record<MultiSelectSize, TagSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

const buildDefaultLabels = (formatNumber: (value: number) => string): MultiSelectLabels => ({
  clear: "Clear all",
  toggle: "Toggle options",
  remove: (label) => `Remove ${label}`,
  selected: "Selected options",
  noResults: "No results",
  loading: "Loading…",
  error: "Something went wrong. Try again.",
  results: (count) => `${formatNumber(count)} ${count === 1 ? "result" : "results"} available`,
  added: (label, count) => `${label} selected, ${formatNumber(count)} selected`,
  removed: (label, count) => `${label} removed, ${formatNumber(count)} selected`,
  cleared: "All options cleared",
  limitReached: (max) => `No more than ${formatNumber(max)} can be selected`,
  selectAll: "Select all",
  deselectAll: "Deselect all",
  selectedCount: (count) => `${formatNumber(count)} selected`,
  required: "Choose at least one option",
  minSelected: (min) => `Choose at least ${formatNumber(min)}`,
  more: (hidden) => `+${formatNumber(hidden)} more`,
  less: "Show less",
  chipsHint: "Use the left arrow key to move to the chosen options",
  notFound: (text) => `${text} isn't in the list`,
  pasted: (added, refused) => `${formatNumber(added)} added, ${formatNumber(refused)} not added`,
  summary: (count) => `${formatNumber(count)} selected`,
  locked: "Can't be removed",
  footerCount: (count) => `${formatNumber(count)} selected`,
  footerClear: "Clear",
  footerDone: "Done",
  selectGroup: (group) => `Select all in ${group}`,
  deselectGroup: (group) => `Deselect all in ${group}`,
  duplicate: (text) => `${text} is already chosen`,
  liftedChip: (label, position, total) =>
    `${label}, position ${formatNumber(position)} of ${formatNumber(total)}. Use the arrow keys to move it, Space to drop it, Escape to cancel`,
  movedChip: (label, position, total) => `${label} moved to position ${formatNumber(position)} of ${formatNumber(total)}`,
  droppedChip: (label, position, total) => `${label} dropped at position ${formatNumber(position)} of ${formatNumber(total)}`,
  cancelledChip: (label, position, total) => `${label} moved back to position ${formatNumber(position)} of ${formatNumber(total)}`,
  create: (text) => `Create “${text}”`,
  typeToSearch: "Type to search",
});

// The defaults for `options` and `value`: one array each, so an omitted prop doesn't make the memos below recompute
// on every render.
const NO_OPTIONS: MultiSelectOption[] = [];
const NO_VALUES: string[] = [];
const DEFAULT_SEPARATORS = [","];

const escapeForPattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Moves the item at `from` so that it ends up at `to`. */
const moved = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
};

const ignoreRemove = () => undefined;
// A space that is not collapsed, so the unseen chip has a line of text and is as tall as a real one.
const NO_BREAK_SPACE = "\u00a0";

const isString = (candidate: unknown): candidate is string => typeof candidate === "string";

/**
 * A text field for choosing several options from a list: the chosen ones are removable chips inside the field, and
 * the list floats beneath it, narrowed by typing. The value is a `string[]` of the options' `value`s. Choosing an
 * option leaves the list open (so several can be chosen in a row) and clears the text that narrowed it; choosing a
 * chosen option, or pressing a chip's remove button, takes it out again. "Multi-select" and "tag select" are the
 * same control.
 *
 * Like `Combobox` the options are an `options` array (grouped, described, with icons, `keywords`, a reason for being
 * `disabled`, fetched as the person types with `filter={false}`, drawn a window at a time when long), and `onCreate`
 * offers a "Create …" row. `maxSelected` stops at a limit, `selectAll` adds a row that chooses every match,
 * `overflow="collapse"` keeps a closed field to one line with a "+N more" button, and `presentation` spans the screen
 * on a phone.
 *
 * Focus stays in the entry while the list is open; the highlighted option is pointed at with
 * `aria-activedescendant`. The chips are not tab stops: the left arrow key from the start of the entry reaches
 * them, the arrow keys move among them and Delete removes one, and Backspace on an empty entry moves to the last.
 * `name` submits each value as its own entry. `ref`, `id`, `data-testid` and the `aria-*` props go to the entry
 * `<input>`; `className` and `style` go to the outermost box.
 *
 * @example
 * ```tsx
 * <MultiSelect
 *   aria-label="Countries"
 *   options={[
 *     { value: "ca", label: "Canada" },
 *     { value: "mx", label: "Mexico" },
 *   ]}
 *   onValueChange={(values) => setCountries(values)}
 * />
 *
 * // At most three, with a row that chooses every match
 * <MultiSelect aria-label="Labels" options={labels} maxSelected={3} selectAll />
 *
 * // One line when idle, the rest behind "+N more"
 * <MultiSelect aria-label="Assignees" options={people} overflow="collapse" />
 *
 * // In a form
 * <FormField label="Regions">{(fieldProps) => <MultiSelect {...fieldProps} name="regions" options={regions} required />}</FormField>
 * ```
 */
export const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(
  (
    {
      options = NO_OPTIONS,
      value: valueProp,
      defaultValue,
      onValueChange,
      inputValue: inputValueProp,
      defaultInputValue,
      onInputValueChange,
      filter,
      autoHighlight,
      closeOnSelect = false,
      maxSelected,
      minSelected,
      selectAll = false,
      onSelectAll,
      selectGroups = false,
      allowCustomValue = false,
      separators = DEFAULT_SEPARATORS,
      pasteList = false,
      footer = false,
      validate,
      clearable = true,
      onClear,
      loading = false,
      error = false,
      emptyContent,
      highlightTone,
      onCreate,
      renderOption,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      openOnFocus = false,
      placeholder,
      size = "md",
      tone = "brand",
      variant = "subtle",
      renderValue,
      reorderable = false,
      overflow = "wrap",
      maxVisible,
      hasError = false,
      disabled = false,
      readOnly = false,
      required = false,
      name,
      form,
      autoFocus,
      autoComplete = "off",
      inputMode,
      enterKeyHint,
      spellCheck,
      presentation = "anchored",
      container,
      side = "bottom",
      align = "start",
      dir = "ltr",
      labels: labelOverrides,
      formatNumber = String,
      controllerRef,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      id,
      className,
      style,
      "data-testid": dataTestId,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `${reactId}-input`;
    const listId = `${reactId}-list`;
    const hintId = `${reactId}-hint`;
    const labels = useMemo(
      () => mergeDefined(buildDefaultLabels(formatNumber), labelOverrides),
      [formatNumber, labelOverrides],
    );

    const entryRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const { message: announcement, announce } = useAnnouncement();

    // Development-only warnings, each once for a mounted field.
    const warned = useRef(new Set<string>());
    const warnOnce = useCallback((message: string) => {
      if (process.env.NODE_ENV === "production" || warned.current.has(message)) return;
      warned.current.add(message);
      console.warn(message);
    }, []);
    useEffect(() => {
      if (ariaLabel || ariaLabelledBy || entryRef.current?.labels?.length) return;
      warnOnce(
        "MultiSelect: no accessible name. Pass `aria-label` or `aria-labelledby`, put it in a `FormField`, or point a `<label htmlFor>` at its `id`; without one a screen reader announces an unnamed combobox and an unnamed list.",
      );
    }, [ariaLabel, ariaLabelledBy, warnOnce]);
    useEffect(() => {
      const seen = new Set<string>();
      for (const option of options) {
        if (seen.has(option.value)) {
          warnOnce(
            `MultiSelect: more than one option has the value "${option.value}". A value must be unique: only the first can be chosen, and the rows share a key.`,
          );
        }
        seen.add(option.value);
      }
    }, [options, warnOnce]);
    useEffect(() => {
      if (valueProp !== undefined && defaultValue !== undefined) {
        warnOnce("MultiSelect: both `value` and `defaultValue` were passed; `defaultValue` is ignored once the field is controlled. Pass one.");
      }
      if (inputValueProp !== undefined && defaultInputValue !== undefined) {
        warnOnce("MultiSelect: both `inputValue` and `defaultInputValue` were passed; `defaultInputValue` is ignored once the typed text is controlled. Pass one.");
      }
      if (maxSelected !== undefined && minSelected !== undefined && minSelected > maxSelected) {
        warnOnce("MultiSelect: `minSelected` is greater than `maxSelected`, so a form can never accept the field. Lower `minSelected` or raise `maxSelected`.");
      }
    }, [valueProp, defaultValue, inputValueProp, defaultInputValue, maxSelected, minSelected, warnOnce]);

    // The chosen values. A value that isn't an array of strings (untyped data on its way) reads as empty.
    const isValueControlled = valueProp !== undefined;
    const [innerValue, setInnerValue] = useState<string[]>(defaultValue ?? NO_VALUES);
    const rawValue = isValueControlled ? valueProp : innerValue;
    const values = useMemo(() => (Array.isArray(rawValue) ? rawValue.filter(isString) : NO_VALUES), [rawValue]);
    const selectedSet = useMemo(() => new Set(values), [values]);
    const optionByValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);

    // A chip shows its option's label, colour and icon. The option is remembered, so a chosen value whose option has left
    // `options` (a list fetched for other text, an option made by `onCreate` or `onSelectAll` that the owner hasn't
    // added) keeps its name.
    const [optionMemory, setOptionMemory] = useState<Record<string, MultiSelectOption>>({});
    let staleOptions: Record<string, MultiSelectOption> | undefined;
    for (const chosen of values) {
      const known = optionByValue.get(chosen);
      if (known && optionMemory[chosen] !== known) (staleOptions ??= {})[chosen] = known;
    }
    if (staleOptions) setOptionMemory({ ...optionMemory, ...staleOptions });
    const optionFor = (chosen: string): MultiSelectOption | undefined => optionByValue.get(chosen) ?? optionMemory[chosen];
    const labelOf = (chosen: string) => optionFor(chosen)?.label ?? chosen;
    const remember = (made: MultiSelectOption[]) =>
      setOptionMemory((memory) => ({ ...memory, ...Object.fromEntries(made.map((entry) => [entry.value, entry])) }));

    // The text typed to narrow the list.
    const isInputControlled = inputValueProp !== undefined;
    const [innerText, setInnerText] = useState(defaultInputValue ?? "");
    const text = isInputControlled ? inputValueProp : innerText;
    const typedText = text.trim();
    const setText = (next: string, reason: MultiSelectInputChangeReason) => {
      if (!isInputControlled) setInnerText(next);
      onInputValueChange?.(next, reason);
    };

    // Open state.
    const isOpenControlled = openProp !== undefined;
    const [innerOpen, setInnerOpen] = useState(defaultOpen);
    const canEdit = !disabled && !readOnly;
    const open = (isOpenControlled ? openProp : innerOpen) && canEdit;
    const setOpen = useCallback(
      (next: boolean) => {
        if (next && !canEdit) return;
        if (!isOpenControlled) setInnerOpen(next);
        if (next !== open) onOpenChange?.(next);
      },
      [canEdit, isOpenControlled, open, onOpenChange],
    );

    const { fullWidth, panelSide, contentStyle } = useOptionListLayout({
      rootRef,
      presentation,
      open,
      side,
      align,
      warn: warnOnce,
      name: "MultiSelect",
    });

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
    const [selecting, setSelecting] = useState(false);
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

    // The "Create …" row: offered for text that names no option, once the person has typed something.
    const canCreate = onCreate !== undefined;
    const [creating, setCreating] = useState(false);
    const foldedLabels = useMemo(
      () => (canCreate || allowCustomValue ? new Set(options.map((option) => fold(option.label))) : undefined),
      [options, canCreate, allowCustomValue],
    );
    const offersCreate = canCreate && foldedLabels !== undefined && typedText !== "" && !foldedLabels.has(fold(typedText));
    const createLabel = offersCreate ? labels.create(typedText) : undefined;

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
    const resultCount = visible.length;
    const hasIcons = useMemo(
      () => offersSelectAll || groupCoverage.size > 0 || options.some((option) => option.icon !== undefined),
      [offersSelectAll, groupCoverage, options],
    );

    // The highlight. `navigated` is the option the person moved to with a key or the pointer; until they do, the
    // highlight is the first match while typing (`autoHighlight`), and nothing otherwise.
    const [navigated, setNavigated] = useState<string | null>(null);
    const highlighted = useMemo(() => {
      if (!open) return -1;
      if (navigated !== null) {
        const index = flat.findIndex((option) => option.value === navigated);
        if (index !== -1) return index;
      }
      if (typedText !== "" && (autoHighlight ?? !allowCustomValue)) {
        const first = flat.findIndex((option) => !isDisabled(option) && !isActionValue(option.value));
        return first !== -1 ? first : firstEnabled(flat);
      }
      return -1;
    }, [open, navigated, flat, typedText, autoHighlight, allowCustomValue]);

    const listWindow = useOptionListWindow({ open, rows, size, highlighted, listId });
    const moveHighlight = (index: number) => {
      const option = flat[index];
      if (!option) return;
      listWindow.reveal(index);
      setNavigated(option.value);
    };

    // Announcements: the number of matches changing while the person types. A list that merely opens, or whose
    // options are all there on arrival, is a first appearance and isn't read.
    const lastAnnounced = useRef<string>("");
    useEffect(() => {
      if (!open || typedText === "") {
        lastAnnounced.current = "";
        return;
      }
      const key = `${text}|${resultCount}|${loading}`;
      if (key === lastAnnounced.current) return;
      lastAnnounced.current = key;
      if (!loading) announce(resultCount === 0 ? labels.noResults : labels.results(resultCount));
    }, [open, typedText, text, resultCount, loading, labels, announce]);
    const lastError = useRef(false);
    useEffect(() => {
      if (error && !lastError.current) announce(labels.error);
      lastError.current = error;
    }, [error, labels.error, announce]);

    const isRtl = () => (boxRef.current ? getComputedStyle(boxRef.current).direction === "rtl" : false);

    // Changing the values.
    // `known` are options just made or chosen that the field has not remembered yet.
    const commit = (next: string[], source: MultiSelectChangeSource, option?: MultiSelectOption, known?: MultiSelectOption[]) => {
      if (!isValueControlled) setInnerValue(next);
      const selected = next.map((entry) => known?.find((candidate) => candidate.value === entry) ?? optionFor(entry));
      onValueChange?.(next, { source, option, selected });
    };

    // A chosen option that has since been disabled can't be removed.
    const isLocked = (chosen: string) => {
      const known = optionFor(chosen);
      return known !== undefined && isDisabled(known);
    };
    const lockedReason = (chosen: string): string => {
      const reason = optionFor(chosen)?.disabled;
      return typeof reason === "string" ? reason : labels.locked;
    };
    const removeAt = (index: number) => {
      const removed = values[index];
      if (removed === undefined || isLocked(removed)) return;
      commit(
        values.filter((_, position) => position !== index),
        "remove",
        optionFor(removed),
      );
      announce(labels.removed(labelOf(removed), values.length - 1));
    };

    // Moving chips (`reorderable`): a gesture asks, and the order changes only when the value does.
    const liftedValue = useRef<string | undefined>(undefined);
    const sortable = useSortable<HTMLUListElement>({
      enabled: reorderable && canEdit,
      count: values.length,
      rtl: isRtl,
      onMove: (from, to, details) => {
        const item = values[from];
        if (item === undefined) return;
        commit(moved(values, from, to), "reorder", optionFor(item));
        announce(
          (details.via === "keyboard" ? labels.movedChip : labels.droppedChip)(labelOf(item), to + 1, values.length),
        );
      },
      onLift: (index) => {
        liftedValue.current = values[index];
        announce(labels.liftedChip(labelOf(values[index] ?? ""), index + 1, values.length));
      },
      onDrop: (index) => announce(labels.droppedChip(labelOf(values[index] ?? ""), index + 1, values.length)),
      onCancel: (origin) => announce(labels.cancelledChip(labelOf(liftedValue.current ?? ""), origin + 1, values.length)),
    });
    const { containerRef: sortableRef, itemProps: sortableItemProps, handleKeyUp: sortableKeyUp, release: releaseChip } = sortable;
    const liftedChip = sortable.lifted;
    const dragged = sortable.drag;
    const chipKeyDown = (event: KeyboardEvent<HTMLUListElement>, index: number) => {
      if (!reorderable) return false;
      // A chip being moved is dropped where it is before it is removed.
      if (liftedChip !== null && (event.key === "Delete" || event.key === "Backspace")) releaseChip();
      return sortable.handleKeyDown(event, index);
    };

    const chips = useSelectedChips({
      count: values.length,
      canEdit,
      onRemoveAt: (index) => removeAt(index),
      entryRef,
      boxRef,
      collapseMode: overflow === "collapse",
      maxVisible,
      onItemKeyDown: chipKeyDown,
    });

    // What every choice from the list leaves behind: the text that narrowed it is cleared, the highlight stays on
    // the option so the list doesn't jump, and (when asked) the list closes.
    const afterChoice = (chosen: string) => {
      if (text !== "") setText("", "select");
      setNavigated(chosen);
      if (closeOnSelect) setOpen(false);
    };

    const toggle = (option: MultiSelectOption) => {
      if (selectedSet.has(option.value)) {
        commit(
          values.filter((chosen) => chosen !== option.value),
          "deselect",
          option,
        );
        announce(labels.removed(option.label, values.length - 1));
      } else {
        if (maxSelected !== undefined && values.length >= maxSelected) {
          announce(labels.limitReached(maxSelected));
          return;
        }
        commit([...values, option.value], "select", option, [option]);
        announce(labels.added(option.label, values.length + 1));
      }
      afterChoice(option.value);
    };

    // Chooses what `covered` holds that isn't chosen yet, up to the limit, or (when all of it is chosen) removes it.
    const toggleCovered = (covered: MultiSelectOption[], everyChosen: boolean, chosenValue: string) => {
      if (everyChosen) {
        const coveredValues = new Set(covered.map((option) => option.value));
        const next = values.filter((chosen) => !coveredValues.has(chosen));
        commit(next, "selectAll");
        announce(labels.selectedCount(next.length));
      } else {
        const room = maxSelected === undefined ? Infinity : Math.max(0, maxSelected - values.length);
        const unchosen = covered.filter((option) => !selectedSet.has(option.value));
        const added = unchosen.slice(0, room);
        const next = [...values, ...added.map((option) => option.value)];
        commit(next, "selectAll", undefined, added);
        announce(labels.selectedCount(next.length));
        if (maxSelected !== undefined && added.length < unchosen.length) announce(labels.limitReached(maxSelected));
      }
      afterChoice(chosenValue);
    };

    // The page answers "Select all" (a list it holds more of than is loaded): the result is added, up to the limit.
    const runRemoteSelectAll = () => {
      if (!onSelectAll || selecting) return;
      const finish = (answer: Array<MultiSelectOption | string> | void) => {
        if (!answer) return;
        const made = answer.filter((entry): entry is MultiSelectOption => typeof entry !== "string");
        remember(made);
        const answered = answer.map((entry) => (typeof entry === "string" ? entry : entry.value));
        const room = maxSelected === undefined ? Infinity : Math.max(0, maxSelected - values.length);
        const fresh = [...new Set(answered)].filter((answeredValue) => !selectedSet.has(answeredValue));
        const added = fresh.slice(0, room);
        const next = [...values, ...added];
        commit(next, "selectAll", undefined, made);
        announce(labels.selectedCount(next.length));
        if (maxSelected !== undefined && added.length < fresh.length) announce(labels.limitReached(maxSelected));
        afterChoice(SELECT_ALL_VALUE);
      };
      let result: ReturnType<NonNullable<typeof onSelectAll>>;
      try {
        result = onSelectAll({ text: typedText, options: coverage });
      } catch (thrown) {
        warnOnce(`MultiSelect: \`onSelectAll\` threw (${String(thrown)}); nothing was chosen. Return the options instead of throwing.`);
        announce(labels.error);
        return;
      }
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setSelecting(true);
        (result as Promise<Array<MultiSelectOption | string> | void>).then(
          (answer) => {
            setSelecting(false);
            finish(answer);
          },
          () => {
            setSelecting(false);
            announce(labels.error);
          },
        );
      } else finish(result as Array<MultiSelectOption | string> | void);
    };

    const runSelectAll = () => {
      if (onSelectAll) runRemoteSelectAll();
      else toggleCovered(coverage, allChosen, SELECT_ALL_VALUE);
    };

    // Asks the owner to make an option for the typed text. It may answer with the new option (chosen at once, even
    // before it is in `options`), with nothing (the owner is handling it), or with a promise of either.
    const finishCreate = (created: MultiSelectOption | void) => {
      if (!created) {
        setOpen(false);
        return;
      }
      remember([created]);
      if (!selectedSet.has(created.value)) {
        commit([...values, created.value], "create", created, [created]);
        announce(labels.added(created.label, values.length + 1));
      }
      afterChoice(created.value);
    };
    const runCreate = () => {
      if (!onCreate || typedText === "" || creating) return;
      if (maxSelected !== undefined && values.length >= maxSelected) {
        announce(labels.limitReached(maxSelected));
        return;
      }
      const result = onCreate(typedText);
      if (result && typeof (result as Promise<MultiSelectOption | void>).then === "function") {
        setCreating(true);
        (result as Promise<MultiSelectOption | void>).then(
          (created) => {
            setCreating(false);
            finishCreate(created);
          },
          () => {
            setCreating(false);
            announce(labels.error);
          },
        );
      } else finishCreate(result as MultiSelectOption | void);
    };

    // Typed text made into chips (`allowCustomValue`). Text that is exactly an option's label chooses that option;
    // other text is a value of its own, unless it is already chosen, refused by `validate` or past the limit.
    const [message, setMessage] = useState<string | undefined>(undefined);
    const usableSeparators = useMemo(
      () => (Array.isArray(separators) ? separators : []).filter((separator): separator is string => typeof separator === "string" && separator !== ""),
      [separators],
    );
    const separatorSource = usableSeparators.map(escapeForPattern).join("|");
    const pastePattern = new RegExp([...usableSeparators.map(escapeForPattern), "\\r?\\n", "\\t"].join("|"));
    const runValidate = (word: string): string | undefined => {
      if (!validate) return undefined;
      try {
        const reason = validate(word);
        return typeof reason === "string" && reason !== "" ? reason : undefined;
      } catch (thrown) {
        warnOnce(`MultiSelect: \`validate\` threw (${String(thrown)}); the text was accepted. Return a message instead of throwing.`);
        return undefined;
      }
    };
    // `pasted` says the pieces came from a pasted list, which is summarised ("3 added, 2 not added") instead of one message
    // for the first piece refused. Without `allowCustomValue` a piece that names no option is refused.
    const addTyped = (pieces: string[], pasted = false): { added: number; refused: string[] } => {
      const next = [...values];
      const refused: string[] = [];
      const addedLabels: string[] = [];
      const chosenOptions: MultiSelectOption[] = [];
      let custom = false;
      for (const piece of pieces) {
        const word = piece.trim();
        if (word === "") continue;
        const named = options.find((option) => fold(option.label) === fold(word));
        if (named && isDisabled(named)) {
          refused.push(typeof named.disabled === "string" ? named.disabled : labels.noResults);
          continue;
        }
        const chosenValue = named ? named.value : word;
        if (next.includes(chosenValue)) {
          refused.push(labels.duplicate(named ? named.label : word));
          continue;
        }
        if (maxSelected !== undefined && next.length >= maxSelected) {
          refused.push(labels.limitReached(maxSelected));
          break;
        }
        if (!named) {
          if (!allowCustomValue) {
            refused.push(labels.notFound(word));
            continue;
          }
          const reason = runValidate(word);
          if (reason) {
            refused.push(reason);
            continue;
          }
          custom = true;
        } else chosenOptions.push(named);
        next.push(chosenValue);
        addedLabels.push(named ? named.label : word);
      }
      const summary = pasted && pieces.filter((piece) => piece.trim() !== "").length > 1 && refused.length > 0 ? labels.pasted(addedLabels.length, refused.length) : undefined;
      if (addedLabels.length > 0) {
        commit(
          next,
          custom ? "custom" : "select",
          addedLabels.length === 1 ? chosenOptions[0] : undefined,
          chosenOptions,
        );
        announce(
          summary ??
            (addedLabels.length === 1 ? labels.added(addedLabels[0] as string, next.length) : labels.selectedCount(next.length)),
        );
      } else if (refused[0]) announce(summary ?? refused[0]);
      setMessage(summary ?? refused[0]);
      return { added: addedLabels.length, refused };
    };

    const choose = (option: MultiSelectOption) => {
      if (isDisabled(option)) return;
      const group = groupOfRowValue(option.value);
      if (option.value === CREATE_VALUE) runCreate();
      else if (option.value === SELECT_ALL_VALUE) runSelectAll();
      else if (group !== undefined) toggleCovered(groupCoverage.get(group) ?? NO_OPTIONS, groupAllChosen(group), option.value);
      else toggle(option);
    };

    const clearAll = () => {
      if (!canEdit) return;
      const kept = values.filter(isLocked);
      if (kept.length < values.length) commit(kept, "clear");
      if (text !== "") setText("", "clear");
      setMessage(undefined);
      setNavigated(null);
      announce(labels.cleared);
      onClear?.();
      entryRef.current?.focus();
    };

    // The accessible name for the list, taken from the field's own label when it isn't named with `aria-label`.
    const [fieldLabel, setFieldLabel] = useState<string | undefined>();
    const readFieldLabel = () => {
      const labelText = entryRef.current?.labels?.[0]?.textContent?.trim();
      setFieldLabel(labelText || undefined);
    };

    const composing = useRef(false);
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!canEdit) return;
      if (message) setMessage(undefined);
      const next = event.target.value;
      setNavigated(null);
      setOpen(true);
      if (!allowCustomValue || composing.current || separatorSource === "" || !new RegExp(separatorSource).test(next)) {
        setText(next, "input");
        return;
      }
      // A separator was typed: everything before the last one is complete, whatever follows it is still being typed.
      const pieces = next.split(new RegExp(separatorSource, "g"));
      const rest = pieces.pop() ?? "";
      const { refused } = addTyped(pieces);
      // A single typed piece that was refused stays in the entry, so it can be fixed.
      setText(pieces.length === 1 && refused.length > 0 ? (pieces[0] as string) : rest, "input");
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
      if (!(allowCustomValue || pasteList) || !canEdit) return;
      const pasted = event.clipboardData.getData("text");
      if (!pastePattern.test(pasted)) return;
      event.preventDefault();
      // The pasted text goes in where the caret (or the selection) is, then everything is split.
      const field = event.currentTarget;
      const start = Math.min(field.selectionStart ?? text.length, text.length);
      const end = Math.min(field.selectionEnd ?? start, text.length);
      addTyped((text.slice(0, start) + pasted + text.slice(end)).split(new RegExp(pastePattern.source, "g")), true);
      setText("", "input");
    };

    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const onEntry = target === entryRef.current;
      const onChip = Boolean(target.closest("li[role=listitem]"));
      chips.setEngaged(onEntry || onChip);
      if (!onChip) releaseChip();
      if (onEntry) {
        readFieldLabel();
        if (openOnFocus) setOpen(true);
      } else setOpen(false);
    };

    // The field is one thing to its owner: leaving the whole box (not moving between a chip's button and the entry)
    // drops the text and closes the list. A press elsewhere gives no relatedTarget, so look again once it settles.
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      const box = event.currentTarget;
      const next = event.relatedTarget as Node | null;
      if (next && box.contains(next)) return;
      const leave = () => {
        if (box.contains(document.activeElement)) return;
        chips.setEngaged(false);
        releaseChip();
        const left = entryRef.current?.value ?? "";
        if (allowCustomValue && canEdit && left.trim() !== "") {
          addTyped([left]);
          setText("", "select");
        } else if (left !== "") setText("", "reset");
        setMessage(undefined);
        setNavigated(null);
        setOpen(false);
      };
      if (next) leave();
      else queueMicrotask(leave);
    };

    // A press anywhere in the box that isn't on a control puts the caret in the entry and opens the list, as in a
    // plain field.
    const handleBoxMouseDown = (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target === entryRef.current || target.closest("button, a, input, [role=button]")) return;
      event.preventDefault();
      entryRef.current?.focus();
      // A press on a chip hands the typing back to the entry, but is not a request for the list (it may be the start of a drag).
      if (!target.closest("li[role=listitem]")) setOpen(true);
    };

    const handleEntryClick = () => {
      if (canEdit && !open) setOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return;
      const key = event.key;
      const plain = !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;

      // Toward the chips (the left arrow in a left-to-right page), from the very start of the entry. This works in
      // a read-only field too: the chips can be read and focused.
      const toward = isRtl() ? "ArrowRight" : "ArrowLeft";
      const field = event.currentTarget;
      if (plain && key === toward && field.selectionStart === 0 && field.selectionEnd === 0) {
        if (chips.focusLastChip()) event.preventDefault();
        return;
      }
      if (!canEdit) return;

      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        const direction = key === "ArrowDown" ? 1 : -1;
        if (event.altKey) {
          setOpen(direction === 1);
          return;
        }
        if (!open) {
          setOpen(true);
          const start = direction === 1 ? firstEnabled(flat) : lastEnabled(flat);
          if (start !== -1) moveHighlight(start);
          return;
        }
        const next =
          highlighted === -1
            ? direction === 1
              ? firstEnabled(flat)
              : lastEnabled(flat)
            : stepEnabled(flat, highlighted, direction);
        if (next !== -1) moveHighlight(next);
        return;
      }
      if ((key === "PageDown" || key === "PageUp") && open) {
        event.preventDefault();
        const direction = key === "PageDown" ? 1 : -1;
        const from = highlighted === -1 ? (direction === 1 ? -1 : flat.length) : highlighted;
        let next = Math.min(flat.length - 1, Math.max(0, from + direction * PAGE_STEP));
        while (next >= 0 && next < flat.length && isDisabled(flat[next] as MultiSelectOption)) next += direction;
        if (next >= 0 && next < flat.length) moveHighlight(next);
        return;
      }
      if (key === "Enter" && allowCustomValue && typedText !== "" && !(open && highlighted !== -1)) {
        // Nothing is highlighted, so Enter makes a chip of what was typed.
        event.preventDefault();
        const { refused } = addTyped([text]);
        if (refused.length === 0) setText("", "select");
        return;
      }
      if (key === "Enter" && open) {
        event.preventDefault();
        const option = highlighted === -1 ? undefined : flat[highlighted];
        if (option) choose(option);
        else setOpen(false);
        return;
      }
      // Backspace on an empty entry moves to the last chip; a second press there removes it. A removal that needs
      // two keys is harder to do by accident than one that follows the last letter typed.
      if (key === "Backspace" && text === "" && values.length > 0) {
        if (chips.focusLastChip()) event.preventDefault();
        return;
      }
      if (key === "Escape" && !open && text !== "") {
        // Only while there is text to clear: the key belongs to this field, not to whatever it sits in.
        event.preventDefault();
        event.stopPropagation();
        setText("", "reset");
        setMessage(undefined);
      }
    };

    // Radix's dismissable layer closes the list on Escape (and marks the key handled, which is why this isn't in the
    // key handler); the typed text stays until a second press.
    const handleEscape = () => setNavigated(null);

    // A form reads the values from hidden inputs, one per value, and refuses an empty or short field through the
    // entry itself: a custom validity on it is the field's constraint, so a surrounding `Form` finds the field's own
    // control, shows the message in its error slot and focuses it.
    useEffect(() => {
      const entry = entryRef.current;
      if (!entry) return;
      let message = "";
      if (required && values.length === 0) message = labels.required;
      else if (minSelected !== undefined && values.length < minSelected) message = labels.minSelected(minSelected);
      entry.setCustomValidity(message);
    });

    // The controller: an object whose identity never changes and whose methods read the latest state.
    const latest = useRef({ open, canEdit, hasValues: values.length > 0 || text !== "", setOpen, clearAll });
    useLayoutEffect(() => {
      latest.current = { open, canEdit, hasValues: values.length > 0 || text !== "", setOpen, clearAll };
    });
    const controller = useMemo<MultiSelectController>(
      () => ({
        open: () => {
          if (latest.current.open || !latest.current.canEdit) return false;
          latest.current.setOpen(true);
          return true;
        },
        close: () => {
          if (!latest.current.open) return false;
          latest.current.setOpen(false);
          return true;
        },
        clear: () => {
          if (!latest.current.canEdit || !latest.current.hasValues) return false;
          latest.current.clearAll();
          return true;
        },
        focus: () => {
          const entry = entryRef.current;
          if (!entry || entry.disabled) return false;
          entry.focus();
          return true;
        },
      }),
      [],
    );
    useImperativeHandle(controllerRef, () => controller, [controller]);

    const summaryMode = overflow === "summary";
    const summaryId = `${reactId}-summary`;
    const showFooter = useResolvedResponsiveValue(footer, false);
    const hasRemovable = values.some((chosen) => !isLocked(chosen));
    const showClear = clearable && canEdit && (hasRemovable || text !== "");
    const tagSize = tagSizeFor[size];
    const errorId = `${reactId}-error`;
    const invalid = hasError || Boolean(message);
    const describedBy =
      [
        ariaDescribedBy,
        message ? errorId : undefined,
        summaryMode && values.length > 0 ? summaryId : undefined,
        !summaryMode && values.length > 0 && canEdit ? hintId : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined;
    // Each chip is keyed by its value (and how many of the same value came before it), so moving one keeps its element,
    // and the focus on its button, rather than making a new one.
    const chipKeys = (() => {
      const seen = new Map<string, number>();
      return values.map((chosen) => {
        const times = seen.get(chosen) ?? 0;
        seen.set(chosen, times + 1);
        return times === 0 ? chosen : `${chosen}\u0000${times}`;
      });
    })();
    const chipContent = (chosen: string) => (renderValue ? renderValue(optionFor(chosen), chosen) : undefined);
    const chipTone = (chosen: string) => optionFor(chosen)?.tone ?? tone;

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Anchor asChild>
          <div {...rest} ref={rootRef} className={cx(chipStyles.root, styles.root, sizeClass[size], className)} style={style} dir={dir}>
            {/* The mousedown only hands focus to the entry, which is itself fully keyboard-operable. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a hit-area extension of the entry, as `Input`'s box is */}
            <div
              ref={boxRef}
              aria-disabled={disabled || undefined}
              className={cx(
                chipStyles.box,
                styles.box,
                invalid && chipStyles.invalid,
                disabled && chipStyles.disabled,
                (chips.collapsed || chips.idleLine || summaryMode) && chipStyles.collapsed,
                values.length === 0 && chipStyles.noTags,
              )}
              onMouseDown={handleBoxMouseDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <div
                className={cx(
                  styles.row,
                  (chips.idleLine || summaryMode) && chipStyles.oneLine,
                  reorderable && canEdit && styles.reorderable,
                  dragged && styles.sorting,
                )}
              >
                {/* The explicit roles are deliberate: Safari with VoiceOver stops treating a list as one under
                    `list-style: none` (05-component-api-conventions.md §6), which the lint rule calls redundant.
                    The key handler only moves focus among the chips' own buttons, which are real controls. */}
                <TooltipProvider>
                  {/* eslint-disable-next-line jsx-a11y/no-redundant-roles, jsx-a11y/no-noninteractive-element-interactions */}
                  <ul
                    ref={mergeRefs(chips.listRef, sortableRef)}
                    role="list"
                    aria-label={labels.selected}
                    className={chipStyles.list}
                    onKeyDown={chips.handleChipKeyDown}
                    onKeyUp={(event) => {
                      if (reorderable) sortableKeyUp(event);
                    }}
                  >
                    {/* A chip drawn but never seen, so the row is as tall as a chip with none in it and choosing the
                        first does not move what is below. Hidden from everything: no tab stop, no name, no width. */}
                    <li aria-hidden="true" className={chipStyles.sizer}>
                      <Tag removable removeTabStop={false} size={tagSize} onRemove={ignoreRemove}>
                        {NO_BREAK_SPACE}
                      </Tag>
                    </li>
                    {values.slice(0, summaryMode ? 0 : chips.visibleCount).map((chosen, index) => (
                      <TagsInputChip
                        key={chipKeys[index]}
                        tag={labelOf(chosen)}
                        reason={undefined}
                        tone={chipTone(chosen)}
                        variant={variant}
                        size={tagSize}
                        icon={optionFor(chosen)?.chipIcon}
                        content={chipContent(chosen)}
                        removable={canEdit && !isLocked(chosen)}
                        note={isLocked(chosen) ? lockedReason(chosen) : undefined}
                        removeLabel={labels.remove(labelOf(chosen))}
                        onRemove={() => chips.removeFromChip(index)}
                        itemProps={reorderable && canEdit ? sortableItemProps(index) : undefined}
                      />
                    ))}
                  </ul>
                </TooltipProvider>
                {!summaryMode && chips.collapsed && (
                  <Tag
                    className={chipStyles.more}
                    tone={tone}
                    variant={variant}
                    size={tagSize}
                    aria-expanded={false}
                    onClick={() => chips.setExpanded(true)}
                  >
                    <span className={chipStyles.chipLabel}>{labels.more(chips.hiddenCount)}</span>
                  </Tag>
                )}
                {!summaryMode && !chips.collapsed && chips.expanded && chips.overflowing && (
                  <Tag
                    className={chipStyles.more}
                    tone={tone}
                    variant={variant}
                    size={tagSize}
                    aria-expanded={true}
                    onClick={() => chips.setExpanded(false)}
                  >
                    <span className={chipStyles.chipLabel}>{labels.less}</span>
                  </Tag>
                )}
                {summaryMode && values.length > 0 && (
                  <Tag id={summaryId} tone={tone} variant={variant} size={tagSize}>
                    <span className={chipStyles.chipLabel}>{labels.summary(values.length)}</span>
                  </Tag>
                )}
                <div className={chipStyles.entryItem}>
                  <input
                    ref={mergeRefs(ref, entryRef)}
                    type="text"
                    id={inputId}
                    data-testid={dataTestId}
                    className={chipStyles.entry}
                    value={text}
                    placeholder={values.length === 0 ? placeholder : undefined}
                    disabled={disabled}
                    readOnly={readOnly}
                    autoComplete={autoComplete}
                    // The opt-in prop of a native input, which React does focus on mount.
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                    inputMode={inputMode}
                    enterKeyHint={enterKeyHint}
                    spellCheck={spellCheck}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    onCompositionStart={() => {
                      composing.current = true;
                    }}
                    onCompositionEnd={() => {
                      composing.current = false;
                    }}
                    onClick={handleEntryClick}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    aria-describedby={describedBy}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    // Points at the list for as long as it is in the page, which includes the moment it fades out after closing.
                    aria-controls={listWindow.listElement ? listId : undefined}
                    aria-autocomplete="list"
                    aria-activedescendant={open && listWindow.activeRendered ? optionDomId(listId, highlighted) : undefined}
                    aria-invalid={invalid || ariaInvalid || undefined}
                    aria-required={required || undefined}
                  />
                </div>
              </div>
              {(loading || showClear || canEdit) && (
                <div className={styles.trailing} data-reserve="true">
                  <Adornments>
                    {loading ? <Spinner size={size} tone="default" /> : null}
                    {showClear ? (
                      <AdornmentButton icon={XIcon} size={size} label={labels.clear} onClick={clearAll} />
                    ) : null}
                    {canEdit ? (
                      <AdornmentButton
                        icon={CaretDownIcon}
                        size={size}
                        label={labels.toggle}
                        onClick={() => {
                          entryRef.current?.focus();
                          setOpen(!open);
                        }}
                      />
                    ) : null}
                  </Adornments>
                </div>
              )}
              {overflow === "collapse" && (
                <div aria-hidden="true" className={chipStyles.measurerFrame}>
                  <div ref={chips.measurerRef} className={chipStyles.measurer}>
                    {values.map((chosen, index) => (
                      <Tag
                        key={chipKeys[index]}
                        tone={chipTone(chosen)}
                        variant={variant}
                        size={tagSize}
                        leadingIcon={optionFor(chosen)?.chipIcon}
                        removable={canEdit}
                        onRemove={ignoreRemove}
                      >
                        {chipContent(chosen) ?? labelOf(chosen)}
                      </Tag>
                    ))}
                    <Tag tone={tone} variant={variant} size={tagSize}>
                      {labels.more(Math.max(values.length, 1))}
                    </Tag>
                  </div>
                </div>
              )}
            </div>
            {message && (
              <FieldError id={errorId} className={chipStyles.message}>
                {message}
              </FieldError>
            )}
            {!summaryMode && values.length > 0 && canEdit && <VisuallyHidden id={hintId}>{labels.chipsHint}</VisuallyHidden>}
            {/* One hidden input per value. With none chosen a disabled one keeps the name in the form's list of
                controls (it is never submitted), so a `Form` can find the field. */}
            {name &&
              (values.length === 0 ? (
                <input type="hidden" name={name} form={form} disabled />
              ) : (
                values.map((chosen, index) => (
                  <input key={`${index}-${chosen}`} type="hidden" name={name} form={form} value={chosen} disabled={disabled} />
                ))
              ))}
            {/* In the page before it has anything to say, so changes are announced. */}
            <VisuallyHidden role="status">{announcement}</VisuallyHidden>
          </div>
        </PopoverPrimitive.Anchor>
        <OptionListPanel
          listId={listId}
          size={size}
          rows={listWindow.drawn}
          windowed={listWindow.drawing}
          windowStyle={listWindow.windowStyle}
          optionCount={flat.length}
          highlighted={highlighted}
          isSelected={(option) => {
            if (option.value === SELECT_ALL_VALUE) return !onSelectAll && allChosen;
            const group = groupOfRowValue(option.value);
            if (group !== undefined) return groupAllChosen(group);
            return option.value !== CREATE_VALUE && selectedSet.has(option.value);
          }}
          onChoose={choose}
          onHover={(option) => {
            if (navigated !== option.value) setNavigated(option.value);
          }}
          markText={text}
          highlightTone={highlightTone}
          hasIcons={hasIcons}
          renderOption={renderOption}
          // Nothing to choose from and nothing typed is an invitation; text that matches nothing is "no results".
          emptyMessage={
            loading
              ? labels.loading
              : typedText === "" && options.length === 0
                ? labels.typeToSearch
                : (emptyContent ?? labels.noResults)
          }
          loading={loading}
          loadingMessage={labels.loading}
          errorMessage={error ? labels.error : undefined}
          footer={
            showFooter ? (
              <>
                <span className={styles.footerCount}>{labels.footerCount(values.length)}</span>
                <Button size="sm" variant="tertiary" tabIndex={-1} disabled={!hasRemovable} onClick={clearAll}>
                  {labels.footerClear}
                </Button>
                <Button size="sm" tabIndex={-1} onClick={() => setOpen(false)}>
                  {labels.footerDone}
                </Button>
              </>
            ) : undefined
          }
          ariaLabel={ariaLabel ?? fieldLabel}
          ariaLabelledBy={ariaLabelledBy}
          multiselectable
          setListRef={listWindow.setListRef}
          fieldRef={rootRef}
          container={container}
          dir={dir}
          side={panelSide}
          align={align}
          fullWidth={fullWidth}
          contentStyle={contentStyle}
          onEscapeKeyDown={handleEscape}
        />
      </PopoverPrimitive.Root>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
