import { useEffect, useRef } from "react";
import type { EditorTab } from "./EditorTabs.types";

/** Tabs that break the strip's rules, said once per message in development rather than left to be wondered about. */
export function useEditorTabsWarnings(tabs: EditorTab[], { reorder, menu }: { reorder: boolean; menu: boolean }): void {
  const said = useRef(new Set<string>());
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const warn = (message: string) => {
      if (said.current.has(message)) return;
      said.current.add(message);
      console.warn(`EditorTabs: ${message}`);
    };
    const ids = new Set<string>();
    let seenUnpinned = false;
    for (const tab of tabs) {
      if (ids.has(tab.id)) warn(`two tabs share the id "${tab.id}". Every tab needs a unique \`id\`.`);
      ids.add(tab.id);
      if (!tab.pinned) seenUnpinned = true;
      else if (seenUnpinned) {
        warn("a pinned tab comes after an unpinned one. Put pinned tabs first in `tabs`; they can't be moved among the others.");
      }
    }
  }, [tabs]);

  // A drag is a pointer gesture that a touch screen scrolls instead, and the keyboard keys are for a keyboard: a tab menu is the way
  // to move a tab with a single press (WCAG 2.5.7), so reordering without one leaves a touch user unable to.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !reorder || menu) return;
    const message =
      "`onReorder` is set with no `tabMenu` or `tabContextMenu`, so a person on a touch screen, or who can't drag, has no way to move a tab. Add `tabMenu` (its Move items) or your own `tabContextMenu`.";
    if (said.current.has(message)) return;
    said.current.add(message);
    console.warn(`EditorTabs: ${message}`);
  }, [reorder, menu]);
}
