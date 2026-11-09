import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "../../atoms/Button";
import type { TagTone } from "../../atoms/Tag";

/** On the shared 5-step scale; the same steps `Button`, `Tag` and the inputs use. */
export type TableToolbarSize = ButtonSize;

export interface TableToolbarProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /**
   * The bar's rows, in reading order: a `TableToolbar.Row` of the search field and toolbars, a `TableToolbar.Row` holding
   * `TableToolbar.ActiveFilters` and `TableToolbar.Summary`, then `TableToolbar.Selection`.
   */
  children?: ReactNode;
  /**
   * The size every part that draws text or controls itself (`Filter` outside a toolbar, `ActiveFilters`, `Summary`,
   * `Selection`) uses unless it sets its own, on the shared scale. Say the same `size` on the `SearchInput` and the
   * `Toolbar`s you put in a row, which are your own components and don't read this.
   * @default 'md'
   */
  size?: TableToolbarSize;
  /**
   * Names the bar for assistive tech ("Orders table tools"). Required unless `aria-labelledby` points at a visible label:
   * a `role="group"` with no name is just a set of controls.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the bar, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a helper text or description for the bar. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the bar's element; has no visual
   * or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TableToolbarRowProps extends ComponentPropsWithoutRef<"div"> {
  /** What shares the row: the search slot, `Toolbar`s, a `Spacer`, `ActiveFilters`, `Summary`. */
  children?: ReactNode;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export type TableToolbarSearchProps = TableToolbarRowProps;

/** The words `TableToolbar.Filter` supplies itself. */
export interface TableToolbarFilterLabels {
  /** The panel's button that clears this filter. */
  clear: string;
  /** Said after the filter's name while some of it is applied: "Status, 2 active". Takes the plain count. */
  activeCount: (count: number) => string;
  /** The panel's accessible name: "Status filter". Takes the filter's `label`. */
  panel: (label: string) => string;
  /** The button's name while the filter has a `value`: "Status: All". Takes the `label` and the `value`. */
  named: (label: string, value: string) => string;
  /** The name drawn before the button with `labelPlacement="before"`: "Status:". Takes the `label`. */
  before: (label: string) => string;
}

export interface TableToolbarFilterProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label"> {
  /** The filter's name, shown on its button ("Status"). */
  label: string;
  /**
   * The filter controls in the panel: a `CheckboxGroup`, a `RadioGroup`, a `Select`, a range. They are yours and their
   * state is yours; this part only opens and names the panel.
   */
  children?: ReactNode;
  /**
   * What the button shows of the choice ("All", "Open", "2 selected"). Left out, the button shows the filter's `label` and the count's badge.
   * Given, the button shows the choice, is named "Status: All" (holding its visible text as whole words), and the `label` is drawn by
   * `labelPlacement`.
   */
  value?: string;
  /**
   * Where the filter's name is drawn when it is given a `value`. `"inside"` writes it in the button ("Status: All"); `"before"` draws it as
   * plain text before a button that shows only the choice. Without a `value` the name is always in the button. With `"before"` the part is
   * a box holding the name and the button, so `className` and `style` go on that box and everything else (`ref`, `id`, the handlers, the
   * `aria-*` props) on the button; size the button from the box (`.box > button`).
   * @default 'inside'
   */
  labelPlacement?: "inside" | "before";
  /**
   * How many values of this filter are applied. Above zero the button shows the count, its accessible name says it
   * ("Status, 2 active"), and the panel offers `onClear`. Zero, the default, shows nothing.
   * @default 0
   */
  count?: number;
  /**
   * The most the badge writes: a count above it reads "99+". The button's accessible name still says the real number
   * ("Status, 1,284 active").
   * @default 99
   */
  max?: number;
  /** Shows a "Clear" button in the panel while `count` is above zero, calling this when pressed. Left out, there is none. */
  onClear?: () => void;
  /** Whether the panel is open, when controlled. Pair with `onOpenChange`. */
  open?: boolean;
  /** Whether the panel starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The button's look. Inside a `Toolbar` it follows the toolbar's `variant` when left out; on its own it is `secondary`.
   * @default 'secondary'
   */
  variant?: ButtonVariant;
  /**
   * The button's size. Inside a `Toolbar` it follows the toolbar's `size` when left out; on its own it is the bar's `size`.
   * @default the bar's `size` ('md')
   */
  size?: TableToolbarSize;
  /** An icon before the label, a component from `@dbm-system/icons` (a funnel for "Filter"). */
  icon?: PhosphorIcon;
  /**
   * Which edge of the button the panel lines up with.
   * @default 'start'
   */
  align?: "start" | "center" | "end";
  /**
   * Replaces the words this part writes, per key. Any you leave out keep their English default; the counts are written with `formatNumber`.
   * @default { clear: "Clear", activeCount: (n) => `${n} active`, panel: (label) => `${label} filter`, named: (label, value) => `${label}: ${value}`, before: (label) => `${label}:` }
   */
  labels?: Partial<TableToolbarFilterLabels>;
  /**
   * Writes the count in a locale's own numerals. Plain `String` by default; also used by the default `activeCount`.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the button; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** One applied filter, as `TableToolbar.ActiveFilters` shows it. */
export interface TableToolbarActiveFilter {
  /** Identifies the filter value; passed back to `onRemove`. Unique within the list. */
  id: string;
  /** What the chip says ("Open"). Plain text, so the remove button can be named after it. */
  label: string;
  /** The filter it belongs to, written before the label ("Status: Open"). */
  group?: string;
}

/** The words `TableToolbar.ActiveFilters` supplies itself. */
export interface TableToolbarActiveFiltersLabels {
  /** The list's accessible name. */
  list: string;
  /** The "Clear all" button. */
  clearAll: string;
  /** A chip's remove button: "Remove filter: Status: Open". Takes the chip's text. */
  remove: (label: string) => string;
  /** What is announced when the number of applied filters changes: "2 filters applied", "No filters applied". Takes the plain count. */
  applied: (count: number) => string;
}

export interface TableToolbarActiveFiltersProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onClick"> {
  /**
   * The filters applied right now. Empty (or left out), nothing is drawn, but the live region that announces changes stays
   * in the page, so going from some to none is still announced.
   */
  items?: TableToolbarActiveFilter[];
  /** Called with the chip's `id` when its remove button is pressed. */
  onRemove?: (id: string) => void;
  /** Shows a "Clear all" button while more than one filter is applied, calling this when pressed. */
  onClearAll?: () => void;
  /**
   * The chips' size, on the shared scale.
   * @default the bar's `size` ('md')
   */
  size?: TableToolbarSize;
  /**
   * The chips' colour.
   * @default 'neutral'
   */
  tone?: TagTone;
  /**
   * Announces a change in how many filters are applied to screen readers, never the first appearance.
   * @default true
   */
  announce?: boolean;
  /**
   * Replaces the words this part writes, per key. Any you leave out keep their English default; the counts are written with `formatNumber`.
   * @default { list: "Applied filters", clearAll: "Clear all", remove: (label) => `Remove filter: ${label}`, applied: (n) => `${n} filters applied` }
   */
  labels?: Partial<TableToolbarActiveFiltersLabels>;
  /**
   * Writes the counts in the default announcements in a locale's own numerals. Plain `String` by default.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** The words `TableToolbar.Summary` supplies itself. */
export interface TableToolbarSummaryLabels {
  /** What a screen reader finds in place of the count while `loading`. */
  loading: string;
  /** "128 results", "1 result", "No results". Takes the plain count. */
  results: (count: number) => string;
  /** "12 of 128 results", for a filtered list: the count shown, then the total. Takes the plain numbers. */
  resultsOf: (count: number, total: number) => string;
}

export interface TableToolbarSummaryProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * How many results there are. Left out (`undefined`) it means "not known yet": nothing is shown, and the count that
   * arrives is not announced as if someone had changed something. `0` is a count, and says "No results".
   */
  count?: number;
  /**
   * The count is on its way: a placeholder takes the count's place, and a screen reader finds `labels.loading` there. Nothing is
   * announced while it is on; the count that arrives afterwards is announced if it differs from the last one announced, and is
   * a first appearance (silent) if there was none.
   * @default false
   */
  loading?: boolean;
  /** The unfiltered total. Given, and larger than `count`, the text reads "12 of 128 results". */
  total?: number;
  /**
   * The text size, on the shared scale.
   * @default the bar's `size` ('md')
   */
  size?: TableToolbarSize;
  /**
   * Announces a change in the count to screen readers, never the first count to appear.
   * @default true
   */
  announce?: boolean;
  /**
   * Replaces the words this part writes, per key. Any you leave out keep their English default; the counts are written with `formatNumber`.
   * @default { results: (n) => `${n} results`, resultsOf: (n, total) => `${n} of ${total} results` }
   */
  labels?: Partial<TableToolbarSummaryLabels>;
  /**
   * Writes the numbers in a locale's own numerals. Plain `String` by default; also used by the default `results`.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** The words `TableToolbar.Selection` supplies itself. */
export interface TableToolbarSelectionLabels {
  /** The row's accessible name. */
  group: string;
  /** "3 selected". Takes the plain count. */
  selected: (count: number) => string;
  /** Announced when the selection is emptied. */
  cleared: string;
  /** The button that clears the selection. */
  clear: string;
  /** The button that selects everything: "Select all 128". Takes the plain total. */
  selectAll: (total: number) => string;
}

export interface TableToolbarSelectionProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /**
   * How many rows are selected. At `0` (or less) the row is hidden, but its live region stays in the page, so emptying the
   * selection is still announced.
   */
  count: number;
  /** How many rows there are in all. With `onSelectAll`, a "Select all" button shows while fewer than this are selected. */
  totalCount?: number;
  /** Shows a "Clear selection" button, calling this when pressed. Left out, there is none. */
  onClear?: () => void;
  /** Shows a "Select all N" button while `count` is below `totalCount`, calling this when pressed. */
  onSelectAll?: () => void;
  /** The bulk actions: a `Toolbar` of `Toolbar.Button`s is the usual choice, so they are one tab stop. */
  children?: ReactNode;
  /**
   * The text and button size, on the shared scale.
   * @default the bar's `size` ('md')
   */
  size?: TableToolbarSize;
  /**
   * Announces a change in the selection to screen readers, never the first appearance.
   * @default true
   */
  announce?: boolean;
  /**
   * Replaces the words this part writes, per key. Any you leave out keep their English default; the counts are written with `formatNumber`.
   * @default { group: "Selected rows", selected: (n) => `${n} selected`, cleared: "Selection cleared", clear: "Clear selection", selectAll: (total) => `Select all ${total}` }
   */
  labels?: Partial<TableToolbarSelectionLabels>;
  /**
   * Writes the counts in a locale's own numerals. Plain `String` by default; also used by the default labels.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

/** The widths `TableToolbar.Filters` goes to its sheet below, as the bar's own width: the breakpoint tokens' `sm` (40rem) to `xl` (80rem). */
export type TableToolbarFiltersCollapseBelow = "sm" | "md" | "lg" | "xl" | "never";

/** The words `TableToolbar.Filters` supplies itself. */
export interface TableToolbarFiltersLabels {
  /** The inline filters' toolbar's accessible name. */
  group: string;
  /** The sheet's button ("Filters"). */
  button: string;
  /** Said after the button's name while some filters are applied: "Filters, 2 active". Takes the plain count. */
  activeCount: (count: number) => string;
  /** The sheet's title. */
  title: string;
  /** The line under the sheet's title. */
  description: string;
  /** The sheet's button that clears every filter (shown with `onClearAll`, while some are applied). */
  clearAll: string;
  /** The sheet's button that closes it. */
  done: string;
}

/**
 * The properties of `TableToolbar.Filters`: a set of `TableToolbar.Filter`s that are inline buttons above a width of the bar and, below it,
 * one "Filters" button that opens them all in a bottom sheet.
 */
export interface TableToolbarFiltersProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * The filters: `TableToolbar.Filter`s, direct children (a filter wrapped in your own component is drawn inline and is not in the sheet).
   * Each is drawn inline inside a `Toolbar.Item`, and in the sheet as a section headed by its `label` holding its `children`.
   */
  children?: ReactNode;
  /**
   * The width of the bar, below which the filters are one button and a sheet: `"sm"` (40rem) to `"xl"` (80rem), or `"never"` to keep them inline.
   * The bar becomes a size container while it holds this part, so it is the bar's width that decides, not the window's.
   * @default 'md'
   */
  collapseBelow?: TableToolbarFiltersCollapseBelow;
  /**
   * Clears every filter. The sheet shows a "Clear all" button that calls it while any filter's `count` is above zero; left out, there is none.
   */
  onClearAll?: () => void;
  /**
   * The size of the inline toolbar's buttons and the sheet's button.
   * @default the bar's `size` ('md')
   */
  size?: TableToolbarSize;
  /**
   * Replaces the words this part writes, per key. Any you leave out keep their English default; the counts are written with `formatNumber`.
   * @default { group: "Filters", button: "Filters", activeCount: (n) => `${n} active`, title: "Filters", description: "Narrow what the table shows.", clearAll: "Clear all", done: "Done" }
   */
  labels?: Partial<TableToolbarFiltersLabels>;
  /**
   * Writes the count in a locale's own numerals. Plain `String` by default; also used by the default `activeCount`.
   * @default (value) => String(value)
   */
  formatNumber?: (value: number) => string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Standard DOM id. */
  id?: string;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}
