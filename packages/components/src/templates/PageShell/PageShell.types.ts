import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { ContainerSize } from "../../atoms/Container";
import type { Responsive, SpaceValue } from "@dbm-system/utils";

/** Which way the shell reads. */
export type PageShellDirection = "ltr" | "rtl";

/** The text the skip link supplies itself. */
export interface PageShellSkipLinkLabels {
  /** The link's text when it is given no children. @default 'Skip to content' */
  skipToContent: string;
}

/** The text the main area supplies itself. */
export interface PageShellMainLabels {
  /** What a screen reader hears, politely, when the main area becomes busy. @default 'Loading' */
  loading: string;
}

/** How far the width presets of `PageShell.Content` reach: a reading page, a dashboard, a page that fills the window. */
export type PageShellContentWidth = "reading" | "dashboard" | "full";

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

/** The properties of `PageShell.PageHeader`: the head of a page, with its title, an optional trail of breadcrumbs, a description and actions. */
export interface PageShellPageHeaderProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title">, PageShellPartBase {
  /** The page's title, drawn as its heading. */
  title: ReactNode;
  /**
   * The heading level of the title.
   * @default 1
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** A line under the title that says what the page is. */
  description?: ReactNode;
  /** A trail above the title: a `Breadcrumb`. */
  breadcrumbs?: ReactNode;
  /** The page's actions, at the end of the title's row, and under it on a phone: buttons. */
  actions?: ReactNode;
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
