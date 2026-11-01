import { createContext, useContext } from "react";

/**
 * What a `Navbar.Links` hands to a `NavigationMenu` drawn inside it, so the menu follows the bar it is in: one current-link look,
 * one rounding, one direction, and, in the bar's menu panel, the stacked form that closes the panel when a link is chosen.
 * Defined here, beside neither component, because `NavigationMenu` may not import a private file of `Navbar`.
 */
export interface NavigationEmbed {
  currentVariant: "subtle" | "underline" | "solid";
  rounded: boolean;
  dir: "ltr" | "rtl";
  /** True for the copy drawn in the bar's menu panel on a phone, where a floating panel is awkward. */
  inPanel: boolean;
  /** Closes the bar's menu panel; a link chosen in the panel calls it. `null` when the bar keeps the panel open. */
  closePanel: (() => void) | null;
}

export const NavigationEmbedContext = createContext<NavigationEmbed | null>(null);

/** The bar a `NavigationMenu` is drawn inside, or `null` when it stands alone. */
export function useNavigationEmbed(): NavigationEmbed | null {
  return useContext(NavigationEmbedContext);
}
