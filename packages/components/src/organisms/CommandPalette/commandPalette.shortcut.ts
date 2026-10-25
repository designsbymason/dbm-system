/** One key of a shortcut, as drawn: its text, and a plain-language name for a symbol a screen reader may not read. */
export interface ShortcutKey {
  text: string;
  label?: string;
}

// The names of modifier keys a shortcut may use, and what each is drawn as on an Apple platform and elsewhere.
const KEYS: Record<string, { apple: ShortcutKey; other: ShortcutKey }> = {
  mod: { apple: { text: "⌘", label: "Command" }, other: { text: "Ctrl" } },
  cmd: { apple: { text: "⌘", label: "Command" }, other: { text: "Win" } },
  command: { apple: { text: "⌘", label: "Command" }, other: { text: "Win" } },
  meta: { apple: { text: "⌘", label: "Command" }, other: { text: "Win" } },
  ctrl: { apple: { text: "⌃", label: "Control" }, other: { text: "Ctrl" } },
  control: { apple: { text: "⌃", label: "Control" }, other: { text: "Ctrl" } },
  alt: { apple: { text: "⌥", label: "Option" }, other: { text: "Alt" } },
  option: { apple: { text: "⌥", label: "Option" }, other: { text: "Alt" } },
  shift: { apple: { text: "⇧", label: "Shift" }, other: { text: "Shift" } },
};

/**
 * The keys of a shortcut, with the modifier names written for the platform: `["mod", "N"]` and `"mod+N"` are ⌘ and N
 * on an Apple platform and Ctrl and N elsewhere. Any other text is drawn as written, so `"⌘N"` and `["Ctrl", "N"]` are
 * left as they are.
 */
export function shortcutKeys(shortcut: string | string[], apple: boolean): ShortcutKey[] {
  const parts = Array.isArray(shortcut) ? shortcut : shortcut.length > 1 ? shortcut.split("+") : [shortcut];
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const known = KEYS[part.toLowerCase()];
      return known ? (apple ? known.apple : known.other) : { text: part };
    });
}
