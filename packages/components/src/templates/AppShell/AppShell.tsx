import { cx } from "@dbm-system/utils";
import { forwardRef } from "react";
import { Sidebar } from "../../organisms/Sidebar";
import styles from "./AppShell.module.css";
import type {
  AppShellFooterProps,
  AppShellHeaderProps,
  AppShellMainProps,
  AppShellProps,
  AppShellSidebarProps,
} from "./AppShell.types";

/**
 * The page frame of an application: a sidebar column, a header, a main area and a footer, with the landmarks, the skip link target and the
 * phone menu wired up. It is layout and wiring only. You place your own `Sidebar` and `Navbar` in the slots and keep every prop they have;
 * the shell adds the grid, the one `<main>`, and the `Sidebar.Provider` that lets the `Navbar`'s menu button open the sidebar's phone panel.
 *
 * Slots: `AppShell.Header` (first in the markup, so the skip link is the first tab stop), `AppShell.Sidebar`, `AppShell.Main` and `AppShell.Footer`. By default the frame is as tall as the window and only
 * `AppShell.Main` scrolls (`scroll="content"`); with `scroll="page"` the page scrolls as a whole. Below the sidebar's `collapseBelow` width the
 * sidebar leaves the page and its column disappears, so the main area takes the full width.
 *
 * Landmarks: the `Navbar` is the `<header>` banner, each `Sidebar.Nav` a named `<nav>`, `AppShell.Main` the one `<main>` and `AppShell.Footer`
 * the `<footer>` contentinfo. Put `Navbar.SkipLink` first in the `Navbar`; it links to `#main`.
 *
 * Does not cover a bar of its own (use `Navbar`), a navigation column of its own (use `Sidebar`), or a page's content.
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <AppShell.Header>
 *     <Navbar>
 *       <Navbar.SkipLink />
 *       <Navbar.Brand>Acme</Navbar.Brand>
 *       <Sidebar.MenuButton />
 *     </Navbar>
 *   </AppShell.Header>
 *   <AppShell.Sidebar>
 *     <Sidebar currentPath="/reports">…</Sidebar>
 *   </AppShell.Sidebar>
 *   <AppShell.Main>
 *     <h1>Reports</h1>
 *   </AppShell.Main>
 * </AppShell>
 * ```
 */
const AppShellRoot = forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      children,
      scroll = "content",
      sidebarSide = "start",
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
      ...props
    },
    ref,
  ) => (
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
      <div
        {...props}
        ref={ref}
        dir={dir}
        data-scroll={scroll}
        data-sidebar-side={sidebarSide}
        className={cx(styles.root, className)}
      >
        {children}
      </div>
    </Sidebar.Provider>
  ),
);
AppShellRoot.displayName = "AppShell";

/** The column that holds the `Sidebar`. It takes the width of the sidebar and none at all while the sidebar is in its phone panel. */
const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.sidebar, className)} />
));
AppShellSidebar.displayName = "AppShell.Sidebar";

/** The band above the main area, for the `Navbar`. It does not scroll with the main area. */
const AppShellHeader = forwardRef<HTMLDivElement, AppShellHeaderProps>(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cx(styles.header, className)} />
));
AppShellHeader.displayName = "AppShell.Header";

/** The page's one `<main>`. It scrolls on its own when the shell is `scroll="content"`, and is the skip link's target. */
const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(({ id = "main", className, ...props }, ref) => (
  // `tabIndex={-1}` lets the skip link move keyboard focus here; `main` is not a control, so it is not a tab stop and draws no ring.
  <main {...props} ref={ref} id={id} tabIndex={-1} className={cx(styles.main, className)} />
));
AppShellMain.displayName = "AppShell.Main";

/** The band below the main area, outside its scrolling. */
const AppShellFooter = forwardRef<HTMLElement, AppShellFooterProps>(({ className, ...props }, ref) => (
  <footer {...props} ref={ref} className={cx(styles.footer, className)} />
));
AppShellFooter.displayName = "AppShell.Footer";

type AppShellComponent = typeof AppShellRoot & {
  Sidebar: typeof AppShellSidebar;
  Header: typeof AppShellHeader;
  Main: typeof AppShellMain;
  Footer: typeof AppShellFooter;
};

export const AppShell: AppShellComponent = Object.assign(AppShellRoot, {
  Sidebar: AppShellSidebar,
  Header: AppShellHeader,
  Main: AppShellMain,
  Footer: AppShellFooter,
});
