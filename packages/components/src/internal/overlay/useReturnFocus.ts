import { useCallback, useRef } from "react";
import { menuInvokerOf } from "./menuInvokers";

/**
 * The element that asked for an overlay, found from where focus is as it opens. Usually that is just the focused
 * element. When focus is inside a menu (an item chosen to open a dialog), the menu is about to unmount and takes
 * that item with it, so the invoker is the menu's own trigger, which a menu names itself by (`aria-labelledby`).
 * A submenu is named by its trigger item, so this follows the chain up to the first element outside any menu. A
 * context menu has no trigger to be named by; it records the element it was opened on (`registerMenuInvoker`).
 */
function findInvoker(): HTMLElement | null {
  let element = document.activeElement as HTMLElement | null;
  for (let depth = 0; element && depth < 6; depth += 1) {
    const menu = element.closest('[role="menu"]');
    if (!menu) break;
    const labelledBy = menu.getAttribute("aria-labelledby");
    const named = (labelledBy ? document.getElementById(labelledBy) : null) ?? menuInvokerOf(menu);
    if (!named) break;
    element = named;
  }
  return element && element !== document.body ? element : null;
}

/**
 * Gives focus back to whatever asked for an overlay when it closes. Radix returns focus only to the overlay's own
 * `Trigger`, so one opened from state (a confirmation chosen from a menu, a row action, a shortcut) closed with focus
 * on the page's `body` and the person lost their place.
 *
 * `remember` is called as the overlay takes focus, and `restore` as it gives it up. A caller that handled
 * `onCloseAutoFocus` itself and called `preventDefault()` keeps what it chose, and nothing is done when the element is
 * gone or there was no invoker to go back to, in which case Radix's own return to its trigger stands.
 */
export function useReturnFocus() {
  const invoker = useRef<HTMLElement | null>(null);
  const remember = useCallback(() => {
    invoker.current = findInvoker();
  }, []);
  const restore = useCallback((event: Event) => {
    const target = invoker.current;
    invoker.current = null;
    if (event.defaultPrevented || !target || !target.isConnected) return;
    event.preventDefault();
    target.focus();
  }, []);
  return { remember, restore };
}
