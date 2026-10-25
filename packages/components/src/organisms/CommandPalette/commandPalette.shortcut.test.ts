import { describe, expect, it } from "vitest";
import { shortcutKeys } from "./commandPalette.shortcut";

describe("shortcutKeys", () => {
  it("writes mod as ⌘ on an Apple platform and Ctrl elsewhere, with a name for the symbol", () => {
    expect(shortcutKeys(["mod", "N"], true)).toEqual([{ text: "⌘", label: "Command" }, { text: "N" }]);
    expect(shortcutKeys(["mod", "N"], false)).toEqual([{ text: "Ctrl" }, { text: "N" }]);
  });

  it("splits a string on +, and writes the other modifiers for the platform", () => {
    expect(shortcutKeys("mod+shift+P", true)).toEqual([{ text: "⌘", label: "Command" }, { text: "⇧", label: "Shift" }, { text: "P" }]);
    expect(shortcutKeys("ctrl+alt+Del", false)).toEqual([{ text: "Ctrl" }, { text: "Alt" }, { text: "Del" }]);
    expect(shortcutKeys("alt+X", true)).toEqual([{ text: "⌥", label: "Option" }, { text: "X" }]);
  });

  it("leaves text it doesn't know as written, including a symbol string and a lone plus", () => {
    expect(shortcutKeys("⌘N", false)).toEqual([{ text: "⌘N" }]);
    expect(shortcutKeys(["Ctrl", "N"], true)).toEqual([{ text: "⌃", label: "Control" }, { text: "N" }]);
    expect(shortcutKeys("+", true)).toEqual([{ text: "+" }]);
    expect(shortcutKeys("F2", true)).toEqual([{ text: "F2" }]);
  });
});
