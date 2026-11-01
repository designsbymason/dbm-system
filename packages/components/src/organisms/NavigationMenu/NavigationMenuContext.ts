import { createContext, useContext } from "react";
import type {
  NavigationMenuCurrentVariant,
  NavigationMenuDirection,
  NavigationMenuLabels,
  NavigationMenuPanelAlign,
  NavigationMenuSize,
} from "./NavigationMenu.types";

export const defaultLabels: NavigationMenuLabels = {
  navigation: "Main",
  externalLink: "(opens in a new tab)",
};

export interface NavigationMenuContextValue {
  /** The stacked form: disclosure buttons and nested links, no Radix primitive. */
  stacked: boolean;
  /** Drawn inside a `Navbar`'s links, so the root is a list item and the bar names the landmark. */
  embedded: boolean;
  viewport: boolean;
  panelAlign: NavigationMenuPanelAlign;
  size: NavigationMenuSize;
  currentVariant: NavigationMenuCurrentVariant;
  rounded: boolean;
  dir: NavigationMenuDirection;
  labels: NavigationMenuLabels;
  /** The open item's value (`""` for none). */
  value: string;
  setValue: (value: string) => void;
  /** Closes the surrounding bar's menu panel when a link is chosen in it; `null` outside one. */
  closePanel: (() => void) | null;
}

export const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null);

export function useNavigationMenuContext(part: string): NavigationMenuContextValue {
  const context = useContext(NavigationMenuContext);
  if (context === null) throw new Error(`${part} must be used inside NavigationMenu.`);
  return context;
}

/** What an item gives its trigger and panel. */
export interface NavigationMenuItemContextValue {
  value: string;
  /** The panel's id in the stacked form; the primitive makes its own in the other. */
  contentId: string;
}

export const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null);

/** True inside a panel, where a link is a row with a description and not a link in the bar. */
export const NavigationMenuContentContext = createContext(false);
