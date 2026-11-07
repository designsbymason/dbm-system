import { cx, mergeDefined, mergeRefs } from "@dbm-system/utils";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Container } from "../../atoms/Container";
import { DirectionProvider, useDirection } from "../../atoms/DirectionProvider";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { MainBusy } from "../../internal/MainBusy";
import { usePageChange } from "../../internal/usePageChange";
import styles from "./TopNavShell.module.css";
import { TopNavShellContext, useTopNavShellContext } from "./TopNavShellContext";
import type {
  TopNavShellBannerProps,
  TopNavShellContentProps,
  TopNavShellFooterProps,
  TopNavShellHeaderProps,
  TopNavShellMainLabels,
  TopNavShellMainProps,
  TopNavShellProps,
  TopNavShellSkipLinkLabels,
  TopNavShellSkipLinkProps,
  TopNavShellSubNavProps,
} from "./TopNavShell.types";

const defaultSkipLinkLabels: TopNavShellSkipLinkLabels = { skipToContent: "Skip to content" };
const defaultMainLabels: TopNavShellMainLabels = { loading: "Loading" };

/**
 * The page frame of an application with no sidebar: a skip link, an optional banner, a header that stays at the top of the window (a `Navbar`
 * and an optional sub-navigation), the page's one `<main>` and a footer that sits at the bottom of the window on a short page. The page scrolls
 * as a whole. It is **layout and wiring only**: you put your own `Navbar` in the header and keep every prop it has.
 *
 * The shell owns the sticking: leave the `Navbar` inside it without its own `sticky`. Put `TopNavShell.SkipLink` first so it is the first tab stop.
 * Pass `pageKey` (the router's pathname) and `pageTitle` to move focus to the main area and announce the new page when the reader navigates.
 *
 * @example
 * ```tsx
 * <TopNavShell pageKey={pathname} pageTitle="Projects">
 *   <TopNavShell.SkipLink />
 *   <TopNavShell.Header>
 *     <Navbar>
 *       <Navbar.Brand href="/">Acme</Navbar.Brand>
 *       <Navbar.Links aria-label="Main">
 *         <Navbar.Link href="/projects" current>Projects</Navbar.Link>
 *       </Navbar.Links>
 *     </Navbar>
 *   </TopNavShell.Header>
 *   <TopNavShell.Main>
 *     <TopNavShell.Content>
 *       <h1>Projects</h1>
 *     </TopNavShell.Content>
 *   </TopNavShell.Main>
 *   <TopNavShell.Footer>© Acme</TopNavShell.Footer>
 * </TopNavShell>
 * ```
 */
const TopNavShellRoot = forwardRef<HTMLDivElement, TopNavShellProps>(
  ({ children, stickyHeader = true, scrolledEdge = true, pageKey, pageTitle, dir: dirProp, className, style, ...props }, ref) => {
    // The direction of the shell: its own, else the nearest `DirectionProvider`'s, else left to right. Everything inside gets it from a provider.
    const dir = useDirection(dirProp);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const mainRef = useRef<HTMLElement | null>(null);

    // Moving to another page: focus goes to the main area and the new title is announced (`usePageChange`, shared with `AppShell`). The page
    // scrolls as a whole, so there is no scroller of the shell's own to send back to its top: that is the router's.
    const announcement = usePageChange({ pageKey, pageTitle, mainRef, resetScroll: false });

    // Whether the page is scrolled down from its top, for the header's shadow. A scroll event does not bubble, so one listener on the document in
    // the capture phase hears the window and any box the shell is drawn inside (a framed demo). Read only from an effect, so the server render and
    // the first client render agree.
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      if (!scrolledEdge) return undefined;
      const root = rootRef.current;
      const read = (event?: Event) => {
        const target = event?.target;
        if (target === undefined || target === document) setScrolled(window.scrollY > 0);
        else if (target instanceof Element && root !== null && target.contains(root)) setScrolled(target.scrollTop > 0);
      };
      read();
      document.addEventListener("scroll", read, { capture: true, passive: true });
      return () => document.removeEventListener("scroll", read, true);
    }, [scrolledEdge]);

    const context = useMemo(() => ({ mainRef }), []);

    return (
      <DirectionProvider dir={dir}>
        <TopNavShellContext.Provider value={context}>
          <div
            {...props}
            ref={mergeRefs(rootRef, ref)}
            dir={dir}
            data-sticky-header={stickyHeader ? "" : undefined}
            data-scrolled-edge={scrolledEdge ? "" : undefined}
            data-scrolled={scrolledEdge && scrolled ? "" : undefined}
            className={cx(styles.root, className)}
            style={style}
          >
            {children}
            {pageKey !== undefined && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
          </div>
        </TopNavShellContext.Provider>
      </DirectionProvider>
    );
  },
);
TopNavShellRoot.displayName = "TopNavShell";

/**
 * A link, out of sight until it takes keyboard focus, that skips the header to the main area. Put it first in the shell, before
 * `TopNavShell.Header`, so it is the first tab stop. Use it when the header has no `Navbar` (a `Navbar` has its own `Navbar.SkipLink`).
 */
const TopNavShellSkipLink = forwardRef<HTMLAnchorElement, TopNavShellSkipLinkProps>(
  ({ href = "#main", labels: labelsProp, className, children, ...props }, ref) => {
    const labels = mergeDefined(defaultSkipLinkLabels, labelsProp);
    return (
      <a {...props} ref={ref} href={href} className={cx(styles.skipLink, className)}>
        {children ?? labels.skipToContent}
      </a>
    );
  },
);
TopNavShellSkipLink.displayName = "TopNavShell.SkipLink";

/** A notice above the header: an `Alert` with `banner`, or any content. It scrolls away with the page; it does not stick. */
const TopNavShellBanner = forwardRef<HTMLDivElement, TopNavShellBannerProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.banner, className)} />
));
TopNavShellBanner.displayName = "TopNavShell.Banner";

/**
 * The slot that stays at the top of the window while the page scrolls (unless the shell's `stickyHeader` is off): a `Navbar` and, if you like, a
 * `TopNavShell.SubNav`. It is a plain `div` by default, since a `Navbar` draws its own `<header>`; `as="header"` makes it the page's banner for
 * a header built without one.
 */
const TopNavShellHeader = forwardRef<HTMLElement, TopNavShellHeaderProps>(({ as: Element = "div", className, ...props }, ref) => (
  <Element {...(props as object)} ref={ref as never} className={cx(styles.header, className)} />
));
TopNavShellHeader.displayName = "TopNavShell.Header";

/**
 * A second row of navigation under the `Navbar`, inside the header so it sticks with it: a `Tabs` list or a row of links, in a `nav` of its own
 * with its own name. It scrolls sideways when it does not fit, so a phone keeps every item.
 */
const TopNavShellSubNav = forwardRef<HTMLDivElement, TopNavShellSubNavProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.subNav, className)} />
));
TopNavShellSubNav.displayName = "TopNavShell.SubNav";

/**
 * The page's one `<main>`, and the skip link's target. It takes focus from the skip link and when the page changes (`tabindex="-1"`). `busy`
 * marks it as loading: `aria-busy`, a thin bar along its top edge and a polite announcement, without hiding what is already there.
 */
const TopNavShellMain = forwardRef<HTMLElement, TopNavShellMainProps>(({ id = "main", busy, labels: labelsProp, className, children, ...props }, ref) => {
  const { mainRef } = useTopNavShellContext();
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
TopNavShellMain.displayName = "TopNavShell.Main";

/**
 * The page's content in the main area, kept to a readable width and padded on the spacing scale: a `Container` with padding above and below
 * as well. Put it inside `TopNavShell.Main`, which adds none of its own.
 */
const TopNavShellContent = forwardRef<HTMLDivElement, TopNavShellContentProps>(
  ({ size = "xl", paddingInline = 4, paddingBlock = 6, style, ...props }, ref) => (
    <Container
      {...props}
      ref={ref}
      size={size}
      paddingInline={paddingInline}
      style={{ paddingBlock: `var(--dbm-space-${paddingBlock})`, ...style }}
    />
  ),
);
TopNavShellContent.displayName = "TopNavShell.Content";

/** The page's `contentinfo`. On a page too short to fill the window it sits at the bottom of the window, not under the content. */
const TopNavShellFooter = forwardRef<HTMLElement, TopNavShellFooterProps>(({ className, ...props }, ref) => (
  <footer {...props} ref={ref} className={cx(styles.footer, className)} />
));
TopNavShellFooter.displayName = "TopNavShell.Footer";

type TopNavShellComponent = typeof TopNavShellRoot & {
  SkipLink: typeof TopNavShellSkipLink;
  Banner: typeof TopNavShellBanner;
  Header: typeof TopNavShellHeader;
  SubNav: typeof TopNavShellSubNav;
  Main: typeof TopNavShellMain;
  Content: typeof TopNavShellContent;
  Footer: typeof TopNavShellFooter;
};

export const TopNavShell: TopNavShellComponent = Object.assign(TopNavShellRoot, {
  SkipLink: TopNavShellSkipLink,
  Banner: TopNavShellBanner,
  Header: TopNavShellHeader,
  SubNav: TopNavShellSubNav,
  Main: TopNavShellMain,
  Content: TopNavShellContent,
  Footer: TopNavShellFooter,
});
