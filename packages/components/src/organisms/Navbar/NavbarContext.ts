import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { NavbarCurrentVariant, NavbarLabels, NavbarLinkSize, NavbarProps, NavbarSize, NavbarVariant } from "./Navbar.types";

export const defaultLabels: NavbarLabels = {
  menu: "Menu",
  navigation: "Main",
  close: "Close",
  skipLink: "Skip to content",
  externalLink: "(opens in a new tab)",
  search: "Search",
};

export interface NavbarContextValue {
  labels: NavbarLabels;
  /** The bar's own settings, which every row starts from. */
  variant: NavbarVariant;
  size: NavbarSize;
  /** The bar's own `linkSize`, when it sets one. */
  linkSize: NavbarLinkSize | undefined;
  contained: boolean;
  closeMenuOnNavigate: boolean;
  currentVariant: NavbarCurrentVariant;
  rounded: boolean;
  menuSide: NonNullable<NavbarProps["menuSide"]>;
  dir: NonNullable<NavbarProps["dir"]>;
  menuContainer: HTMLElement | null | undefined;
  /** The menu panel's body element once it is drawn, where each `Navbar.Links` puts its copy of its links. */
  panelBody: HTMLElement | null;
  setPanelBody: (body: HTMLElement | null) => void;
  /** Where `quiet` links put theirs, after all the others, so a courtesy row's links come last in the panel in the DOM as on screen. */
  panelQuietBody: HTMLElement | null;
  setPanelQuietBody: (body: HTMLElement | null) => void;
  /** The menu panel's footer element once it is drawn, where `Navbar.PanelActions` puts its children. */
  panelFooter: HTMLElement | null;
  setPanelFooter: (footer: HTMLElement | null) => void;
  /** Whether a `Navbar.PanelActions` is among the bar's children, so the panel draws a footer for it. */
  hasPanelActions: boolean;
  /** Which row (by position) draws the automatic menu button, and the button itself; `null` when there is none to draw. */
  menuButtonRow: number | null;
  autoMenuButton: ReactNode;
  /** Closes the phone menu from inside it (a link chosen). */
  closeMenu: () => void;
}

export const NavbarContext = createContext<NavbarContextValue | null>(null);

/** The position of a `Navbar.Row` among the bar's rows, set by the bar around each one. */
export const NavbarRowIndexContext = createContext(0);

/** The size of the row a part is in, which a menu button or a search button takes as its own. */
export const NavbarRowContext = createContext<{ size: NavbarSize; linkSize: NavbarLinkSize | undefined } | null>(null);

/** What a set of links resolved its link size to (`explicit` when someone set one), for the links and a group inside it to read. */
export const NavbarLinkSizeContext = createContext<{ size: NavbarLinkSize; explicit: boolean } | null>(null);

/** The look a set of links gave itself (`currentVariant`, `rounded`), for the links and a group inside it in the bar to read; none outside one, or in the panel. */
export const NavbarLinksLookContext = createContext<{ currentVariant: NavbarCurrentVariant; rounded: boolean } | null>(null);

/** True for the links drawn in the menu panel, which close it when chosen. */
export const NavbarPanelContext = createContext(false);

/**
 * Set inside the floating list a `Navbar.Group` opens in the bar, where its links are menu items and not list items; the value
 * closes that list. `Menu` closes itself when an item is chosen, but not when the item's own click handler called
 * `preventDefault` (the way a router's link does), so a link closes it by hand then.
 */
export const NavbarMenuContext = createContext<(() => void) | null>(null);

export function useNavbarContext(part: string): NavbarContextValue {
  const context = useContext(NavbarContext);
  if (context === null) {
    throw new Error(`${part} must be used inside <Navbar>.`);
  }
  return context;
}
