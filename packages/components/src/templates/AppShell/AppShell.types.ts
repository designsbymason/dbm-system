import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
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
   * The shell's slots: `AppShell.Header`, `AppShell.Sidebar`, `AppShell.Main` and `AppShell.Footer`. The shell places each in its own area, so
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
   * The reading direction of everything inside. Not read from the page: pass `"rtl"` on a right-to-left page. Components with their own `dir`
   * prop (`Sidebar`, `Menu`, `Tabs`) still need it passed to them.
   * @default 'ltr'
   */
  dir?: AppShellDirection;
}

export interface AppShellSidebarProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, AppShellPartBase {
  /** The `Sidebar`. The column is as wide as the sidebar and is absent from the page while the sidebar is in its phone panel. */
  children?: ReactNode;
}

export interface AppShellHeaderProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, AppShellPartBase {
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
  /** The page's footer: the `contentinfo` landmark, below the main area and outside its scrolling. */
  children?: ReactNode;
}
