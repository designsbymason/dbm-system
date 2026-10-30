import { useState, type ReactNode } from "react";
import type { Responsive } from "@dbm-system/utils";
import type { MenuPresentation } from "../Menu/Menu.types";
import { ContextMenu } from "../ContextMenu";

/**
 * One tab's context menu: the tab item is the menu's trigger, and the items are drawn only while the menu is open (and
 * through its exit), so a strip of many tabs holds a menu root per tab and nothing else until one is pressed.
 */
export function EditorTabsMenu({
  name,
  dir,
  presentation,
  renderItems,
  children,
}: {
  /** The panel's accessible name: what the menu is about. */
  name: string;
  /** The reading direction, passed to the menu and its submenus. */
  dir: "ltr" | "rtl";
  /** How the menu is drawn: at the pointer, or as a sheet across the bottom of the screen. */
  presentation: Responsive<MenuPresentation> | undefined;
  renderItems: () => ReactNode;
  /** The tab item, one element, which becomes the trigger. */
  children: ReactNode;
}) {
  // Drawn from the opening until the menu is out of the page, not only while open, so the items stay for the exit.
  const [active, setActive] = useState(false);
  return (
    <ContextMenu
      dir={dir}
      presentation={presentation}
      onOpenChange={(open) => {
        if (open) setActive(true);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) setActive(false);
      }}
    >
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Content aria-label={name}>{active ? renderItems() : null}</ContextMenu.Content>
    </ContextMenu>
  );
}
