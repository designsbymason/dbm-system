import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ButtonSize, ButtonTone, ButtonVariant } from "../../atoms/Button";
import type { ContainerSize } from "../../atoms/Container";
import type { Breakpoint, Responsive, SpaceValue } from "@dbm-system/utils";

/** Which way the shell reads. */
export type PageShellDirection = "ltr" | "rtl";

/** The text the skip link supplies itself. */
export interface PageShellSkipLinkLabels {
  /** The link's text when it is given no children. @default 'Skip to content' */
  skipToContent: string;
}

/** Where focus goes when the page changes: the main area, or the page's heading (the first `h1` in the main area). */
export type PageShellFocusTarget = "main" | "heading";

/** The text the shell supplies itself. */
export interface PageShellLabels {
  /** What a screen reader hears, politely, when the shell is `navigating`. @default 'Loading' */
  loading: string;
}

/** The text the main area supplies itself. */
export interface PageShellMainLabels {
  /** What a screen reader hears, politely, when the main area becomes busy. @default 'Loading' */
  loading: string;
}

/** How far the width presets of `PageShell.Content` reach: a reading page, a dashboard, a page that fills the window. */
export type PageShellContentWidth = "reading" | "dashboard" | "full";

/**
 * The width below which the aside leaves its column: a breakpoint step (`"lg"` is 1024px), or `"never"` to keep it beside the page at every width.
 * `"base"` is not an option, since it would mean never.
 */
export type PageShellAsideCollapseBelow = Exclude<Breakpoint, "base"> | "never";

/**
 * What the aside becomes below its collapse step: `stack` drops it under the page as a block, in the order it is written, with no state; `drawer`
 * takes it off the page and draws its children in a `Drawer` opened from `PageShell.AsideToggle`.
 */
export type PageShellAsideCollapse = "stack" | "drawer";

/** The text the aside's drawer supplies itself. */
export interface PageShellAsideLabels {
  /** The title of the drawer the aside becomes below its collapse step, when the aside has no `aria-label`. @default 'Details' */
  title: string;
  /** The accessible name of the drawer's close button. @default 'Close' */
  close: string;
}

/** The text `PageShell.AsideToggle` supplies itself. */
export interface PageShellAsideToggleLabels {
  /** The toggle's accessible name. @default 'Show details' */
  open: string;
}

/** Props every part of the shell accepts on top of its own native element's. */
interface PageShellPartBase {
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

// Every prop is declared here, in the order the Docs read, and not inherited: the Controls panel lists a type's inherited props before its own.
export interface PageShellProps extends Omit<ComponentPropsWithoutRef<"div">, "dir" | "children"> {
  /**
   * The shell's parts and your header, in the order you want them on the page, which is the keyboard's tab order: `PageShell.SkipLink` first, then
   * `PageShell.Banner` if there is one, your header (a `Navbar`, or any header of your own: the shell does not wrap it, so it sticks by its own
   * means), `PageShell.Main` (holding a `PageShell.Content`) and `PageShell.Footer`. Only `PageShell.Main` is needed.
   */
  children?: ReactNode;
  /**
   * The router's page, usually its pathname. When it changes, focus moves to the main area, so the keyboard starts at the new page's top and a
   * screen reader is told where it is, and `pageTitle` is announced. Nothing happens on the first render, or while this is left out.
   */
  pageKey?: string | number;
  /** The new page's title, announced politely after `pageKey` changes. */
  pageTitle?: string;
  /**
   * Keeps the browser tab's title (`document.title`) in step with `pageTitle`, so a router does not have to. `true` sets it to `pageTitle`; a
   * function builds the whole title from it (`(title) => `${title} · Acme``). The title the document had is put back when the shell unmounts.
   * Nothing happens while `pageTitle` is left out.
   * @default false
   */
  documentTitle?: boolean | ((pageTitle: string) => string);
  /**
   * Where focus goes after `pageKey` changes: `main` (the main area, the default) or `heading`, the first `h1` inside it, so the keyboard starts at the
   * page's own title. With no `h1` it is the main area. The title is announced either way.
   * @default 'main'
   */
  focusTarget?: PageShellFocusTarget;
  /**
   * Scrolls the window to its top, instantly, when `pageKey` changes, for an app whose router does not. Nothing happens on the first render.
   * @default false
   */
  scrollToTopOnChange?: boolean;
  /**
   * The app is moving between pages: a loading bar along the top of the window, above the header, and a polite "Loading" announcement. For the time
   * a router takes to arrive at the next page; `busy` on `PageShell.Main` is for a page that is reloading its own content.
   */
  navigating?: boolean;
  /** Text the shell supplies itself, namely what is announced while `navigating`. Merged over the English defaults. */
  labels?: Partial<PageShellLabels>;
  /**
   * Whether the aside's drawer is open (controlled), for an aside with `collapse="drawer"` below its collapse step. Always `false` while the aside is
   * on the page.
   */
  asideOpen?: boolean;
  /**
   * Whether the aside's drawer starts open (uncontrolled).
   * @default false
   */
  defaultAsideOpen?: boolean;
  /** Called with the drawer's next state when it opens or closes (the toggle, a close key, a press outside, the window growing past the step). */
  onAsideOpenChange?: (open: boolean) => void;
  /**
   * The reading direction of everything inside. The shell sets it on its own element and provides it to everything inside. Left out, it is the
   * nearest `DirectionProvider`'s, else left to right.
   * @default "the provider's, else 'ltr'"
   */
  dir?: PageShellDirection;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Standard DOM id. */
  id?: string;
  /**
   * Test identifier for automated testing (e.g. Testing Library's `getByTestId`, Playwright/Cypress selectors).
   * Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.
   */
  "data-testid"?: string;
}

/** The properties of `PageShell.SkipLink`: a link, out of sight until it takes keyboard focus, that skips the header to the main area. */
export interface PageShellSkipLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "children">, PageShellPartBase {
  /** The link's text. Left out, `labels.skipToContent`. */
  children?: ReactNode;
  /**
   * Where the link goes: the main area's id.
   * @default '#main'
   */
  href?: string;
  /** The words the link supplies itself. */
  labels?: Partial<PageShellSkipLinkLabels>;
}

/** The properties of `PageShell.Banner`: a notice above the header that scrolls away with the page. */
export interface PageShellBannerProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageShellPartBase {
  /** The notice: an `Alert` with `banner`, or any content. */
  children?: ReactNode;
}

/** The properties of `PageShell.Body`: the page's width and padding around `PageShell.Main` and `PageShell.Aside`, side by side. */
export interface PageShellBodyProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageShellPartBase {
  /** `PageShell.Main` and `PageShell.Aside`, in the order they read: the layout follows it, so an aside written first is at the start. */
  children?: ReactNode;
  /**
   * The width the page is kept to, by what it is: `reading`, `dashboard` or `full`. An explicit `size` replaces it.
   */
  width?: PageShellContentWidth;
  /**
   * The widest the body gets, on the same steps as `Container`, centred. `full` is no limit.
   * @default 'xl'
   */
  size?: ContainerSize;
  /**
   * Padding at the start and end, on the spacing scale: one step, or a map keyed by breakpoint.
   * @default 4
   */
  paddingInline?: Responsive<SpaceValue>;
  /**
   * Padding above and below, on the spacing scale.
   * @default 6
   */
  paddingBlock?: SpaceValue;
}

/** The properties of `PageShell.Aside`: a complementary column beside the page. */
export interface PageShellAsideProps extends Omit<ComponentPropsWithoutRef<"aside">, "children"> {
  /**
   * The aside's content: a table of contents, filters, related links, a details panel. The same children are drawn beside the page and, below
   * `collapseBelow` with `collapse="drawer"`, in the drawer.
   * With `collapse="drawer"` they are drawn twice while the drawer is open (in the hidden column and in the drawer), so keep ids and local state out of them.
   */
  children?: ReactNode;
  /**
   * The width of the column and of the drawer: a number of pixels or any CSS length (`"24rem"`). Left out it is the `app-shell.aside-width` token.
   */
  width?: number | string;
  /**
   * Keeps the aside in view, under the header, while the page scrolls, and lets it scroll inside itself when it is taller than the window (a tab stop
   * while it does). Only beside the page: stacked under it, the aside scrolls with it.
   * @default false
   */
  sticky?: boolean;
  /**
   * How far from the top of the window a sticky aside sticks, a CSS length. The default is the height of the header as the shell measures it
   * (`--page-shell-header-height`, the first direct `<header>` while it sticks), so the aside sticks under it; a header whose height changes (rows at the
   * start that scroll away, `hideOnScroll`) is the app's to measure and pass here.
   * @default 'var(--page-shell-header-height, 0px)'
   */
  stickyOffset?: string;
  /**
   * What the aside becomes below `collapseBelow`: dropped under the page (`stack`), or a drawer opened from `PageShell.AsideToggle`.
   * @default 'stack'
   */
  collapse?: PageShellAsideCollapse;
  /**
   * The width below which the aside leaves its column, a breakpoint step; `"never"` keeps it beside the page at every width.
   * @default 'lg'
   */
  collapseBelow?: PageShellAsideCollapseBelow;
  /** Text the aside's drawer supplies itself, such as its title and its close button's name. Merged over the English defaults. */
  labels?: Partial<PageShellAsideLabels>;
  /** An element to draw the drawer inside instead of the document body, so it stays within a frame. Mainly for demos and tests. */
  drawerContainer?: HTMLElement | null;
  /**
   * The aside is a `complementary` landmark, so name it ("On this page", "Related"). It is also the drawer's title when given. A development warning
   * says so when neither this nor `aria-labelledby` is given.
   */
  "aria-label"?: string;
  /** The id of a visible element that names the aside, in place of `aria-label`. */
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

/** The properties of `PageShell.AsideToggle`: the button that opens the aside's drawer. */
export interface PageShellAsideToggleProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
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
  /** The button's colour family: `brand` or `neutral`. */
  tone?: ButtonTone;
  /**
   * The button's size, on the same scale as `IconButton`.
   * @default 'md'
   */
  size?: ButtonSize;
  /** The button's accessible name. Defaults to `labels.open` ("Show details"). */
  "aria-label"?: string;
  /** Text the button supplies itself, namely its accessible name. Merged over the English defaults. */
  labels?: Partial<PageShellAsideToggleLabels>;
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

/** The properties of `PageShell.Main`: the page's one `<main>`, and the skip link's target. */
export interface PageShellMainProps extends Omit<ComponentPropsWithoutRef<"main">, "children">, PageShellPartBase {
  /** The page. Usually one `PageShell.Content`. */
  children?: ReactNode;
  /**
   * Marks the main area as loading: `aria-busy`, a thin bar along its top edge and a polite announcement, without hiding what is already there.
   */
  busy?: boolean;
  /** The words the main area supplies itself. */
  labels?: Partial<PageShellMainLabels>;
  /**
   * The element's id, the skip link's target.
   * @default 'main'
   */
  id?: string;
}

/** The properties of `PageShell.Content`: the page's content kept to a readable width and padded, a `Container` with padding above and below. */
export interface PageShellContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, PageShellPartBase {
  /** The page's content. */
  children?: ReactNode;
  /**
   * The width the page is kept to, by what it is: `reading` for text (a narrow column), `dashboard` for cards and tables (the wide step), `full`
   * for a page that fills the window. An explicit `size` replaces it.
   */
  width?: PageShellContentWidth;
  /**
   * The widest the content gets, on the same steps as `Container`, centred. `full` is no limit. Takes the place of `width` when both are given.
   * @default 'xl'
   */
  size?: ContainerSize;
  /**
   * Padding at the start and end, on the spacing scale: one step, or a map keyed by breakpoint. The default is the step a `Navbar` with `contained` pads its own content by, so the bar and the page share a left edge.
   * @default 4
   */
  paddingInline?: Responsive<SpaceValue>;
  /**
   * Padding above and below, on the spacing scale.
   * @default 6
   */
  paddingBlock?: SpaceValue;
}

/** The properties of `PageShell.Footer`: the page's `contentinfo`, at the bottom of the window on a short page. */
export interface PageShellFooterProps extends Omit<ComponentPropsWithoutRef<"footer">, "children">, PageShellPartBase {
  /** The footer's content. */
  children?: ReactNode;
}
