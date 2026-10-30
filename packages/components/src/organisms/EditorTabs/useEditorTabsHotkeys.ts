import { useEffect, useMemo, useRef } from "react";
import { isApplePlatform, matchesHotkey, parseHotkey } from "../../internal/hotkey/hotkey";
import type { EditorTabsHotkeys } from "./EditorTabs.types";

type Action = "next" | "previous" | "close" | "add";

/**
 * Binds the shortcuts of `hotkeys` on the document, as the project's other shortcut owner does: the platform is read when a key is
 * pressed, a press that matches is kept from the browser, and one that repeats, is already handled or is part of an input method's
 * composition is ignored. A combination that names no key warns once in development.
 */
export function useEditorTabsHotkeys(hotkeys: EditorTabsHotkeys | undefined, run: (action: Action) => boolean): void {
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });

  const parsed = useMemo(() => {
    const entries: Array<[Action, NonNullable<ReturnType<typeof parseHotkey>>]> = [];
    for (const action of ["next", "previous", "close", "add"] as const) {
      const combo = hotkeys?.[action];
      if (!combo) continue;
      const hotkey = parseHotkey(combo);
      if (hotkey) entries.push([action, hotkey]);
      else if (process.env.NODE_ENV !== "production") {
        console.warn(`EditorTabs: \`hotkeys.${action}\` "${combo}" is not a key combination, so it does nothing. Write modifiers and a key joined by "+", e.g. "mod+alt+ArrowRight".`);
      }
    }
    return entries;
  }, [hotkeys?.next, hotkeys?.previous, hotkeys?.close, hotkeys?.add]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (parsed.length === 0) return undefined;
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      const apple = isApplePlatform();
      for (const [action, hotkey] of parsed) {
        if (!matchesHotkey(event, hotkey, apple)) continue;
        if (latest.current(action)) event.preventDefault();
        return;
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [parsed]);
}
