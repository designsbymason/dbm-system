import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { MenuContentProps, MenuSize } from "../Menu/Menu.types";

export type {
  MenuAlign as MenubarAlign,
  MenuCheckboxItemProps as MenubarCheckboxItemProps,
  MenuGroupProps as MenubarGroupProps,
  MenuItemProps as MenubarItemProps,
  MenuItemTone as MenubarItemTone,
  MenuLabelProps as MenubarLabelProps,
  MenuRadioGroupProps as MenubarRadioGroupProps,
  MenuRadioItemProps as MenubarRadioItemProps,
  MenuSeparatorProps as MenubarSeparatorProps,
  MenuSide as MenubarSide,
  MenuSubContentProps as MenubarSubContentProps,
  MenuSubProps as MenubarSubProps,
  MenuSubTriggerProps as MenubarSubTriggerProps,
} from "../Menu/Menu.types";

/** The size of the bar's triggers, and of every menu it opens unless a `Menubar.Content` sets its own. */
export type MenubarSize = MenuSize;

/** The colour family of the triggers and of the bar's own border and fill: the system's identity colour, or neutral. */
export type MenubarTone = "neutral" | "brand";

/** How the bar itself is drawn: no surface of its own, a bordered bar, or a tinted bar. */
export type MenubarSurface = "ghost" | "outlined" | "filled";

export interface MenubarProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "dir" | "defaultValue"
> {
  /** The menus: `Menubar.Menu`, each holding a `Menubar.Trigger` and a `Menubar.Content`. */
  children?: ReactNode;
  /**
   * The `value` of the menu that is open, or `""` when none is. Omit it (with `defaultValue`) to let the bar manage
   * its own state. Set it to open a menu from code, for an app's own shortcut (Alt+F for File).
   */
  value?: string;
  /**
   * The menu that is open to begin with, for uncontrolled usage. Ignored once `value` is provided.
   * @default ''
   */
  defaultValue?: string;
  /** Called with the `value` of the menu that opened, or `""` when the open one closed. */
  onValueChange?: (value: string) => void;
  /**
   * Called with a menu's `value` and `true` once that menu has finished opening, or `false` once it has finished
   * closing, its focus is back and it is out of the page. `onValueChange` says a change *started*; this says it is over.
   */
  onOpenChangeComplete?: (value: string, open: boolean) => void;
  /**
   * The height and type size of the triggers, and the row size of every menu the bar opens.
   * @default 'md'
   */
  size?: MenubarSize;
  /**
   * How the bar is drawn: `ghost` (no surface; the triggers sit on the page or on a header), `outlined` (a bordered
   * bar) or `filled` (a tinted bar). The same three names `Toolbar` uses for its `surface`.
   * @default 'ghost'
   */
  surface?: MenubarSurface;
  /**
   * The colour of the triggers and of the bar's own border and fill: `brand` (the system's identity colour) or
   * `neutral`. Every colour is a subtle one. It does not change the menus the bar opens.
   * @default 'brand'
   */
  tone?: MenubarTone;
  /**
   * Whether the arrow keys wrap from the last trigger to the first and back.
   * @default true
   */
  loop?: boolean;
  /**
   * The reading direction, passed to the bar and its menus: it decides which arrow key moves to the next trigger and
   * which side a submenu opens on. Defaulted, not read from the page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /** An accessible name for the bar ("Application menu"). A page with more than one menubar needs one on each. */
  "aria-label"?: string;
  /** The id of an element that names the bar. */
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

export interface MenubarMenuProps {
  /** The name of this menu. It is what the bar's `value` holds while this menu is open, so it is unique within the bar. */
  value: string;
  /** One `Menubar.Trigger` and one `Menubar.Content`. */
  children?: ReactNode;
}

export interface MenubarTriggerProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "children"
> {
  /** The trigger's label: "File", "Edit". */
  children?: ReactNode;
  /**
   * Renders as the single child element (through Radix `Slot`) instead of the built-in `<button>`.
   * @default false
   */
  asChild?: boolean;
  /**
   * A disabled trigger opens nothing and is skipped by the arrow keys.
   * @default false
   */
  disabled?: boolean;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface MenubarContentProps extends Omit<MenuContentProps, "size"> {
  /**
   * The row height and type size of every item in this menu. By default it follows the bar's `size`.
   * @default the bar's size
   */
  size?: MenuSize;
}
