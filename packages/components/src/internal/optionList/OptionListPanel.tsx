import { cx } from "@dbm-system/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { Spinner } from "../../atoms/Spinner";
import styles from "./OptionList.module.css";
import { OptionListBody } from "./OptionListBody";
import type { Row } from "./optionList.rows";
import type { ListOption, OptionListSize } from "./optionList.types";
import { EDGE_GAP, SIDE_OFFSET } from "./useOptionListLayout";
import type { HighlightTone } from "../../atoms/Highlight";

const sizeClass: Record<OptionListSize, string | undefined> = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
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
        <OptionListBody
          listId={listId}
          size={size}
          rows={rows}
          windowed={windowed}
          windowStyle={windowStyle}
          optionCount={optionCount}
          highlighted={highlighted}
          isSelected={isSelected}
          onChoose={onChoose}
          onHover={onHover}
          markText={markText}
          highlightTone={highlightTone}
          hasIcons={hasIcons}
          renderOption={renderOption}
          emptyMessage={emptyMessage}
          loading={loading}
          ariaLabel={ariaLabel}
          ariaLabelledBy={ariaLabelledBy}
          multiselectable={multiselectable}
          setListRef={setListRef}
        />
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
