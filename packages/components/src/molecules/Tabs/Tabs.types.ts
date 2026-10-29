import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

/**
 * How the selected tab is marked. `"underline"` (the default) draws a bar
 * under the selected tab, on a hairline that runs the length of the list —
 * the classic tab strip. `"subtle"` gives the selected tab a soft brand tint
 * and no baseline; `"outlined"` is `"subtle"` with a border on every tab, in
 * the brand colour on the selected one and a faint tint on the rest; `"solid"`
 * fills the selected tab with the brand colour for the strongest emphasis.
 * `subtle`, `outlined` and `solid` are the variant names `Tag` uses too.
 */
export type TabsVariant = "underline" | "subtle" | "outlined" | "solid";

/**
 * Trigger height, padding and type size, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2). A trigger's minimum height matches
 * `Button`'s and `IconButton`'s at the same step, so a tab list sits flush
 * beside them. `Tabs.Content`'s spacing tracks the same step.
 */
export type TabsSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The direction the tabs run — and, with it, which arrow-key pair moves between
 * them (`Left`/`Right` when `"horizontal"`, `Up`/`Down` when `"vertical"`). A
 * `"vertical"` list sits beside its panel; a `"horizontal"` one sits above it.
 */
export type TabsOrientation = "horizontal" | "vertical";

/**
 * Whether moving focus onto a tab also selects it. `"automatic"` (the default)
 * selects as focus arrives, so the panel follows the arrow keys; `"manual"`
 * only moves focus, and `Enter` or `Space` selects — for a panel that is
 * expensive to show, so a reader can move through the tabs without loading
 * each one.
 */
export type TabsActivationMode = "automatic" | "manual";

/**
 * Where the tabs sit within their list, along the direction they run — the
 * leading edge, the middle, or the trailing edge. Only visible while the list
 * is wider (or, vertical, taller) than its tabs need; a list with more tabs
 * than room already fills the space by scrolling, and `"center"`/`"end"`
 * stay safe then — the leading tab is never pushed out of reach, even though
 * it would be for an ordinary (non-scrolling) centered or end-aligned row.
 */
export type TabsAlign = "start" | "center" | "end";

export interface TabsProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "dir" | "defaultValue" | "onChange" | "children" | "id" | "className" | "style"
  > {
  /** A `Tabs.List` holding the `Tabs.Trigger`s, and one `Tabs.Content` per trigger. */
  children: ReactNode;
  /**
   * The controlled selected tab's `value`. Pair it with `onValueChange`.
   */
  value?: string;
  /**
   * The selected tab's `value` when uncontrolled. Pass one — with neither this
   * nor `value`, no tab is selected and no panel shows.
   */
  defaultValue?: string;
  /** Called with the newly selected tab's `value` whenever the selection changes. */
  onValueChange?: (value: string) => void;
  /**
   * How the selected tab is marked: an underline bar, a soft brand tint, a tint
   * with a border on every tab, or a solid brand fill.
   * @default 'underline'
   */
  variant?: TabsVariant;
  /**
   * Trigger height, padding and type size, and the panel's own spacing.
   * @default 'md'
   */
  size?: TabsSize;
  /**
   * Fully rounds the ends of every tab, in the `subtle`, `outlined` and `solid`
   * variants. It has no effect on `underline`, whose tabs have no shape to round.
   * @default false
   */
  rounded?: boolean;
  /**
   * The direction the tabs run, and which arrow-key pair moves between them.
   * Accepts a mobile-first breakpoint map, so a vertical list beside its panel on
   * a wide screen can become a horizontal strip above it on a phone —
   * `{ base: "horizontal", md: "vertical" }`. A map is resolved in JavaScript,
   * so a server render uses `base` and corrects after mount.
   * @default 'horizontal'
   */
  orientation?: Responsive<TabsOrientation>;
  /**
   * Whether focusing a tab selects it (`"automatic"`), or only `Enter`/`Space`
   * does (`"manual"`).
   * @default 'automatic'
   */
  activationMode?: TabsActivationMode;
  /**
   * Stretches the triggers to fill the width of a horizontal list, instead of
   * sizing each to its label.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Text direction, passed through to Radix Tabs — flips which physical arrow key
   * moves focus forward versus back in a horizontal list. When omitted, defers
   * to the nearest Radix `DirectionProvider` ancestor, if the consuming app has
   * one, falling back to `"ltr"` otherwise.
   */
  dir?: "ltr" | "rtl";
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at these
   * tabs, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TabsListProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The `Tabs.Trigger`s. */
  children: ReactNode;
  /**
   * Whether arrow-key navigation wraps around — `End` past the last tab lands on
   * the first, and the reverse.
   * @default true
   */
  loop?: boolean;
  /**
   * Where the tabs sit within the list when they don't fill it: the leading edge,
   * the middle, or the trailing edge.
   * @default 'start'
   */
  align?: TabsAlign;
  /**
   * Whether the scroll buttons appear at whichever edge currently has more tabs beyond it, while
   * the list is scrollable. The edge fade is unaffected either way — arrow keys, and a touch or
   * trackpad swipe, still scroll the list when this is `false`; only the pointer-only buttons are
   * hidden.
   * @default true
   */
  showScrollButtons?: boolean;
  /**
   * The list's accessible name, announced with the `tablist` role. Name it when the
   * page holds more than one set of tabs, or when the surrounding heading does
   * not already say what they switch between.
   */
  "aria-label"?: string;
  /**
   * The id of a visible element that names this list. Takes the place of
   * `aria-label` when there is already a heading to point at.
   */
  "aria-labelledby"?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when another
   * element's `aria-labelledby`/`aria-describedby` needs to point at this
   * list, or when a test or router needs a stable anchor.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TabsTriggerProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children" | "value" | "type"> {
  /**
   * This tab's unique identifier within its `Tabs` — what `value`/`defaultValue`/
   * `onValueChange` refer to, and what pairs it with the `Tabs.Content` that has
   * the same `value`.
   */
  value: string;
  /** The tab's label. Optional only for an icon-only tab, which then needs an `aria-label`. */
  children?: ReactNode;
  /**
   * An icon shown before the label. Pass a Phosphor icon reference. It is
   * decorative — the label names the tab — so an icon-only tab needs an
   * `aria-label` instead.
   */
  icon?: PhosphorIcon;
  /**
   * Prevents this tab from being selected or focused. A disabled tab is skipped by
   * `Tab` and by the arrow keys, like a natively disabled button.
   */
  disabled?: boolean;
  /**
   * Renders the trigger's behaviour and styling onto a single provided child
   * element (via Radix `Slot`) instead of its own `<button>` — for a tab that must
   * be another element, such as a link. The child supplies its own label, so
   * `icon` has no effect in this mode.
   * @default false
   */
  asChild?: boolean;
  /**
   * The tab's accessible name. Required for an icon-only tab, which has no visible
   * label to name it.
   */
  "aria-label"?: string;
  /** The id of a visible element that names this tab. */
  "aria-labelledby"?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when a test or router
   * needs a stable anchor. Radix sets a default one, which the panel's
   * `aria-labelledby` points at — overriding it here would break that pairing.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TabsItemProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** One `Tabs.Trigger`: the tab this item holds. */
  children: ReactNode;
  /**
   * A control drawn at the end of the tab, beside the tab button and not inside it (a button inside a
   * button is invalid HTML), such as a close button. It is the caller's own element: give it
   * `tabIndex={-1}` so the tab list stays one tab stop. It is hidden from assistive technology (a
   * `tablist` may own only tabs), so it is a pointer shortcut: give what it does a key on the focused
   * tab or a menu as well. The tab makes room for it, so the label never runs under it.
   */
  action?: ReactNode;
  /** Additional CSS classes for customization, applied to the item's wrapper. */
  className?: string;
  /** Inline styles, merged onto the item's wrapper. */
  style?: CSSProperties;
  /** Standard DOM id, on the item's wrapper. */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface TabsContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * The `value` of the `Tabs.Trigger` this panel belongs to. It shows while that
   * tab is selected.
   */
  value: string;
  /** The panel's content. */
  children?: ReactNode;
  /**
   * Keeps the panel mounted while its tab is not selected, hidden from view and
   * from assistive technology, instead of removing it from the DOM. Use it when a
   * panel holds state that must survive switching away (a half-filled form, a
   * scroll position, a video). Leave it unset for the common case.
   */
  forceMount?: true;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Standard DOM id. Rarely needed directly, but required when a test or router
   * needs a stable anchor. Radix sets a default one, which the trigger's
   * `aria-controls` points at — overriding it here would break that pairing.
   */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's
   * `getByTestId`, Playwright/Cypress selectors). Rendered as the DOM
   * `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
