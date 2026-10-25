import { CheckIcon, PlusIcon } from "@dbm-system/icons";
import { cx } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { Highlight } from "../../atoms/Highlight";
import type { HighlightTone } from "../../atoms/Highlight";
import { Icon } from "../../atoms/Icon";
import { Spinner } from "../../atoms/Spinner";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import styles from "./OptionList.module.css";
import { findMatches } from "./optionList.match";
import { CREATE_VALUE, isActionValue, isDisabled } from "./optionList.rows";
import type { Row } from "./optionList.rows";
import type { ListOption, OptionListSize } from "./optionList.types";
import { EDGE_GAP, SIDE_OFFSET } from "./useOptionListLayout";
import { optionDomId } from "./useOptionListWindow";

const sizeClass: Record<OptionListSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const optionIconSize: Record<OptionListSize, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "md",
};

export interface OptionListPanelProps<O extends ListOption> {
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

  /** What the list says when there is nothing to choose. */
  emptyMessage: ReactNode;
  loading: boolean;
  loadingMessage: string;
  /** The note under the options when the owner reports an error. */
  errorMessage: string | undefined;
  /** A row of actions under the list (a count and its buttons), outside the listbox. */
  footer?: ReactNode;

  /** The listbox's accessible name. */
  ariaLabel: string | undefined;
  ariaLabelledBy: string | undefined;
  /** More than one option can be chosen. */
  multiselectable?: boolean;
  setListRef: (element: HTMLDivElement | null) => void;

  /** The floating layer. */
  fieldRef: RefObject<HTMLElement | null>;
  container: HTMLElement | null | undefined;
  dir: "ltr" | "rtl";
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  fullWidth: boolean;
  contentStyle: CSSProperties | undefined;
  onEscapeKeyDown: () => void;
}

/**
 * The floating list under a field that `Combobox` and `MultiSelect` share: a Radix popover layer (anchored by the
 * field, never taking focus from it), a `listbox` of rows with group headings, icons, descriptions, a mark on the
 * chosen ones and a note for "no results", loading and error. The field keeps focus and points at the highlighted
 * option with `aria-activedescendant`, so the rows are not focusable.
 */
export function OptionListPanel<O extends ListOption>({
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
  emptyMessage,
  loading,
  loadingMessage,
  errorMessage,
  footer,
  ariaLabel,
  ariaLabelledBy,
  multiselectable,
  setListRef,
  fieldRef,
  container,
  dir,
  side,
  align,
  fullWidth,
  contentStyle,
  onEscapeKeyDown,
}: OptionListPanelProps<O>) {
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
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        role="presentation"
        dir={dir}
        side={side}
        align={align}
        sideOffset={SIDE_OFFSET}
        collisionPadding={EDGE_GAP}
        className={cx(styles.content, sizeClass[size], fullWidth && styles.fullWidth)}
        // Focus stays in the field: nothing here takes it, and a press on the list isn't the field losing it.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={onEscapeKeyDown}
        onFocusOutside={(event) => event.preventDefault()}
        // A press in the field or its buttons is not "outside"; one anywhere else closes the list.
        onInteractOutside={(event) => {
          const target = event.target;
          if (target instanceof Node && fieldRef.current?.contains(target)) event.preventDefault();
        }}
        style={contentStyle}
        onMouseDown={(event) => event.preventDefault()}
      >
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
        {errorMessage ? <div className={styles.footer}>{errorMessage}</div> : null}
        {footer ? <div className={styles.actions}>{footer}</div> : null}
        {loading && optionCount > 0 ? (
          <div className={styles.footer}>
            <Spinner size="xs" tone="default" />
            {loadingMessage}
          </div>
        ) : null}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
