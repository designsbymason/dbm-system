import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import { forwardRef, useEffect, useMemo, useRef } from "react";
import { Container } from "../../atoms/Container";
import type { ContainerSize } from "../../atoms/Container";
import { DirectionProvider, useDirection } from "../../atoms/DirectionProvider";
import { Heading } from "../../atoms/Heading";
import { SkipLink } from "../../atoms/SkipLink";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { MainBusy } from "../../internal/MainBusy";
import { usePageChange } from "../../internal/usePageChange";
import styles from "./PageShell.module.css";
import { PageShellContext, usePageShellContext } from "./PageShellContext";
import type {
  PageShellBannerProps,
  PageShellContentProps,
  PageShellFooterProps,
  PageShellMainLabels,
  PageShellContentWidth,
  PageShellMainProps,
  PageShellPageHeaderProps,
  PageShellProps,
  PageShellSkipLinkProps,
} from "./PageShell.types";

const defaultMainLabels: PageShellMainLabels = { loading: "Loading" };

/** The steps of `Container` each width preset of `PageShell.Content` stands for. */
const widthSizes: Record<PageShellContentWidth, ContainerSize> = { reading: "md", dashboard: "2xl", full: "full" };

/**
 * The page frame of an application with no sidebar: a skip link, an optional banner, your header, the page's one `<main>` and a footer that sits at
 * the bottom of the window on a short page. The page scrolls as a whole. It is **layout and wiring only**, and it does not wrap your header: put a
 * `Navbar` (or any header) directly in it, in the order you want it on the page, and the header sticks by its own means (`Navbar`'s `sticky`, or
 * `Affix` around a header of your own).
 *
 * Put `PageShell.SkipLink` first so it is the first tab stop. Pass `pageKey` (the router's pathname) and `pageTitle` to move focus to the main area
 * and announce the new page when the reader navigates, and `documentTitle` to keep the browser tab's title in step. The shell publishes the device's
 * safe-area insets as `--page-shell-safe-top` (and `-right`, `-bottom`, `-left`), so a sticky header can keep clear of a notch.
 *
 * @example
 * ```tsx
 * <PageShell pageKey={pathname} pageTitle="Projects">
 *   <PageShell.SkipLink />
 *   <Navbar sticky>
 *     <Navbar.Brand href="/">Acme</Navbar.Brand>
 *     <Navbar.Links aria-label="Main">
 *       <Navbar.Link href="/projects" current>Projects</Navbar.Link>
 *     </Navbar.Links>
 *   </Navbar>
 *   <PageShell.Main>
 *     <PageShell.Content>
 *       <h1>Projects</h1>
 *     </PageShell.Content>
 *   </PageShell.Main>
 *   <PageShell.Footer>© Acme</PageShell.Footer>
 * </PageShell>
 * ```
 */
const PageShellRoot = forwardRef<HTMLDivElement, PageShellProps>(
  ({ children, pageKey, pageTitle, documentTitle = false, dir: dirProp, className, style, ...props }, ref) => {
    // The direction of the shell: its own, else the nearest `DirectionProvider`'s, else left to right. Everything inside gets it from a provider.
    const dir = useDirection(dirProp);
    const mainRef = useRef<HTMLElement | null>(null);

    // Moving to another page: focus goes to the main area and the new title is announced (`usePageChange`, shared with `AppShell`). The page
    // scrolls as a whole, so there is no scroller of the shell's own to send back to its top: that is the router's.
    const announcement = usePageChange({ pageKey, pageTitle, mainRef, resetScroll: false });

    // The browser tab's title follows `pageTitle` when asked, and the title the document had comes back when the shell goes.
    useEffect(() => {
      if (!documentTitle || pageTitle === undefined) return undefined;
      const previous = document.title;
      document.title = typeof documentTitle === "function" ? documentTitle(pageTitle) : pageTitle;
      return () => {
        document.title = previous;
      };
    }, [documentTitle, pageTitle]);

    const context = useMemo(() => ({ mainRef }), []);

    return (
      <DirectionProvider dir={dir}>
        <PageShellContext.Provider value={context}>
          <div {...props} ref={ref} dir={dir} className={cx(styles.root, className)} style={style}>
            {children}
            {pageKey !== undefined && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
          </div>
        </PageShellContext.Provider>
      </DirectionProvider>
    );
  },
);
PageShellRoot.displayName = "PageShell";

/**
 * A link, out of sight until it takes keyboard focus, that skips the header to the main area. Put it first in the shell, before the header, so it is
 * the first tab stop. It is the `SkipLink` atom. Use it when the header has no `Navbar` (a `Navbar` has its own `Navbar.SkipLink`).
 */
const PageShellSkipLink = forwardRef<HTMLAnchorElement, PageShellSkipLinkProps>(
  (props, ref) => <SkipLink {...props} ref={ref} />,
);
PageShellSkipLink.displayName = "PageShell.SkipLink";

/** A notice above the header: an `Alert` with `banner`, or any content. It scrolls away with the page; it does not stick. */
const PageShellBanner = forwardRef<HTMLDivElement, PageShellBannerProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.banner, className)} />
));
PageShellBanner.displayName = "PageShell.Banner";

/**
 * The page's one `<main>`, and the skip link's target. It takes focus from the skip link and when the page changes (`tabindex="-1"`). `busy`
 * marks it as loading: `aria-busy`, a thin bar along its top edge and a polite announcement, without hiding what is already there.
 */
const PageShellMain = forwardRef<HTMLElement, PageShellMainProps>(({ id = "main", busy, labels: labelsProp, className, children, ...props }, ref) => {
  const { mainRef } = usePageShellContext();
  const labels = mergeDefined(defaultMainLabels, labelsProp);
  return (
    <main
      {...props}
      ref={mergeRefs(mainRef, ref)}
      id={id}
      aria-busy={busy ? true : undefined}
      data-busy={busy ? "" : undefined}
      tabIndex={-1}
      className={cx(styles.main, className)}
    >
      <MainBusy busy={busy} label={labels.loading} barClassName={styles.busyBar} />
      {children}
    </main>
  );
});
PageShellMain.displayName = "PageShell.Main";

/**
 * The head of a page, at the top of `PageShell.Content`: its title as the page's `h1` (`titleLevel` changes that), an optional trail of
 * breadcrumbs above it, a description under it and the page's actions at the end of the row, under the title on a phone.
 */
const PageShellPageHeader = forwardRef<HTMLDivElement, PageShellPageHeaderProps>(
  ({ title, titleLevel = 1, description, breadcrumbs, actions, className, ...props }, ref) => (
    <div {...props} ref={ref} className={cx(styles.pageHeader, className)}>
      <div className={styles.pageHeaderText}>
        {breadcrumbs}
        <Heading level={titleLevel} size="2xl">
          {title}
        </Heading>
        {description !== undefined && <Text color="secondary">{description}</Text>}
      </div>
      {actions !== undefined && <div className={styles.pageHeaderActions}>{actions}</div>}
    </div>
  ),
);
PageShellPageHeader.displayName = "PageShell.PageHeader";

/**
 * The page's content in the main area, kept to a readable width and padded on the spacing scale: a `Container` with padding above and below
 * as well. Put it inside `PageShell.Main`, which adds none of its own.
 */
const PageShellContent = forwardRef<HTMLDivElement, PageShellContentProps>(
  ({ width, size = width === undefined ? "xl" : widthSizes[width], paddingInline = 4, paddingBlock = 6, style, ...props }, ref) => (
    <Container
      {...props}
      ref={ref}
      size={size}
      paddingInline={paddingInline}
      style={{ paddingBlock: `var(--dbm-space-${paddingBlock})`, ...style }}
    />
  ),
);
PageShellContent.displayName = "PageShell.Content";

/**
 * The page's `contentinfo`. On a page too short to fill the window it sits at the bottom of the window, not under the content.
 */
const PageShellFooter = forwardRef<HTMLElement, PageShellFooterProps>(({ className, ...props }, ref) => (
  <footer {...props} ref={ref} className={cx(styles.footer, className)} />
));
PageShellFooter.displayName = "PageShell.Footer";

type PageShellComponent = typeof PageShellRoot & {
  SkipLink: typeof PageShellSkipLink;
  Banner: typeof PageShellBanner;
  PageHeader: typeof PageShellPageHeader;
  Main: typeof PageShellMain;
  Content: typeof PageShellContent;
  Footer: typeof PageShellFooter;
};

export const PageShell: PageShellComponent = Object.assign(PageShellRoot, {
  SkipLink: PageShellSkipLink,
  Banner: PageShellBanner,
  PageHeader: PageShellPageHeader,
  Main: PageShellMain,
  Content: PageShellContent,
  Footer: PageShellFooter,
});
