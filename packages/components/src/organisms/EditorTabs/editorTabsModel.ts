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

/** The tabs a "close others" would close: every closable tab but this one. */
export function closableOthers(tabs: EditorTab[], id: string): EditorTab[] {
  return tabs.filter((tab) => tab.id !== id && isClosable(tab));
}

/** The tabs a "close to the end" would close: the closable tabs after this one. */
export function closableAfter(tabs: EditorTab[], id: string): EditorTab[] {
  const index = tabs.findIndex((tab) => tab.id === id);
  return index < 0 ? [] : tabs.slice(index + 1).filter(isClosable);
}

/** The tabs a "close all" would close: every closable tab. */
export function closableAll(tabs: EditorTab[]): EditorTab[] {
  return tabs.filter(isClosable);
}

/** Puts `id` last in a most-recently-used list, once, capped so a long session does not grow it without end. */
export function recordRecent(recent: string[], id: string, cap = 100): string[] {
  const next = recent.filter((entry) => entry !== id);
  next.push(id);
  return next.length > cap ? next.slice(next.length - cap) : next;
}

interface AfterClose {
  /** The ids in order as they were when the close was asked. */
  order: string[];
  /** The tab that was selected, and is now gone. */
  selectedId: string;
  /** The ids still there. */
  remaining: string[];
  /** Enabled ids, to choose among. */
  enabled: Set<string>;
  /** Most recently selected last. */
  recent: string[];
  mode: "neighbor" | "previous";
}

/** The tab to select once the selected one is gone: the one used before it, or the nearest one after it, else before it. */
export function chooseAfterClose({ order, selectedId, remaining, enabled, recent, mode }: AfterClose): string | null {
  const stays = new Set(remaining.filter((id) => enabled.has(id)));
  if (mode === "previous") {
    for (let index = recent.length - 1; index >= 0; index -= 1) {
      const id = recent[index]!;
      if (id !== selectedId && stays.has(id)) return id;
    }
  }
  const from = order.indexOf(selectedId);
  for (let index = from + 1; index < order.length; index += 1) if (stays.has(order[index]!)) return order[index]!;
  for (let index = from - 1; index >= 0; index -= 1) if (stays.has(order[index]!)) return order[index]!;
  return stays.values().next().value ?? null;
}
