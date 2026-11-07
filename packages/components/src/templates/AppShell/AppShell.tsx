import { SidebarSimpleIcon, TrayIcon, WarningCircleIcon } from "@dbm-system/icons";
import { cx, mergeDefined, mergeRefs, useAnnouncement, useIsScrollable } from "@dbm-system/utils";
import { Children, forwardRef, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { Container } from "../../atoms/Container";
import { DirectionProvider, useDirection } from "../../atoms/DirectionProvider";
import { IconButton } from "../../atoms/IconButton";
import { ProgressBar } from "../../atoms/ProgressBar";
import { VisuallyHidden } from "../../atoms/VisuallyHidden";
import { EmptyState } from "../../molecules/EmptyState";
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
  AppShellBannerProps,
  AppShellContentProps,
  AppShellFooterProps,
  AppShellHeaderProps,
  AppShellMainLabels,
  AppShellMainProps,
  AppShellProps,
  AppShellSidebarLabels,
  AppShellSidebarProps,
  AppShellSkipLinkLabels,
  AppShellSkipLinkProps,
  AppShellStateProps,
} from "./AppShell.types";

const defaultAsideLabels: AppShellAsideLabels = { title: "Details", close: "Close" };
const defaultAsideToggleLabels: AppShellAsideToggleLabels = { open: "Show details" };
const defaultSkipLinkLabels: AppShellSkipLinkLabels = { skipToContent: "Skip to content" };
const defaultSidebarLabels: AppShellSidebarLabels = { resize: "Resize sidebar" };
const defaultMainLabels: AppShellMainLabels = { loading: "Loading" };

// Before paint where there is a browser, so a remembered layout or a rail is in place on the first frame and nothing jumps; the plain effect on
// the server, where a layout effect warns in React 18 and does nothing useful.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The shell's own storage entry: the reader's collapsed state and the sidebar's width. Anything unreadable is ignored. */
interface StoredLayout {
  collapsed?: boolean;
  width?: number;
}

function readLayout(key: string): StoredLayout {
  try {
    const raw = window.localStorage.getItem(`dbm-app-shell:${key}`);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const { collapsed, width } = parsed as Record<string, unknown>;
    return {
      ...(typeof collapsed === "boolean" ? { collapsed } : {}),
      ...(typeof width === "number" && Number.isFinite(width) && width > 0 ? { width } : {}),
    };
  } catch {
    return {};
  }
}

function writeLayout(key: string, patch: StoredLayout & { clearWidth?: boolean }) {
  try {
    const { clearWidth, ...rest } = patch;
    const next = { ...readLayout(key), ...rest };
    if (clearWidth) delete next.width;
    window.localStorage.setItem(`dbm-app-shell:${key}`, JSON.stringify(next));
  } catch {
    // storage is full, blocked or disabled: the layout is just not remembered
  }
}

/** The page's `rem` in pixels (16 where the browser reports nothing, as a test document does). */
function rootFontSize(): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/** A length in pixels from a number or a `rem` or `px` string, or `fallback` when it is none of those. */
function toPixels(value: number | string | undefined, fallback: number): number {
  if (typeof value === "number") return value;
  const match = typeof value === "string" ? /^\s*([\d.]+)\s*(rem|px)\s*$/.exec(value) : null;
  if (match === null) return fallback;
  const amount = Number.parseFloat(match[1] as string);
  return match[2] === "rem" ? amount * rootFontSize() : amount;
}

// The widths the aside's collapse steps stand for: the literal values of the breakpoint tokens (a media query can't read a custom property),
// as `Sidebar` and `Drawer` write them.
const breakpointQueries: Record<Exclude<AppShellAsideCollapseBelow, "never">, string> = {
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
      railBelow = "never",
      persistKey,
      sidebarWidth: sidebarWidthProp,
      defaultSidebarWidth,
      onSidebarWidthChange,
      scrolledEdge = true,
      asideCollapseBelow = "lg",
      asideCollapseTo = "drawer",
      asideOpen: asideOpenProp,
      defaultAsideOpen = false,
      onAsideOpenChange,
      pageKey,
      pageTitle,
      dir: dirProp,
      collapsed: collapsedProp,
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
    // The direction of the shell: its own, else the nearest `DirectionProvider`'s, else left to right. Everything inside gets it from a provider.
    const dir = useDirection(dirProp);

    // With `scroll="page"` a header, a banner or a footer can only stay in view if its grid area is as tall as the whole shell, so the shell needs
    // their heights to keep their rows that size. Zero (the server render, the first client render) leaves each in its own row, unstuck.
    const [headerHeight, setHeaderHeight] = useState(0);
    const [bannerHeight, setBannerHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);
    const [bannerSticky, setBannerSticky] = useState(false);
    const measured = scroll === "page" && headerHeight > 0;
    const bannerMeasured = scroll === "page" && bannerHeight > 0;
    const footerMeasured = scroll === "page" && footerHeight > 0;

    // The sidebar's collapsed state is the shell's, controlled by `collapsed` or held here, so the shell can also collapse it by itself (`railBelow`)
    // and restore it (`persistKey`). Whoever changes it is told through `onCollapsedChange`; only the reader's own changes are remembered.
    const [collapsedState, setCollapsedState] = useState(defaultCollapsed ?? false);
    const collapsed = collapsedProp ?? collapsedState;
    const collapsedRef = useRef(collapsed);
    collapsedRef.current = collapsed;
    const persistKeyRef = useRef(persistKey);
    persistKeyRef.current = persistKey;
    const changeCollapsed = useCallback(
      (next: boolean, source: "reader" | "auto" | "restore") => {
        if (next === collapsedRef.current) return;
        if (collapsedProp === undefined) setCollapsedState(next);
        else if (source === "restore") return; // a collapsed state the app holds is the app's to restore
        collapsedRef.current = next;
        onCollapsedChange?.(next);
        if (source === "reader" && persistKeyRef.current !== undefined) writeLayout(persistKeyRef.current, { collapsed: next });
      },
      [collapsedProp, onCollapsedChange],
    );
    const setCollapsed = useCallback((next: boolean) => changeCollapsed(next, "reader"), [changeCollapsed]);

    // The sidebar's width in pixels, once resized: controlled by `sidebarWidth` or held here.
    const [widthState, setWidthState] = useState<number | undefined>(defaultSidebarWidth);
    const sidebarWidth = sidebarWidthProp ?? widthState;
    const setSidebarWidth = useCallback(
      (next: number | undefined) => {
        if (sidebarWidthProp === undefined) setWidthState(next);
        onSidebarWidthChange?.(next);
        if (persistKeyRef.current !== undefined) {
          if (next === undefined) writeLayout(persistKeyRef.current, { clearWidth: true });
          else writeLayout(persistKeyRef.current, { width: next });
        }
      },
      [sidebarWidthProp, onSidebarWidthChange],
    );

    // The remembered layout, applied once on the page (so the server's render and the first client render agree), before paint. A width the app
    // controls is not touched. What was remembered wins over `railBelow` for the first frame; the first crossing of the step after that wins back.
    const rememberedCollapsed = useRef<boolean | undefined>(undefined);
    // Until the first frames have been drawn the sidebar's own width transition is off, so a restored width or an automatic rail is just there
    // on load and does not slide into place.
    const [settled, setSettled] = useState(persistKey === undefined && railBelow === "never");
    useEffect(() => {
      if (settled) return undefined;
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setSettled(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }, [settled]);
    useBeforePaint(() => {
      if (persistKey === undefined) return;
      const stored = readLayout(persistKey);
      rememberedCollapsed.current = stored.collapsed;
      if (stored.collapsed !== undefined) changeCollapsed(stored.collapsed, "restore");
      if (stored.width !== undefined && sidebarWidthProp === undefined) setWidthState(stored.width);
    }, []);

    // `railBelow`: the sidebar is a rail below the step and expanded above it, set when the page loads (unless a layout was remembered) and each
    // time the window crosses the step. In between the reader's own toggle holds.
    const changeCollapsedRef = useRef(changeCollapsed);
    changeCollapsedRef.current = changeCollapsed;
    useBeforePaint(() => {
      if (railBelow === "never" || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
      const query = window.matchMedia(breakpointQueries[railBelow]);
      if (rememberedCollapsed.current === undefined) changeCollapsedRef.current(!query.matches, "auto");
      const onChange = () => changeCollapsedRef.current(!query.matches, "auto");
      query.addEventListener?.("change", onChange);
      return () => query.removeEventListener?.("change", onChange);
    }, [railBelow]);

    // The header's and the main area's scrolling: whether the content is scrolled down from its top, and whether there is more below.
    const mainRef = useRef<HTMLElement | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [moreBelow, setMoreBelow] = useState(false);
    useEffect(() => {
      if (typeof window === "undefined") return undefined;
      const main = mainRef.current;
      const read = () => {
        if (scroll === "content" && main !== null) {
          setScrolled(main.scrollTop > 0.5);
          setMoreBelow(main.scrollTop + main.clientHeight < main.scrollHeight - 1);
        } else if (scroll === "page") {
          const page = document.documentElement;
          setScrolled(window.scrollY > 0.5);
          setMoreBelow(window.scrollY + window.innerHeight < page.scrollHeight - 1);
        }
      };
      read();
      const target: HTMLElement | Window = scroll === "content" && main !== null ? main : window;
      target.addEventListener("scroll", read, { passive: true });
      window.addEventListener("resize", read);
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
      if (scroll === "content" && main !== null) {
        observer?.observe(main);
        if (main.firstElementChild) observer?.observe(main.firstElementChild);
      } else {
        observer?.observe(document.documentElement);
      }
      return () => {
        target.removeEventListener("scroll", read);
        window.removeEventListener("resize", read);
        observer?.disconnect();
      };
    }, [scroll]);

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
        bannerHeight: scroll === "page" ? bannerHeight : 0,
        footerHeight: scroll === "page" ? footerHeight : 0,
        collapsed,
        setCollapsed,
        sidebarWidth,
        setSidebarWidth,
        scrolled,
        moreBelow,
        asideOpen,
        setAsideOpen,
        setHeaderHeight,
        setBannerHeight,
        setFooterHeight,
        setBannerSticky,
        dir,
        sidebarSide,
        asideCollapseBelow,
        asideCollapseTo,
        mainRef,
        asideToggleRef,
        inShell: true,
      }),
      [
        scroll,
        headerHeight,
        bannerHeight,
        footerHeight,
        collapsed,
        setCollapsed,
        sidebarWidth,
        setSidebarWidth,
        scrolled,
        moreBelow,
        asideOpen,
        setAsideOpen,
        dir,
        sidebarSide,
        asideCollapseBelow,
        asideCollapseTo,
      ],
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

    const rootStyle = {
      ...(measured ? { "--app-shell-header-height": `${headerHeight}px` } : undefined),
      ...(bannerMeasured ? { "--app-shell-banner-height": `${bannerHeight}px` } : undefined),
      // What the header, the sidebar and the aside stick below: the banner, but only while the banner itself stays in view.
      ...(bannerMeasured && bannerSticky ? { "--app-shell-banner-stick": `${bannerHeight}px` } : undefined),
      ...(footerMeasured ? { "--app-shell-footer-height": `${footerHeight}px` } : undefined),
    } as CSSProperties;

    return (
      <DirectionProvider dir={dir}>
        <Sidebar.Provider
          collapsed={collapsed}
          onCollapsedChange={(next) => changeCollapsed(next, "reader")}
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
              data-banner-measured={bannerMeasured ? "" : undefined}
              data-banner-sticky={bannerSticky ? "" : undefined}
              data-footer-measured={footerMeasured ? "" : undefined}
              data-restoring={settled ? undefined : ""}
              data-scrolled-edge={scrolledEdge ? "" : undefined}
              data-scrolled={scrolled ? "" : undefined}
              data-more-below={moreBelow ? "" : undefined}
              className={cx(styles.root, className)}
              style={{ ...rootStyle, ...style }}
            >
              {children}
              {pageKey !== undefined && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
            </div>
          </AppShellContext.Provider>
        </Sidebar.Provider>
      </DirectionProvider>
    );
  },
);
AppShellRoot.displayName = "AppShell";

/**
 * The column that holds the `Sidebar`. It takes the width of the sidebar and none at all while the sidebar is in its phone panel. With
 * `resizable` the reader can drag its inner edge, or use the arrow keys, to set the width.
 */
const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
  ({ resizable = false, minWidth, maxWidth, labels: labelsProp, className, style, children, ...props }, ref) => {
    const { sidebarWidth, setSidebarWidth, collapsed, dir, sidebarSide } = useAppShellContext();
    const labels = mergeDefined(defaultSidebarLabels, labelsProp);
    const slotRef = useRef<HTMLDivElement>(null);
    const [slotWidth, setSlotWidth] = useState(0);
    const [dragging, setDragging] = useState(false);

    // How wide the column is on the page: nothing while the sidebar is in its phone panel, so there is no handle to drag there.
    useEffect(() => {
      const slot = slotRef.current;
      if (!resizable || slot === null) return undefined;
      const read = () => setSlotWidth(slot.getBoundingClientRect().width);
      read();
      if (typeof ResizeObserver === "undefined") return undefined;
      const observer = new ResizeObserver(read);
      observer.observe(slot);
      return () => observer.disconnect();
    }, [resizable]);

    useEffect(() => {
      if (process.env.NODE_ENV === "production" || !resizable) return;
      if (Children.toArray(children).some((child) => isValidElement(child) && (child.props as { width?: unknown }).width !== undefined)) {
        console.warn("AppShell: `AppShell.Sidebar` is `resizable`, so its width is the shell's. A `width` on the `Sidebar` inside wins over it and the handle seems to do nothing. Leave `width` off.");
      }
    }, [resizable, children]);

    // The handle's bounds, read when it is used (rem is the page's font size).
    const bounds = () => {
      const min = toPixels(minWidth, toPixels("12rem", 192));
      const max = Math.max(min, toPixels(maxWidth, toPixels("28rem", 448)));
      return { min, max };
    };
    const clamp = (width: number) => {
      const { min, max } = bounds();
      return Math.round(Math.min(max, Math.max(min, width)));
    };
    // Which way is wider: toward the content. A start-side sidebar in left-to-right text is widened by moving right, and each of the other
    // three arrangements flips it.
    const growsRightward = (sidebarSide === "start") === (dir === "ltr");

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      try {
        // The drag keeps hearing the pointer when it leaves the handle. A pointer that has already ended, or a synthetic one (a test's), cannot be
        // captured, and the drag works without it for as long as the pointer is over the handle.
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* see above */
      }
      setDragging(true);
    };
    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging || slotRef.current === null) return;
      const rect = slotRef.current.getBoundingClientRect();
      setSidebarWidth(clamp(growsRightward ? event.clientX - rect.left : rect.right - event.clientX));
    };
    const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      try {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* the capture was never taken, or is already gone */
      }
    };
    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const { min, max } = bounds();
      const current = sidebarWidth ?? slotWidth;
      const step = rootFontSize() * (event.shiftKey ? 4 : 1);
      let next: number | undefined;
      if (event.key === "ArrowRight") next = current + (growsRightward ? step : -step);
      else if (event.key === "ArrowLeft") next = current + (growsRightward ? -step : step);
      else if (event.key === "Home") next = min;
      else if (event.key === "End") next = max;
      else return;
      event.preventDefault();
      setSidebarWidth(clamp(next));
    };

    const showHandle = resizable && !collapsed && slotWidth > 0;
    const { min, max } = showHandle ? bounds() : { min: 0, max: 0 };
    return (
      <div
        {...props}
        ref={mergeRefs(slotRef, ref)}
        data-side={sidebarSide}
        data-resizable={resizable ? "" : undefined}
        data-dragging={dragging ? "" : undefined}
        className={cx(styles.sidebar, className)}
        style={{ ...(sidebarWidth !== undefined ? ({ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties) : undefined), ...style }}
      >
        {children}
        {showHandle && (
          // A separator that takes focus and reports a value is the WAI-ARIA window splitter, an interactive widget; the lint rules know it as plain.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={labels.resize}
            aria-valuenow={Math.round(slotWidth)}
            aria-valuemin={Math.round(min)}
            aria-valuemax={Math.round(max)}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className={styles.resizeHandle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            onDoubleClick={() => setSidebarWidth(undefined)}
          />
        )}
      </div>
    );
  },
);
AppShellSidebar.displayName = "AppShell.Sidebar";

/**
 * A strip above everything, the header included: an announcement, a maintenance notice, a trial reminder (usually an `Alert`). It scrolls away
 * with the page unless it is `sticky`, in which case the header sticks below it. With `scroll="content"` it is always in view.
 */
const AppShellBanner = forwardRef<HTMLDivElement, AppShellBannerProps>(({ sticky = false, className, ...props }, ref) => {
  const { scroll, setBannerHeight, setBannerSticky } = useAppShellContext();
  const innerRef = useRef<HTMLDivElement>(null);
  useElementHeight(scroll === "page" && sticky, innerRef, setBannerHeight);
  useBeforePaint(() => {
    setBannerSticky(sticky);
    return () => setBannerSticky(false);
  }, [sticky, setBannerSticky]);
  return <div {...props} ref={mergeRefs(innerRef, ref)} data-sticky={sticky ? "" : undefined} className={cx(styles.banner, className)} />;
});
AppShellBanner.displayName = "AppShell.Banner";

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

/**
 * The page's one `<main>`. It scrolls on its own when the shell is `scroll="content"`, and is the skip link's target. `busy` marks it as loading:
 * `aria-busy`, a thin bar along its top edge and a polite announcement, without hiding what is already there.
 */
const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(({ id = "main", busy, labels: labelsProp, className, children, ...props }, ref) => {
  const { scroll, mainRef } = useAppShellContext();
  const labels = mergeDefined(defaultMainLabels, labelsProp);
  const innerRef = useRef<HTMLElement>(null);
  const scrolls = useIsScrollable(innerRef, "y");
  // The skip link needs `main` to take focus (`-1`). While it scrolls it is also a tab stop (`0`), so a keyboard user can scroll a page with
  // nothing focusable in it; one that fits, or a page that scrolls as a whole, gets no extra stop.
  return (
    <main
      {...props}
      ref={mergeRefs(innerRef, mainRef, ref)}
      id={id}
      aria-busy={busy ? true : undefined}
      data-busy={busy ? "" : undefined}
      tabIndex={scroll === "content" && scrolls ? 0 : -1}
      className={cx(styles.main, className)}
    >
      {busy && (
        // Zero tall and stuck to the top, so the bar is along the main area's edge however far the content has scrolled, and takes no room.
        <div className={styles.busyBar} aria-hidden="true">
          <ProgressBar size="xs" tone="brand" label={labels.loading} />
        </div>
      )}
      {/* The region is there before it has anything to say, so that "Loading" is a change a screen reader announces and not a first appearance. */}
      {busy !== undefined && <VisuallyHidden role="status">{busy ? labels.loading : ""}</VisuallyHidden>}
      {children}
    </main>
  );
});
AppShellMain.displayName = "AppShell.Main";

/**
 * A whole-page state for the main area: nothing to show yet (`empty`) or something failed (`error`). Put it inside `AppShell.Main` in place of
 * the page; the sidebar, the header and the rest of the shell stay. It is an `EmptyState` filling and centring the main area; an error is in the
 * danger tone and is announced to a screen reader when it appears.
 */
const AppShellState = forwardRef<HTMLDivElement, AppShellStateProps>(
  ({ kind = "empty", title, description, icon, actions, level = 1, className, ...props }, ref) => (
    <div {...props} ref={ref} data-kind={kind} className={cx(styles.state, className)}>
      <EmptyState size="lg" tone={kind === "error" ? "danger" : "neutral"} announce={kind === "error"}>
        <EmptyState.Icon icon={icon ?? (kind === "error" ? WarningCircleIcon : TrayIcon)} />
        <EmptyState.Title level={level}>{title}</EmptyState.Title>
        {description !== undefined && <EmptyState.Description>{description}</EmptyState.Description>}
        {actions !== undefined && <EmptyState.Actions>{actions}</EmptyState.Actions>}
      </EmptyState>
    </div>
  ),
);
AppShellState.displayName = "AppShell.State";

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
    const asideDrawerRef = useRef<HTMLDivElement>(null);
    const scrolls = useIsScrollable(innerRef, "y");
    const size = width !== undefined ? toLength(width) : "var(--dbm-app-shell-aside-width)";
    const asDrawer = asideCollapseTo === "drawer" && asideCollapseBelow !== "never";

    // Past the width where the aside is back on the page, a drawer left open would sit over a column already on show.
    useEffect(() => {
      if (!asDrawer || !asideOpen || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
      const query = window.matchMedia(breakpointQueries[asideCollapseBelow as Exclude<AppShellAsideCollapseBelow, "never">]);
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
              ref={asideDrawerRef}
              onCloseAutoFocus={(event) => {
                // Focus goes back to the toggle only if it is still in the drawer or has fallen to the page; a page change that moved it to the main
                // area while the drawer was closing has put it where the reader should be (`06` §9).
                const toggle = asideToggleRef.current;
                if (toggle === null || !toggle.isConnected) return;
                event.preventDefault();
                const active = document.activeElement;
                if (active === null || active === document.body || asideDrawerRef.current?.contains(active)) toggle.focus();
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

/**
 * The band below the main area, outside its scrolling. With `sticky` it stays at the bottom of the window while the page scrolls
 * (`scroll="page"`), for a bar of actions that must stay in reach.
 */
const AppShellFooter = forwardRef<HTMLElement, AppShellFooterProps>(({ sticky = false, className, ...props }, ref) => {
  const { scroll, setFooterHeight } = useAppShellContext();
  const innerRef = useRef<HTMLElement>(null);
  useElementHeight(scroll === "page" && sticky, innerRef, setFooterHeight);
  return <footer {...props} ref={mergeRefs(innerRef, ref)} data-sticky={sticky ? "" : undefined} className={cx(styles.footer, className)} />;
});
AppShellFooter.displayName = "AppShell.Footer";

/**
 * The page's content in the main area, kept to a readable width and padded on the spacing scale: a `Container` with padding above and below
 * as well. Put it inside `AppShell.Main`, which adds none of its own.
 */
const AppShellContent = forwardRef<HTMLDivElement, AppShellContentProps>(
  ({ size = "full", paddingInline = { base: 4, md: 6, lg: 8 }, paddingBlock = 6, style, ...props }, ref) => (
    <Container
      {...props}
      ref={ref}
      size={size}
      paddingInline={paddingInline}
      style={{ paddingBlock: `var(--dbm-space-${paddingBlock})`, ...style }}
    />
  ),
);
AppShellContent.displayName = "AppShell.Content";

type AppShellComponent = typeof AppShellRoot & {
  SkipLink: typeof AppShellSkipLink;
  Banner: typeof AppShellBanner;
  Sidebar: typeof AppShellSidebar;
  Header: typeof AppShellHeader;
  Main: typeof AppShellMain;
  State: typeof AppShellState;
  Content: typeof AppShellContent;
  Aside: typeof AppShellAside;
  AsideToggle: typeof AppShellAsideToggle;
  Footer: typeof AppShellFooter;
};

export const AppShell: AppShellComponent = Object.assign(AppShellRoot, {
  SkipLink: AppShellSkipLink,
  Banner: AppShellBanner,
  Sidebar: AppShellSidebar,
  Header: AppShellHeader,
  Main: AppShellMain,
  State: AppShellState,
  Content: AppShellContent,
  Aside: AppShellAside,
  AsideToggle: AppShellAsideToggle,
  Footer: AppShellFooter,
});
