import { afterEach, describe, expect, it, vi } from "vitest";
import { isApplePlatform, matchesHotkey, parseHotkey } from "./commandPalette.hotkey";
import type { ParsedHotkey } from "./commandPalette.hotkey";

const press = (init: Partial<Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">>) => ({
  key: "k",
  code: "KeyK",
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...init,
});

afterEach(() => vi.unstubAllGlobals());

describe("parseHotkey", () => {
  it("reads modifiers and a key, in any case and spacing", () => {
    expect(parseHotkey("mod+k")).toMatchObject({ key: "k", mod: true });
    expect(parseHotkey(" Ctrl + Shift + P ")).toMatchObject({ key: "p", ctrl: true, shift: true, mod: false });
    expect(parseHotkey("cmd+option+/")).toMatchObject({ key: "/", meta: true, alt: true });
    expect(parseHotkey("/")).toMatchObject({ key: "/", mod: false });
  });

  it("refuses a combination with no key or an unknown modifier", () => {
    expect(parseHotkey("")).toBeUndefined();
    expect(parseHotkey("hyper+k")).toBeUndefined();
  });
});

describe("matchesHotkey", () => {
  const hotkey = parseHotkey("mod+k") as ParsedHotkey;

  it("makes mod Ctrl off an Apple platform and ⌘ on one, and nothing else", () => {
    expect(matchesHotkey(press({ ctrlKey: true }), hotkey, false)).toBe(true);
    expect(matchesHotkey(press({ metaKey: true }), hotkey, false)).toBe(false);
    expect(matchesHotkey(press({ metaKey: true }), hotkey, true)).toBe(true);
    expect(matchesHotkey(press({ ctrlKey: true }), hotkey, true)).toBe(false);
  });

  it("needs exactly the modifiers written", () => {
    expect(matchesHotkey(press({ ctrlKey: true, shiftKey: true }), hotkey, false)).toBe(false);
    expect(matchesHotkey(press({ ctrlKey: true, altKey: true }), hotkey, false)).toBe(false);
    expect(matchesHotkey(press({}), hotkey, false)).toBe(false);
  });

  it("matches a letter by its physical key when Option changes the character", () => {
    expect(matchesHotkey(press({ metaKey: true, key: "˚" }), hotkey, true)).toBe(true);
    expect(matchesHotkey(press({ metaKey: true, key: "x", code: "KeyX" }), hotkey, true)).toBe(false);
  });

  it("matches a named key", () => {
    expect(matchesHotkey(press({ key: "/", code: "Slash" }), parseHotkey("/") as ParsedHotkey, false)).toBe(true);
  });
});

describe("isApplePlatform", () => {
  it("reads the platform when asked", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel" });
    expect(isApplePlatform()).toBe(true);
    vi.stubGlobal("navigator", { platform: "Win32" });
    expect(isApplePlatform()).toBe(false);
    vi.stubGlobal("navigator", { userAgentData: { platform: "macOS" }, platform: "" });
    expect(isApplePlatform()).toBe(true);
  });
});
