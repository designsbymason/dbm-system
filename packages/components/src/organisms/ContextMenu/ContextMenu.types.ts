import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import type { MenuContentProps, MenuLabels, MenuPresentation, MenuProps } from "../Menu/Menu.types";
import type { Responsive } from "@dbm-system/utils";

export type {
  MenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  MenuGroupProps as ContextMenuGroupProps,
  MenuItemProps as ContextMenuItemProps,
  MenuItemTone as ContextMenuItemTone,
  MenuLabels as ContextMenuLabels,
  MenuPresentation as ContextMenuPresentation,
  MenuLabelProps as ContextMenuLabelProps,
  MenuRadioGroupProps as ContextMenuRadioGroupProps,
  MenuRadioItemProps as ContextMenuRadioItemProps,
  MenuSeparatorProps as ContextMenuSeparatorProps,
  MenuSize as ContextMenuSize,
  MenuSubContentProps as ContextMenuSubContentProps,
  MenuSubProps as ContextMenuSubProps,
  MenuSubTriggerProps as ContextMenuSubTriggerProps,
} from "../Menu/Menu.types";

/** A point on the page, in CSS pixels from the top-left of the viewport (the coordinates of a pointer event). */
export interface ContextMenuPoint {
  x: number;
  y: number;
}

/**
 * What code outside the menu can do to it: open it where it wants and close it. `ContextMenu`'s `controllerRef`
 * hands it out, and `useContextMenuController()` returns the same object inside the menu.
 */
export interface ContextMenuController {
  /**
   * Opens the menu at a point, as a right-click there would: the panel's start corner is at the point, flipped to
   * stay inside the viewport. Sends the trigger a `contextmenu` event, which bubbles to the page like a real one.
   * Returns `false` when there is nothing to open from: the trigger isn't mounted or is `disabled`.
   */
  openAt: (point: ContextMenuPoint) => boolean;
  /**
   * Opens the menu from an element: at the element's bottom corner on the reading-start side, so the panel hangs
   * under it. What the element is for is up to the caller (the focused cell, a row, a button).
   */
  openFrom: (element: Element) => boolean;
  /** Closes the menu. Does nothing if it is closed. */
  close: () => void;
  /** Whether the menu is open now. */
  readonly open: boolean;
}

export interface ContextMenuProps {
  /** `ContextMenu.Trigger` and `ContextMenu.Content`. */
  children?: ReactNode;
  /**
   * The controlled open state. Omit (along with `defaultOpen`) to let the menu manage its own open state. It is for
   * following and closing the menu from outside: a menu can only be opened at a point by a press on the trigger.
   */
  open?: MenuProps["open"];
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is provided. For a story or a test: a menu
   * that opens before any press has no position to open at, so it is drawn at the top-left corner of the page (and
   * Radix says so in the console during development).
   * @default false
   */
  defaultOpen?: MenuProps["defaultOpen"];
  /**
   * Called with the new open state whenever it changes: a right-click, a long press, the context-menu key, Escape, a
   * press outside, or an item chosen.
   */
  onOpenChange?: MenuProps["onOpenChange"];
  /**
   * Called with `true` once the menu has finished opening and with `false` once it has finished closing, its focus
   * is back where it was and it is out of the page. `onOpenChange` says a change *started*; this says it is over.
   */
  onOpenChangeComplete?: MenuProps["onOpenChangeComplete"];
  /**
   * Whether the menu is modal. A modal menu makes the rest of the page inert and locks its scroll while open, and a
   * press outside only closes it (it doesn't also activate what was under the pointer), as a native menu does. Set
   * `false` for a menu that leaves the page usable behind it.
   * @default true
   */
  modal?: MenuProps["modal"];
  /**
   * The reading direction, passed to the menu and its submenus: it decides which side a submenu opens on and which
   * arrow key opens and closes it. Defaulted, not read from the page.
   * @default 'ltr'
   */
  dir?: MenuProps["dir"];
  /**
   * How the menu is drawn, a single value or a mobile-first map keyed by breakpoint (`{ base: "sheet", md: "menu" }`
   * for a sheet on a phone and a menu at the pointer from `md` up). A sheet is anchored to the bottom edge across the
   * full width with taller rows and a scrim behind it, wherever the press was; `alignOffset` and the collision props
   * don't apply to it. A submenu covers the menu it opened from, under a "Back" row. It is the same menu either way:
   * the same keys, the same parts, the same focus handling.
   * @default 'menu'
   */
  presentation?: Responsive<MenuPresentation>;
  /**
   * The text the menu supplies itself, each with an English default: `back`, the row at the top of a submenu in a
   * sheet. Pass any subset.
   */
  labels?: Partial<MenuLabels>;
  /**
   * Hands the menu's controls (`openAt`, `openFrom`, `close`) to code outside it, such as a "Actions" button or a
   * key you handle yourself. Inside the menu, `useContextMenuController()` returns the same object.
   */
  controllerRef?: Ref<ContextMenuController>;
}

export interface ContextMenuTriggerProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  /**
   * Renders as the single child element (through Radix `Slot`) instead of the built-in `<span>`. Reach for it to make
   * a row, a card or a canvas the area, so its own element, role and focus behaviour stay yours.
   * @default false
   */
  asChild?: boolean;
  /** The area a right-click opens the menu from, or a single element when `asChild` is set. */
  children?: ReactNode;
  /**
   * A disabled trigger opens nothing, and the browser's own context menu shows instead.
   * @default false
   */
  disabled?: boolean;
  /**
   * Extra keys that open the menu from the element that has focus, written as modifiers and a key
   * (`"Alt+ArrowDown"`, `"Control+Enter"`). The context-menu key and Shift+F10 work without this on Windows and
   * Linux; macOS has no such key, so an app that wants a keyboard path there names one. The menu opens under the
   * focused element (not under the area), so a focused cell or button in a row anchors it. Keep a visible control
   * for the same actions: a key nobody knows is no better than a right-click.
   */
  openOnKeys?: string[];
  /**
   * Makes the area reachable by keyboard. The context-menu key and Shift+F10 open the menu on the element that has
   * focus, so an area that can't take focus can't be opened that way: set `0` here, or put the trigger on an
   * element that is already focusable (a row, a link, a button) with `asChild`.
   */
  tabIndex?: number;
  /** An accessible name for the area, when it is focusable and has no text of its own. */
  "aria-label"?: string;
  /** The id of an element that names the area. */
  "aria-labelledby"?: string;
  /** The id(s) of elements that describe the area. */
  "aria-describedby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface ContextMenuContentProps
  extends Omit<
    MenuContentProps,
    "side" | "align" | "sideOffset" | "alignOffset" | "onCloseAutoFocus" | "aria-label" | "aria-labelledby"
  > {
  /**
   * Pixel offset of the panel from the point that was pressed, along the pointer's own line (a context menu is placed
   * at the pointer and takes no `side`, `align` or `sideOffset`).
   * @default 0
   */
  alignOffset?: number;
  /**
   * An accessible name for the panel. A context menu has no trigger button to be named after, so name it when the
   * area's own text would not say what the menu is for ("File actions").
   */
  "aria-label"?: string;
  /** The id of an element that names the panel. */
  "aria-labelledby"?: string;
  /** Called when focus would return to where it was on close. Call `event.preventDefault()` to place it yourself. */
  onCloseAutoFocus?: (event: Event) => void;
}
