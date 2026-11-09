import { cx, mergeDefined } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useContext, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
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
  ({ children, collapseBelow = "md", onClearAll, size: sizeProp, labels: labelOverrides, formatNumber = String, className, ...props }, ref) => {
    const bar = useContext(TableToolbarContext);
    const size = sizeProp ?? bar.size;
    const labels = mergeDefined(makeLabels(formatNumber), labelOverrides);
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const filters = Children.toArray(children).filter(isFilter);
    const total = filters.reduce((sum, filter) => sum + safeCount(filter.props.count), 0);

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

    return (
      <div
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        {...props}
        data-table-toolbar-filters=""
        className={cx(styles.filters, collapseClass[collapseBelow], className)}
      >
        <Toolbar aria-label={labels.group} variant="secondary" size={size} className={styles.filtersInline}>
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
                {filters.map((filter, index) => (
                  <section key={filter.key ?? index} className={styles.sheetSection}>
                    <Heading level={3} size="sm" className={styles.sheetHeading}>
                      {filter.props.label}
                    </Heading>
                    {filter.props.children}
                  </section>
                ))}
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
