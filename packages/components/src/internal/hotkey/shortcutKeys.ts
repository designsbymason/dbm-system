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
export function shortcutKeys(
  shortcut: string | string[],
  apple: boolean,
): ShortcutKey[] {
  const parts = Array.isArray(shortcut)
    ? shortcut
    : shortcut.length > 1
      ? shortcut.split("+")
      : [shortcut];
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const known = KEYS[part.toLowerCase()];
      return known ? (apple ? known.apple : known.other) : { text: part };
    });
}

/**
 * The keys of a shortcut as they are drawn: the modifier names written for the platform (`shortcutKeys`) and a single
 * letter in capitals, so `"mod+shift+s"` is ⌘ ⇧ S on an Apple platform and Ctrl Shift S elsewhere.
 */
export function drawnShortcutKeys(
  shortcut: string | string[],
  apple: boolean,
): ShortcutKey[] {
  return shortcutKeys(shortcut, apple).map((key) =>
    key.text.length === 1 ? { ...key, text: key.text.toUpperCase() } : key,
  );
}

/** The keys of a shortcut as one run of text: `⌘⇧S` on an Apple platform, `Ctrl+Shift+S` elsewhere. */
export function drawnShortcutText(
  shortcut: string | string[],
  apple: boolean,
): string {
  const texts = drawnShortcutKeys(shortcut, apple).map((key) => key.text);
  return apple ? texts.join("") : texts.join("+");
}

/** What a screen reader should say for the keys, naming a symbol ("Command Shift S"). */
export function shortcutSpokenName(keys: ShortcutKey[]): string {
  return keys.map((key) => key.label ?? key.text).join(" ");
}
