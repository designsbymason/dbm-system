import { cx, mergeDefined, mergeRefs, useScrollEdges } from "@dbm-system/utils";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import { Container } from "../../atoms/Container";
import type { ContainerSize } from "../../atoms/Container";
import { DirectionProvider, useDirection } from "../../atoms/DirectionProvider";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { MainBusy } from "../../internal/MainBusy";
import { usePageChange } from "../../internal/usePageChange";
import skipLinkStyles from "../../internal/skipLink.module.css";
import styles from "./PageShell.module.css";
import { PageShellContext, usePageShellContext } from "./PageShellContext";
import type {
  PageShellBannerProps,
  PageShellContentProps,
  PageShellFooterProps,
  PageShellHeaderProps,
  PageShellMainLabels,
  PageShellContentWidth,
  PageShellMainProps,
  PageShellPageHeaderProps,
  PageShellProps,
  PageShellSkipLinkLabels,
  PageShellSkipLinkProps,
  PageShellSubNavLinkProps,
  PageShellSubNavProps,
} from "./PageShell.types";

const defaultSkipLinkLabels: PageShellSkipLinkLabels = { skipToContent: "Skip to content" };
const defaultMainLabels: PageShellMainLabels = { loading: "Loading" };

/** How far the page must be scrolled before a header that hides on scroll (`stickyHeader="auto"`) will go, and how far one move must be to count. */
const HIDE_AFTER_SCROLL = 80;
const SCROLL_STEP = 6;

/** The steps of `Container` each width preset of `PageShell.Content` stands for. */
const widthSizes: Record<PageShellContentWidth, ContainerSize> = { reading: "md", dashboard: "2xl", full: "full" };

/**
 * The page frame of an application with no sidebar: a skip link, an optional banner, a header that stays at the top of the window (a `Navbar`
 * and an optional sub-navigation), the page's one `<main>` and a footer that sits at the bottom of the window on a short page. The page scrolls
 * as a whole. It is **layout and wiring only**: you put your own `Navbar` in the header and keep every prop it has.
 *
 * The shell owns the sticking: leave the `Navbar` inside it without its own `sticky`. Put `PageShell.SkipLink` first so it is the first tab stop.
 * Pass `pageKey` (the router's pathname) and `pageTitle` to move focus to the main area and announce the new page when the reader navigates.
 *
 * @example
 * ```tsx
 * <PageShell pageKey={pathname} pageTitle="Projects">
 *   <PageShell.SkipLink />
 *   <PageShell.Header>
 *     <Navbar>
 *       <Navbar.Brand href="/">Acme</Navbar.Brand>
 *       <Navbar.Links aria-label="Main">
 *         <Navbar.Link href="/projects" current>Projects</Navbar.Link>
 *       </Navbar.Links>
 *     </Navbar>
 *   </PageShell.Header>
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
  ({ children, stickyHeader = true, scrolledEdge = true, pageKey, pageTitle, documentTitle = false, dir: dirProp, className, style, ...props }, ref) => {
    // The direction of the shell: its own, else the nearest `DirectionProvider`'s, else left to right. Everything inside gets it from a provider.
    const dir = useDirection(dirProp);
    const rootRef = useRef<HTMLDivElement | null>(null);
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

    // Whether the page is scrolled down from its top, for the header's shadow, and which way it is moving, for a header that hides on scroll. A
    // scroll event does not bubble, so one listener on the document in the capture phase hears the window and any box the shell is drawn inside
    // (a framed demo). Read only from an effect, so the server render and the first client render agree.
    const autoHide = stickyHeader === "auto";
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    useEffect(() => {
      if (!scrolledEdge && !autoHide) return undefined;
      const root = rootRef.current;
      let last = 0;
      const move = (position: number) => {
        setScrolled(position > 0);
        if (!autoHide) return;
        if (position <= HIDE_AFTER_SCROLL) setHidden(false);
        else if (position - last > SCROLL_STEP) setHidden(true);
        else if (last - position > SCROLL_STEP) setHidden(false);
        if (Math.abs(position - last) > SCROLL_STEP || position <= HIDE_AFTER_SCROLL) last = position;
      };
      const read = (event?: Event) => {
        const target = event?.target;
        if (target === undefined || target === document) move(window.scrollY);
        else if (target instanceof Element && root !== null && target.contains(root)) move(target.scrollTop);
      };
      read();
      document.addEventListener("scroll", read, { capture: true, passive: true });
      return () => document.removeEventListener("scroll", read, true);
    }, [scrolledEdge, autoHide]);

    // A sub-navigation that scrolls away with the page tells the shell, which then sticks only the bar and not the whole slot (a marker on the
    // root, set from outside React's render so the page does not draw twice).
    const setSubNavStatic = useCallback((isStatic: boolean) => {
      rootRef.current?.toggleAttribute("data-subnav-static", isStatic);
    }, []);

    const context = useMemo(() => ({ mainRef, setSubNavStatic }), [setSubNavStatic]);

    return (
      <DirectionProvider dir={dir}>
        <PageShellContext.Provider value={context}>
          <div
            {...props}
            ref={mergeRefs(rootRef, ref)}
            dir={dir}
            data-sticky-header={stickyHeader === "auto" ? "auto" : stickyHeader ? "" : undefined}
            data-header-hidden={autoHide && hidden ? "" : undefined}
            data-scrolled-edge={scrolledEdge ? "" : undefined}
            data-scrolled={scrolledEdge && scrolled ? "" : undefined}
            className={cx(styles.root, className)}
            style={style}
          >
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
 * A link, out of sight until it takes keyboard focus, that skips the header to the main area. Put it first in the shell, before
 * `PageShell.Header`, so it is the first tab stop. Use it when the header has no `Navbar` (a `Navbar` has its own `Navbar.SkipLink`).
 */
const PageShellSkipLink = forwardRef<HTMLAnchorElement, PageShellSkipLinkProps>(
  ({ href = "#main", labels: labelsProp, className, children, ...props }, ref) => {
    const labels = mergeDefined(defaultSkipLinkLabels, labelsProp);
    return (
      <a {...props} ref={ref} href={href} className={cx(skipLinkStyles.skipLink, className)}>
        {children ?? labels.skipToContent}
      </a>
    );
  },
);
PageShellSkipLink.displayName = "PageShell.SkipLink";

/** A notice above the header: an `Alert` with `banner`, or any content. It scrolls away with the page; it does not stick. */
const PageShellBanner = forwardRef<HTMLDivElement, PageShellBannerProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.banner, className)} />
));
PageShellBanner.displayName = "PageShell.Banner";

/**
 * The slot that stays at the top of the window while the page scrolls (unless the shell's `stickyHeader` is off): a `Navbar` and, if you like, a
 * `PageShell.SubNav`. It is a plain `div` by default, since a `Navbar` draws its own `<header>`; `as="header"` makes it the page's banner for
 * a header built without one.
 */
const PageShellHeader = forwardRef<HTMLElement, PageShellHeaderProps>(({ as: Element = "div", className, ...props }, ref) => (
  <Element {...(props as object)} ref={ref as never} className={cx(styles.header, className)} />
));
PageShellHeader.displayName = "PageShell.Header";

/**
 * A second row of navigation under the `Navbar`, inside the header so it sticks with it: a row of `PageShell.SubNavLink`s (give it a `label`
 * and it draws the `nav`), or a `Tabs` list of your own in a `nav` with its own name. The links are centred while they all fit. When they do
 * not, the row scrolls sideways so a phone keeps every item, fades at the edge that has more, and brings the current link into view.
 */
const PageShellSubNav = forwardRef<HTMLDivElement, PageShellSubNavProps>(
  ({ label, align = "center", bordered = true, sticky = true, className, children, ...props }, ref) => {
    const { setSubNavStatic } = usePageShellContext();
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const { overflowStart, overflowEnd } = useScrollEdges(scrollerRef, "horizontal", { itemSelector: "a, button, [role=tab]" });

    // The current link is brought into view, when the row mounts and whenever the current link changes.
    useEffect(() => {
      const scroller = scrollerRef.current;
      if (scroller === null) return undefined;
      let first = true;
      const reveal = () => {
        const current = scroller.querySelector("[aria-current]");
        if (current === null) return;
        const box = scroller.getBoundingClientRect();
        const rect = current.getBoundingClientRect();
        const gap = Number.parseFloat(getComputedStyle(scroller).scrollPaddingInlineStart) || 0;
        const smooth = !first && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const behavior = smooth ? "smooth" : "auto";
        if (rect.left < box.left + gap) scroller.scrollBy({ left: rect.left - box.left - gap, behavior });
        else if (rect.right > box.right - gap) scroller.scrollBy({ left: rect.right - box.right + gap, behavior });
        first = false;
      };
      reveal();
      first = false;
      if (typeof MutationObserver === "undefined") return undefined;
      const observer = new MutationObserver(reveal);
      observer.observe(scroller, { attributes: true, attributeFilter: ["aria-current"], subtree: true });
      return () => observer.disconnect();
    }, []);

    // A row that is not sticky tells the shell, and takes it back when it stops or goes.
    useEffect(() => {
      if (sticky) return undefined;
      setSubNavStatic(true);
      return () => setSubNavStatic(false);
    }, [sticky, setSubNavStatic]);

    return (
      <div
        {...props}
        ref={ref}
        data-overflow-start={overflowStart ? "" : undefined}
        data-overflow-end={overflowEnd ? "" : undefined}
        data-align={align}
        className={cx(styles.subNav, bordered && styles.subNavBordered, className)}
      >
        <div ref={scrollerRef} data-sub-nav-scroller="" className={styles.subNavScroller}>
          {label === undefined ? children : (
            <nav aria-label={label} className={styles.subNavList}>
              {children}
            </nav>
          )}
        </div>
      </div>
    );
  },
);
PageShellSubNav.displayName = "PageShell.SubNav";

/**
 * A link of `PageShell.SubNav`: a round ghost button. The current page's link (`current`) takes `aria-current="page"` and the subtle tint the
 * `Navbar` gives its own current link, underlined as well in forced colours, where a fill is dropped.
 */
const PageShellSubNavLink = forwardRef<HTMLAnchorElement, PageShellSubNavLinkProps>(({ current = false, className, children, ...props }, ref) => (
  <Button asChild variant="ghost" tone="neutral" size="sm" rounded className={cx(styles.subNavLink, current && styles.subNavLinkCurrent, className)}>
    <a {...props} ref={ref} aria-current={current ? "page" : undefined}>
      {children}
    </a>
  </Button>
));
PageShellSubNavLink.displayName = "PageShell.SubNavLink";

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
 * The page's `contentinfo`. On a page too short to fill the window it sits at the bottom of the window, not under the content. `variant` makes it
 * a tighter one (`compact`) or a bar of actions that stays at the bottom of the window (`actions`).
 */
const PageShellFooter = forwardRef<HTMLElement, PageShellFooterProps>(({ variant = "default", className, ...props }, ref) => (
  <footer
    {...props}
    ref={ref}
    data-variant={variant}
    className={cx(styles.footer, variant === "compact" && styles.footerCompact, variant === "actions" && styles.footerActions, className)}
  />
));
PageShellFooter.displayName = "PageShell.Footer";

type PageShellComponent = typeof PageShellRoot & {
  SkipLink: typeof PageShellSkipLink;
  Banner: typeof PageShellBanner;
  Header: typeof PageShellHeader;
  SubNav: typeof PageShellSubNav;
  SubNavLink: typeof PageShellSubNavLink;
  PageHeader: typeof PageShellPageHeader;
  Main: typeof PageShellMain;
  Content: typeof PageShellContent;
  Footer: typeof PageShellFooter;
};

export const PageShell: PageShellComponent = Object.assign(PageShellRoot, {
  SkipLink: PageShellSkipLink,
  Banner: PageShellBanner,
  Header: PageShellHeader,
  SubNav: PageShellSubNav,
  SubNavLink: PageShellSubNavLink,
  PageHeader: PageShellPageHeader,
  Main: PageShellMain,
  Content: PageShellContent,
  Footer: PageShellFooter,
});
