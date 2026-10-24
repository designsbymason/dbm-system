import { createContext, type MutableRefObject } from "react";
import type { ContextMenuController } from "./ContextMenu.types";

/** The controller of the nearest `ContextMenu`, `null` outside one. */
export const ContextMenuControllerContext = createContext<ContextMenuController | null>(null);

/** The element the nearest `ContextMenu.Trigger` rendered, which the controller sends its `contextmenu` event to. */
export const ContextMenuTriggerNodeContext = createContext<MutableRefObject<HTMLElement | null>>({ current: null });

/** What a controller does outside any menu: nothing, and says so by returning `false`. */
export const INERT_CONTROLLER: ContextMenuController = {
  openAt: () => false,
  openFrom: () => false,
  close: () => undefined,
  open: false,
};

const MODIFIER_NAMES: Record<string, "ctrlKey" | "altKey" | "shiftKey" | "metaKey"> = {
  control: "ctrlKey",
  ctrl: "ctrlKey",
  alt: "altKey",
  option: "altKey",
  shift: "shiftKey",
  meta: "metaKey",
  cmd: "metaKey",
  command: "metaKey",
};

/**
 * Whether a key event is the combination `combo` names (`"Alt+ArrowDown"`): the key itself, compared without regard to
 * case, and exactly the modifiers written, so `"Enter"` does not match Shift+Enter.
 */
export function matchesKeyCombo(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">, combo: string): boolean {
  const parts = combo.split("+").map((part) => part.trim());
  const key = parts.pop();
  if (!key) return false;
  const wanted = { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false };
  for (const part of parts) {
    const modifier = MODIFIER_NAMES[part.toLowerCase()];
    if (!modifier) return false;
    wanted[modifier] = true;
  }
  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    event.ctrlKey === wanted.ctrlKey &&
    event.altKey === wanted.altKey &&
    event.shiftKey === wanted.shiftKey &&
    event.metaKey === wanted.metaKey
  );
}
