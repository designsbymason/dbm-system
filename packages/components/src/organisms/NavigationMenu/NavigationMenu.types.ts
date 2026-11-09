import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

/** The size of the links and triggers, on the shared five-step scale (the steps `Menu` and `Navbar`'s links use). */
export type NavigationMenuSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * How the current page's link (and the item whose panel holds it) is marked, beyond its `aria-current` (`"page"`, or the menu's `currentType`), which is always set:
 * `underline` (a brand line under it), `subtle` (a tinted pill with brand-coloured text) or `solid` (a brand fill with the text on
 * it). The names `Navbar` and `Tabs` use.
 */
export type NavigationMenuCurrentVariant = "subtle" | "underline" | "solid";

/**
 * How the menu is drawn: `mega` (a row of triggers whose panels open under them) or `stacked` (a vertical list where each trigger
 * is a disclosure button and its links nest beneath it, for a phone or a side panel).
 */
export type NavigationMenuPresentation = "mega" | "stacked";

/**
 * Where a panel sits under the menu: lined up with its start edge, centred under it, lined up with its end edge, or `auto`, which is
 * `start` unless there is more room toward the start side than the end side (a menu far along the bar), when it is `end`. All logical,
 * so `start` is the right edge in right-to-left text.
 */
export type NavigationMenuPanelAlign = "start" | "center" | "end" | "auto";

/**
 * How wide a panel is: `auto` (as wide as its content wants, between the two measure tokens), `sm`, `md` or `lg` (one, two or three
 * and a half times the least width: fixed widths, still kept on the screen), or `full` (the width of the nearest positioned ancestor:
 * a `sticky` `Navbar` is one, and otherwise give the box to span `position: relative`).
 */
export type NavigationMenuPanelSize = "auto" | "sm" | "md" | "lg" | "full";

/** The direction the triggers run: `horizontal` (a bar, panels under them) or `vertical` (a column, panels beside them). */
export type NavigationMenuOrientation = "horizontal" | "vertical";

/** How a panel lays out its children: stacked one under another, or side by side in columns that wrap. */
export type NavigationMenuContentLayout = "stack" | "columns";

/** How `currentPath` is matched against a link's `href`: the whole path, or the path and everything under it. */
export type NavigationMenuCurrentMatch = "exact" | "prefix";

/**
 * What a current link is announced as, the value of its `aria-current`: `"page"` (the default) for a link to the page the reader is on, or
 * `"location"` for a link to the place in the page they are at, such as the section an outline of the page marks.
 */
export type NavigationMenuCurrentType = "page" | "location";

/** What `controllerRef` gives code outside the menu. Its identity never changes, and its methods read the latest state. */
export interface NavigationMenuController {
  /** Opens the panel of the item with this value. Returns `false` when it was already the open one. */
  open: (value: string) => boolean;
  /** Closes the open panel. Returns `false` when none was open. */
  close: () => boolean;
  /** The value of the open item (`""` for none), as of the latest render. */
  readonly value: string;
}

/** The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page. */
export type NavigationMenuDirection = "ltr" | "rtl";

/** The text `NavigationMenu` supplies itself, translatable through the `labels` prop. Nothing here needs a number. */
export interface NavigationMenuLabels {
  /** The name of the `<nav>` landmark, when the menu is not given an `aria-label`. Not used inside a `Navbar`, whose own links landmark names it. @default 'Main' */
  navigation: string;
  /** Read out after an external link's text, in place of a visible cue. @default '(opens in a new tab)' */
  externalLink: string;
  /** The name of a split trigger's caret button, given the trigger's text (or "Menu" when it is not plain text). @default (name) => `${name} menu` */
  togglePanel: (name: string) => string;
}

export interface NavigationMenuProps extends Omit<ComponentPropsWithoutRef<"nav">, "dir" | "defaultValue" | "onChange"> {
  /**
   * The items: a `NavigationMenu.List` holding `NavigationMenu.Item`s. Anything else is drawn as written, after the list.
   */
  children?: ReactNode;
  /** The value of the item whose panel is open (`""` for none). Controlled: pass it with `onValueChange`. Omit it (and use `defaultValue`) to let the menu manage it. */
  value?: string;
  /**
   * The initial open item for uncontrolled usage — ignored once `value` is provided.
   * @default ''
   */
  defaultValue?: string;
  /** Called with the value of the item whose panel is now open, or `""` when the last one closed. */
  onValueChange?: (value: string) => void;
  /**
   * Called once a panel has finished opening, or the last one has finished closing, with its entrance or exit over: `onValueChange`
   * says a change started, this says it is done. `value` is the item that opened, or that was open when it closed.
   */
  onOpenChangeComplete?: (open: boolean, value: string) => void;
  /** Gives code outside the menu a way to open and close it — see {@link NavigationMenuController}. A controlled `value` does the same. */
  controllerRef?: Ref<NavigationMenuController>;
  /**
   * How the menu is drawn — see {@link NavigationMenuPresentation}. A width map (`{ base: "stacked", md: "mega" }`) chooses by
   * screen width, resolved in the browser like `Menu`'s `presentation`. Inside a `Navbar`'s menu panel it is always `stacked`.
   * @default 'mega'
   */
  presentation?: Responsive<NavigationMenuPresentation>;
  /**
   * Whether more than one item can be open at once in the stacked form. Off, opening one closes the others. Not read in the mega
   * form, which shows one panel at a time.
   * @default true
   */
  exclusive?: boolean;
  /**
   * One panel area, shared by every item and resized between them, or (`false`) a panel under its own item.
   * @default true
   */
  viewport?: boolean;
  /**
   * Where a panel sits — see {@link NavigationMenuPanelAlign}. In the shared panel area it lines up under the whole menu; with
   * `viewport={false}` under its own item, which can say otherwise itself.
   * @default 'start'
   */
  panelAlign?: NavigationMenuPanelAlign;
  /**
   * How wide a panel is — see {@link NavigationMenuPanelSize}. `full` spans the nearest positioned ancestor: a `sticky` `Navbar` is one, and otherwise the box to span needs `position: relative`.
   * @default 'auto'
   */
  panelSize?: NavigationMenuPanelSize;
  /**
   * The direction the triggers run — see {@link NavigationMenuOrientation}. Vertical suits a side navigation on a wide screen; the
   * stacked form is the phone one.
   * @default 'horizontal'
   */
  orientation?: NavigationMenuOrientation;
  /**
   * Draws a small arrow from the open item's trigger to its panel, sliding between triggers. Needs the shared panel area and the
   * horizontal direction.
   * @default false
   */
  indicator?: boolean;
  /**
   * The path of the current page. A link whose `href` is this path is the current page without its own `current`, and the trigger of
   * an item whose panel holds it is marked too. A link's own `current` (either value) wins. Only same-site paths are compared; a
   * hash, a query and a trailing slash are ignored.
   */
  currentPath?: string;
  /**
   * How `currentPath` is matched — see {@link NavigationMenuCurrentMatch}.
   * @default 'exact'
   */
  currentMatch?: NavigationMenuCurrentMatch;
  /**
   * What a current link is announced as — see {@link NavigationMenuCurrentType}. Use `"location"` when the links lead to places in one page (an outline
   * of its sections) rather than to pages.
   * @default 'page'
   */
  currentType?: NavigationMenuCurrentType;
  /**
   * The text size, icon size and padding of the triggers and links, on the shared five-step scale. Inside a `Navbar` the bar's
   * link size applies and this one is ignored.
   * @default 'md'
   */
  size?: NavigationMenuSize;
  /**
   * How the current page's link is marked — see {@link NavigationMenuCurrentVariant}. Inside a `Navbar` the bar's choice applies.
   * @default 'underline'
   */
  currentVariant?: NavigationMenuCurrentVariant;
  /**
   * Fully rounded triggers and links (pills). Inside a `Navbar` the bar's choice applies.
   * @default false
   */
  rounded?: boolean;
  /**
   * How long the pointer rests on a trigger, in milliseconds, before its panel opens.
   * @default 200
   */
  delayDuration?: number;
  /**
   * How long, in milliseconds, after a panel closes that moving onto another trigger opens its panel at once.
   * @default 300
   */
  skipDelayDuration?: number;
  /**
   * The reading direction, passed to the primitive and every part around it. Left out, it follows the nearest `DirectionProvider`,
   * else left-to-right; it is not read from the page. Inside a `Navbar` the bar's `dir` applies.
   * @default 'ltr'
   */
  dir?: NavigationMenuDirection;
  /** Text the menu supplies itself (the landmark's name, the external-link cue), merged over the English defaults. */
  labels?: Partial<NavigationMenuLabels>;
  /** The name of the `<nav>` landmark. Without it, `labels.navigation`. */
  "aria-label"?: string;
  /** The id of an element that names the `<nav>` landmark; replaces the default name. */
  "aria-labelledby"?: string;
  /** Extra class names for the root element. */
  className?: string;
  /** Inline styles for the root element. */
  style?: ComponentPropsWithoutRef<"nav">["style"];
  /** The id of the root element. */
  id?: string;
  /** A test id for the root element. */
  "data-testid"?: string;
}

export interface NavigationMenuListProps extends ComponentPropsWithoutRef<"ul"> {
  /** The items, in reading order. */
  children?: ReactNode;
  /** Extra class names for the list. */
  className?: string;
  /** Inline styles for the list. */
  style?: ComponentPropsWithoutRef<"ul">["style"];
  /** The id of the list. */
  id?: string;
  /** A test id for the list. */
  "data-testid"?: string;
}

export interface NavigationMenuItemProps extends Omit<ComponentPropsWithoutRef<"li">, "value"> {
  /** What identifies the item for the menu's `value`. Left out, one is generated, which is fine unless you control the open item. */
  value?: string;
  /** A `NavigationMenu.Trigger` with its `NavigationMenu.Content`, or a `NavigationMenu.Link`. */
  children?: ReactNode;
  /**
   * Starts the item expanded in the stacked form. Left out, an item starts expanded when a link in its panel is the current page
   * (from `currentPath` or a link's own `current`); `false` keeps it closed. Ignored once any item has been pressed, and when `value`
   * is controlled.
   */
  defaultOpen?: boolean;
  /** Where this item's panel sits when panels hang from their own items (`viewport={false}`), in place of the menu's `panelAlign`. */
  panelAlign?: NavigationMenuPanelAlign;
  /** Extra class names for the item. */
  className?: string;
  /** Inline styles for the item. */
  style?: ComponentPropsWithoutRef<"li">["style"];
  /** The id of the item. */
  id?: string;
  /** A test id for the item. */
  "data-testid"?: string;
}

export interface NavigationMenuTriggerProps extends ComponentPropsWithoutRef<"button"> {
  /** The trigger's text. */
  children?: ReactNode;
  /** An icon (a component reference) drawn before the text. */
  icon?: PhosphorIcon;
  /**
   * A mark after the text (a count, a "New"), part of the trigger's name. A `Badge` you pass is drawn as written; anything else is
   * the content of a solid brand badge.
   */
  badge?: ReactNode;
  /**
   * Makes a split trigger: the text is a link to this address and a caret button beside it opens the panel. Without it the whole
   * trigger is the button. The link opens the panel too when the pointer rests on it. In a split trigger the `ref`, `aria-label`
   * (which names the caret, in place of `labels.togglePanel`), `aria-labelledby`, `aria-describedby` and every other native prop go to
   * the caret button; the link is named by its text.
   */
  href?: string;
  /**
   * Marks the item whose panel holds the current page: tints or underlines the trigger in the menu's `currentVariant`. It sets no
   * `aria-current`, since a button is not a page. Left out, it follows the item's panel: current when a link in it is.
   */
  current?: boolean;
  /**
   * Called when the person shows intent to open this item: the pointer has rested on the trigger for a moment, or keyboard focus
   * arrives. Use it to prefetch what the panel's links lead to. It can fire more than once, so keep it idempotent.
   */
  onIntent?: () => void;
  /**
   * How long, in milliseconds, the pointer rests on this trigger before its panel opens, in place of the menu's `delayDuration`. A
   * panel already open elsewhere is still replaced at once.
   */
  delayDuration?: number;
  /**
   * Stops the trigger opening its panel. A native `disabled` button, so it leaves the tab order.
   * @default false
   */
  disabled?: boolean;
  /** Extra class names for the trigger. */
  className?: string;
  /** Inline styles for the trigger. */
  style?: ComponentPropsWithoutRef<"button">["style"];
  /** The id of the trigger. */
  id?: string;
  /** A test id for the trigger. */
  "data-testid"?: string;
  /** Names the trigger when its text alone does not; it must contain the visible text as whole words, in order. */
  "aria-label"?: string;
  /** The id of an element that names the trigger. */
  "aria-labelledby"?: string;
  /** The id of an element that describes the trigger. */
  "aria-describedby"?: string;
}

/** The panel takes no `id`: the menu generates it and points the trigger's `aria-controls` at it. */
export interface NavigationMenuContentProps extends Omit<ComponentPropsWithoutRef<"div">, "dir" | "id"> {
  /**
   * The panel's content: `NavigationMenu.Group`s, `NavigationMenu.Link`s, a `NavigationMenu.Feature` and anything else. A
   * `NavigationMenu.Footer` that is a direct child is drawn under the rest.
   */
  children?: ReactNode;
  /**
   * How the children are laid out — see {@link NavigationMenuContentLayout}. Not read in the stacked form, which is always one column.
   * @default 'stack'
   */
  layout?: NavigationMenuContentLayout;
  /**
   * Keeps the panel mounted while it is closed, for an animation of your own or to keep its state.
   * @default false
   */
  forceMount?: true;
  /** Called when `Escape` is pressed in the open panel. Call `event.preventDefault()` to keep it open. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Called when a pointer goes down outside the open panel. Call `event.preventDefault()` to keep it open. */
  onPointerDownOutside?: (event: Event) => void;
  /** Called when focus moves outside the open panel. Call `event.preventDefault()` to keep it open. */
  onFocusOutside?: (event: Event) => void;
  /** Called on a pointer or focus interaction outside the open panel. Call `event.preventDefault()` to keep it open. */
  onInteractOutside?: (event: Event) => void;
  /** Extra class names for the panel. */
  className?: string;
  /** Inline styles for the panel. */
  style?: ComponentPropsWithoutRef<"div">["style"];
  /** A test id for the panel. */
  "data-testid"?: string;
}

export interface NavigationMenuLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "children" | "onSelect"> {
  /** The link's text, or (with `asChild`) the element that is the link. */
  children?: ReactNode;
  /** Where the link goes. Not used with `asChild`, where the child element has its own. */
  href?: string;
  /**
   * Marks the page the reader is on (`aria-current`: `"page"`, or the menu's `currentType`), drawn in the menu's `currentVariant` when the link is a top-level item.
   * @default false
   */
  current?: boolean;
  /**
   * Blocks the click and marks the link `aria-disabled`, keeping it in the tab order as `Link` does.
   * @default false
   */
  disabled?: boolean;
  /**
   * Draws the look on the child element (a router's link) instead of an `<a>`.
   * @default false
   */
  asChild?: boolean;
  /** An icon (a component reference) drawn before the text. */
  icon?: PhosphorIcon;
  /** A second line under the text, in a panel: what the link leads to. It is part of the link's name. */
  description?: ReactNode;
  /** The most lines the description takes before it is cut with an ellipsis. Left out, it wraps in full. */
  descriptionLines?: 1 | 2 | 3 | 4;
  /** Called when the person shows intent to follow the link: the pointer has rested on it for a moment, or keyboard focus arrives. Use it to prefetch. It can fire more than once, so keep it idempotent. */
  onIntent?: () => void;
  /** A mark after the text (a count, a "New"), part of the link's name. */
  badge?: ReactNode;
  /**
   * Opens the link in a new tab with an external mark. Worked out from `href` when left out: a full `http(s)://` URL is external.
   */
  external?: boolean;
  /** Called when the link is chosen (a click, or Enter). Call `event.preventDefault()` to keep the panel open. */
  onSelect?: (event: Event) => void;
  /** Extra class names for the link. */
  className?: string;
  /** Inline styles for the link. */
  style?: ComponentPropsWithoutRef<"a">["style"];
  /** The id of the link. */
  id?: string;
  /** A test id for the link. */
  "data-testid"?: string;
  /** Names the link when its text alone does not; it must contain the visible text as whole words, in order. */
  "aria-label"?: string;
  /** The id of an element that names the link. */
  "aria-labelledby"?: string;
  /** The id of an element that describes the link. */
  "aria-describedby"?: string;
}

export interface NavigationMenuGroupProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  /** The group's heading: it names the list of links beneath it. */
  label?: ReactNode;
  /** Makes the heading a link to the group's own page, which closes the panel as any link does. */
  href?: string;
  /** The `NavigationMenu.Link`s of the group. */
  children?: ReactNode;
  /**
   * How many columns the group's links run in, from the width the panel gives it.
   * @default 1
   */
  columns?: 1 | 2 | 3;
  /** Extra class names for the group. */
  className?: string;
  /** Inline styles for the group. */
  style?: ComponentPropsWithoutRef<"div">["style"];
  /** The id of the group. */
  id?: string;
  /** A test id for the group. */
  "data-testid"?: string;
}

export interface NavigationMenuFeatureProps extends Omit<ComponentPropsWithoutRef<"div">, "title" | "onSelect"> {
  /** A picture or other media drawn above the text: an `<img>`, an `Image`. It sets its own height. */
  media?: ReactNode;
  /** The block's heading. */
  title: ReactNode;
  /** The block's text. */
  children?: ReactNode;
  /** Makes the whole block a link to this address, which closes the panel as any link does. Without it the block is plain content. */
  href?: string;
  /** Called when the block is chosen, when it is a link. Call `event.preventDefault()` to keep the panel open. */
  onSelect?: (event: Event) => void;
  /** Extra class names for the block. */
  className?: string;
  /** Inline styles for the block. */
  style?: ComponentPropsWithoutRef<"div">["style"];
  /** The id of the block. */
  id?: string;
  /** A test id for the block. */
  "data-testid"?: string;
}

export interface NavigationMenuFooterProps extends ComponentPropsWithoutRef<"div"> {
  /** What the footer holds: links ("View all"), a help line. */
  children?: ReactNode;
  /** Extra class names for the footer. */
  className?: string;
  /** Inline styles for the footer. */
  style?: ComponentPropsWithoutRef<"div">["style"];
  /** The id of the footer. */
  id?: string;
  /** A test id for the footer. */
  "data-testid"?: string;
}
