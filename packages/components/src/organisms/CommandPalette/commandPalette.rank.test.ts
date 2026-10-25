import { describe, expect, it } from "vitest";
import { queryWords } from "../../internal/optionList/optionList.match";
import { rankCommands, scoreCommand } from "./commandPalette.rank";

const score = (label: string, text: string, extra: { keywords?: string[]; textValue?: string } = {}) =>
  scoreCommand({ label, ...extra }, queryWords(text));

describe("scoreCommand", () => {
  it("scores a label that starts with the word above one with the word starting inside it, above one with it anywhere, above a keyword", () => {
    const start = score("Settings", "set");
    const wordStart = score("Open settings", "set");
    const inside = score("Offset", "set");
    const keyword = score("Preferences", "set", { keywords: ["settings"] });
    expect(start).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(inside);
    expect(inside).toBeGreaterThan(keyword);
    expect(keyword).toBeGreaterThan(0);
  });

  it("is 0 unless every word is found", () => {
    expect(score("Open settings", "open theme")).toBe(0);
    expect(score("Open settings", "settings open")).toBeGreaterThan(0);
  });

  it("ignores case and accents, and reads textValue in place of the label", () => {
    expect(score("Café", "CAFE")).toBeGreaterThan(0);
    expect(score("Go home", "house", { textValue: "House" })).toBeGreaterThan(0);
  });

  it("scores everything alike when there are no words", () => {
    expect(scoreCommand({ label: "Anything" }, [])).toBeGreaterThan(0);
  });
});

describe("rankCommands", () => {
  const commands = [
    { label: "Open settings", group: "App" },
    { label: "New file", group: "File" },
    { label: "Settings", group: "App" },
    { label: "Offset layer", group: "File" },
    { label: "Reset", group: "App" },
  ];

  it("returns the commands as given when nothing is typed", () => {
    expect(rankCommands(commands, "  ")).toBe(commands);
  });

  it("lists the best match first inside a group and keeps the groups in their first order", () => {
    expect(rankCommands(commands, "set").map((command) => command.label)).toEqual([
      "Settings",
      "Open settings",
      "Reset",
      "Offset layer",
    ]);
  });

  it("keeps the order given for equal scores", () => {
    const equal = [{ label: "Beta one" }, { label: "Alpha one" }, { label: "Gamma one" }];
    expect(rankCommands(equal, "one").map((command) => command.label)).toEqual(["Beta one", "Alpha one", "Gamma one"]);
  });

  it("drops commands that do not match", () => {
    expect(rankCommands(commands, "zzz")).toEqual([]);
  });

  it("does not move a group that comes first when only a later group matches best", () => {
    const groups = [
      { label: "Weak match here", group: "A" },
      { label: "Exact", group: "B" },
    ];
    expect(rankCommands(groups, "e").map((command) => command.group)).toEqual(["A", "B"]);
  });
});
