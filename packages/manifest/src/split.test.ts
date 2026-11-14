import { describe, expect, it } from "vitest";
import { firstSentence, splitManifest } from "./split";
import type { Manifest } from "./types";
import { validateManifestFile } from "./validate";

describe("firstSentence", () => {
  it("returns a one-sentence summary whole", () => {
    expect(firstSentence("A box.")).toBe("A box.");
    expect(firstSentence("No full stop at all")).toBe("No full stop at all");
  });
  it("stops at the first full stop followed by a capital letter or a backtick", () => {
    expect(firstSentence("The primary action. Five variants, five sizes.")).toBe("The primary action.");
    expect(firstSentence("Opens a menu. `Menu.Item` is a row.")).toBe("Opens a menu.");
    expect(firstSentence("Really? Yes.")).toBe("Really?");
  });
  it("does not stop at an abbreviation or a version number", () => {
    expect(firstSentence("Takes one thing, e.g. A or B, and shows it. Then more.")).toBe("Takes one thing, e.g. A or B, and shows it.");
    expect(firstSentence("Built on Radix 1.2 and later. Next.")).toBe("Built on Radix 1.2 and later.");
    expect(firstSentence("Rows, columns etc. Also more.")).toBe("Rows, columns etc. Also more.");
  });
});

const manifest: Manifest = {
  schemaVersion: 1,
  package: "@dbm-system/components",
  version: "0.1.0",
  components: [
    { name: "Box", tier: "atom", category: "Layout", summary: "The base primitive. It renders a div.", importName: "Box", source: "src/atoms/Box/Box.tsx", asChild: false, as: true, extends: [], props: [], parts: [], examples: [] },
    { name: "Menu", tier: "organism", category: "Navigation", summary: "A menu.", importName: "Menu", source: "src/organisms/Menu/Menu.tsx", asChild: false, as: false, extends: [], props: [], parts: [], examples: [] },
  ],
  utilities: [{ name: "useThing", kind: "hook", summary: "Does a thing. Twice.", signature: "(): void", params: [], returns: "void", examples: [] }],
  constants: [{ name: "thing", type: "string", summary: "A thing." }],
};

describe("splitManifest", () => {
  const files = splitManifest(manifest);
  it("writes an index, a file per component and the utilities", () => {
    expect(Object.keys(files).sort()).toEqual(["components/Box.json", "components/Menu.json", "index.json", "utilities.json"]);
  });
  it("puts a short row for each component and function in the index, with the path to read it in full", () => {
    expect(files["index.json"]).toEqual({
      schemaVersion: 1,
      package: "@dbm-system/components",
      version: "0.1.0",
      components: [
        { name: "Box", tier: "atom", category: "Layout", summary: "The base primitive.", file: "components/Box.json" },
        { name: "Menu", tier: "organism", category: "Navigation", summary: "A menu.", file: "components/Menu.json" },
      ],
      utilities: [{ name: "useThing", kind: "hook", summary: "Does a thing." }],
      utilitiesFile: "utilities.json",
    });
  });
  it("leaves each component's entry as it is, and keeps the utilities and constants whole", () => {
    expect(files["components/Box.json"]).toBe(manifest.components[0]);
    expect(files["utilities.json"]).toMatchObject({ utilities: manifest.utilities, constants: manifest.constants, version: "0.1.0" });
  });
  it("conforms to the schema", () => {
    expect(validateManifestFile("index", files["index.json"])).toEqual([]);
    expect(validateManifestFile("utilitiesFile", files["utilities.json"])).toEqual([]);
    expect(validateManifestFile("component", files["components/Box.json"])).toEqual([]);
  });
  it("is caught when a file is the wrong shape", () => {
    expect(validateManifestFile("index", { schemaVersion: 1 })).toContain("index.components: missing");
    expect(validateManifestFile("component", { name: "Box" })).toContain("component.tier: missing");
  });
});
