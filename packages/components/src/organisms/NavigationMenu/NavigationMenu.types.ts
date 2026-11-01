import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** The size of the links and triggers, on the shared five-step scale (the steps `Menu` and `Navbar`'s links use). */
export type NavigationMenuSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * How the current page's link (and the item whose panel holds it) is marked, beyond `aria-current="page"`, which is always set:
 * `underline` (a brand line under it), `subtle` (a tinted pill with brand-coloured text) or `solid` (a brand fill with the text on
 * it). The names `Navbar` and `Tabs` use.
 */
export type NavigationMenuCurrentVariant = "subtle" | "underline" | "solid";

/**
 * How the menu is drawn: `mega` (a row of triggers whose panels open under them) or `stacked` (a vertical list where each trigger
 * is a disclosure button and its links nest beneath it, for a phone or a side panel).
 */
export type NavigationMenuPresentation = "mega" | "stacked";

/** Where a panel sits under the menu: lined up with its start edge, or centred under it. */
export type NavigationMenuPanelAlign = "start" | "center";

/** The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page. */
export type NavigationMenuDirection = "ltr" | "rtl";

/** The text `NavigationMenu` supplies itself, translatable through the `labels` prop. Nothing here needs a number. */
export interface NavigationMenuLabels {
  /** The name of the `<nav>` landmark, when the menu is not given an `aria-label`. Not used inside a `Navbar`, whose own links landmark names it. @default 'Main' */
  navigation: string;
  /** Read out after an external link's text, in place of a visible cue. @default '(opens in a new tab)' */
  externalLink: string;
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
   * How the menu is drawn — see {@link NavigationMenuPresentation}. A width map (`{ base: "stacked", md: "mega" }`) chooses by
   * screen width, resolved in the browser like `Menu`'s `presentation`. Inside a `Navbar`'s menu panel it is always `stacked`.
   * @default 'mega'
   */
  presentation?: Responsive<NavigationMenuPresentation>;
  /**
   * One panel area, shared by every item and resized between them, or (`false`) a panel under its own item.
   * @default true
   */
  viewport?: boolean;
  /**
   * Where a panel sits — see {@link NavigationMenuPanelAlign}. In the shared panel area it lines up under the whole menu; with
   * `viewport={false}` under its own item.
   * @default 'start'
   */
  panelAlign?: NavigationMenuPanelAlign;
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
   * The reading direction, passed to the primitive and every part around it rather than read from the page. Inside a `Navbar`
   * the bar's `dir` applies.
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
   * Marks the item whose panel holds the current page: tints or underlines the trigger in the menu's `currentVariant`. It sets no
   * `aria-current`, since a button is not a page.
   * @default false
   */
  current?: boolean;
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
  /** The panel's content: `NavigationMenu.Group`s, `NavigationMenu.Link`s and anything else (a featured block). */
  children?: ReactNode;
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
   * Marks the page the reader is on (`aria-current="page"`), drawn in the menu's `currentVariant` when the link is a top-level item.
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
