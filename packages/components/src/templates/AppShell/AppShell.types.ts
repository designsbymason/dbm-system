import type { Breakpoint, Responsive, SpaceValue } from "@dbm-system/utils";
import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../../atoms/Button";
import type { ContainerSize } from "../../atoms/Container";
import type { SidebarStateProps } from "../../organisms/Sidebar";

/**
 * What scrolls. `content` fits the shell to the height of the window, so the sidebar and the header never move and only `AppShell.Main`
 * scrolls. `page` lets the page scroll as a whole: the shell is at least as tall as the window, and it keeps the header and the sidebar in
 * view as the page scrolls (so they need no `sticky` of their own).
 */
export type AppShellScroll = "content" | "page";

/** Which edge of the page the sidebar column sits against, in the reading direction: `start` is the left in left-to-right text. */
export type AppShellSidebarSide = "start" | "end";

/** The reading direction. Not read from the page: pass `"rtl"` on a right-to-left page. */
export type AppShellDirection = "ltr" | "rtl";

/**
 * How far the header reaches. `content` stops at the sidebar, so the sidebar is a full-height column beside it. `full` runs across the whole
 * top of the shell, over the sidebar, which then starts below it.
 */
export type AppShellHeaderSpan = "content" | "full";

/**
 * The width below which the aside leaves the page: a breakpoint step (`"lg"` is 1024px), or `"never"` to keep it on the page at every
 * width. `"base"` is not an option, since it would mean never.
 */
export type AppShellAsideCollapseBelow = Exclude<Breakpoint, "base"> | "never";

/**
 * What the aside becomes below its collapse step: `drawer` (opened from `AppShell.AsideToggle`, with the same children drawn in a
 * `Drawer`) or `hidden` (not drawn at all, and out of the accessibility tree).
 */
export type AppShellAsideCollapseTo = "drawer" | "hidden";

/**
 * The width below which the sidebar is a rail of icons on its own: a breakpoint step, or `"never"` to leave the rail to the reader. Between this
 * and the width where the sidebar leaves the page for a drawer (`collapseBelow`) the shell collapses it, and above it expands it again.
 */
export type AppShellRailBelow = Exclude<Breakpoint, "base"> | "never";

/** The text `AppShell.Sidebar`'s resize handle supplies itself, translatable through its `labels`. */
export interface AppShellSidebarLabels {
  /** The resize handle's accessible name. @default 'Resize sidebar' */
  resize: string;
}

/** The element `AppShell.Header` renders: a plain `div`, or a real `<header>` for a header that does not hold a `Navbar`. */
export type AppShellHeaderElement = "div" | "header";

/** The text the aside's drawer supplies itself, translatable through `AppShell.Aside`'s `labels`. */
export interface AppShellAsideLabels {
  /** The title of the drawer the aside becomes below its collapse step. @default 'Details' */
  title: string;
  /** The accessible name of the drawer's close button. @default 'Close' */
  close: string;
}

/** The text `AppShell.AsideToggle` supplies itself, translatable through its `labels`. */
export interface AppShellAsideToggleLabels {
  /** The toggle's accessible name. @default 'Show details' */
  open: string;
}

/** The text `AppShell.SkipLink` supplies itself, translatable through its `labels`. */
export interface AppShellSkipLinkLabels {
  /** The link's text when it is given no children. @default 'Skip to content' */
  skipToContent: string;
}

/** What `useAppShell()` returns: how the shell is set up and the state the app may want to read or change. */
export interface AppShellState {
  /** What scrolls: `content` (only the main area) or `page`. */
  scroll: AppShellScroll;
  /**
   * The header's height in pixels while `scroll="page"` and the header is on the page, and `0` otherwise (a server render, the first client
   * render, `scroll="content"`, no header). The same number is the `--app-shell-header-height` custom property on the shell, for a
   * sticky element inside the main area that must stick below the header (`top: var(--app-shell-header-height, 0px)`).
   */
  headerHeight: number;
  /** The banner's height in pixels while `scroll="page"` and a banner is on the page, and `0` otherwise. Also `--app-shell-banner-height`. */
  bannerHeight: number;
  /**
   * The footer's height in pixels while `scroll="page"` and a sticky footer is on the page, and `0` otherwise. Also `--app-shell-footer-height`,
   * for a bar in the main area that must stop above it.
   */
  footerHeight: number;
  /** Whether the sidebar is collapsed to a rail, whoever collapsed it: the reader, `railBelow`, or what was remembered. */
  collapsed: boolean;
  /** Collapses the sidebar to a rail, or expands it. Reports through `onCollapsedChange`. */
  setCollapsed: (collapsed: boolean) => void;
  /** The sidebar's width in pixels once it has been resized (or given one), and `undefined` while it is at its own width. */
  sidebarWidth: number | undefined;
  /** Sets the sidebar's width in pixels, or `undefined` to give it back its own width. Reports through `onSidebarWidthChange`. */
  setSidebarWidth: (width: number | undefined) => void;
  /** Whether the content (`scroll="content"`: the main area; `scroll="page"`: the page) has been scrolled down from its top. */
  scrolled: boolean;
  /** Whether there is more content below what is in view. */
  moreBelow: boolean;
  /** Whether the aside's drawer is open. Always `false` while the aside is on the page. */
  asideOpen: boolean;
  /** Opens or closes the aside's drawer. Reports through `onAsideOpenChange`. */
  setAsideOpen: (open: boolean) => void;
}

/** Props every slot of the shell accepts on top of its own native element's. */
interface AppShellPartBase {
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

export interface AppShellProps
  extends SidebarStateProps,
    Omit<ComponentPropsWithoutRef<"div">, "dir" | "children">,
    AppShellPartBase {
  /**
   * The shell's slots: `AppShell.SkipLink`, `AppShell.Banner`, `AppShell.Header`, `AppShell.Sidebar`, `AppShell.Main` (holding an optional `AppShell.Content`), `AppShell.Aside` and `AppShell.Footer`. The shell places each in its own area, so
   * the markup order does not change the layout, but it is the keyboard's tab order: put `AppShell.Header` first, so the skip link is the
   * first stop and the sidebar's links come after it. Only `AppShell.Main` is needed.
   */
  children?: ReactNode;
  /**
   * What scrolls: only the main area while the sidebar and header stay put, or the page as a whole.
   * @default 'content'
   */
  scroll?: AppShellScroll;
  /**
   * Which edge of the page the sidebar column sits against. Set the sidebar's own `side` to match, so its line and its phone panel are on the
   * same edge.
   * @default 'start'
   */
  sidebarSide?: AppShellSidebarSide;
  /**
   * How far the header reaches: `content` stops at the sidebar (a full-height sidebar beside it), `full` runs across the top over the sidebar,
   * which starts below it.
   * @default 'content'
   */
  headerSpan?: AppShellHeaderSpan;
  /**
   * The width below which `AppShell.Aside` leaves the page: a breakpoint step, or `"never"` to keep it on the page at every width. The
   * `AppShell.AsideToggle` button shows below the same width.
   * @default 'lg'
   */
  asideCollapseBelow?: AppShellAsideCollapseBelow;
  /**
   * What the aside becomes below `asideCollapseBelow`: a drawer opened from `AppShell.AsideToggle`, or nothing at all.
   * @default 'drawer'
   */
  asideCollapseTo?: AppShellAsideCollapseTo;
  /** Whether the aside's drawer is open (controlled). Pair with `onAsideOpenChange`. */
  asideOpen?: boolean;
  /**
   * Whether the aside's drawer starts open (uncontrolled).
   * @default false
   */
  defaultAsideOpen?: boolean;
  /** Called when the aside's drawer opens or closes, with the new value. */
  onAsideOpenChange?: (open: boolean) => void;
  /**
   * A value that changes when the reader goes to another page, such as the router's pathname. When it changes after the first render, the
   * shell moves keyboard focus to `AppShell.Main`, scrolls it back to the top (`scroll="content"`) and, with `pageTitle`, announces the
   * new page. Never on the first render, and nothing happens while it is left out.
   */
  pageKey?: string | number;
  /**
   * The new page's title, announced politely to a screen reader when `pageKey` changes. Left out, the focus still moves and nothing is said.
   */
  pageTitle?: string;
  /**
   * The width below which the shell collapses the sidebar to a rail of icons by itself, between the phone's drawer (`collapseBelow`) and the
   * desktop: a breakpoint step, or `"never"` to leave it to the reader. Above the step it expands the sidebar again. The reader's own toggle
   * still works anywhere and holds until the window crosses the step again. Changes the sidebar's collapsed state only, so `collapsed` and
   * `onCollapsedChange` report it like any other change.
   * @default 'never'
   */
  railBelow?: AppShellRailBelow;
  /**
   * Remembers the reader's layout, the collapsed state and the sidebar's width, in `localStorage` under this key, and restores it after the
   * page loads. Only the part you leave uncontrolled is stored (a `collapsed` or `sidebarWidth` you pass is yours to keep). The saved layout
   * is applied once the page is on screen, so a server render and the first client render agree. Storage that is unavailable is ignored.
   */
  persistKey?: string;
  /**
   * The sidebar's width in pixels (controlled), for a sidebar with `resizable`. Pair with `onSidebarWidthChange`. `undefined` leaves the
   * sidebar at its own width.
   */
  sidebarWidth?: number;
  /** The sidebar's width in pixels to start at (uncontrolled), for a sidebar with `resizable`. */
  defaultSidebarWidth?: number;
  /** Called with the new width in pixels when the reader resizes the sidebar, and with `undefined` when they reset it. */
  onSidebarWidthChange?: (width: number | undefined) => void;
  /**
   * Shows a shadow under the header while the content is scrolled down from its top, and over the footer while there is more below, so
   * the reader can see that the page continues. A line is always drawn between them and the content. Off, the shadows are not drawn.
   * @default true
   */
  scrolledEdge?: boolean;
  /**
   * The reading direction of everything inside. Not read from the page: pass `"rtl"` on a right-to-left page. Components with their own `dir`
   * prop (`Sidebar`, `Menu`, `Tabs`) still need it passed to them.
   * @default 'ltr'
   */
  dir?: AppShellDirection;
}

export interface AppShellSidebarProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, AppShellPartBase {
  /** The `Sidebar`. The column is as wide as the sidebar and is absent from the page while the sidebar is in its phone panel. */
  children?: ReactNode;
  /**
   * Puts a handle on the column's inner edge that the reader drags, or moves with the arrow keys, to set the sidebar's width (Home and End jump
   * to the least and the most, a double press gives it back its own width). The width is the shell's (`sidebarWidth`, `persistKey`), set on the
   * column as `--sidebar-width`, so leave `width` off the `Sidebar` inside: its own `width` would win. There is no handle while the sidebar is
   * a rail or in its phone panel.
   * @default false
   */
  resizable?: boolean;
  /**
   * The least width a resize reaches: a number of pixels or a CSS length in `rem` or `px`.
   * @default '12rem'
   */
  minWidth?: number | string;
  /**
   * The most width a resize reaches: a number of pixels or a CSS length in `rem` or `px`.
   * @default '28rem'
   */
  maxWidth?: number | string;
  /** Text the resize handle supplies itself, namely its accessible name. Merged over the English defaults. */
  labels?: Partial<AppShellSidebarLabels>;
}

export interface AppShellHeaderProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, AppShellPartBase {
  /**
   * The element to render. A plain `div` by default, since a `Navbar` draws the page's `<header>` banner itself and a second one around it
   * would nest two. Pass `"header"` for a header built without a `Navbar`, so the page still has its banner landmark.
   * @default 'div'
   */
  as?: AppShellHeaderElement;
  /** The `Navbar`, which is the page's banner landmark and holds the skip link and the menu button. */
  children?: ReactNode;
}

export interface AppShellMainProps extends Omit<ComponentPropsWithoutRef<"main">, "children">, AppShellPartBase {
  /**
   * The page's content. The one `<main>` landmark, and the target of the skip link. With `scroll="content"` it scrolls on its own, and
   * while it does it is a tab stop (with a focus ring) so the keyboard can scroll it.
   */
  children?: ReactNode;
  /**
   * The id the skip link points at: `Navbar.SkipLink` links to `#main` unless you give it another `href`.
   * @default 'main'
   */
  id?: string;
}

export interface AppShellFooterProps extends Omit<ComponentPropsWithoutRef<"footer">, "children">, AppShellPartBase {
  /**
   * Keeps the footer at the bottom of the window while the page scrolls (`scroll="page"`), for a bar of actions that must stay in reach, such as
   * Save and Cancel. It clears a home indicator. Nothing changes with `scroll="content"`, where the footer is already outside the scrolling.
   * @default false
   */
  sticky?: boolean;
  /** The page's footer: the `contentinfo` landmark, below the main area and outside its scrolling. */
  children?: ReactNode;
}

export interface AppShellAsideProps extends Omit<ComponentPropsWithoutRef<"aside">, "children">, AppShellPartBase {
  /**
   * The aside's content: a detail pane, an inspector, an activity feed, a table of contents. The same children are drawn on the page and,
   * below `asideCollapseBelow` with `asideCollapseTo="drawer"`, in the drawer.
   */
  children?: ReactNode;
  /**
   * The width of the column and of the drawer: a number of pixels or any CSS length (`"24rem"`). Left out it is the `app-shell.aside-width`
   * token. The drawer is never wider than the window less the sliver of the page the drawer keeps showing.
   */
  width?: number | string;
  /**
   * The aside is a `complementary` landmark, so name it when the page has another one ("Details", "On this page"). It is also the drawer's
   * title when `labels.title` is not given.
   */
  "aria-label"?: string;
  /** The id of a visible element that names the aside, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Text the aside's drawer supplies itself, such as its title and its close button's name. Merged over the English defaults. */
  labels?: Partial<AppShellAsideLabels>;
  /** An element to draw the drawer inside instead of the document body, so it stays within a frame. Mainly for demos and tests. */
  drawerContainer?: HTMLElement | null;
}

export interface AppShellAsideToggleProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  /**
   * The icon, a component reference.
   * @default SidebarSimpleIcon
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
  /**
   * The button's size, on the same scale as `IconButton`.
   * @default 'md'
   */
  size?: ButtonSize;
  /** The button's accessible name. Defaults to `labels.open` ("Show details"). */
  "aria-label"?: string;
  /** Text the button supplies itself, namely its accessible name. Merged over the English defaults. */
  labels?: Partial<AppShellAsideToggleLabels>;
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

export interface AppShellSkipLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "children"> {
  /** The link's text. Left out it is `labels.skipToContent` ("Skip to content"). */
  children?: ReactNode;
  /**
   * Where the link goes: the id of the element to skip to, which is `AppShell.Main`'s by default.
   * @default '#main'
   */
  href?: string;
  /** Text the link supplies itself, namely its words when it has no children. Merged over the English defaults. */
  labels?: Partial<AppShellSkipLinkLabels>;
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

export interface AppShellBannerProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, AppShellPartBase {
  /** The banner's content: an announcement, a maintenance notice, a trial reminder. Usually an `Alert`. */
  children?: ReactNode;
  /**
   * Keeps the banner at the top of the window while the page scrolls (`scroll="page"`); the header sticks below it. Off, the banner scrolls away
   * and the header sticks at the top. Nothing changes with `scroll="content"`, where the banner is always in view above the header.
   * @default false
   */
  sticky?: boolean;
}

export interface AppShellContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, AppShellPartBase {
  /** The page's content. */
  children?: ReactNode;
  /**
   * The widest the content gets, on the same steps as `Container`, centred in the main area. `full` is no limit.
   * @default 'full'
   */
  size?: ContainerSize;
  /**
   * Padding at the start and end, on the spacing scale: one step, or a map keyed by breakpoint (`{ base: 4, md: 6, lg: 8 }`).
   * @default { base: 4, md: 6, lg: 8 }
   */
  paddingInline?: Responsive<SpaceValue>;
  /**
   * Padding above and below, on the spacing scale.
   * @default 6
   */
  paddingBlock?: SpaceValue;
}
