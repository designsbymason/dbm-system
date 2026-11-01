import { useEffect } from "react";
import {
  isApplePlatform,
  matchesHotkey,
  parseHotkey,
} from "../../internal/hotkey/hotkey";
import { warnOnce } from "../../internal/warnOnce";

/**
 * Opens a menu from a key anywhere on the page: `hotkeys` maps a menu's `value` to a combination (or `false`), and
 * `openFromCode` is what opens it. Nothing is bound without it.
 */
export function useMenubarHotkeys(
  hotkeys: Record<string, string | false> | undefined,
  openFromCode: (menu: string) => boolean,
) {
  // `hotkeys` is an object an app writes inline, so what is bound is read from its content, not its identity.
  const hotkeysKey = hotkeys ? JSON.stringify(hotkeys) : "";
  useEffect(() => {
    if (!hotkeysKey) return undefined;
    const bindings = Object.entries(
      JSON.parse(hotkeysKey) as Record<string, string | false>,
    ).flatMap(([menu, combo]) => {
      if (combo === false) return [];
      const parsed = parseHotkey(combo);
      if (!parsed) {
        warnOnce(
          `Menubar: the hotkey "${combo}" for "${menu}" is not a key combination (modifiers and a key joined by +, such as "alt+f"), so it binds nothing.`,
        );
        return [];
      }
      return [[menu, parsed] as const];
    });
    if (bindings.length === 0) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      const apple = isApplePlatform();
      const hit = bindings.find(([, parsed]) =>
        matchesHotkey(event, parsed, apple),
      );
      if (!hit) return;
      // A key for a menu that is not in the bar (it moved into "More", or is not mounted) is left to the browser.
      if (openFromCode(hit[0])) event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hotkeysKey, openFromCode]);
}
