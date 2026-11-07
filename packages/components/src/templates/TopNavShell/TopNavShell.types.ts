import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ContainerSize } from "../../atoms/Container";
import type { Responsive, SpaceValue } from "@dbm-system/utils";

/** Which way the shell reads. */
export type TopNavShellDirection = "ltr" | "rtl";

/** The text the skip link supplies itself. */
export interface TopNavShellSkipLinkLabels {
  /** The link's text when it is given no children. @default 'Skip to content' */
  skipToContent: string;
}

/** The text the main area supplies itself. */
export interface TopNavShellMainLabels {
  /** What a screen reader hears, politely, when the main area becomes busy. @default 'Loading' */
  loading: string;
}

/** Props every part of the shell accepts on top of its own native element's. */
interface TopNavShellPartBase {
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
export interface TopNavShellProps extends Omit<ComponentPropsWithoutRef<"div">, "dir" | "children"> {
  /**
   * The shell's parts: `TopNavShell.SkipLink`, `TopNavShell.Banner`, `TopNavShell.Header` (holding a `Navbar` and, if you like, a
   * `TopNavShell.SubNav`), `TopNavShell.Main` (holding a `TopNavShell.Content`) and `TopNavShell.Footer`. They draw in the order you write
   * them, which is the keyboard's tab order: put the skip link first and the header after it. Only `TopNavShell.Main` is needed.
   */
  children?: ReactNode;
  /**
   * Keeps the header (and the sub-navigation in it) at the top of the window while the page scrolls. Leave the `Navbar` inside it without its
   * own `sticky`: the shell owns the sticking.
   * @default true
   */
  stickyHeader?: boolean;
  /**
   * Shows a shadow under the header while the page is scrolled down from its top (a line instead in forced colours, which drop shadows).
   * @default true
   */
  scrolledEdge?: boolean;
  /**
   * The router's page, usually its pathname. When it changes, focus moves to the main area, so the keyboard starts at the new page's top and a
   * screen reader is told where it is, and `pageTitle` is announced. Nothing happens on the first render, or while this is left out.
   */
  pageKey?: string | number;
  /** The new page's title, announced politely after `pageKey` changes. */
  pageTitle?: string;
  /**
   * The reading direction of everything inside. The shell sets it on its own element and provides it to everything inside. Left out, it is the
   * nearest `DirectionProvider`'s, else left to right.
   * @default "the provider's, else 'ltr'"
   */
  dir?: TopNavShellDirection;
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

/** The properties of `TopNavShell.SkipLink`: a link, out of sight until it takes keyboard focus, that skips the header to the main area. */
export interface TopNavShellSkipLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "children">, TopNavShellPartBase {
  /** The link's text. Left out, `labels.skipToContent`. */
  children?: ReactNode;
  /**
   * Where the link goes: the main area's id.
   * @default '#main'
   */
  href?: string;
  /** The words the link supplies itself. */
  labels?: Partial<TopNavShellSkipLinkLabels>;
}

/** The properties of `TopNavShell.Banner`: a notice above the header that scrolls away with the page. */
export interface TopNavShellBannerProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, TopNavShellPartBase {
  /** The notice: an `Alert` with `banner`, or any content. */
  children?: ReactNode;
}

/** The properties of `TopNavShell.Header`: the sticky slot that holds a `Navbar` and, if you like, a `TopNavShell.SubNav`. */
export interface TopNavShellHeaderProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, TopNavShellPartBase {
  /** The header's content: a `Navbar`, then a `TopNavShell.SubNav`. */
  children?: ReactNode;
  /**
   * The element the slot is. A `Navbar` draws its own `<header>`, so leave this a `div` around one; use `header` for a header built without one,
   * so the page still has its banner landmark.
   * @default 'div'
   */
  as?: "div" | "header";
}

/** The properties of `TopNavShell.SubNav`: a second row of navigation under the `Navbar`, sticking with it. */
export interface TopNavShellSubNavProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, TopNavShellPartBase {
  /** The row's content: usually a `nav` (a `Tabs` list, or links) with its own name. It scrolls sideways when it does not fit. */
  children?: ReactNode;
}

/** The properties of `TopNavShell.Main`: the page's one `<main>`, and the skip link's target. */
export interface TopNavShellMainProps extends Omit<ComponentPropsWithoutRef<"main">, "children">, TopNavShellPartBase {
  /** The page. Usually one `TopNavShell.Content`. */
  children?: ReactNode;
  /**
   * Marks the main area as loading: `aria-busy`, a thin bar along its top edge and a polite announcement, without hiding what is already there.
   */
  busy?: boolean;
  /** The words the main area supplies itself. */
  labels?: Partial<TopNavShellMainLabels>;
  /**
   * The element's id, the skip link's target.
   * @default 'main'
   */
  id?: string;
}

/** The properties of `TopNavShell.Content`: the page's content kept to a readable width and padded, a `Container` with padding above and below. */
export interface TopNavShellContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children">, TopNavShellPartBase {
  /** The page's content. */
  children?: ReactNode;
  /**
   * The widest the content gets, on the same steps as `Container`, centred. `full` is no limit.
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

/** The properties of `TopNavShell.Footer`: the page's `contentinfo`, at the bottom of the window on a short page. */
export interface TopNavShellFooterProps extends Omit<ComponentPropsWithoutRef<"footer">, "children">, TopNavShellPartBase {
  /** The footer's content. */
  children?: ReactNode;
}
