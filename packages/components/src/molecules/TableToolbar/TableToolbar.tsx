import { CaretDownIcon } from "@dbm-system/icons";
import { cx, mergeDefined, useAnnouncement } from "@dbm-system/utils";
import { forwardRef, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import type { ButtonSize } from "../../atoms/Button";
import { useButtonGroup } from "../../atoms/Button/buttonGroupContext";
import { Tag } from "../../atoms/Tag";
import type { TagSize } from "../../atoms/Tag";
import { Skeleton } from "../../atoms/Skeleton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Popover } from "../Popover";
import { focusNearestOutside } from "./focus";
import { safeCount } from "./safeCount";
import { TableToolbarContext } from "./tableToolbarContext";
import { TableToolbarFilters } from "./TableToolbarFilters";
import styles from "./TableToolbar.module.css";
import type {
  TableToolbarActiveFiltersLabels,
  TableToolbarActiveFiltersProps,
  TableToolbarFilterLabels,
  TableToolbarFilterProps,
  TableToolbarProps,
  TableToolbarRowProps,
  TableToolbarSearchProps,
  TableToolbarSelectionLabels,
  TableToolbarSelectionProps,
  TableToolbarSize,
  TableToolbarSummaryLabels,
  TableToolbarSummaryProps,
} from "./TableToolbar.types";


// A chip is a step smaller than a button of the same size, as `Tag` is wherever it sits beside one.
const tagSizeFor: Record<TableToolbarSize, TagSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };
// Bulk-action and summary text sits one step down from the control size, so it reads as supporting the table.
const textClass: Record<TableToolbarSize, string | undefined> = {
  xs: styles.textXs,
  sm: styles.textSm,
  md: styles.textMd,
  lg: styles.textLg,
  xl: styles.textXl,
};
const smallerButton: Record<TableToolbarSize, ButtonSize> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };


/**
 * The bar above a table of data: search, filters, the filters currently applied, a result count, and the bulk actions that
 * appear when rows are selected. It owns no data: everything is driven by props and callbacks, so a `Table`, a card list or
 * a `DataTable` (which draws it as `DataTable.Toolbar`) can all sit under it.
 *
 * It is a named `role="group"`, not a `role="toolbar"`: a search field can't live in a toolbar, which takes the left and
 * right arrow keys for itself. Inside it the search field is an ordinary tab stop; the filters and actions go in real
 * `Toolbar`s (`TableToolbar.Filter` inside a `Toolbar.Item`), so each is one tab stop with arrow-key movement; the applied-filter chips
 * and "Clear all" are ordinary tab stops in reading order.
 *
 * Parts: `TableToolbar.Row` (a wrapping row), `.Search` (sizes the search field), `.Filter` (a button that opens a panel of
 * filter controls), `.ActiveFilters` (removable chips and "Clear all"), `.Summary` ("128 results"), `.Selection` (the bulk row).
 * Text the parts supply is a `labels` object and numbers go through `formatNumber`.
 *
 * @example
 * ```tsx
 * <TableToolbar aria-label="Orders table tools">
 *   <TableToolbar.Row>
 *     <TableToolbar.Search>
 *       <SearchInput aria-label="Search orders" onSearch={setQuery} />
 *     </TableToolbar.Search>
 *     <Toolbar aria-label="Filters" variant="secondary">
 *       <Toolbar.Item>
 *         <TableToolbar.Filter label="Status" count={statuses.length} onClear={clearStatuses}>
 *           <CheckboxGroup aria-label="Status" …>…</CheckboxGroup>
 *         </TableToolbar.Filter>
 *       </Toolbar.Item>
 *     </Toolbar>
 *     <Spacer />
 *     <Toolbar aria-label="Actions" variant="secondary">
 *       <Toolbar.Button leadingIcon={DownloadIcon}>Export</Toolbar.Button>
 *     </Toolbar>
 *   </TableToolbar.Row>
 *   <TableToolbar.Row>
 *     <TableToolbar.ActiveFilters items={applied} onRemove={removeFilter} onClearAll={clearFilters} />
 *     <TableToolbar.Summary count={rows.length} total={allRows.length} />
 *   </TableToolbar.Row>
 *   <TableToolbar.Selection count={selected.size} totalCount={rows.length} onClear={clearSelection} onSelectAll={selectAll}>
 *     <Toolbar aria-label="Bulk actions"><Toolbar.Button>Archive</Toolbar.Button></Toolbar>
 *   </TableToolbar.Selection>
 * </TableToolbar>
 * ```
 */
const TableToolbarRoot = forwardRef<HTMLDivElement, TableToolbarProps>(
  ({ children, size: sizeProp, className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    // Nested in another bar, a size left out follows the outer bar's, as `ButtonGroup`'s does (alone, the context's default is `md`).
    const parent = useContext(TableToolbarContext);
    const size = sizeProp ?? parent.size;
    const hasWarnedNoAccessibleNameRef = useRef(false);
    if (process.env.NODE_ENV !== "production") {
      if (!ariaLabel && !ariaLabelledBy && !hasWarnedNoAccessibleNameRef.current) {
        hasWarnedNoAccessibleNameRef.current = true;
        console.warn(
          "TableToolbar: no accessible name — pass `aria-label`, or `aria-labelledby` pointing at a visible label, so assistive tech can say what the group of table controls is for.",
        );
      }
    }
    return (
      <TableToolbarContext.Provider value={{ size }}>
        <div
          ref={ref}
          {...props}
          // Applied after `{...props}` so a same-named consumer prop can never replace them
          // (05-component-api-conventions.md §3).
          role="group"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          data-table-toolbar=""
          className={cx(styles.root, className)}
        >
          {children}
        </div>
      </TableToolbarContext.Provider>
    );
  },
);
TableToolbarRoot.displayName = "TableToolbar";

/** A wrapping row of the bar: what shares it moves to the next line when it doesn't fit. */
const TableToolbarRow = forwardRef<HTMLDivElement, TableToolbarRowProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} {...props} className={cx(styles.row, className)}>
    {children}
  </div>
));
TableToolbarRow.displayName = "TableToolbar.Row";

/**
 * Sizes the search field: it wants a usable width before its row wraps, grows into spare room up to a measure, and never
 * shrinks to nothing. Put a `SearchInput` in it.
 */
const TableToolbarSearch = forwardRef<HTMLDivElement, TableToolbarSearchProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} {...props} className={cx(styles.search, className)}>
    {children}
  </div>
));
TableToolbarSearch.displayName = "TableToolbar.Search";

const makeFilterLabels = (formatNumber: (value: number) => string): TableToolbarFilterLabels => ({
  clear: "Clear",
  activeCount: (count) => `${formatNumber(count)} active`,
  panel: (label) => `${label} filter`,
  named: (label, value) => `${label}: ${value}`,
  before: (label) => `${label}:`,
});

/**
 * A button that opens a panel of filter controls (a `Popover`), showing how many values of the filter are applied. The
 * controls in the panel and their state are yours. Inside a `Toolbar`, wrap it in a `Toolbar.Item` so it joins the arrow-key
 * order: it hands every prop it is given to its button, so a `Select` or a popover trigger works the same way there.
 */
const TableToolbarFilter = forwardRef<HTMLButtonElement, TableToolbarFilterProps>(
  (
    {
      label,
      children,
      value,
      labelPlacement = "inside",
      count: countProp = 0,
      max = 99,
      onClear,
      open,
      defaultOpen,
      onOpenChange,
      variant,
      size,
      icon,
      align = "start",
      labels: labelOverrides,
      formatNumber = String,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const bar = useContext(TableToolbarContext);
    // Inside a `Toolbar` the button takes the toolbar's variant and size (it reads the same context `Button` does); on its
    // own it is a `secondary` button at the bar's size.
    const group = useButtonGroup();
    const count = safeCount(countProp);
    const labels = mergeDefined(makeFilterLabels(formatNumber), labelOverrides);

    const hasWarnedNoLabelRef = useRef(false);
    if (process.env.NODE_ENV !== "production" && !label && !hasWarnedNoLabelRef.current) {
      hasWarnedNoLabelRef.current = true;
      console.warn("TableToolbar.Filter: no `label`, so the button has no name. Pass the filter's name (\"Status\").");
    }

    // A `value` makes the button show the choice: the name is then "Status: All" (the visible text as whole words), with the name written in the
    // button or, with `labelPlacement="before"`, as plain text before it.
    const hasValue = typeof value === "string";
    const before = hasValue && labelPlacement === "before";
    const named = hasValue ? labels.named(label, value) : label;

    const popover = (
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          <Button
            ref={ref}
            {...props}
            variant={variant ?? (group ? undefined : "secondary")}
            size={size ?? (group ? undefined : bar.size)}
            leadingIcon={icon}
            trailingIcon={CaretDownIcon}
            // What the button shows ("Status 2", or "Status 99+" past `max`) is inside this name, as whole words in order, so what the
            // button says is what it is called (WCAG 2.5.3). The true count still follows: "Tags 99+, 1,284 active".
            aria-label={
              hasValue || count === 0
                ? named
                : count > max
                  ? `${label} ${formatNumber(max)}+, ${labels.activeCount(count)}`
                  : `${label}, ${labels.activeCount(count)}`
            }
            data-active={count > 0 ? "" : undefined}
            className={before ? undefined : className}
            style={before ? undefined : style}
          >
            {hasValue ? (before ? value : named) : label}
            {!hasValue && count > 0 && " "}
            {!hasValue && count > 0 && (
              <span className={cx(styles.filterCount, (size ?? group?.size ?? bar.size) === "xs" && styles.filterCountXs)} aria-hidden="true">
                <Badge tone="brand" size="xs">
                  {count > max ? `${formatNumber(max)}+` : formatNumber(count)}
                </Badge>
              </span>
            )}
          </Button>
        </Popover.Trigger>
        <Popover.Content aria-label={labels.panel(label)} align={align} className={styles.filterPanel}>
          {children}
          {count > 0 && onClear && (
            <div className={styles.filterFooter}>
              <Button variant="ghost" size="sm" fullWidth onClick={onClear}>
                {labels.clear}
              </Button>
            </div>
          )}
        </Popover.Content>
      </Popover>
    );
    if (!before) return popover;
    // `className` and `style` go on the outermost box in every form; the name before the button is drawn text, named again by the button.
    return (
      <span className={cx(styles.filterBox, className)} style={style}>
        <span className={styles.filterName} aria-hidden="true">
          {labels.before(label)}
        </span>
        {popover}
      </span>
    );
  },
);
TableToolbarFilter.displayName = "TableToolbar.Filter";

const makeActiveFiltersLabels = (formatNumber: (value: number) => string): TableToolbarActiveFiltersLabels => ({
  list: "Applied filters",
  clearAll: "Clear all",
  remove: (label) => `Remove filter: ${label}`,
  applied: (count) => (count === 0 ? "No filters applied" : count === 1 ? "1 filter applied" : `${formatNumber(count)} filters applied`),
});

/**
 * The filters applied right now, as removable chips, with "Clear all" once there is more than one. Nothing is drawn while
 * there are none, but its live region stays in the page: a change in how many are applied is announced (never the first
 * appearance). Removing a chip from the keyboard moves focus to the next chip, or, if it was the last, to the nearest
 * control before it, so the keyboard user doesn't lose their place.
 */
const TableToolbarActiveFilters = forwardRef<HTMLDivElement, TableToolbarActiveFiltersProps>(
  (
    {
      items: itemsProp,
      onRemove,
      onClearAll,
      size: sizeProp,
      tone = "neutral",
      announce = true,
      labels: labelOverrides,
      formatNumber = String,
      className,
      ...props
    },
    ref,
  ) => {
    const bar = useContext(TableToolbarContext);
    const size = sizeProp ?? bar.size;
    const items = Array.isArray(itemsProp) ? itemsProp : [];
    const labels = mergeDefined(makeActiveFiltersLabels(formatNumber), labelOverrides);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const hasWarnedNotArrayRef = useRef(false);
    if (process.env.NODE_ENV !== "production" && itemsProp !== undefined && !Array.isArray(itemsProp) && !hasWarnedNotArrayRef.current) {
      hasWarnedNotArrayRef.current = true;
      console.warn("TableToolbar.ActiveFilters: `items` should be an array of { id, label, group? }; got something else, so nothing is shown.");
    }

    // A change in how many filters are applied is announced; the first count seen is not.
    const { message, announce: say } = useAnnouncement();
    const previousCount = useRef<number | undefined>(undefined);
    const appliedLabel = labels.applied;
    useEffect(() => {
      if (previousCount.current === undefined) {
        previousCount.current = items.length;
        return;
      }
      if (previousCount.current === items.length) return;
      previousCount.current = items.length;
      if (announce) say(appliedLabel(items.length));
    }, [announce, say, appliedLabel, items.length]);

    // Where keyboard focus should go once the control that has it has gone: after a keyboard removal, to the chip now at that
    // place (or the last), and with no chip left, out of the part, to the nearest control before it.
    const pendingFocus = useRef<{ index: number } | null>(null);
    useLayoutEffect(() => {
      const pending = pendingFocus.current;
      if (!pending) return;
      pendingFocus.current = null;
      const buttons = listRef.current?.querySelectorAll<HTMLElement>("li button") ?? [];
      const target = buttons[Math.min(pending.index, buttons.length - 1)];
      if (target) target.focus();
      else if (rootRef.current) focusNearestOutside(rootRef.current);
    }, [items.length]);

    const noteKeyboardRemoval = (index: number) => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && listRef.current?.contains(active) && active.matches(":focus-visible")) {
        pendingFocus.current = { index };
      }
    };

    return (
      <>
        <div
          ref={(node) => {
            rootRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          {...props}
          hidden={items.length === 0}
          className={cx(styles.activeFilters, className)}
        >
          {/* The explicit roles are deliberate: Safari with VoiceOver stops treating a list as one under `list-style: none`
              (05-component-api-conventions.md §6), which is what the lint rule calls redundant. */}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ul ref={listRef} role="list" aria-label={labels.list} className={styles.chips}>
            {items.map((item, index) => {
              const text = item.group ? `${item.group}: ${item.label}` : item.label;
              return (
                // eslint-disable-next-line jsx-a11y/no-redundant-roles -- see the list above
                <li key={item.id} role="listitem">
                  <Tag
                    removable
                    tone={tone}
                    size={tagSizeFor[size]}
                    removeLabel={labels.remove(text)}
                    onRemove={() => {
                      noteKeyboardRemoval(index);
                      onRemove?.(item.id);
                    }}
                  >
                    {text}
                  </Tag>
                </li>
              );
            })}
          </ul>
          {items.length > 1 && onClearAll && (
            <Button
              variant="ghost"
              size={smallerButton[size]}
              rounded
              className={styles.clearAll}
              onClick={() => {
                noteKeyboardRemoval(-1);
                onClearAll();
              }}
            >
              {labels.clearAll}
            </Button>
          )}
        </div>
        {announce && <VisuallyHidden role="status">{message}</VisuallyHidden>}
      </>
    );
  },
);
TableToolbarActiveFilters.displayName = "TableToolbar.ActiveFilters";

const makeSummaryLabels = (formatNumber: (value: number) => string): TableToolbarSummaryLabels => ({
  loading: "Loading results",
  results: (count) => (count === 0 ? "No results" : count === 1 ? "1 result" : `${formatNumber(count)} results`),
  resultsOf: (count, total) => `${formatNumber(count)} of ${formatNumber(total)} results`,
});

/**
 * "128 results", or "12 of 128 results" for a filtered list. A change in the count is announced to screen readers; the
 * first count to appear is not (a `count` left `undefined` means it isn't known yet, so the one that arrives later is a first
 * appearance, not a change).
 */
const TableToolbarSummary = forwardRef<HTMLDivElement, TableToolbarSummaryProps>(
  (
    { count, total, loading = false, size: sizeProp, announce = true, labels: labelOverrides, formatNumber = String, className, ...props },
    ref,
  ) => {
    const bar = useContext(TableToolbarContext);
    const size = sizeProp ?? bar.size;
    const labels = mergeDefined(makeSummaryLabels(formatNumber), labelOverrides);
    const known = typeof count === "number" && Number.isFinite(count) && count >= 0;
    const shown = known ? Math.floor(count) : undefined;
    const showTotal = shown !== undefined && typeof total === "number" && Number.isFinite(total) && total > shown;
    const text = shown === undefined ? "" : showTotal ? labels.resultsOf(shown, Math.floor(total)) : labels.results(shown);

    const { message, announce: say } = useAnnouncement();
    const previousText = useRef<string | undefined>(undefined);
    useEffect(() => {
      // Loading: the count on screen is out of date or not there yet, so say nothing; what arrives afterwards is compared with
      // the last count announced (a change), or is a first appearance if there was none.
      if (loading) return;
      // Nothing shown yet: forget the last text, so the one that arrives is a first appearance.
      if (shown === undefined) {
        previousText.current = undefined;
        return;
      }
      if (previousText.current === undefined) {
        previousText.current = text;
        return;
      }
      if (previousText.current === text) return;
      previousText.current = text;
      if (announce) say(text);
    }, [announce, say, loading, shown, text]);

    return (
      <>
        {loading ? (
          <div ref={ref} {...props} aria-busy="true" className={cx(styles.summary, styles.summaryLoading, textClass[size], className)}>
            <Skeleton variant="text" className={styles.summarySkeleton} />
            <VisuallyHidden>{labels.loading}</VisuallyHidden>
          </div>
        ) : (
          shown !== undefined && (
            <div ref={ref} {...props} className={cx(styles.summary, textClass[size], className)}>
              {text}
            </div>
          )
        )}
        {announce && <VisuallyHidden role="status">{message}</VisuallyHidden>}
      </>
    );
  },
);
TableToolbarSummary.displayName = "TableToolbar.Summary";

const makeSelectionLabels = (formatNumber: (value: number) => string): TableToolbarSelectionLabels => ({
  group: "Selected rows",
  selected: (count) => `${formatNumber(count)} selected`,
  cleared: "Selection cleared",
  clear: "Clear selection",
  selectAll: (total) => `Select all ${formatNumber(total)}`,
});

/**
 * The bulk row: how many rows are selected, "Select all N", the bulk actions you put in it (a `Toolbar` of buttons) and
 * "Clear selection". It is a row of its own, so search and filters keep their state and focus while rows are selected, and it
 * shows only while something is selected. A change in the selection is announced (never the first appearance); when the
 * selection empties with keyboard focus inside the row, focus moves to the nearest control before it.
 */
const TableToolbarSelection = forwardRef<HTMLDivElement, TableToolbarSelectionProps>(
  (
    {
      count: countProp,
      totalCount,
      onClear,
      onSelectAll,
      children,
      size: sizeProp,
      announce = true,
      labels: labelOverrides,
      formatNumber = String,
      className,
      ...props
    },
    ref,
  ) => {
    const bar = useContext(TableToolbarContext);
    const size = sizeProp ?? bar.size;
    const count = safeCount(countProp);
    const labels = mergeDefined(makeSelectionLabels(formatNumber), labelOverrides);
    const visible = count > 0;
    const rowRef = useRef<HTMLDivElement | null>(null);
    const focusWasInside = useRef(false);
    const clearRef = useRef<HTMLButtonElement | null>(null);
    const selectAllHadFocus = useRef(false);
    const showSelectAll =
      Boolean(onSelectAll) && typeof totalCount === "number" && Number.isFinite(totalCount) && count < totalCount;

    // A change in the selection is announced; the first count seen is not.
    const { message, announce: say } = useAnnouncement();
    const previousCount = useRef<number | undefined>(undefined);
    const selectedLabel = labels.selected;
    const clearedLabel = labels.cleared;
    useEffect(() => {
      if (previousCount.current === undefined) {
        previousCount.current = count;
        return;
      }
      if (previousCount.current === count) return;
      previousCount.current = count;
      if (announce) say(count === 0 ? clearedLabel : selectedLabel(count));
    }, [announce, say, count, selectedLabel, clearedLabel]);

    // The row is hidden when the selection empties. If keyboard focus is in it then, hiding it would drop focus to the top of
    // the document, so it moves to the nearest control before it first (worked out while the row is still there).
    useLayoutEffect(() => {
      if (!visible && focusWasInside.current && rowRef.current) {
        focusWasInside.current = false;
        focusNearestOutside(rowRef.current);
      }
    }, [visible]);

    // "Select all N" goes away once everything is chosen. If keyboard focus is on it then, hiding it would drop focus to the top of
    // the document, so focus moves to the next control in the row: "Clear selection", or the first of the bulk actions.
    useLayoutEffect(() => {
      if (showSelectAll || !selectAllHadFocus.current) return;
      selectAllHadFocus.current = false;
      const row = rowRef.current;
      const next = clearRef.current ?? row?.querySelector<HTMLElement>(`.${styles.selectionActions} button:not([disabled]), .${styles.selectionActions} a[href], .${styles.selectionActions} [tabindex]:not([tabindex="-1"])`);
      next?.focus();
    }, [showSelectAll]);

    return (
      <>
        <div
          ref={(node) => {
            rowRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          {...props}
          role="group"
          aria-label={labels.group}
          hidden={!visible}
          onFocus={(event) => {
            props.onFocus?.(event);
            // Only focus from the keyboard counts: a mouse press that took focus needn't be held onto.
            focusWasInside.current = event.target.matches(":focus-visible");
          }}
          onBlur={(event) => {
            props.onBlur?.(event);
            if (!event.currentTarget.contains(event.relatedTarget)) focusWasInside.current = false;
          }}
          className={cx(styles.selection, textClass[size], className)}
        >
          <span className={styles.selectionCount} data-widest={labels.selected(Math.max(count, safeCount(totalCount)))}>
            {labels.selected(count)}
          </span>
          {showSelectAll && (
            <Button
              variant="ghost"
              size={smallerButton[size]}
              onClick={onSelectAll}
              // Only focus from the keyboard counts, as for the row: a mouse press needn't be held onto.
              onFocus={(event) => {
                selectAllHadFocus.current = event.target.matches(":focus-visible");
              }}
              onBlur={() => {
                selectAllHadFocus.current = false;
              }}
            >
              {labels.selectAll(totalCount as number)}
            </Button>
          )}
          <div className={styles.selectionActions}>{children}</div>
          {onClear && (
            <Button ref={clearRef} variant="ghost" size={smallerButton[size]} onClick={onClear}>
              {labels.clear}
            </Button>
          )}
        </div>
        {announce && <VisuallyHidden role="status">{message}</VisuallyHidden>}
      </>
    );
  },
);
TableToolbarSelection.displayName = "TableToolbar.Selection";

type TableToolbarComponent = typeof TableToolbarRoot & {
  Row: typeof TableToolbarRow;
  Search: typeof TableToolbarSearch;
  Filter: typeof TableToolbarFilter;
  Filters: typeof TableToolbarFilters;
  ActiveFilters: typeof TableToolbarActiveFilters;
  Summary: typeof TableToolbarSummary;
  Selection: typeof TableToolbarSelection;
};

export const TableToolbar: TableToolbarComponent = Object.assign(TableToolbarRoot, {
  Row: TableToolbarRow,
  Search: TableToolbarSearch,
  Filter: TableToolbarFilter,
  Filters: TableToolbarFilters,
  ActiveFilters: TableToolbarActiveFilters,
  Summary: TableToolbarSummary,
  Selection: TableToolbarSelection,
});
