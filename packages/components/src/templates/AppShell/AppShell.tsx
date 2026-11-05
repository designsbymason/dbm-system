import { SidebarSimpleIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useIsScrollable } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { IconButton } from "../../atoms/IconButton";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { Drawer } from "../../organisms/Drawer";
import { Sidebar } from "../../organisms/Sidebar";
import styles from "./AppShell.module.css";
import { AppShellContext, useAppShellContext } from "./AppShellContext";
import { useElementHeight } from "./useElementHeight";
import type {
  AppShellAsideCollapseBelow,
  AppShellAsideLabels,
  AppShellAsideProps,
  AppShellAsideToggleLabels,
  AppShellAsideToggleProps,
  AppShellFooterProps,
  AppShellHeaderProps,
  AppShellMainProps,
  AppShellProps,
  AppShellSidebarProps,
  AppShellSkipLinkLabels,
  AppShellSkipLinkProps,
} from "./AppShell.types";

const defaultAsideLabels: AppShellAsideLabels = { title: "Details", close: "Close" };
const defaultAsideToggleLabels: AppShellAsideToggleLabels = { open: "Show details" };
const defaultSkipLinkLabels: AppShellSkipLinkLabels = { skipToContent: "Skip to content" };

// The widths the aside's collapse steps stand for: the literal values of the breakpoint tokens (a media query can't read a custom property),
// as `Sidebar` and `Drawer` write them.
const collapseQueries: Record<Exclude<AppShellAsideCollapseBelow, "never">, string> = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
};

function toLength(width: number | string): string {
  return typeof width === "number" ? `${width}px` : width;
}

/**
 * The page frame of an application: a sidebar column, a header, a main area, an optional aside and a footer, with the page's landmarks, the skip
 * link's target and the phone menu wired up. It is layout and wiring only. You place your own `Sidebar` and `Navbar` in the slots and keep every
 * prop they have; the shell adds the grid, the one `<main>`, and the `Sidebar.Provider` that lets the `Navbar`'s menu button open the sidebar's
 * phone panel.
 *
 * Slots: `AppShell.SkipLink` and `AppShell.Header` first in the markup (so the skip link is the first tab stop), then `AppShell.Sidebar`,
 * `AppShell.Main`, `AppShell.Aside` and `AppShell.Footer`. By default the frame is as tall as the window and only `AppShell.Main` scrolls
 * (`scroll="content"`); with `scroll="page"` the page scrolls as a whole and the header and sidebar stay in view. Below the sidebar's
 * `collapseBelow` width the sidebar leaves the page and its column disappears, so the main area takes the full width; the aside does the
 * same below `asideCollapseBelow`, becoming a drawer opened from `AppShell.AsideToggle` (or nothing, with `asideCollapseTo="hidden"`).
 * `headerSpan="full"` runs the header over the sidebar. Notches and home indicators are kept clear (`env(safe-area-inset-*)`).
 *
 * Landmarks: the shell supplies `<main>` and the `<footer>`; the `Navbar` in the header draws the `<header>` banner (or pass `as="header"` to
 * `AppShell.Header` for a header built without one), each `Sidebar.Nav` is a named `<nav>`, and `AppShell.Aside` is a `complementary` `<aside>`.
 *
 * Pass `pageKey` (the router's pathname) and `pageTitle` to move focus to the main area and announce the new page when the reader navigates.
 * `useAppShell()` gives the app the shell's state, such as the header's height.
 *
 * Does not cover a bar of its own (use `Navbar`), a navigation column of its own (use `Sidebar`), or a page's content.
 *
 * @example
 * ```tsx
 * <AppShell pageKey={pathname} pageTitle="Reports">
 *   <AppShell.SkipLink />
 *   <AppShell.Header>
 *     <Navbar>
 *       <Navbar.Brand>Acme</Navbar.Brand>
 *       <Sidebar.MenuButton />
 *       <AppShell.AsideToggle />
 *     </Navbar>
 *   </AppShell.Header>
 *   <AppShell.Sidebar>
 *     <Sidebar currentPath="/reports">…</Sidebar>
 *   </AppShell.Sidebar>
 *   <AppShell.Main>
 *     <h1>Reports</h1>
 *   </AppShell.Main>
 *   <AppShell.Aside aria-label="Details">…</AppShell.Aside>
 * </AppShell>
 * ```
 */
const AppShellRoot = forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      children,
      scroll = "content",
      sidebarSide = "start",
      headerSpan = "content",
      asideCollapseBelow = "lg",
      asideCollapseTo = "drawer",
      asideOpen: asideOpenProp,
      defaultAsideOpen = false,
      onAsideOpenChange,
      pageKey,
      pageTitle,
      dir = "ltr",
      collapsed,
      defaultCollapsed,
      onCollapsedChange,
      menuOpen,
      defaultMenuOpen,
      onMenuOpenChange,
      collapseBelow,
      labels,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    // With `scroll="page"` the header can only stay in view if its grid area is as tall as the whole shell, so the shell needs its height
    // to keep the first row that size. Zero (the server render, the first client render) leaves the header in its own row, unstuck.
    const [headerHeight, setHeaderHeight] = useState(0);
    const measured = scroll === "page" && headerHeight > 0;

    // The aside's drawer: controlled by `asideOpen` or held here, and only ever open while the aside is a drawer.
    const [asideOpenState, setAsideOpenState] = useState(defaultAsideOpen);
    const asideOpen = (asideOpenProp ?? asideOpenState) && asideCollapseTo === "drawer";
    const setAsideOpen = useCallback(
      (open: boolean) => {
        if (asideOpenProp === undefined) setAsideOpenState(open);
        onAsideOpenChange?.(open);
      },
      [asideOpenProp, onAsideOpenChange],
    );

    const mainRef = useRef<HTMLElement | null>(null);
    const asideToggleRef = useRef<HTMLElement | null>(null);

    // Moving to another page: focus goes to the main area (so the keyboard starts at the new page's top, and a screen reader is told where
    // it is), a scrolling main area goes back to its top, and the new page's title is announced. Not on the first render, which the page's own
    // load already announced, and not while `pageKey` is left out. The key remembered here, not a flag, keeps it quiet under `StrictMode`.
    const { message: announcement, announce } = useAnnouncement();
    const previousKey = useRef(pageKey);
    useEffect(() => {
      if (pageKey === undefined || previousKey.current === undefined) {
        previousKey.current = pageKey;
        return;
      }
      if (previousKey.current === pageKey) return;
      previousKey.current = pageKey;
      const main = mainRef.current;
      if (main !== null) {
        main.focus({ preventScroll: true });
        if (scroll === "content") main.scrollTop = 0;
      }
      if (pageTitle) announce(pageTitle);
    }, [pageKey, pageTitle, scroll, announce]);

    const context = useMemo(
      () => ({
        scroll,
        headerHeight: scroll === "page" ? headerHeight : 0,
        asideOpen,
        setAsideOpen,
        setHeaderHeight,
        dir,
        asideCollapseBelow,
        asideCollapseTo,
        mainRef,
        asideToggleRef,
        inShell: true,
      }),
      [scroll, headerHeight, asideOpen, setAsideOpen, dir, asideCollapseBelow, asideCollapseTo],
    );

    useEffect(() => {
      if (process.env.NODE_ENV === "production") return;
      const slots = Children.toArray(children).filter(isValidElement);
      const header = slots.findIndex((slot) => slot.type === AppShellHeader);
      const sidebar = slots.findIndex((slot) => slot.type === AppShellSidebar);
      if (header !== -1 && sidebar !== -1 && sidebar < header) {
        console.warn(
          "AppShell: `AppShell.Sidebar` comes before `AppShell.Header` in the markup. The layout is the same, but the keyboard follows the markup, so the sidebar's links come before the skip link. Put `AppShell.Header` first.",
        );
      }
    }, [children]);

    return (
      <Sidebar.Provider
        collapsed={collapsed}
        defaultCollapsed={defaultCollapsed}
        onCollapsedChange={onCollapsedChange}
        menuOpen={menuOpen}
        defaultMenuOpen={defaultMenuOpen}
        onMenuOpenChange={onMenuOpenChange}
        collapseBelow={collapseBelow}
        labels={labels}
      >
        <AppShellContext.Provider value={context}>
          <div
            {...props}
            ref={ref}
            dir={dir}
            data-scroll={scroll}
            data-sidebar-side={sidebarSide}
            data-header-span={headerSpan}
            data-aside-collapse={asideCollapseBelow}
            data-aside-to={asideCollapseTo}
            data-header-measured={measured ? "" : undefined}
            className={cx(styles.root, className)}
            style={{ ...(measured ? ({ "--app-shell-header-height": `${headerHeight}px` } as CSSProperties) : undefined), ...style }}
          >
            {children}
            {pageKey !== undefined && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
          </div>
        </AppShellContext.Provider>
      </Sidebar.Provider>
    );
  },
);
AppShellRoot.displayName = "AppShell";

/** The column that holds the `Sidebar`. It takes the width of the sidebar and none at all while the sidebar is in its phone panel. */
const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.sidebar, className)} />
));
AppShellSidebar.displayName = "AppShell.Sidebar";

/**
 * The band above the main area, for the `Navbar`. It does not scroll with the main area. A `div` unless `as="header"`, since a `Navbar` draws the
 * page's `<header>` banner itself.
 */
const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(({ as: Element = "div", className, ...props }, ref) => {
  const { scroll, setHeaderHeight } = useAppShellContext();
  const innerRef = useRef<HTMLElement>(null);
  useElementHeight(scroll === "page", innerRef, setHeaderHeight);
  return <Element {...(props as object)} ref={mergeRefs(innerRef, ref) as never} className={cx(styles.header, className)} />;
});
AppShellHeader.displayName = "AppShell.Header";

/** The page's one `<main>`. It scrolls on its own when the shell is `scroll="content"`, and is the skip link's target. */
const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(({ id = "main", className, ...props }, ref) => {
  const { scroll, mainRef } = useAppShellContext();
  const innerRef = useRef<HTMLElement>(null);
  const scrolls = useIsScrollable(innerRef, "y");
  // The skip link needs `main` to take focus (`-1`). While it scrolls it is also a tab stop (`0`), so a keyboard user can scroll a page with
  // nothing focusable in it; one that fits, or a page that scrolls as a whole, gets no extra stop.
  return (
    <main
      {...props}
      ref={mergeRefs(innerRef, mainRef, ref)}
      id={id}
      tabIndex={scroll === "content" && scrolls ? 0 : -1}
      className={cx(styles.main, className)}
    />
  );
});
AppShellMain.displayName = "AppShell.Main";

/**
 * A link, out of sight until it takes keyboard focus, that skips the header and the sidebar to the main area. Put it first in the shell, before
 * `AppShell.Header`, so it is the first tab stop. Use it when the header has no `Navbar` (a `Navbar` has its own `Navbar.SkipLink`).
 */
const AppShellSkipLink = forwardRef<HTMLAnchorElement, AppShellSkipLinkProps>(
  ({ href = "#main", labels: labelsProp, className, children, ...props }, ref) => {
    const labels = mergeDefined(defaultSkipLinkLabels, labelsProp);
    return (
      <a {...props} ref={ref} href={href} className={cx(styles.skipLink, className)}>
        {children ?? labels.skipToContent}
      </a>
    );
  },
);
AppShellSkipLink.displayName = "AppShell.SkipLink";

/**
 * The end-edge column beside the main area: a detail pane, an inspector, an activity feed, a table of contents. A `complementary` `<aside>`, so
 * name it. Below the shell's `asideCollapseBelow` it leaves the page, and (unless `asideCollapseTo="hidden"`) its children are drawn in a
 * `Drawer` that `AppShell.AsideToggle` opens. While the shell is `scroll="content"` it scrolls on its own.
 */
const AppShellAside = forwardRef<HTMLElement, AppShellAsideProps>(
  ({ children, width, labels: labelsProp, drawerContainer, className, style, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }, ref) => {
    const { scroll, dir, asideCollapseBelow, asideCollapseTo, asideOpen, setAsideOpen, asideToggleRef } = useAppShellContext();
    const labels = mergeDefined(defaultAsideLabels, labelsProp);
    const innerRef = useRef<HTMLElement>(null);
    const scrolls = useIsScrollable(innerRef, "y");
    const size = width !== undefined ? toLength(width) : "var(--dbm-app-shell-aside-width)";
    const asDrawer = asideCollapseTo === "drawer" && asideCollapseBelow !== "never";

    // Past the width where the aside is back on the page, a drawer left open would sit over a column already on show.
    useEffect(() => {
      if (!asDrawer || !asideOpen || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
      const query = window.matchMedia(collapseQueries[asideCollapseBelow as Exclude<AppShellAsideCollapseBelow, "never">]);
      const close = () => {
        if (query.matches) setAsideOpen(false);
      };
      close();
      query.addEventListener?.("change", close);
      return () => query.removeEventListener?.("change", close);
    }, [asDrawer, asideOpen, asideCollapseBelow, setAsideOpen]);

    return (
      <>
        <aside
          {...props}
          ref={mergeRefs(innerRef, ref)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          // A scrolling aside is a tab stop for the same reason `main` is: a keyboard user can scroll a region with nothing focusable in it.
          tabIndex={scroll === "content" && scrolls ? 0 : undefined}
          className={cx(styles.aside, className)}
          style={{ ...(width !== undefined ? ({ "--app-shell-aside-size": size } as CSSProperties) : undefined), ...style }}
        >
          {children}
        </aside>
        {asDrawer && (
          <Drawer open={asideOpen} onOpenChange={(open) => setAsideOpen(open)}>
            <Drawer.Content
              side="end"
              size={size}
              dir={dir}
              container={drawerContainer}
              labels={{ close: labels.close }}
              aria-describedby={undefined}
              onCloseAutoFocus={(event) => {
                const toggle = asideToggleRef.current;
                if (toggle === null || !toggle.isConnected) return;
                event.preventDefault();
                toggle.focus();
              }}
            >
              <Drawer.Header>
                <Drawer.Title>{ariaLabel ?? labels.title}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>{children}</Drawer.Body>
            </Drawer.Content>
          </Drawer>
        )}
      </>
    );
  },
);
AppShellAside.displayName = "AppShell.Aside";

/**
 * The button that opens the aside's drawer below `asideCollapseBelow`: an `IconButton` that sits outside the aside (in the `Navbar`, a page
 * header). Gone while the aside is on the page, and always gone with `asideCollapseTo="hidden"`.
 */
const AppShellAsideToggle = forwardRef<HTMLButtonElement, AppShellAsideToggleProps>(
  ({ icon = SidebarSimpleIcon, variant = "ghost", tone, size = "md", labels: labelsProp, className, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const { asideOpen, setAsideOpen, asideToggleRef } = useAppShellContext();
    const labels = mergeDefined(defaultAsideToggleLabels, labelsProp);
    return (
      <IconButton
        {...props}
        ref={mergeRefs(asideToggleRef, ref)}
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
AppShellAsideToggle.displayName = "AppShell.AsideToggle";

/** The band below the main area, outside its scrolling. */
const AppShellFooter = forwardRef<HTMLElement, AppShellFooterProps>(({ className, ...props }, ref) => (
  <footer {...props} ref={ref} className={cx(styles.footer, className)} />
));
AppShellFooter.displayName = "AppShell.Footer";

type AppShellComponent = typeof AppShellRoot & {
  SkipLink: typeof AppShellSkipLink;
  Sidebar: typeof AppShellSidebar;
  Header: typeof AppShellHeader;
  Main: typeof AppShellMain;
  Aside: typeof AppShellAside;
  AsideToggle: typeof AppShellAsideToggle;
  Footer: typeof AppShellFooter;
};

export const AppShell: AppShellComponent = Object.assign(AppShellRoot, {
  SkipLink: AppShellSkipLink,
  Sidebar: AppShellSidebar,
  Header: AppShellHeader,
  Main: AppShellMain,
  Aside: AppShellAside,
  AsideToggle: AppShellAsideToggle,
  Footer: AppShellFooter,
});
