/**
 * The element a menu was opened on, for a menu that has no trigger element of its own to be named by (a context
 * menu, opened on whatever was pressed). Keyed by the menu's panel in a `WeakMap`, so nothing outlives the panel and
 * no two providers or server renders share anything. `findInvoker` in `useReturnFocus` reads it.
 */
const invokers = new WeakMap<Element, HTMLElement>();

export function registerMenuInvoker(menu: Element, invoker: HTMLElement): void {
  invokers.set(menu, invoker);
}

export function menuInvokerOf(menu: Element): HTMLElement | undefined {
  return invokers.get(menu);
}
