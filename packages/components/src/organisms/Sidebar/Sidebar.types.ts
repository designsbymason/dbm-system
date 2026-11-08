import type { Breakpoint, SpaceValue } from "@dbm-system/utils";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../../atoms/Button";
import type { DrawerOpenChangeDetails } from "../Drawer";

/**
 * The height of an item, on the same steps as `Navbar`'s links and the `IconButton` heights they follow: `xs` is a dense
 * list, `md` the default, `lg` a roomy one. The expanded width is separate (`width`), and the collapsed rail is as wide as an
 * item of the same step plus the sidebar's padding.
 */
export type SidebarSize = "xs" | "sm" | "md" | "lg";

/**
 * How the sidebar itself is drawn: `outlined` (a surface with a line along its inner edge), `filled` (the same surface with no
 * line), `ghost` (nothing of its own, the items sit on the page) or `floating` (an inset card: the surface set in from the page's edges, with
 * rounded corners, a line all round and a soft shadow). The first three are the names `Card`, `EmptyState` and `Navbar` use for their
 * `variant`.
 */
export type SidebarVariant = "outlined" | "filled" | "ghost" | "floating";

/**
 * How the current page's item (and a group that holds it) is marked, beyond `aria-current="page"`, which is always set:
 * `subtle` (a tinted pill with brand-coloured text), `bar` (a brand line along the item's start edge) or `solid` (a brand fill
 * with the text on it). `bar` is the vertical counterpart of `Navbar`'s `underline`.
 */
export type SidebarCurrentVariant = "subtle" | "bar" | "solid";

/**
 * How an item's `href` is compared with the sidebar's `currentPath`: `exact` (the same path) or `prefix` (the same path, or a page below
 * it, so `/reports` is current at `/reports/sales`).
 */
export type SidebarMatch = "exact" | "prefix";

/** Which edge of the page the sidebar sits against, in the reading direction: `start` is the left in left-to-right text. */
export type SidebarSide = "start" | "end";

/**
 * The width below which the sidebar leaves the page for a menu button and a panel: a breakpoint step (`"md"` is 768px), or
 * `"never"` to keep the column on the page at every width. `"base"` is not an option, since it would mean never.
 */
export type SidebarCollapseBelow = Exclude<Breakpoint, "base"> | "never";

/** The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page. */
export type SidebarDirection = "ltr" | "rtl";

/** What closed (or opened) the phone panel: the same reasons `Drawer` reports. */
export type SidebarMenuChangeDetails = DrawerOpenChangeDetails;

/** The text `Sidebar` supplies itself, translatable through the `labels` prop. Nothing here needs a number. */
export interface SidebarLabels {
  /** The visually hidden text a `Sidebar.Skeleton` announces while the navigation loads. @default 'Loading' */
  loading: string;
  /** The accessible name of a `Sidebar.Nav` that is given no other. @default 'Main' */
  navigation: string;
  /** The accessible name of the collapse button while the sidebar is expanded. @default 'Collapse sidebar' */
  collapse: string;
  /** The accessible name of the collapse button while the sidebar is a rail. @default 'Expand sidebar' */
  expand: string;
  /** The accessible name of the menu button, and the title of the panel that opens. @default 'Menu' */
  menu: string;
  /** The accessible name of the panel's close button. @default 'Close' */
  close: string;
  /** The visually hidden text after an external item's text. @default '(opens in a new tab)' */
  externalLink: string;
}

/**
 * The settings that decide whether the sidebar is a rail and whether the phone panel is open. They are the same on
 * `Sidebar.Provider` and on `Sidebar` itself; a sidebar inside a provider uses the provider's.
 */
export interface SidebarStateProps {
  /**
   * Whether the sidebar is collapsed to a rail of icons (controlled). Pair with `onCollapsedChange`. The phone panel is never a rail.
   */
  collapsed?: boolean;
  /**
   * Whether the sidebar starts as a rail (uncontrolled).
   * @default false
   */
  defaultCollapsed?: boolean;
  /** Called with the new value when the collapse button is pressed or `setCollapsed` is called. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Whether the phone panel is open (controlled). Pair with `onMenuOpenChange`. */
  menuOpen?: boolean;
  /**
   * Whether the phone panel starts open (uncontrolled).
   * @default false
   */
  defaultMenuOpen?: boolean;
  /** Called when the phone panel opens or closes, with what caused it. */
  onMenuOpenChange?: (open: boolean, details: SidebarMenuChangeDetails) => void;
  /**
   * The width below which the sidebar leaves the page for a menu button and a panel (see `SidebarCollapseBelow`).
   * @default 'md'
   */
  collapseBelow?: SidebarCollapseBelow;
  /** Text the sidebar supplies itself, such as the collapse button's name. Merged over the English defaults. */
  labels?: Partial<SidebarLabels>;
}

/** What `useSidebar()` returns: the sidebar's state and the functions that change it. */
export interface SidebarState {
  /** Whether the sidebar you are inside is a rail. Always `false` in the phone panel, which is never one. */
  collapsed: boolean;
  /** Collapses to a rail, or expands. Reports through `onCollapsedChange`. */
  setCollapsed: (collapsed: boolean) => void;
  /** Flips `collapsed`. */
  toggleCollapsed: () => void;
  /**
   * Whether the part calling it is drawn in the phone panel (below `collapseBelow`) and not on the page. The same children are drawn in both, so a
   * part can draw something different on a phone: a shorter header, an extra link, a close hint.
   */
  inPanel: boolean;
  /** Whether the phone panel is open. */
  menuOpen: boolean;
  /** Opens or closes the phone panel. Reports through `onMenuOpenChange`. */
  setMenuOpen: (open: boolean) => void;
}

export interface SidebarProviderProps extends SidebarStateProps {
  /** The page shell: a `Sidebar`, and any `Sidebar.MenuButton` or `Sidebar.Toggle` that sits outside it (in a `Navbar`). */
  children?: ReactNode;
}

export interface SidebarProps extends SidebarStateProps, Omit<ComponentPropsWithoutRef<"div">, "dir" | "children"> {
  /**
   * The sidebar's parts, in reading order: `Sidebar.Header`, `Sidebar.Content` holding a `Sidebar.Nav`, and `Sidebar.Footer`. The
   * same children are drawn on the page and, below `collapseBelow`, in the phone panel.
   */
  children?: ReactNode;
  /**
   * How the sidebar itself is drawn: a surface with a line along its inner edge, the same surface with no line, nothing of its own, or a
   * floating card set in from the page's edges with rounded corners and a shadow.
   * @default 'outlined'
   */
  variant?: SidebarVariant;
  /**
   * The height of an item and its icon and text size, on the same scale as `Navbar`'s links. The rail is as wide as an item of this step plus the
   * sidebar's padding.
   * @default 'md'
   */
  size?: SidebarSize;
  /**
   * How the current item is marked: a tinted pill, a brand line along its start edge, or a brand fill. `aria-current` is set whichever
   * it is, and the look is the same in the phone panel.
   * @default 'subtle'
   */
  currentVariant?: SidebarCurrentVariant;
  /**
   * The path of the page the reader is on (from your router), so each item marks itself: an item whose `href` is that path is current, and a
   * group that holds one is current too, with no `current` written on either. An item's own `current` always wins, and `match="prefix"` on an
   * item also matches the pages below it. Query strings, hashes and trailing slashes are ignored, and an address on another site never
   * matches. Left out, nothing is current until you say so.
   */
  currentPath?: string;
  /**
   * Fully rounded items: each item and group button is a pill, with the current item's tint or fill following the shape. The items round, not the
   * sidebar.
   * @default false
   */
  rounded?: boolean;
  /**
   * The expanded width: a number of pixels or any CSS length (`"18rem"`, `"min(20rem, 30vw)"`). Left out it is the `sidebar.width` token.
   * The rail's width does not change with it.
   */
  width?: number | string;
  /**
   * The width of the phone panel alone, below `collapseBelow`: a number of pixels or any CSS length (`"20rem"`). Left out it is `width`, so the
   * panel and the column on the page match. The drawer keeps a sliver of the page showing on a narrow phone, so the panel is never wider than
   * the window less that.
   */
  panelWidth?: number | string;
  /**
   * Which edge of the page the sidebar sits against: it sets which edge its line is on and which side the phone panel slides in from.
   * @default 'start'
   */
  side?: SidebarSide;
  /**
   * Lets a sidebar collapsed to a rail open as an overlay while the pointer is over it or focus is inside it, so the labels can be read without
   * committing to expand it: the rail keeps its width in the page and the open sidebar is drawn over the content beside it, then closes when the
   * pointer and focus leave. A mouse only (a touch screen has no hover; focus works everywhere). It stays open while a menu opened from it is open.
   * @default false
   */
  peek?: boolean;
  /** Called when the phone panel has finished opening or closing, after its animation. */
  onMenuOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether to close the phone panel when a link in it is pressed, including a router's link that prevents the browser's own navigation.
   * @default true
   */
  closeMenuOnNavigate?: boolean;
  /**
   * Keeps one group open at a time among the groups that share a parent: opening one closes the others beside it. A group that starts open
   * because it holds the current page is closed when another is opened.
   * @default false
   */
  exclusive?: boolean;
  /**
   * An element to draw the phone panel inside instead of the document body, so it stays within a frame. Mainly for demos and tests.
   */
  menuContainer?: HTMLElement | null;
  /**
   * Keeps the sidebar in view while the page scrolls: it sticks to the top of the page (below `stickyOffset`) and is as tall as the
   * rest of the window, scrolling its own content.
   * @default false
   */
  sticky?: boolean;
  /**
   * How far from the top of the page a sticky sidebar sticks: a step of the spacing scale, or any CSS length for a header whose height is not a
   * step (`"var(--page-shell-header-height, 0px)"` under a `PageShell` header, which publishes its measured height). It is the height of a
   * sticky `Navbar` above the sidebar, which the sidebar then leaves clear and shortens itself by.
   * @default 0
   */
  stickyOffset?: SpaceValue | string;
  /**
   * The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page, or wrap the page in a `DirectionProvider` once and leave
   * this out. Left out, it is the nearest provider's direction, else left to right.
   * @default 'ltr'
   */
  dir?: SidebarDirection;
  /** Standard DOM id. Avoid it: the sidebar's children are drawn twice while the phone panel is open. */
  id?: string;
  /** Additional CSS classes, on the sidebar's root. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** The top of the sidebar: a brand, a workspace switcher. Read `useSidebar().collapsed` to draw a smaller version in the rail. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarContentProps extends HTMLAttributes<HTMLDivElement> {
  /** The middle of the sidebar, which scrolls on its own when its navigation is taller than the room. Holds `Sidebar.Nav`s. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** The bottom of the sidebar, which stays in view: an account menu, a help link. Read `useSidebar().collapsed` to draw a smaller version in the rail. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarNavProps extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  /** A list of `Sidebar.Item`s, `Sidebar.Group`s, `Sidebar.Section`s and `Sidebar.Separator`s. */
  children?: ReactNode;
  /** The navigation's accessible name; defaults to `labels.navigation` ("Main"). Give each `Sidebar.Nav` its own, so they are told apart. */
  "aria-label"?: string;
  /** Names the navigation from an element on the page instead of a string. */
  "aria-labelledby"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarSectionProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
  /** The section's heading, drawn above its items. In the rail it is hidden, and a line separates the sections; it still names the group. */
  label: ReactNode;
  /** A control drawn at the end of the heading, such as an "add" `IconButton`: as `Sidebar.Item`'s `action`. Not drawn in the rail. */
  action?: ReactNode;
  /**
   * Makes the heading a button that folds the section's list away and brings it back, with a caret. The rail has no headings, so it always shows
   * every list. The state is kept for the whole sidebar, so a fold on the page is the same in the phone panel.
   * @default false
   */
  collapsible?: boolean;
  /** Whether a collapsible section is open (controlled). Pair with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether a collapsible section starts open (uncontrolled).
   * @default true
   */
  defaultOpen?: boolean;
  /** Called with the new value when a collapsible section's heading is pressed. */
  onOpenChange?: (open: boolean) => void;
  /**
   * A name for this section's fold, kept for the whole sidebar so the page and the phone panel share it. Left out, it is the label, which is enough
   * unless two sections have the same label, or the label is not plain text (then the page's copy and the panel's keep a fold each).
   */
  value?: string;
  /** The section's `Sidebar.Item`s and `Sidebar.Group`s. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /** The item's text. In the rail it is hidden and shown in a tooltip, and it stays the item's accessible name. With `asChild`, the child's own content instead. */
  children?: ReactNode;
  /** Where the item goes. Without one, the item is a `<button>` (an action, such as "New project"). With `asChild`, put it on the child instead. */
  href?: string;
  /**
   * An icon before the text, a component reference. It is all the rail shows, so give every item one; without it the rail shows the text's
   * first character. It follows the text's colour, so it tracks hover and the current look.
   */
  icon?: PhosphorIcon;
  /**
   * A second line under the text, in smaller, quieter type: what the page is for. It describes the item (the link's `aria-describedby`) rather than
   * naming it, so the item's name stays short, and it is cut with an ellipsis like the text. It is not shown in the rail.
   */
  description?: ReactNode;
  /**
   * What to show after the text, such as a count: plain text, drawn in `Badge`'s solid brand look (its subtle look on a current item drawn as a brand fill, where a solid pill would vanish), or a `Badge` you pass, drawn as written.
   * Pass the `Badge` element itself. It is part of the item's name, so a count is read with it ("Inbox 3"). In the rail it becomes a small
   * mark on the icon.
   */
  badge?: ReactNode;
  /**
   * A control drawn at the end of the item's row, outside the link: an `IconButton` for "add" or a menu's trigger. It is shown while the row is
   * hovered or has focus (always on a touch screen and in the phone panel), the row leaves room for it, and the buttons in it default to ghost,
   * neutral and `xs`. It is not drawn in the rail. It is a sibling of the link, never inside it, so it stays a valid, separate control.
   */
  action?: ReactNode;
  /**
   * Marks the item as leading off the site: it opens in a new tab with `rel="noopener noreferrer"`, and gets a trailing icon and a
   * visually hidden "(opens in a new tab)". Worked out from `href` when left out (an `http(s)://` or `//` address).
   */
  external?: boolean;
  /**
   * Marks the item as the page the reader is on: `aria-current="page"` and the sidebar's `currentVariant` look. Left out, it is worked out from
   * the sidebar's `currentPath` and this item's `href` (never current when the sidebar has none); `true` or `false` here always wins.
   */
  current?: boolean;
  /**
   * How `href` is compared with the sidebar's `currentPath`: the same path, or also any page below it. Has no effect when `current` is set or
   * the sidebar has no `currentPath`.
   * @default 'exact'
   */
  match?: SidebarMatch;
  /**
   * Makes the item inert: `aria-disabled` plus a blocked click, and it stays in the tab order, as `Link` does.
   * @default false
   */
  disabled?: boolean;
  /**
   * Renders as a single provided child element (via Radix `Slot`) instead of the built-in `<a>` or `<button>`, to use a router's link.
   * @default false
   */
  asChild?: boolean;
  /** Names the item when its content is only an icon. */
  "aria-label"?: string;
  /** Standard DOM id. Avoid it: the sidebar's items are on the page twice while the phone panel is open. */
  id?: string;
  /** Additional CSS classes, on the item's element. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarGroupProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /** The group's text, on the button that opens it. In the rail it is the title of the flyout and the button's tooltip. */
  label: ReactNode;
  /** The group's `Sidebar.Item`s, and `Sidebar.Group`s nested in it (up to three levels). */
  children?: ReactNode;
  /** An icon before the label. It is all the rail shows, so give every top-level group one. */
  icon?: PhosphorIcon;
  /**
   * A badge for the group, shown while its items are out of sight: after the label while the group is shut, and on the icon in the rail, where
   * its items are in a flyout. Anything `Sidebar.Item`'s `badge` takes. Left out, it is the sum of the numeric `badge`s of the items written inside
   * it (none, when there is no number among them), so a group of inboxes shows the unread total; `null` shows nothing.
   */
  badge?: ReactNode;
  /** A control drawn at the end of the group's button, outside it, such as an "add" `IconButton`: as `Sidebar.Item`'s `action`. Not drawn in the rail. */
  action?: ReactNode;
  /**
   * Marks the group as holding the current page: the `currentVariant` look on its button while it is collapsed, and it starts open.
   * It has no `aria-current`, since a button is not a page. Left out, it is worked out from the sidebar's `currentPath` and the `href` of the
   * items written inside it; `true` or `false` here always wins.
   */
  current?: boolean;
  /** Whether the group is open (controlled). Pair with `onOpenChange`. Ignored in the rail, where the group is a flyout. */
  open?: boolean;
  /**
   * Whether the group starts open (uncontrolled). Left out it starts open when `current`.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called with the new value when the group's button is pressed. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Makes the group's button inert: a native `disabled` button, so it leaves the tab order, unlike a disabled item.
   * @default false
   */
  disabled?: boolean;
  /**
   * A name for this group's open state, kept for the whole sidebar so the page and the phone panel share it. Left out, it is the label (and the
   * labels of the groups it is inside), which is enough unless two groups beside each other have the same label.
   */
  value?: string;
  /** Standard DOM id on the group's button. */
  id?: string;
  /** Additional CSS classes, on the group's button. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarSeparatorProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarSkeletonProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
  /**
   * How many placeholder rows to draw. Each is the height of an item, with an icon and a line of text whose width varies from row to row.
   * @default 5
   */
  rows?: number;
  /**
   * Whether the placeholder is pulsing. Turn it off for a dense screen with many loading regions; the reduced-motion preference turns it off anyway.
   * @default true
   */
  animated?: boolean;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarToggleProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /**
   * The icon while the sidebar is expanded, on the button that collapses it. Left out it is a caret pointing toward the edge the sidebar sits against
   * (mirrored for `side="end"` and right-to-left text), so give one that does not depend on direction (a sidebar-simple icon, say) or mirror it yourself.
   */
  collapseIcon?: PhosphorIcon;
  /**
   * The icon while the sidebar is a rail, on the button that expands it. Left out it is a caret pointing away from the edge the sidebar sits against.
   */
  expandIcon?: PhosphorIcon;
  /**
   * The button's look: any `IconButton` variant, so it can match the icon buttons beside it.
   * @default 'ghost'
   */
  variant?: ButtonVariant;
  /**
   * The button's colour family: `brand` or `neutral`.
   * @default 'neutral'
   */
  tone?: ButtonTone;
  /** The button's size: the same scale as `IconButton`. Defaults to the sidebar's own `size`. */
  size?: ButtonSize;
  /** The button's accessible name. Defaults to `labels.collapse` or `labels.expand`, whichever the press would do. */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarMenuButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /**
   * The icon, a component reference.
   * @default ListIcon
   */
  icon?: PhosphorIcon;
  /**
   * The button's look: any `IconButton` variant, so it can match the icon buttons beside it.
   * @default 'ghost'
   */
  variant?: ButtonVariant;
  /**
   * The button's colour family: `brand` or `neutral`, so it can match the icon buttons beside it.
   * @default 'brand'
   */
  tone?: ButtonTone;
  /** The button's size, on the same scale as `IconButton`. Defaults to the sidebar's own `size`, or `md` outside one. */
  size?: ButtonSize;
  /** The button's accessible name. Defaults to `labels.menu` ("Menu"). */
  "aria-label"?: string;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

export interface SidebarAccountProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type" | "name"> {
  /** The account's or workspace's name, beside its avatar. In the rail it is hidden and is the button's tooltip and name. */
  name: string;
  /** A quieter line under the name, such as an email address or a plan. Not shown in the rail. */
  description?: string;
  /** What to draw in place of the avatar: a workspace logo, an icon. Left out, an `Avatar` made from `name` (and `src`). */
  avatar?: ReactNode;
  /** The image for the default avatar. Left out, it shows the name's initials. */
  src?: string;
  /**
   * Which side of the button its menu opens toward. Left out, it opens above the button on the page and toward the page in the rail, which is
   * right for a footer; give `"bottom"` for one in the header.
   */
  menuSide?: "top" | "right" | "bottom" | "left";
  /** The menu's items (`Menu.Item`s, `Menu.Separator`s…). Left out, the button opens nothing, so put your own action on it with `onClick`. */
  children?: ReactNode;
  /** Standard DOM id. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}
