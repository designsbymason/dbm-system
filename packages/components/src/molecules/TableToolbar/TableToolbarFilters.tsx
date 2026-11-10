import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { useDirection } from "../../atoms/DirectionProvider";
import { Heading } from "../../atoms/Heading";
import { Drawer } from "../../organisms/Drawer";
import { Toolbar } from "../Toolbar";
import { safeCount } from "./safeCount";
import { TableToolbarContext } from "./tableToolbarContext";
import styles from "./TableToolbar.module.css";
import type { TableToolbarFilterProps, TableToolbarFiltersLabels, TableToolbarFiltersProps } from "./TableToolbar.types";

const makeLabels = (formatNumber: (value: number) => string): TableToolbarFiltersLabels => ({
  group: "Filters",
  button: "Filters",
  activeCount: (count) => `${formatNumber(count)} active`,
  title: "Filters",
  description: "Narrow what the table shows.",
  clearAll: "Clear all",
  done: "Done",
});

const collapseClass = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
  xl: styles.collapseXl,
  never: undefined,
} as const;

/** A `TableToolbar.Filter` element, found by its display name (the part is defined beside the bar, which imports this one). */
const isFilter = (child: ReactNode): child is ReactElement<TableToolbarFilterProps> =>
  isValidElement(child) && (child.type as { displayName?: string }).displayName === "TableToolbar.Filter";

/**
 * A set of `TableToolbar.Filter`s that are inline buttons while the bar is wide and, below a width of the bar (`collapseBelow`), one "Filters"
 * button that opens all of them in a bottom sheet: each filter as a section headed by its `label`, holding the controls it was given, with
 * "Clear all" (`onClearAll`) and "Done". The bar owns no state (ADR-0034): the filters' values, counts and clearing are yours.
 *
 * The switch is a container query on the bar's width, so it follows the room the table has, not the window. The bar becomes a size
 * container while it holds this part. Give each filter's `children` as for an inline filter; the sheet draws the same ones. The filters
 * must be direct children: a filter wrapped in your own component is drawn inline and is not in the sheet.
 *
 * @example
 * ```tsx
 * <TableToolbar.Filters onClearAll={clearAll}>
 *   <TableToolbar.Filter label="Status" count={statuses.length}>
 *     <CheckboxGroup aria-label="Status" …>…</CheckboxGroup>
 *   </TableToolbar.Filter>
 *   <TableToolbar.Filter label="Department" count={departments.length}>…</TableToolbar.Filter>
 * </TableToolbar.Filters>
 * ```
 */
export const TableToolbarFilters = forwardRef<HTMLDivElement, TableToolbarFiltersProps>(
  ({ children, collapseBelow = "md", onClearAll, size: sizeProp, labels: labelOverrides, formatNumber = String, className, dir: dirProp, onFocus, onBlur, ...props }, ref) => {
    const dir = useDirection(dirProp);
    const bar = useContext(TableToolbarContext);
    const size = sizeProp ?? bar.size;
    const labels = mergeDefined(makeLabels(formatNumber), labelOverrides);
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inlineRef = useRef<HTMLDivElement | null>(null);
    // Which form keyboard focus is in, kept from the focus events: the form it is in can be taken out of the page by a change of width, and
    // reading where focus is at that moment is unreliable (the browser drops it from a hidden element only on its next render).
    const focusIn = useRef<"inline" | "button" | null>(null);

    const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);
    const filters = Children.toArray(children).filter(isFilter);
    const total = filters.reduce((sum, filter) => sum + safeCount(filter.props.count), 0);
    // A disabled filter is drawn inline as a disabled button, and has no section in the sheet: its controls are not for choosing from.
    const sheetFilters = filters.filter((filter) => !filter.props.disabled);

    const warned = useRef(false);
    if (process.env.NODE_ENV !== "production" && filters.length === 0 && !warned.current) {
      warned.current = true;
      console.warn("TableToolbar.Filters: no `TableToolbar.Filter` among its direct children, so there is nothing in the sheet.");
    }

    // While the sheet is open, close it if the bar grows past the step: the sheet's button is then out of the page and the filters are inline.
    useEffect(() => {
      if (!open) return undefined;
      const root = rootRef.current;
      const button = buttonRef.current;
      if (!root || !button || typeof ResizeObserver === "undefined") return undefined;
      const observer = new ResizeObserver(() => {
        if (button.getClientRects().length === 0) setOpen(false);
      });
      observer.observe(root);
      return () => observer.disconnect();
    }, [open]);

    // A change of width hides the form that has keyboard focus: hand focus to the same place in the other form, so the keyboard user keeps their place
    // (06 §9). Only focus that was in the filters, and only when it has not moved on to somewhere that is still on the page.
    useEffect(() => {
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === "undefined") return undefined;
      const observer = new ResizeObserver(() => {
        const side = focusIn.current;
        if (!side) return;
        const from = side === "inline" ? inlineRef.current : buttonRef.current;
        if (!from || from.getClientRects().length > 0) return;
        const active = document.activeElement;
        if (active && active !== document.body && !from.contains(active)) {
          focusIn.current = null;
          return;
        }
        const to = side === "inline" ? buttonRef.current : inlineRef.current?.querySelector<HTMLElement>("button:not([disabled])");
        if (to && to.getClientRects().length > 0) {
          to.focus();
          focusIn.current = side === "inline" ? "button" : "inline";
        }
      });
      observer.observe(root);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={mergedRef}
        {...props}
        // The caller's handlers first, then ours (05 §3). A focus event from the sheet (portaled, but React bubbles it here) is neither form.
        onFocus={(event) => {
          onFocus?.(event);
          const target = event.target as Node;
          focusIn.current = inlineRef.current?.contains(target) ? "inline" : buttonRef.current === target ? "button" : null;
        }}
        onBlur={(event) => {
          onBlur?.(event);
          // A blur to nowhere is either a real one or the form being hidden; once the page has settled, the form still being drawn means it was real.
          window.setTimeout(() => {
            const side = focusIn.current;
            const from = side === "inline" ? inlineRef.current : side === "button" ? buttonRef.current : null;
            const active = document.activeElement;
            if (from && from.getClientRects().length > 0 && !(active && rootRef.current?.contains(active))) focusIn.current = null;
          }, 0);
        }}
        data-table-toolbar-filters=""
        className={cx(styles.filters, collapseClass[collapseBelow], className)}
      >
        <Toolbar ref={inlineRef} dir={dir} aria-label={labels.group} variant="secondary" size={size} className={styles.filtersInline}>
          {Children.map(children, (child) => (isFilter(child) ? <Toolbar.Item>{child}</Toolbar.Item> : child))}
        </Toolbar>
        <Drawer open={open} onOpenChange={setOpen}>
          <Drawer.Trigger asChild>
            <Button
              ref={buttonRef}
              className={styles.filtersButton}
              variant="secondary"
              size={size}
              aria-label={total > 0 ? `${labels.button}, ${labels.activeCount(total)}` : labels.button}
            >
              {labels.button}
              {total > 0 && " "}
              {total > 0 && (
                <span className={cx(styles.filterCount, size === "xs" && styles.filterCountXs)} aria-hidden="true">
                  <Badge tone="brand" size="xs">
                    {formatNumber(total)}
                  </Badge>
                </span>
              )}
            </Button>
          </Drawer.Trigger>
          <Drawer.Content side="bottom" size="lg">
            <Drawer.Header>
              <Drawer.Title>{labels.title}</Drawer.Title>
              <Drawer.Description>{labels.description}</Drawer.Description>
            </Drawer.Header>
            <Drawer.Body>
              <div className={styles.sheetSections}>
                {sheetFilters.map((filter, index) => {
                  const clear = filter.props.labels?.clear ?? "Clear";
                  return (
                    <section key={filter.key ?? index} className={styles.sheetSection}>
                      <div className={styles.sheetSectionHead}>
                        <Heading level={3} size="sm" className={styles.sheetHeading}>
                          {filter.props.label}
                        </Heading>
                        {/* The same Clear the filter's own panel offers: while some of it is applied and it was given `onClear`. */}
                        {safeCount(filter.props.count) > 0 && filter.props.onClear && (
                          <Button variant="ghost" size="sm" onClick={filter.props.onClear} aria-label={`${clear} ${filter.props.label}`}>
                            {clear}
                          </Button>
                        )}
                      </div>
                      {filter.props.children}
                    </section>
                  );
                })}
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              {onClearAll && (
                <Button variant="secondary" disabled={total === 0} onClick={onClearAll}>
                  {labels.clearAll}
                </Button>
              )}
              <Drawer.Close asChild>
                <Button>{labels.done}</Button>
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      </div>
    );
  },
);
TableToolbarFilters.displayName = "TableToolbar.Filters";
