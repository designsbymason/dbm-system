// Reading and matching a keyboard shortcut written as a combination such as `"mod+k"`: shared by `CommandPalette` (its hotkey and the
// modifier keys it draws) and `EditorTabs` (its `hotkeys`), per `05-component-api-conventions.md` §3.
//
// A browser keeps some combinations for itself and never gives them to the page (Ctrl+Tab and Ctrl+W, and on a Mac Command and Option with
// the arrow keys or W), so a component that binds one does nothing there. Control and Option (`ctrl+alt`) with a key work on both.

/** A combination such as `"mod+k"` or `"ctrl+shift+p"`, read into the modifiers it needs and the key. */
export interface ParsedHotkey {
  key: string;
  mod: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

const MODIFIERS: Record<string, keyof Omit<ParsedHotkey, "key">> = {
  mod: "mod",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift",
  meta: "meta",
  cmd: "meta",
  command: "meta",
};

/** Reads a combination, or `undefined` when it names no key or a modifier it does not know. */
export function parseHotkey(combo: string): ParsedHotkey | undefined {
  const parts = combo
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const key = parts.pop();
  if (!key) return undefined;
  const parsed: ParsedHotkey = { key, mod: false, ctrl: false, alt: false, shift: false, meta: false };
  for (const part of parts) {
    const modifier = MODIFIERS[part];
    if (!modifier) return undefined;
    parsed[modifier] = true;
  }
  return parsed;
}

/** Whether the browser is on an Apple platform, where `mod` is ⌘. Read when a key is pressed, never while rendering. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Whether a key event is the combination, with exactly the modifiers it names (`mod` is ⌘ on an Apple platform and
 * Ctrl elsewhere). A letter also matches by its physical key, since Option on a Mac changes the character a key types.
 */
export function matchesHotkey(
  event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">,
  hotkey: ParsedHotkey,
  apple: boolean,
): boolean {
  const wantsMeta = hotkey.meta || (hotkey.mod && apple);
  const wantsCtrl = hotkey.ctrl || (hotkey.mod && !apple);
  if (event.metaKey !== wantsMeta || event.ctrlKey !== wantsCtrl) return false;
  if (event.altKey !== hotkey.alt || event.shiftKey !== hotkey.shift) return false;
  const pressed = event.key.toLowerCase();
  if (pressed === hotkey.key) return true;
  return /^[a-z]$/.test(hotkey.key) && event.code === `Key${hotkey.key.toUpperCase()}`;
}
