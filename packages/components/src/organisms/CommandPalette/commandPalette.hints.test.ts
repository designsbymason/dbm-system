import { describe, expect, it } from "vitest";
import { keywordHints } from "./commandPalette.hints";

describe("keywordHints", () => {
  const settings = { label: "Open settings", keywords: ["preferences", "options"] };

  it("names the keyword a word was found through when the label doesn't hold it", () => {
    expect(keywordHints(settings, "prefer")).toEqual(["preferences"]);
    expect(keywordHints(settings, "prefer opt")).toEqual(["preferences", "options"]);
  });

  it("is empty when the label holds the word, or nothing is typed, or no keyword has it", () => {
    expect(keywordHints(settings, "settings")).toEqual([]);
    expect(keywordHints(settings, "  ")).toEqual([]);
    expect(keywordHints(settings, "zzz")).toEqual([]);
    expect(keywordHints({ label: "Plain" }, "x")).toEqual([]);
  });

  it("reads the label as the search does: ignoring case and accents, and textValue in its place", () => {
    expect(keywordHints({ label: "Café", keywords: ["coffee"] }, "CAFE")).toEqual([]);
    expect(keywordHints({ label: "Go home", textValue: "House", keywords: ["residence"] }, "house")).toEqual([]);
  });

  it("offers each keyword once and never an ignored one", () => {
    expect(keywordHints({ label: "Dark", keywords: ["theme"] }, "the them")).toEqual(["theme"]);
    expect(keywordHints({ label: "Dark", keywords: ["Change theme"] }, "theme", "Change theme")).toEqual([]);
  });
});
