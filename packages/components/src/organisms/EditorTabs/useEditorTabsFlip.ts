import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { EditorTab } from "./EditorTabs.types";

interface Position {
  x: number;
  y: number;
}

/**
 * Eases the tabs to their new places when the list changes (a tab closed or added, a tab dropped elsewhere), and fades a new tab in.
 * Each tab is measured in the list's own scrolling coordinates before and after a change; a tab that moved is put back where it was
 * with `translate` and then released, and the stylesheet's `transition` on `translate` (a motion token, and none under reduced motion)
 * does the easing. Nothing is measured on the first render, and nothing animates when the positions did not change. The tab that was
 * dragged by the pointer, which the person has already moved by hand, is left out.
 */
export function useEditorTabsFlip(listRef: RefObject<HTMLElement | null>, tabs: EditorTab[], vertical: boolean, takeSkip: () => string | null): void {
  const previous = useRef<Map<string, Position> | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-editor-tab-item]"));
    const listBox = list.getBoundingClientRect();
    const now = new Map<string, Position>();
    for (const item of items) {
      const box = item.getBoundingClientRect();
      now.set(item.dataset.editorTabItem!, { x: box.left - listBox.left + list.scrollLeft, y: box.top - listBox.top + list.scrollTop });
    }
    const before = previous.current;
    previous.current = now;
    if (!before) return;

    const skipId = takeSkip();
    const moved: Array<[HTMLElement, number, number]> = [];
    for (const item of items) {
      const id = item.dataset.editorTabItem!;
      const to = now.get(id)!;
      const from = before.get(id);
      if (!from) {
        item.dataset.entering = "";
        item.addEventListener("animationend", () => delete item.dataset.entering, { once: true });
        continue;
      }
      if (id === skipId) continue;
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) moved.push([item, vertical ? 0 : dx, vertical ? dy : 0]);
    }
    if (moved.length === 0) return;

    for (const [item, dx, dy] of moved) {
      item.style.transition = "none";
      item.style.translate = `${dx}px ${dy}px`;
    }
    // Read once so the offsets are in force, then release them with the transition back on.
    void list.offsetWidth;
    const frame = requestAnimationFrame(() => {
      for (const [item] of moved) {
        item.style.transition = "";
        item.style.translate = "";
      }
    });
    return () => cancelAnimationFrame(frame);
      // `takeSkip` reads a ref, so it is not a reason to run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRef, tabs, vertical]);
}
