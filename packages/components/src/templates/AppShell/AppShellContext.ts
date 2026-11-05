import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type {
  AppShellAsideCollapseBelow,
  AppShellAsideCollapseTo,
  AppShellDirection,
  AppShellSidebarSide,
  AppShellState,
} from "./AppShell.types";

/** What the shell tells its slots, beyond what `useAppShell()` returns to an app. */
export interface AppShellContextValue extends AppShellState {
  /** Called by `AppShell.Header` with its height in pixels (and with `0` when it unmounts), so the shell can keep it in view. */
  setHeaderHeight: (height: number) => void;
  /** Called by `AppShell.Banner` (and `AppShell.Footer`, when sticky) with its height, as the header does. */
  setBannerHeight: (height: number) => void;
  setFooterHeight: (height: number) => void;
  /** Whether a banner is on the page, and whether it is sticky: the header sticks below it only then. */
  setBannerSticky: (sticky: boolean) => void;
  dir: AppShellDirection;
  sidebarSide: AppShellSidebarSide;
  asideCollapseBelow: AppShellAsideCollapseBelow;
  asideCollapseTo: AppShellAsideCollapseTo;
  /** The shell's `<main>`, set by `AppShell.Main`, for moving focus to it on a page change. */
  mainRef: RefObject<HTMLElement | null>;
  /** The button that opened the aside's drawer, which gets focus back when it closes. Set by `AppShell.AsideToggle`. */
  asideToggleRef: RefObject<HTMLElement | null>;
  /** Whether the shell is there at all: a slot drawn outside one gets the defaults below rather than throwing. */
  inShell: boolean;
}

const fallback: AppShellContextValue = {
  scroll: "content",
  headerHeight: 0,
  bannerHeight: 0,
  footerHeight: 0,
  collapsed: false,
  setCollapsed: () => {},
  sidebarWidth: undefined,
  setSidebarWidth: () => {},
  scrolled: false,
  moreBelow: false,
  asideOpen: false,
  setAsideOpen: () => {},
  setHeaderHeight: () => {},
  setBannerHeight: () => {},
  setFooterHeight: () => {},
  setBannerSticky: () => {},
  dir: "ltr",
  sidebarSide: "start",
  asideCollapseBelow: "lg",
  asideCollapseTo: "drawer",
  mainRef: { current: null },
  asideToggleRef: { current: null },
  inShell: false,
};

export const AppShellContext = createContext<AppShellContextValue>(fallback);

/** The shell around a slot, for the slots themselves. */
export function useAppShellContext(): AppShellContextValue {
  return useContext(AppShellContext);
}

/**
 * The shell's state for the app: what scrolls, the header's height, and the aside's drawer. Read it from anywhere inside an `AppShell`, such as
 * a sticky toolbar in the main area or the button that opens the aside.
 *
 * @example
 * ```tsx
 * const { headerHeight, setAsideOpen } = useAppShell();
 * ```
 */
export function useAppShell(): AppShellState {
  const { inShell, scroll, headerHeight, bannerHeight, footerHeight, collapsed, setCollapsed, sidebarWidth, setSidebarWidth, scrolled, moreBelow, asideOpen, setAsideOpen } =
    useContext(AppShellContext);
  if (!inShell) throw new Error("useAppShell must be used inside an AppShell.");
  return { scroll, headerHeight, bannerHeight, footerHeight, collapsed, setCollapsed, sidebarWidth, setSidebarWidth, scrolled, moreBelow, asideOpen, setAsideOpen };
}
