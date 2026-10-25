import { CheckIcon, PlusIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import type { CSSProperties, ReactNode } from "react";
import { Highlight } from "../../atoms/Highlight";
import type { HighlightTone } from "../../atoms/Highlight";
import { Icon } from "../../atoms/Icon";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./OptionList.module.css";
import { findMatches } from "./optionList.match";
import { CREATE_VALUE, isActionValue, isDisabled } from "./optionList.rows";
import type { Row } from "./optionList.rows";
import type { ListOption, OptionListSize } from "./optionList.types";
import { optionDomId } from "./useOptionListWindow";

const optionIconSize: Record<OptionListSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "md",
};

export interface OptionListBodyProps<O extends ListOption> {
  /** Stable id of the listbox; each option's id is built from it. */
  listId: string;
  size: OptionListSize;

  /** The rows to draw (the window, when the list is windowed). */
  rows: Row<O>[];
  /** Whether `rows` is only a window of a longer list, so groups are not real elements and options carry their group. */
  windowed: boolean;
  /** The padding that stands in for the rows left out of a window. */
  windowStyle: CSSProperties | undefined;
  /** How many options there are in all, to know whether the list is empty. */
  optionCount: number;
  /** The index in the whole list of the highlighted option, or `-1`. */
  highlighted: number;
  isSelected: (option: O) => boolean;
  onChoose: (option: O) => void;
  /** The pointer moved over an enabled option. */
  onHover: (option: O) => void;

  /** The typed text, whose matches are marked in each label (empty marks nothing). */
  markText: string;
  highlightTone?: HighlightTone;
  /** Whether any option has an icon, so the rows without one hold a blank place and the labels line up. */
  hasIcons: boolean;
  renderOption?: (option: O, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  /** What a row ends with, after its text and before its mark: a shortcut, a chevron, a spinner. */
  renderTrailing?: (option: O, state: { highlighted: boolean; selected: boolean }) => ReactNode;

  /** What the list says when there is nothing to choose. */
  emptyMessage: ReactNode;
  loading: boolean;

  /** The listbox's accessible name. */
  ariaLabel: string | undefined;
  ariaLabelledBy: string | undefined;
  /** More than one option can be chosen. */
  multiselectable?: boolean;
  setListRef: (element: HTMLDivElement | null) => void;
}

/**
 * The listbox that `Combobox` and `MultiSelect` (inside `OptionListPanel`'s floating layer) and `CommandPalette`
 * (inline in a dialog) draw: rows with group headings, icons, descriptions, a mark on the chosen ones, and a note for
 * "no results". The field keeps focus and points at the highlighted option with `aria-activedescendant`, so the
 * rows are not focusable.
 */
export function OptionListBody<O extends ListOption>({
  listId,
  size,
  rows,
  windowed,
  windowStyle,
  optionCount,
  highlighted,
  isSelected,
  onChoose,
  onHover,
  markText,
  highlightTone,
  hasIcons,
  renderOption,
  renderTrailing,
  emptyMessage,
  loading,
  ariaLabel,
  ariaLabelledBy,
  multiselectable,
  setListRef,
}: OptionListBodyProps<O>) {
  const renderRowContent = (option: O, isHighlighted: boolean, selected: boolean): ReactNode => {
    if (renderOption) return renderOption(option, { highlighted: isHighlighted, selected });
    if (isActionValue(option.value)) {
      // A row for one of the field's own actions: its text is not an option's label, so nothing in it is marked.
      const icon = option.value === CREATE_VALUE ? PlusIcon : option.icon;
      return (
        <>
          {icon ? <Icon icon={icon} size={optionIconSize[size]} tone="default" className={styles.optionIcon} /> : null}
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>{option.label}</span>
          </span>
        </>
      );
    }
    const matches = findMatches(option.label, markText);
    const parts: ReactNode[] = [];
    let at = 0;
    matches.forEach(([from, to], position) => {
      if (from > at) parts.push(option.label.slice(at, from));
      const text = option.label.slice(from, to);
      // Bold by default; a tone adds `Highlight`'s colours as well.
      parts.push(
        highlightTone ? (
          <Highlight key={position} tone={highlightTone} className={styles.match}>
            {text}
          </Highlight>
        ) : (
          <b key={position} className={styles.match}>
            {text}
          </b>
        ),
      );
      at = to;
    });
    if (at < option.label.length) parts.push(option.label.slice(at));
    const label = matches.length > 0 ? <>{parts}</> : option.label;
    return (
      <>
        {option.icon ? (
          <Icon icon={option.icon} size={optionIconSize[size]} tone="default" className={styles.optionIcon} />
        ) : hasIcons ? (
          // Keeps the labels of options without an icon in line with those that have one.
          <span aria-hidden="true" className={styles.optionIconSpace} />
        ) : null}
        <span className={styles.optionText}>
          <span className={styles.optionLabel}>{label}</span>
          {option.description ? <span className={styles.optionDescription}>{option.description}</span> : null}
        </span>
      </>
    );
  };

  const renderOptionRow = (row: Extract<Row<O>, { kind: "option" }>) => {
    const { option, index } = row;
    const selected = isSelected(option);
    const isHighlighted = index === highlighted;
    const reason = typeof option.disabled === "string" ? option.disabled : undefined;
    // In a windowed list the group's own element isn't drawn, so each option carries the group's name to be read.
    const groupName = windowed ? option.group : undefined;
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- an option of a combobox is never focused: focus stays in the field, which points at the highlighted option with aria-activedescendant and answers the keys itself (the ARIA combobox pattern).
      <div
        key={row.key}
        id={optionDomId(listId, index)}
        role="option"
        aria-selected={selected}
        aria-disabled={isDisabled(option) || undefined}
        data-highlighted={isHighlighted || undefined}
        data-selected={selected || undefined}
        data-disabled={isDisabled(option) || undefined}
        title={reason}
        className={cx(styles.option, Boolean(option.description) && styles.optionDescribed)}
        onClick={() => onChoose(option)}
        onMouseMove={() => {
          if (!isDisabled(option)) onHover(option);
        }}
      >
        {renderRowContent(option, isHighlighted, selected)}
        {renderTrailing ? renderTrailing(option, { highlighted: isHighlighted, selected }) : null}
        {groupName ? <VisuallyHidden>{`, ${groupName}`}</VisuallyHidden> : null}
        {reason ? <VisuallyHidden>{`, ${reason}`}</VisuallyHidden> : null}
        {selected && option.value !== CREATE_VALUE ? (
          <Icon icon={CheckIcon} size={optionIconSize[size]} tone="brand" className={styles.optionCheck} />
        ) : null}
      </div>
    );
  };

  const renderHeading = (row: Extract<Row<O>, { kind: "group" }>) => (
    <div key={row.key} id={`${listId}-${row.key}`} role="presentation" className={styles.groupLabel}>
      {row.label}
    </div>
  );

  const renderRows = (): ReactNode => {
    if (optionCount === 0) {
      return (
        <div role="option" aria-selected="false" aria-disabled="true" className={cx(styles.option, styles.status)}>
          {emptyMessage}
        </div>
      );
    }
    if (windowed) {
      return rows.map((row) => (row.kind === "group" ? renderHeading(row) : renderOptionRow(row)));
    }
    const sections: ReactNode[] = [];
    let group: { heading: Extract<Row<O>, { kind: "group" }>; items: ReactNode[] } | undefined;
    const flush = () => {
      if (!group) return;
      sections.push(
        <div key={group.heading.key} role="group" aria-labelledby={`${listId}-${group.heading.key}`}>
          {renderHeading(group.heading)}
          {group.items}
        </div>,
      );
      group = undefined;
    };
    for (const row of rows) {
      if (row.kind === "group") {
        flush();
        group = { heading: row, items: [] };
      } else if (group) group.items.push(renderOptionRow(row));
      else sections.push(renderOptionRow(row));
    }
    flush();
    return sections;
  };

  return (
    <div
      ref={setListRef}
      id={listId}
      role="listbox"
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-multiselectable={multiselectable || undefined}
      aria-busy={loading || undefined}
      className={styles.list}
    >
      {/* The spacers of a windowed list are this box's padding, not the scrolling box's own: a box can't
          shrink below its padding, so padding on it would stop it being capped. */}
      <div role="presentation" style={windowStyle}>
        {renderRows()}
      </div>
    </div>
  );
}
