import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { SpaceValue } from "@dbm-system/utils";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactNode,
  Ref,
  RefObject,
  SyntheticEvent,
} from "react";
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

/** What a bar does when its menus do not fit: scroll sideways, or move the ones that do not fit into a "More" menu. */
export type MenubarOverflow = "scroll" | "menu";

/** The text a bar supplies itself. */
export interface MenubarLabels {
  /** The "More" menu's label, when `overflow` is `"menu"` and some menus do not fit. @default 'More' */
  more: string;
}

/**
 * What code outside the bar can do to it: open a menu and close it. `Menubar`'s `controllerRef` hands it out, and
 * `useMenubarController()` returns the same object inside the bar.
 */
export interface MenubarController {
  /**
   * Opens the menu named `value` and puts keyboard focus on its first item, as the key that opens it would. Returns
   * `false`, and does nothing, when there is no such menu (it is not mounted, or has moved into the "More" menu), when
   * it is a `Menubar.Action`, or when its trigger is disabled with a reason.
   */
  open: (value: string) => boolean;
  /** Closes the open menu. Does nothing if none is open. */
  close: () => void;
  /** The `value` of the menu that is open now, or an empty string. */
  readonly value: string;
}

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
   * The colour of the triggers' hover and open fills and of the bar's own border and fill: `brand` (the system's identity colour) or
   * `neutral`. Every colour is a subtle one. It does not change the menus the bar opens.
   * @default 'brand'
   */
  tone?: MenubarTone;
  /**
   * What the bar does when its menus do not fit its container: `scroll` (sideways, with a fade at each end that has
   * more behind it) or `menu` (the menus that do not fit move into a "More" menu, each as a submenu). Each
   * `Menubar.Menu` and `Menubar.Action` tells the bar what it is, so they can sit inside a component of your own. `menu`
   * sizes the bar against its container, which has to be sized by the layout and not by the bar.
   * @default 'scroll'
   */
  overflow?: MenubarOverflow;
  /**
   * Keys that open a menu from anywhere on the page: an object from a menu's `value` to a combination (`"alt+f"`,
   * `"mod+shift+e"`), where `mod` is ⌘ on an Apple platform and Ctrl elsewhere, or `false` to turn one off. Nothing is
   * bound by default. A press that matches is kept from the browser, and opens the menu with focus on its first item.
   * A browser keeps some combinations for itself (Ctrl+Tab, Ctrl+W), so use `alt` or `ctrl+alt`.
   */
  hotkeys?: Record<string, string | false>;
  /**
   * Hands the bar's controls (`open`, `close`, `value`) to code outside it, such as a button or a key you handle
   * yourself. Inside the bar, `useMenubarController()` returns the same object.
   */
  controllerRef?: Ref<MenubarController>;
  /**
   * The text the bar supplies itself, each with an English default: `more`, the "More" menu's label. Pass any subset.
   */
  labels?: Partial<MenubarLabels>;
  /**
   * Keeps the bar at the top of the page (or of `scrollContainerRef`) as the reader scrolls, with a surface behind it
   * and a shadow while it is stuck. Built on `Affix`, the same as `Toolbar`'s `sticky`.
   * @default false
   */
  sticky?: boolean;
  /**
   * How far from the top a sticky bar sticks, from the spacing token scale. Has no effect without `sticky`.
   * @default 0
   */
  stickyOffset?: SpaceValue;
  /**
   * The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without `sticky`.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
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
   * A disabled trigger opens nothing and is skipped by the arrow keys, unless it has a `disabledReason`.
   * @default false
   */
  disabled?: boolean;
  /**
   * Why the trigger is disabled, shown in a tooltip and announced as its description. Only with `disabled`. A trigger
   * with a reason stays focusable (and `aria-disabled`) so the reason can be reached and heard, and the arrow keys stop on it.
   */
  disabledReason?: ReactNode;
  /** A leading icon, as a component reference (`icon={FileIcon}`), drawn in `icon.*` colours. Decorative: the label carries the meaning. */
  icon?: PhosphorIcon;
  /** Content after the label: a count, a `Badge`. */
  trailing?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface MenubarActionProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "onSelect"
> {
  /** The action's label: "Run", "Help". */
  children?: ReactNode;
  /**
   * Called when the action is chosen, by a click, Enter or Space. It opens no menu and closes any that is open.
   */
  onSelect?: (event: SyntheticEvent) => void;
  /**
   * Renders as the single child element (through Radix `Slot`), such as a link, which keeps its own element and
   * receives the action's role and keys. The action then draws no icon or trailing content of its own.
   * @default false
   */
  asChild?: boolean;
  /**
   * A disabled action can't be chosen and is skipped by the arrow keys, unless it has a `disabledReason`.
   * @default false
   */
  disabled?: boolean;
  /** Why the action is disabled, shown in a tooltip and announced as its description. Only with `disabled`; it keeps the action focusable. */
  disabledReason?: ReactNode;
  /** A leading icon, as a component reference. Decorative: the label carries the meaning. */
  icon?: PhosphorIcon;
  /** Content after the label: a count, a `Badge`. */
  trailing?: ReactNode;
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
