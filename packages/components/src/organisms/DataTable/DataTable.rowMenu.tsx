import { useState, type ReactNode } from "react";
import { ContextMenu } from "../ContextMenu";

/**
 * One row's context menu: the row is the menu's trigger, and the items are drawn only while the menu is open (and
 * through its exit), so a table of many rows holds a menu root per row and nothing else until one is pressed.
 */
export function DataTableRowMenu({
  name,
  keys,
  onOpen,
  renderItems,
  children,
}: {
  /** The panel's accessible name: what the menu is about. */
  name: string;
  keys: string[] | undefined;
  /** Called as the menu opens, before its items are drawn: where the table chooses the row. */
  onOpen: () => void;
  renderItems: () => ReactNode;
  /** The row, one element, which becomes the trigger. */
  children: ReactNode;
}) {
  // Drawn from the opening until the menu is out of the page, not only while open, so the items stay for the exit.
  const [active, setActive] = useState(false);
  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) return;
        onOpen();
        setActive(true);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) setActive(false);
      }}
    >
      <ContextMenu.Trigger asChild openOnKeys={keys}>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Content aria-label={name}>{active ? renderItems() : null}</ContextMenu.Content>
    </ContextMenu>
  );
}
