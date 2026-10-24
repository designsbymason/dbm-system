import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { MenuContentProps, MenuProps } from "../Menu/Menu.types";

export type {
  MenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  MenuGroupProps as ContextMenuGroupProps,
  MenuItemProps as ContextMenuItemProps,
  MenuItemTone as ContextMenuItemTone,
  MenuLabelProps as ContextMenuLabelProps,
  MenuRadioGroupProps as ContextMenuRadioGroupProps,
  MenuRadioItemProps as ContextMenuRadioItemProps,
  MenuSeparatorProps as ContextMenuSeparatorProps,
  MenuSize as ContextMenuSize,
  MenuSubContentProps as ContextMenuSubContentProps,
  MenuSubProps as ContextMenuSubProps,
  MenuSubTriggerProps as ContextMenuSubTriggerProps,
} from "../Menu/Menu.types";

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
  extends Omit<MenuContentProps, "side" | "align" | "sideOffset" | "alignOffset" | "onCloseAutoFocus"> {
  /**
   * Pixel offset of the panel from the point that was pressed, along the pointer's own line (a context menu is placed
   * at the pointer and takes no `side`, `align` or `sideOffset`).
   * @default 0
   */
  alignOffset?: number;
  /** Called when focus would return to where it was on close. Call `event.preventDefault()` to place it yourself. */
  onCloseAutoFocus?: (event: Event) => void;
}
