import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Responsive } from "@dbm-system/utils";

/** `horizontal` puts the panes side by side (the handles are vertical bars); `vertical` stacks them. */
export type SplitterOrientation = "horizontal" | "vertical";

/** How the handles look: a thin `line`, or a line with a `grip` you can see at rest. */
export type SplitterVariant = "line" | "grip";

/**
 * A pane size limit: a plain number is a percentage of the space the panes share, `"20%"` is the same as `20`,
 * and `"240px"` and `"15rem"` are lengths (a `rem` is measured against the page's root font size, so a limit
 * written in it keeps up with the text size a person has chosen; it is read when the splitter mounts and whenever
 * its container changes size). The panes share the container less its handles.
 */
export type SplitterSize = number | `${number}px` | `${number}rem` | `${number}%`;

/** Text the splitter supplies itself (translate or replace it). */
export interface SplitterLabels {
  /**
   * The accessible name of a handle, from its position among the resizable handles (1-based), how many there
   * are, and the `label` of the pane before it when that pane has one. Default: "Resize Sidebar" for a labelled
   * pane, otherwise "Resize panels", or "Resize panels 1 of 2" when there is more than one handle.
   */
  handle: (position: number, total: number, paneLabel?: string) => string;
  /** What a handle reads while the pane before it is open, from that pane's size as a whole-number percentage. Default: "30%". */
  valueText: (percent: number) => string;
  /** What a handle reads while the pane before it is collapsed. Default: "Collapsed". */
  collapsed: string;
}

export interface SplitterProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "dir"> {
  /**
   * The panes — `Splitter.Pane` elements, as direct children. A handle is added between each pair.
   */
  children?: ReactNode;
  /**
   * `horizontal` puts the panes side by side; `vertical` stacks them (the splitter then needs a height of its
   * own to share out). Takes a breakpoint map, to stack the panes on a phone.
   * @default 'horizontal'
   */
  orientation?: Responsive<SplitterOrientation>;
  /**
   * The size of every pane as a percentage, in order, summing to 100 — for a layout you hold yourself. Pair it
   * with `onLayoutChange`.
   */
  layout?: number[];
  /**
   * The starting sizes when the splitter holds its own layout. Left out, each pane takes its own `defaultSize`
   * and the panes without one share what is left equally.
   */
  defaultLayout?: number[];
  /** Called with the new layout (percentages, summing to 100) on every change, including each step of a drag. */
  onLayoutChange?: (layout: number[]) => void;
  /** Called with the layout once a drag or a key press has finished — the moment to save it. */
  onLayoutCommit?: (layout: number[]) => void;
  /**
   * How the handles look.
   * @default 'line'
   */
  variant?: SplitterVariant;
  /**
   * How far an arrow key moves a handle, as a percentage. Page Up and Page Down move it twice as far.
   * @default 5
   */
  keyboardStep?: number;
  /**
   * Stops the handles resizing and collapsing anything. The handles stay in the tab order, marked disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The text direction. Left out, it follows the nearest `DirectionProvider`, else left-to-right; it is not read from the page. In `rtl` the first pane is on the right and
   * the arrow keys follow.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** Text the splitter supplies itself — see `SplitterLabels`. Any you leave out keep their English default. */
  labels?: Partial<SplitterLabels>;
  /**
   * Writes the percentages a handle announces, in a locale's own digits. Defaults to plain digits.
   */
  formatNumber?: (value: number) => string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for the container. */
  className?: string;
  /** Inline styles for the container. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/** What a pane's render-function `children` is told about the pane. */
export interface SplitterPaneState {
  /** Whether the pane is collapsed (to nothing, or to its strip). */
  collapsed: boolean;
  /** The pane's current size, as a percentage of the space the panes share. */
  size: number;
  /**
   * Collapses the pane, or opens it again at the size it had — what Enter on a handle beside it does, for content
   * inside the pane (a button on a collapsed rail). Does nothing for a pane that can't collapse or in a disabled
   * splitter. On a pane you control with `collapsed` it only asks, through `onCollapsedChange`.
   */
  toggle: () => void;
}

export interface SplitterPaneProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * What the pane holds — or a function of the pane's state (`collapsed`, `size`, and `toggle` to collapse or open
   * it), to show something else once it has collapsed to a strip, with a button that opens it.
   */
  children?: ReactNode | ((state: SplitterPaneState) => ReactNode);
  /**
   * A short name for the pane ("Sidebar"). The handle after it is named from it ("Resize Sidebar"), so a screen
   * reader user with several handles can tell them apart. Not added to the pane itself.
   */
  label?: string;
  /**
   * The pane's starting size as a percentage, when the splitter holds its own layout and gets no
   * `defaultLayout`. Panes without one share the rest equally.
   */
  defaultSize?: number;
  /**
   * The smallest the pane can be.
   * @default 10
   */
  minSize?: SplitterSize;
  /**
   * The largest the pane can be.
   * @default 100
   */
  maxSize?: SplitterSize;
  /**
   * Whether a handle next to this pane can resize it. `false` locks the pane (a header, a footer): each handle
   * beside it is drawn as a plain divider, out of the tab order, that moves nothing. The pane can still be
   * collapsed from outside with `collapsed`.
   * @default true
   */
  resizable?: boolean;
  /**
   * Keeps the pane's length when the container is resized: it stays the same number of pixels and the other
   * panes share out the difference (a sidebar that holds its width while the content flexes). A person can still
   * drag it to a new size, which it then keeps. Without it a pane keeps its percentage.
   * @default false
   */
  fixed?: boolean;
  /**
   * Lets the pane collapse: pulled past halfway to its minimum it snaps shut, and Enter or a double click on a
   * neighbouring handle toggles it.
   * @default false
   */
  collapsible?: boolean;
  /**
   * The size a collapsed pane keeps — `0` makes it disappear (and hides its content from assistive tech),
   * `"48px"` leaves a strip.
   * @default 0
   */
  collapsedSize?: SplitterSize;
  /**
   * Collapses or opens the pane from outside, and makes the pane controlled: a handle's gesture (a drag past the
   * snap point, Home, Enter, a double click) then only asks, through `onCollapsedChange`, and the pane follows when
   * you change this. Pair it with `onCollapsedChange`. A pane that is `true` at the start is already shut.
   */
  collapsed?: boolean;
  /**
   * Whether the pane starts collapsed, when it isn't controlled.
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * Called when the pane collapses or opens — or, for a pane you control with `collapsed`, when a handle asks it to
   * (it is then yours to change `collapsed`; changing it yourself isn't reported back).
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Standard DOM id; the handles next to the pane point at it with `aria-controls`. Generated when left out.
   */
  id?: string;
  /** Additional CSS classes for the pane. */
  className?: string;
  /** Inline styles for the pane. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress
   * selectors). Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
