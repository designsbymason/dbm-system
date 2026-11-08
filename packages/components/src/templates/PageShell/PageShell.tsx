import { SidebarSimpleIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useIsScrollable } from "@dbm-system/utils";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Container } from "../../atoms/Container";
import type { ContainerSize } from "../../atoms/Container";
import { DirectionProvider, useDirection } from "../../atoms/DirectionProvider";
import { IconButton } from "../../atoms/IconButton";
import { SkipLink } from "../../atoms/SkipLink";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { AsideDrawer } from "../../internal/AsideDrawer";
import { toLength } from "../../internal/breakpoints";
import { MainBusy } from "../../internal/MainBusy";
import { usePageChange } from "../../internal/usePageChange";
import styles from "./PageShell.module.css";
import { PageShellContext, usePageShellContext } from "./PageShellContext";
import type {
  PageShellAsideCollapseBelow,
  PageShellAsideLabels,
  PageShellAsideProps,
  PageShellAsideToggleLabels,
  PageShellAsideToggleProps,
  PageShellBannerProps,
  PageShellBodyProps,
  PageShellContentProps,
  PageShellFooterProps,
  PageShellMainLabels,
  PageShellContentWidth,
  PageShellMainProps,
  PageShellProps,
  PageShellSkipLinkProps,
} from "./PageShell.types";

const defaultMainLabels: PageShellMainLabels = { loading: "Loading" };
const defaultAsideLabels: PageShellAsideLabels = { title: "Details", close: "Close" };
const defaultAsideToggleLabels: PageShellAsideToggleLabels = { open: "Show details" };

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
  (
    { children, pageKey, pageTitle, documentTitle = false, asideOpen: asideOpenProp, defaultAsideOpen = false, onAsideOpenChange, dir: dirProp, className, style, ...props },
    ref,
  ) => {
    // The direction of the shell: its own, else the nearest `DirectionProvider`'s, else left to right. Everything inside gets it from a provider.
    const dir = useDirection(dirProp);
    const mainRef = useRef<HTMLElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);

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

    // The aside's drawer: open or closed, controlled or not, and the toggle it gives focus back to.
    const [asideOpenState, setAsideOpenState] = useState(defaultAsideOpen);
    const asideOpen = asideOpenProp ?? asideOpenState;
    const asideToggleRef = useRef<HTMLElement | null>(null);
    const setAsideOpen = useCallback(
      (open: boolean) => {
        if (asideOpenProp === undefined) setAsideOpenState(open);
        onAsideOpenChange?.(open);
      },
      [asideOpenProp, onAsideOpenChange],
    );

    // The height of the app's header while it sticks, published as `--page-shell-header-height` for a sticky aside to stick under. The header is the
    // first direct `<header>` child (a `Navbar`'s, whose trailing row is outside it); measured in an effect, so the server render and the first client
    // render agree, and kept current as it resizes or as the shell's children change. Zero while it does not stick.
    useEffect(() => {
      const root = rootRef.current;
      if (root === null) return undefined;
      let observed: Element | null = null;
      const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => measure());
      function measure() {
        const header = Array.from(root!.children).find((child) => child.tagName === "HEADER") ?? null;
        if (header !== observed) {
          if (observed !== null) resize?.unobserve(observed);
          if (header !== null) resize?.observe(header);
          observed = header;
        }
        const height = header !== null && getComputedStyle(header).position === "sticky" ? header.getBoundingClientRect().height : 0;
        root!.style.setProperty("--page-shell-header-height", `${height}px`);
      }
      measure();
      const mutations = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(measure);
      mutations?.observe(root, { childList: true });
      return () => {
        resize?.disconnect();
        mutations?.disconnect();
        root.style.removeProperty("--page-shell-header-height");
      };
    }, []);

    const context = useMemo(() => ({ mainRef, asideOpen, setAsideOpen, asideToggleRef }), [asideOpen, setAsideOpen]);

    return (
      <DirectionProvider dir={dir}>
        <PageShellContext.Provider value={context}>
          <div {...props} ref={mergeRefs(rootRef, ref)} dir={dir} className={cx(styles.root, className)} style={style}>
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
 * The page's content and its aside side by side, inside the page's width and padding (`PageShell.Content`'s, `size`, `paddingInline` and `paddingBlock`):
 * `PageShell.Main` and `PageShell.Aside` as its children, in the order they read, so an aside written first is at the start. Use it in place of
 * `PageShell.Content` for a page with an aside: the aside is a landmark of its own and cannot be inside `<main>`, so the width lives around both.
 */
const PageShellBody = forwardRef<HTMLDivElement, PageShellBodyProps>(
  ({ width, size = width === undefined ? "xl" : widthSizes[width], paddingInline = 4, paddingBlock = 6, className, style, ...props }, ref) => (
    <Container
      {...props}
      ref={ref}
      size={size}
      paddingInline={paddingInline}
      className={cx(styles.body, className)}
      style={{ paddingBlock: `var(--dbm-space-${paddingBlock})`, ...style }}
    />
  ),
);
PageShellBody.displayName = "PageShell.Body";

const collapseClass: Record<Exclude<PageShellAsideCollapseBelow, "never">, string | undefined> = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
  xl: styles.collapseXl,
  "2xl": styles.collapse2xl,
  "3xl": styles.collapse3xl,
};

/**
 * A complementary column beside the page, in `PageShell.Body`: a table of contents, filters, related links, a details panel. An `<aside>`, so name it.
 * It sits at the end of the row (at the start if it is written before `PageShell.Main`), scrolls with the page, or with `sticky` stays in view under
 * the header. Below `collapseBelow` it drops under the page (`collapse="stack"`, the default) or leaves it for a drawer that `PageShell.AsideToggle`
 * opens (`collapse="drawer"`).
 */
const PageShellAside = forwardRef<HTMLElement, PageShellAsideProps>(
  (
    {
      children,
      width,
      sticky = false,
      stickyOffset,
      collapse = "stack",
      collapseBelow = "lg",
      labels: labelsProp,
      drawerContainer,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const { asideOpen, setAsideOpen, asideToggleRef } = usePageShellContext();
    const dir = useDirection();
    const labels = mergeDefined(defaultAsideLabels, labelsProp);
    const innerRef = useRef<HTMLElement | null>(null);
    const scrolls = useIsScrollable(innerRef, "y");
    const size = width !== undefined ? toLength(width) : "var(--dbm-app-shell-aside-width)";
    const asDrawer = collapse === "drawer" && collapseBelow !== "never";
    const step = collapseBelow === "never" ? undefined : collapseClass[collapseBelow];

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      if (ariaLabel === undefined && ariaLabelledBy === undefined) {
        console.warn("PageShell.Aside: name it with `aria-label` or `aria-labelledby`: it is a `complementary` landmark, and a page can have more than one.");
      }
    }, [ariaLabel, ariaLabelledBy]);

    return (
      <>
        <aside
          {...props}
          ref={mergeRefs(innerRef, ref)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          data-collapse={collapseBelow === "never" ? undefined : collapse}
          data-sticky={sticky ? "" : undefined}
          // A sticky aside that scrolls inside itself is a tab stop, so a keyboard user can scroll a region with nothing focusable in it.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={sticky && scrolls ? 0 : undefined}
          className={cx(styles.aside, sticky && styles.sticky, step, className)}
          style={
            {
              "--page-shell-aside-size": size,
              ...(stickyOffset !== undefined ? { "--page-shell-aside-offset": stickyOffset } : undefined),
              ...style,
            } as CSSProperties
          }
        >
          {children}
        </aside>
        {asDrawer && (
          <AsideDrawer
            open={asideOpen}
            onOpenChange={setAsideOpen}
            collapseBelow={collapseBelow}
            size={size}
            dir={dir}
            container={drawerContainer}
            title={ariaLabel ?? labels.title}
            closeLabel={labels.close}
            toggleRef={asideToggleRef}
          >
            {children}
          </AsideDrawer>
        )}
      </>
    );
  },
);
PageShellAside.displayName = "PageShell.Aside";

/**
 * The button that opens the aside's drawer below `collapseBelow`: an `IconButton` you place anywhere in the page (next to a page header's actions, in a
 * `Navbar`). It shows only below the step and only for an aside with `collapse="drawer"`.
 */
const PageShellAsideToggle = forwardRef<HTMLButtonElement, PageShellAsideToggleProps>(
  ({ icon = SidebarSimpleIcon, variant = "ghost", tone, size = "md", labels: labelsProp, className, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const { asideOpen, setAsideOpen, asideToggleRef } = usePageShellContext();
    const labels = mergeDefined(defaultAsideToggleLabels, labelsProp);
    return (
      <IconButton
        {...props}
        ref={mergeRefs(asideToggleRef as React.RefObject<HTMLButtonElement | null>, ref)}
        icon={icon}
        variant={variant}
        tone={tone}
        size={size}
        aria-label={ariaLabel ?? labels.open}
        aria-haspopup="dialog"
        aria-expanded={asideOpen}
        className={cx(styles.asideToggle, className)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          asideToggleRef.current = event.currentTarget;
          setAsideOpen(true);
        }}
      />
    );
  },
);
PageShellAsideToggle.displayName = "PageShell.AsideToggle";

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
  Main: typeof PageShellMain;
  Content: typeof PageShellContent;
  Body: typeof PageShellBody;
  Aside: typeof PageShellAside;
  AsideToggle: typeof PageShellAsideToggle;
  Footer: typeof PageShellFooter;
};

export const PageShell: PageShellComponent = Object.assign(PageShellRoot, {
  SkipLink: PageShellSkipLink,
  Banner: PageShellBanner,
  Main: PageShellMain,
  Content: PageShellContent,
  Body: PageShellBody,
  Aside: PageShellAside,
  AsideToggle: PageShellAsideToggle,
  Footer: PageShellFooter,
});
