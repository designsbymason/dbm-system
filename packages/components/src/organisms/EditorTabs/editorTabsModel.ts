import type { EditorTab } from "./EditorTabs.types";

/** The name a tab is announced by: its `aria-label`, its text label, its title, or its id. */
export function tabName(tab: EditorTab): string {
  if (tab["aria-label"]) return tab["aria-label"];
  if (typeof tab.label === "string" || typeof tab.label === "number") return String(tab.label);
  return tab.title ?? tab.id;
}

/** Whether a tab offers a close control: closable (not pinned unless it says so), not disabled. */
export function isClosable(tab: EditorTab): boolean {
  return !tab.disabled && (tab.closable ?? !tab.pinned);
}

/** How many tabs at the start are pinned. Pinned tabs are expected first; the count stops at the first one that isn't. */
export function pinnedCount(tabs: EditorTab[]): number {
  let count = 0;
  while (count < tabs.length && tabs[count]!.pinned) count += 1;
  return count;
}

/** The tab that takes over when `index` goes: the next enabled one, else the previous enabled one. */
export function neighbourId(tabs: EditorTab[], index: number): string | null {
  for (let next = index + 1; next < tabs.length; next += 1) if (!tabs[next]!.disabled) return tabs[next]!.id;
  for (let previous = index - 1; previous >= 0; previous -= 1) if (!tabs[previous]!.disabled) return tabs[previous]!.id;
  return null;
}

/** Keeps a move of the tab at `from` inside its own group: the pinned tabs, or the rest. Returns the position it can go to. */
export function clampToGroup(tabs: EditorTab[], from: number, to: number): number {
  const pinned = pinnedCount(tabs);
  const bounded = Math.min(Math.max(to, 0), tabs.length - 1);
  return from < pinned ? Math.min(bounded, pinned - 1) : Math.max(bounded, pinned);
}
