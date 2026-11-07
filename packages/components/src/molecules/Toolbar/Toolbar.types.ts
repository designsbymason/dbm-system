import type { Responsive, SpaceValue } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import type { ButtonSize, ButtonVariant } from "../../atoms/Button";
import type { SpacerProps } from "../../atoms/Spacer";
import type { ToggleGroupMultipleProps, ToggleGroupSingleProps, ToggleGroupVariant } from "../ToggleGroup";

export type ToolbarOrientation = "horizontal" | "vertical";
export type ToolbarSurface = "ghost" | "outlined" | "filled";
export type ToolbarDirection = "ltr" | "rtl";
export type ToolbarAlign = "start" | "center" | "end";
/**
 * What a bar does when its items don't fit: `visible` (overflow the container), `wrap` onto more lines, `scroll`, or
 * `menu` (the ones that don't fit move into a "more" menu at the end of the bar).
 */
export type ToolbarOverflow = "visible" | "wrap" | "scroll" | "menu";

/** The text a toolbar supplies itself, translatable through `labels`. */
export interface ToolbarLabels {
  /** The accessible name of the "more" button when `overflow` is `"menu"`. @default 'More actions' */
  overflow: string;
}

export interface ToolbarProps extends Omit<ComponentPropsWithoutRef<"div">, "role" | "dir"> {
  /**
   * The toolbar's contents: `Toolbar.Button`, `Toolbar.IconButton`, `Toolbar.Item`, `Toolbar.Group`,
   * `Toolbar.Separator` and `Toolbar.Spacer`. Only `Toolbar.Button`, `Toolbar.IconButton` and `Toolbar.Item` take
   * part in arrow-key movement; a plain `Button` inside a toolbar is just another tab stop.
   */
  children?: ReactNode;
  /**
   * How the bar itself is drawn: `ghost` (no surface of its own, the items sit on the page), `outlined` (a bordered bar)
   * or `filled` (a tinted bar). The same three names `Card` and `EmptyState` use for their `variant`; it is `surface` here
   * because `variant` is the look of the items, as it is on `ButtonGroup`, `ToggleGroup` and `Pagination`.
   * @default 'ghost'
   */
  surface?: ToolbarSurface;
  /**
   * The visual style every `Toolbar.Button` and `Toolbar.IconButton` uses unless it sets its own `variant`. `ghost` keeps
   * a row of icon buttons quiet; use `secondary` or `primary` for a bar of labelled actions.
   * @default 'ghost'
   */
  variant?: ButtonVariant;
  /**
   * The size of the bar's padding and gaps and the default `size` of every item, on the shared scale.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Fully rounded items, and a pill-shaped bar when `surface` draws one. Also the default for each item's own
   * `rounded`.
   * @default false
   */
  rounded?: boolean;
  /**
   * Disables every item in the toolbar. A disabled item can't be focused, so arrow keys skip it. An item that is
   * disabled itself stays disabled either way.
   * @default false
   */
  disabled?: boolean;
  /**
   * Lays the items out in a row or a column; the arrow keys that move between items follow it (left and right
   * for a row, up and down for a column). Also takes a mobile-first map keyed by breakpoint
   * (`{ base: "vertical", md: "horizontal" }`).
   * @default 'horizontal'
   */
  orientation?: Responsive<ToolbarOrientation>;
  /**
   * The reading direction, which decides which arrow key goes forwards in a row. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page.
   * @default 'ltr'
   */
  dir?: ToolbarDirection;
  /**
   * Whether the arrow keys wrap from the last item to the first, and back. `false` stops at the ends.
   * @default true
   */
  loop?: boolean;
  /**
   * Stretches the bar to the width of its container. A bar is as wide as its items otherwise, so a `Toolbar.Spacer`
   * has nothing to take up until the bar is given more room than its items need — by this, or by a width of its own.
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Where the items sit along the bar's own direction when the bar is wider (or, in a column, taller) than they
   * are — `start`, `center` or `end`. It follows the reading direction, so `start` is the right edge in a
   * right-to-left page. Has no effect while a `Toolbar.Spacer` is taking up the free space, and none on a bar that is
   * only as wide as its items (set `fullWidth`, or a width, to give it room).
   * @default 'start'
   */
  align?: ToolbarAlign;
  /**
   * What a bar does when its items are more than fit. `scroll` (the default) keeps one line (or one column) and scrolls it
   * along its own axis: an edge fade and a button show at whichever end has more, and the item that takes focus is scrolled
   * fully into view. `wrap` wraps a horizontal bar's items onto more lines (arrow keys still follow the order they are
   * written in). `visible` lets them overflow the container. `menu` keeps the bar on one line and moves the items that
   * don't fit, from the end, into a "more" menu at its end: `Toolbar.Button`, `Toolbar.IconButton`, `Toolbar.Group` and
   * `Toolbar.ToggleGroup` become menu items (a pressed icon button a checkbox item, a single toggle group a radio group, a
   * multiple one checkbox items); `Toolbar.Item`, whatever it holds, and anything marked `pinned` always stay on the bar.
   * The bar is as wide as its items, up to its container (`fullWidth` fills it), and this mode is for a horizontal bar (a vertical one scrolls). A scrolling column needs a height of its own to respond to (a
   * bar in a box with a fixed or maximum height). While it scrolls, the bar sits in a frame that carries its surface, and
   * the focus ring is drawn inside each item, since a scrolling box would cut off one drawn outside it.
   * @default 'scroll'
   */
  overflow?: ToolbarOverflow;
  /**
   * The text the toolbar supplies itself, with English defaults: the name of the "more" button of
   * `overflow="menu"`.
   */
  labels?: Partial<ToolbarLabels>;
  /**
   * Keeps the bar at the top of the page (or of `scrollContainerRef`) as the reader scrolls, with a surface behind
   * it and a shadow while it is stuck. Built on `Affix`, the same as `Alert`'s `sticky`.
   * @default false
   */
  sticky?: boolean;
  /**
   * How far from the top a sticky bar sticks, from the spacing token scale — for a page whose own header is also
   * sticky. Has no effect without `sticky`.
   * @default 0
   */
  stickyOffset?: SpaceValue;
  /**
   * The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without `sticky`.
   * The same prop `Affix`, `BackToTop` and `Alert` take.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * Names the toolbar for assistive tech ("Text formatting") — announced when focus enters it. Required unless
   * `aria-labelledby` points at a visible label.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the toolbar, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** The `id` of a helper text or description for the toolbar. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /**
   * Additional CSS classes for customization, on the outermost box: the toolbar element itself, or, while it scrolls (the
   * default), the frame around it that carries the surface, so a margin or a width behaves the same either way.
   */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles, on the same outermost box as `className`. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing. Rendered as the DOM `data-testid` attribute on the toolbar's element;
   * has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/** What a `Toolbar.Button` and a `Toolbar.IconButton` take beyond the atom they draw. */
export interface ToolbarPinnedProps {
  /**
   * Keeps the item on the bar when `overflow` is `"menu"`, however little room there is: the items that may move into the
   * menu are taken from the end, and a pinned one is passed over. Has no effect in the other overflow modes.
   * @default false
   */
  pinned?: boolean;
}

export interface ToolbarItemProps {
  /**
   * The one focusable element to put in the toolbar's arrow-key order, as a single element that takes the props
   * it is handed (a `Button` with `asChild`, a menu or popover trigger, a native `<a>`). Prefer `Toolbar.Button`
   * and `Toolbar.IconButton` for plain buttons.
   */
  children: ReactElement;
  /**
   * Takes this item out of arrow-key movement. The toolbar's `disabled` does so for every item either way. The
   * element itself still needs its own disabled state.
   * @default false
   */
  disabled?: boolean;
}

export interface ToolbarGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "role"> {
  /** The items in the group. */
  children?: ReactNode;
  /**
   * Fuses the group's `Toolbar.Button`s and `Toolbar.IconButton`s into one segmented control — square corners where they
   * meet, one separator between them, no gap — the look `ButtonGroup` has by default (it is a `ButtonGroup`), with every
   * item still in the toolbar's arrow-key order. Off, the items sit apart by the bar's own gap. For choosing among options,
   * use `Toolbar.ToggleGroup`, which is attached by default.
   * @default false
   */
  attached?: boolean;
  /**
   * Keeps the item on the bar when `overflow` is `"menu"`, however little room there is: the items that may move into the
   * menu are taken from the end, and a pinned one is passed over. Has no effect in the other overflow modes.
   * @default false
   */
  pinned?: boolean;
  /**
   * Names the group for assistive tech ("Text style"). Required unless `aria-labelledby` points at a visible label:
   * a group with no name is just a set of items.
   */
  "aria-label"?: string;
  /** The `id` of an already-visible element that names the group, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface ToolbarSeparatorProps extends Omit<ComponentPropsWithoutRef<"div">, "role" | "children"> {
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export type ToolbarSpacerProps = SpacerProps;

/**
 * A `ToggleGroup` that sits in the toolbar's arrow-key order: single (a segmented choice such as text alignment, a
 * `radiogroup`) or multiple (independent toggles, a plain `group`). Takes every `ToggleGroup` prop except `loop` and
 * `rovingFocus`, which the toolbar owns; its `size`, `rounded`, `disabled`, `orientation` and `dir` default to the toolbar's.
 */
export type ToolbarToggleGroupProps =
  | (Omit<ToggleGroupSingleProps, "loop" | "rovingFocus" | "variant"> & ToolbarToggleGroupVariantProp)
  | (Omit<ToggleGroupMultipleProps, "loop" | "rovingFocus" | "variant"> & ToolbarToggleGroupVariantProp);

interface ToolbarToggleGroupVariantProp {
  /**
   * Keeps the item on the bar when `overflow` is `"menu"`, however little room there is: the items that may move into the
   * menu are taken from the end, and a pinned one is passed over. Has no effect in the other overflow modes.
   * @default false
   */
  pinned?: boolean;

  /**
   * How the chosen item is marked: `subtle` (borderless, a soft brand tint), `outlined` or `solid`. Here the default is
   * `subtle`, not `ToggleGroup`'s `outlined`, so the group sits quietly among a bar's ghost items.
   * @default 'subtle'
   */
  variant?: ToggleGroupVariant;
}
