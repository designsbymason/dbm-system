import { createContext, useContext } from "react";
import type {
  NavigationMenuCurrentMatch,
  NavigationMenuCurrentVariant,
  NavigationMenuDirection,
  NavigationMenuLabels,
  NavigationMenuOrientation,
  NavigationMenuPanelSize,
  NavigationMenuSize,
} from "./NavigationMenu.types";

export const defaultLabels: NavigationMenuLabels = {
  navigation: "Main",
  externalLink: "(opens in a new tab)",
  togglePanel: (name) => `${name} menu`,
};

export interface NavigationMenuContextValue {
  /** The stacked form: disclosure buttons and nested links, no Radix primitive. */
  stacked: boolean;
  /** Drawn inside a `Navbar`'s links, so the root is a list item and the bar names the landmark. */
  embedded: boolean;
  viewport: boolean;
  /** Where panels sit once `auto` is settled. */
  panelAlign: "start" | "center" | "end";
  /** What the menu was asked for, for an item that has no choice of its own. */
  panelAlignChoice: "start" | "center" | "end" | "auto";
  panelSize: NavigationMenuPanelSize;
  orientation: NavigationMenuOrientation;
  indicator: boolean;
  exclusive: boolean;
  /** Whether the open item is controlled, so a disclosure shows only what `value` says. */
  controlled: boolean;
  /** Whether anything has been pressed, after which an item's `defaultOpen` no longer holds it open. */
  interacted: boolean;
  size: NavigationMenuSize;
  currentVariant: NavigationMenuCurrentVariant;
  rounded: boolean;
  dir: NavigationMenuDirection;
  labels: NavigationMenuLabels;
  delayDuration: number;
  currentPath: string | undefined;
  currentMatch: NavigationMenuCurrentMatch;
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
  /** Whether the item's panel is open, in either form. */
  open: boolean;
  /** Opens or closes the item's panel in the stacked form. */
  toggle: () => void;
  /** Whether a link in the item's panel is the current page. */
  holdsCurrent: boolean;
  /** Where this item's panel sits when it hangs from the item. */
  panelAlign: "start" | "center" | "end";
}

export const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null);

/** True inside a panel, where a link is a row with a description and not a link in the bar. */
export const NavigationMenuContentContext = createContext(false);
