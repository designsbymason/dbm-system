import type { Responsive } from "@dbm-system/utils";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

type MenuPrimitiveContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;
type MenuPrimitiveSubContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>;

/**
 * The menu's row height and type size, on the standard 5-step scale (`05-component-api-conventions.md` §2). Every
 * step keeps a target at least 24 × 24 CSS pixels. Set once on `Menu.Content`; its items, labels and submenus take it.
 */
export type MenuSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * How the menu is drawn: `"menu"` floats beside what opened it, `"sheet"` is a panel across the bottom of the screen
 * with larger rows and a dimmed page behind it, the shape a touch screen expects.
 */
export type MenuPresentation = "menu" | "sheet";

/** The text a menu supplies itself. */
export interface MenuLabels {
  /** The row at the top of a submenu in a sheet, which returns to the menu it came from. */
  back: string;
}

/** The side of the trigger the panel opens on. */
export type MenuSide = "top" | "right" | "bottom" | "left";

/** The alignment of the panel along the chosen side. */
export type MenuAlign = "start" | "center" | "end";

/**
 * The meaning of an item. `"danger"` colours an item that destroys or discards something (Delete, Remove, Sign out
 * everywhere) so it reads as different before it is read, in addition to its words.
 */
export type MenuItemTone = "neutral" | "danger";

export interface MenuProps {
  /** `Menu.Trigger` and `Menu.Content`. */
  children?: ReactNode;
  /** The controlled open state. Omit (along with `defaultOpen`) to let the menu manage its own open state. */
  open?: boolean;
  /**
   * The initial open state for uncontrolled usage — ignored once `open` is provided.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the new open state whenever it changes: a trigger press, Escape, a press outside, or an item chosen.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Called with `true` once the menu has finished opening and with `false` once it has finished closing, its focus
   * is back on the trigger and it is out of the page. `onOpenChange` says a change *started*; this says it is over:
   * the place to release something heavy, or to start something that should wait for the menu to be gone.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the menu is modal. A modal menu makes the rest of the page inert and locks its scroll while open, and a
   * press outside only closes it (it doesn't also activate what was under the pointer), as a native menu does. Set
   * `false` for a menu that leaves the page usable behind it.
   * @default true
   */
  modal?: boolean;
  /**
   * The reading direction, passed to the menu and its submenus: it decides which side a submenu opens on and which
   * arrow key opens and closes it. Defaulted, not read from the page.
   * @default 'ltr'
   */
  dir?: "ltr" | "rtl";
  /**
   * How the menu is drawn, a single value or a mobile-first map keyed by breakpoint (`{ base: "sheet", md: "menu" }`
   * for a sheet on a phone and a floating menu from `md` up). A sheet is anchored to the bottom edge across the full
   * width with taller rows and a scrim behind it; `side`, `align` and `sideOffset` don't apply to it. A submenu
   * covers the menu it opened from, under a "Back" row. It is the same menu either way: the same keys, the same
   * parts, the same focus handling.
   * @default 'menu'
   */
  presentation?: Responsive<MenuPresentation>;
  /**
   * The text the menu supplies itself, each with an English default: `back`, the row at the top of a submenu in a
   * sheet. Pass any subset.
   */
  labels?: Partial<MenuLabels>;
}

export interface MenuTriggerProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * Renders as the single child element (through Radix `Slot`) instead of the built-in, unstyled `<button>`. Reach
   * for it to use `Button` or `IconButton` as the visible trigger, since the fallback brings no chrome of its own.
   * @default false
   */
  asChild?: boolean;
  /** The trigger's content, or a single element when `asChild` is set. */
  children?: ReactNode;
  /**
   * A disabled trigger can't open the menu.
   * @default false
   */
  disabled?: boolean;
  /** `"menu"` on a trigger that opens one; Radix sets it, so this is only to document it. */
  "aria-haspopup"?: ComponentPropsWithoutRef<"button">["aria-haspopup"];
  /** Whether the menu is open; Radix keeps it in step with the open state. */
  "aria-expanded"?: boolean;
  /** An accessible name, required on an icon-only trigger. The menu is named after its trigger. */
  "aria-label"?: string;
  /** The id of an element that names the trigger. */
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

export interface MenuContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "dir"> {
  /** The menu's items, labels, groups, separators and submenus. */
  children?: ReactNode;
  /**
   * The row height and type size of every item, label and submenu in this menu. A submenu takes its parent's unless
   * its own `Menu.SubContent` sets one.
   * @default 'md'
   */
  size?: MenuSize;
  /**
   * Which side of the trigger the panel opens on, a single value or a mobile-first map keyed by breakpoint
   * (`{ base: "bottom", md: "right" }`). Radix flips it to the opposite side when there isn't room.
   * @default 'bottom'
   */
  side?: Responsive<MenuSide>;
  /**
   * Alignment along the chosen side: `"start"` lines the panel's start edge up with the trigger's, which is where
   * a menu belongs under a button.
   * @default 'start'
   */
  align?: MenuAlign;
  /**
   * Pixel gap between the trigger and the panel along `side`.
   * @default 4
   */
  sideOffset?: number;
  /**
   * Pixel offset along `align`'s own axis.
   * @default 0
   */
  alignOffset?: number;
  /**
   * Whether the panel repositions itself to stay inside the viewport instead of overflowing it.
   * @default true
   */
  avoidCollisions?: boolean;
  /**
   * Minimum distance, in pixels, kept between the panel and the viewport's edge while repositioning.
   * @default 8
   */
  collisionPadding?: number | Partial<Record<MenuSide, number>>;
  /**
   * Element(s) to use as the collision boundary instead of the viewport, such as a scrolling container the menu
   * should stay inside.
   * @default []
   */
  collisionBoundary?: MenuPrimitiveContentProps["collisionBoundary"];
  /**
   * Hides the panel when its trigger scrolls fully out of view, instead of leaving it floating.
   * @default false
   */
  hideWhenDetached?: MenuPrimitiveContentProps["hideWhenDetached"];
  /**
   * Whether the panel stays in the viewport on the alignment axis once the trigger has gone past an edge:
   * `"partial"` lets it leave with its trigger, `"always"` keeps it fully on screen.
   * @default 'partial'
   */
  sticky?: "partial" | "always";
  /**
   * Whether arrow-key movement wraps from the last item to the first and back.
   * @default false
   */
  loop?: boolean;
  /**
   * The element the panel is portaled into. Defaults to `document.body`.
   */
  container?: HTMLElement | null;
  /** Called when focus would return to the trigger on close. Call `event.preventDefault()` to place it yourself. */
  onCloseAutoFocus?: MenuPrimitiveContentProps["onCloseAutoFocus"];
  /** Called when Escape is pressed while open. Call `event.preventDefault()` to keep the menu open. */
  onEscapeKeyDown?: MenuPrimitiveContentProps["onEscapeKeyDown"];
  /** Called on a pointer press outside the panel. Call `event.preventDefault()` to keep the menu open. */
  onPointerDownOutside?: MenuPrimitiveContentProps["onPointerDownOutside"];
  /** Called when focus moves outside the panel. Call `event.preventDefault()` to keep the menu open. */
  onFocusOutside?: MenuPrimitiveContentProps["onFocusOutside"];
  /** Called on any interaction outside the panel. Call `event.preventDefault()` to keep the menu open. */
  onInteractOutside?: MenuPrimitiveContentProps["onInteractOutside"];
  /** An accessible name for the panel. By default it is named after its trigger. */
  "aria-label"?: string;
  /** The id of an element that names the panel. By default it is named after its trigger. */
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

/** What the items that choose or toggle something share. */
interface MenuItemBaseProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onSelect" | "defaultChecked" | "defaultValue"> {
  /** The item's label. Typeahead matches the start of its text. */
  children?: ReactNode;
  /**
   * A leading icon, as a component reference (`icon={CopyIcon}`), drawn in `icon.*` colours. It is decorative: the
   * label carries the meaning.
   */
  icon?: PhosphorIcon;
  /**
   * A shortcut hint shown at the item's end (`"⌘C"`). It displays the shortcut and does not bind it: wire the
   * key yourself, and pass `aria-keyshortcuts` on the item if it should be announced.
   */
  shortcut?: ReactNode;
  /**
   * A disabled item is dimmed and can't be chosen. Without a `disabledReason` it is also skipped by the arrow keys
   * and typeahead.
   * @default false
   */
  disabled?: boolean;
  /**
   * Called when the item is chosen, by a click, Enter or Space. Call `event.preventDefault()` to keep the menu open
   * after it. **Return a promise for an action that takes time:** the item shows a spinner and ignores further
   * presses while it is pending, the menu stays open, and it closes when the promise resolves (unless
   * `closeOnSelect` is `false`). A rejection ends the pending state and leaves the menu open (see
   * `onSelectError`).
   */
  onSelect?: (event: Event) => void | Promise<unknown>;
  /**
   * Receives the error when a promise returned by `onSelect` rejects. The menu stays open either way; with no handler
   * the rejection is left unhandled so it is not lost silently.
   */
  onSelectError?: (error: unknown) => void;
  /**
   * Whether choosing the item closes the menu. An action closes it; a toggle the person may flip several times
   * (a checkbox or radio item) stays open by default. `onSelect`'s `event.preventDefault()` still keeps it open.
   * @default true (false for `Menu.CheckboxItem` and `Menu.RadioItem`)
   */
  closeOnSelect?: boolean;
  /**
   * A second line under the label, in quiet text (`Billing` — "Plan and invoices"). It describes the item for
   * assistive technology rather than becoming part of its name.
   */
  description?: ReactNode;
  /**
   * Content at the item's end, before a shortcut hint: a count, a `Badge`, "New". Unlike `shortcut` it is not
   * quiet text; style it as you would anywhere.
   */
  trailing?: ReactNode;
  /**
   * Why the item is `disabled`, shown in a tooltip and announced as its description. Only with `disabled`. A
   * disabled item that has a reason stays focusable (and `aria-disabled`) so a keyboard user can reach it and
   * hear why, instead of being skipped; it still can't be chosen.
   */
  disabledReason?: ReactNode;
  /**
   * The text typeahead matches, when it isn't the item's own text (an item whose label is an icon and a visually
   * hidden name, say).
   */
  textValue?: string;
  /**
   * The keys that do the same as choosing this item from elsewhere in the page (`"Meta+E"`), announced with it. The
   * `shortcut` hint only displays a key; this says it exists, so set both together and bind the key yourself.
   */
  "aria-keyshortcuts"?: string;
  /**
   * The id(s) of elements that describe the item, in addition to its `description` and `disabledReason`, which are
   * added to it.
   */
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

export interface MenuItemProps extends MenuItemBaseProps {
  /**
   * Renders as the single child element (through Radix `Slot`), which receives the item's role, keyboard handling
   * and styles: how a link or a router `Link` becomes a menu item. In this mode the item draws none of its own
   * content, so `icon` and `shortcut` are not rendered (a development warning says so); put them inside the child.
   * @default false
   */
  asChild?: boolean;
  /**
   * The meaning of the item; `"danger"` is for one that destroys or discards something.
   * @default 'neutral'
   */
  tone?: MenuItemTone;
}

export interface MenuCheckboxItemProps extends MenuItemBaseProps {
  /**
   * Whether the item is checked (controlled), or `"indeterminate"` for a mixed state. Omit it, with
   * `defaultChecked`, to let the item keep its own state.
   */
  checked?: boolean | "indeterminate";
  /**
   * The initial checked state for uncontrolled usage — ignored once `checked` is provided.
   * @default false
   */
  defaultChecked?: boolean | "indeterminate";
  /** Called with the new checked state when the item is chosen. */
  onCheckedChange?: (checked: boolean) => void;
}

export interface MenuRadioGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "defaultValue" | "onChange"> {
  /** `Menu.RadioItem`s, with an optional `Menu.Label`. */
  children?: ReactNode;
  /** The value of the chosen item (controlled). Omit it, with `defaultValue`, to let the group keep its own. */
  value?: string;
  /** The initially chosen value for uncontrolled usage — ignored once `value` is provided. */
  defaultValue?: string;
  /** Called with the new value when an item is chosen. */
  onValueChange?: (value: string) => void;
  /** An accessible name for the group, when there is no `Menu.Label` inside it. */
  "aria-label"?: string;
  /** The id of an element that names the group. Without it, a `Menu.Label` inside the group names it. */
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

export interface MenuRadioItemProps extends MenuItemBaseProps {
  /** The value this item stands for. Required: it is what the group's `value` is compared with. */
  value: string;
}

export interface MenuLabelProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The heading text. It names the `Menu.Group` or `Menu.RadioGroup` it sits in. */
  children?: ReactNode;
  /** Standard DOM id. Set by a group around it; replace it only if nothing refers to it. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface MenuGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The items of the group, with an optional `Menu.Label` that names it. */
  children?: ReactNode;
  /** An accessible name for the group, when there is no `Menu.Label` inside it. */
  "aria-label"?: string;
  /** The id of an element that names the group. Without it, a `Menu.Label` inside the group names it. */
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

export interface MenuSeparatorProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface MenuSubProps {
  /** `Menu.SubTrigger` and `Menu.SubContent`. */
  children?: ReactNode;
  /**
   * The controlled open state of the submenu. Omit it to let the submenu manage its own: it opens on a pointer
   * resting on its trigger or on the key that points toward it, and closes when focus or the pointer leaves.
   * There is no `defaultOpen`: a submenu closes as soon as focus is anywhere but in it or on its trigger, so one
   * opened by default would shut as the menu around it took focus.
   */
  open?: boolean;
  /** Called with the new open state whenever the submenu opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

export interface MenuSubTriggerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The item's label. Typeahead matches the start of its text. */
  children?: ReactNode;
  /** A leading icon, as a component reference. Decorative. */
  icon?: PhosphorIcon;
  /**
   * A disabled submenu trigger is dimmed, skipped by the arrow keys and can't be opened.
   * @default false
   */
  disabled?: boolean;
  /** The text typeahead matches, when it isn't the item's own text. */
  textValue?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}

export interface MenuSubContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "dir"> {
  /** The submenu's items, labels, groups and separators. */
  children?: ReactNode;
  /**
   * The row height and type size of this submenu. By default it takes its parent menu's.
   */
  size?: MenuSize;
  /**
   * Pixel gap between the trigger and the submenu along the side it opens on.
   * @default 0
   */
  sideOffset?: number;
  /**
   * Pixel offset along the submenu's alignment axis. The default lines the first item up with its trigger by
   * cancelling the panel's own padding and border.
   * @default -5
   */
  alignOffset?: number;
  /**
   * Whether the submenu repositions itself (flips to the other side, or shifts) to stay inside the viewport instead
   * of overflowing it.
   * @default true
   */
  avoidCollisions?: boolean;
  /**
   * Element(s) to use as the collision boundary instead of the viewport, such as a scrolling container the menu
   * should stay inside.
   * @default []
   */
  collisionBoundary?: MenuPrimitiveSubContentProps["collisionBoundary"];
  /**
   * Hides the submenu when its trigger scrolls fully out of view, instead of leaving it floating.
   * @default false
   */
  hideWhenDetached?: MenuPrimitiveSubContentProps["hideWhenDetached"];
  /**
   * Whether the submenu stays in the viewport on the alignment axis once its trigger has gone past an edge:
   * `"partial"` lets it leave with its trigger, `"always"` keeps it fully on screen.
   * @default 'partial'
   */
  sticky?: "partial" | "always";
  /** Called when Escape is pressed while the submenu is open. Call `event.preventDefault()` to keep it open. */
  onEscapeKeyDown?: MenuPrimitiveSubContentProps["onEscapeKeyDown"];
  /** Called on a pointer press outside the submenu. Call `event.preventDefault()` to keep it open. */
  onPointerDownOutside?: MenuPrimitiveSubContentProps["onPointerDownOutside"];
  /** Called when focus moves outside the submenu. Call `event.preventDefault()` to keep it open. */
  onFocusOutside?: MenuPrimitiveSubContentProps["onFocusOutside"];
  /** Called on any interaction outside the submenu. Call `event.preventDefault()` to keep it open. */
  onInteractOutside?: MenuPrimitiveSubContentProps["onInteractOutside"];
  /**
   * Whether arrow-key movement wraps from the last item to the first and back.
   * @default false
   */
  loop?: boolean;
  /**
   * Minimum distance, in pixels, kept between the submenu and the viewport's edge while repositioning.
   * @default 8
   */
  collisionPadding?: MenuPrimitiveSubContentProps["collisionPadding"];
  /** The element the submenu is portaled into. Defaults to `document.body`. */
  container?: HTMLElement | null;
  /** An accessible name for the submenu. By default it is named after its trigger. */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; no visual or behavioral effect. */
  "data-testid"?: string;
}
