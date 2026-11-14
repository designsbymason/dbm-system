import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { generateManifest } from "./generate";
import type { GenerateResult } from "./generate";
import { validateManifest } from "./validate";

// Runs against the real components package, so what is checked is what ships. One run takes a few seconds, more on a slow runner.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components");

describe("generateManifest on the components package", () => {
  let result: GenerateResult;
  beforeAll(() => {
    result = generateManifest({ packageRoot });
  }, 180_000);

  it("conforms to the schema", () => {
    expect(validateManifest(result.manifest)).toEqual([]);
  });

  it("describes the package and its version", () => {
    const { version } = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
    expect(result.manifest.package).toBe("@dbm-system/components");
    expect(result.manifest.version).toBe(version);
  });

  it("lists every component once, sorted by name", () => {
    const names = result.manifest.components.map((component) => component.name);
    expect(names.length).toBeGreaterThan(100);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort((a, b) => (a < b ? -1 : 1)));
  });

  it("reads Button's props, defaults and allowed values from its types and JSDoc", () => {
    const button = result.manifest.components.find((component) => component.name === "Button");
    expect(button).toMatchObject({ tier: "atom", category: "Inputs", importName: "Button", source: "src/atoms/Button/Button.tsx", asChild: true, as: false });
    expect(button?.extends).toEqual(['ComponentPropsWithoutRef<"button">']);
    expect(button?.summary).toMatch(/^The primary interactive action element\./);
    expect(button?.examples.length).toBeGreaterThan(0);
    const variant = button?.props.find((prop) => prop.name === "variant");
    expect(variant).toMatchObject({ type: "ButtonVariant", required: false, default: "'primary'", values: ["primary", "secondary", "tertiary", "ghost", "destructive"] });
    expect(variant?.description).not.toBe("");
  });

  it("lists only the props this system declares, not the native ones, and not ref", () => {
    const button = result.manifest.components.find((component) => component.name === "Button");
    const names = button?.props.map((prop) => prop.name) ?? [];
    expect(names).toContain("variant");
    expect(names).not.toContain("onMouseEnter");
    expect(names).not.toContain("ref");
    // `ref` is forwarded by every component and documented by none, so it is in no entry (it was in 7 before it was filtered out).
    const withRef = result.manifest.components.filter((component) => component.props.some((prop) => prop.name === "ref")).map((component) => component.name);
    expect(withRef).toEqual([]);
  });

  it("finds a compound component's parts under their public names, including ones its file does not export", () => {
    const menu = result.manifest.components.find((component) => component.name === "Menu");
    expect(menu?.parts.map((part) => part.name)).toEqual(expect.arrayContaining(["Menu.Item", "Menu.Content", "Menu.Sub"]));
    const accordion = result.manifest.components.find((component) => component.name === "Accordion");
    const item = accordion?.parts.find((part) => part.name === "Accordion.Item");
    expect(item?.props.length).toBeGreaterThan(0);
  });

  it("reads the tier and category from the story title", () => {
    const tiers = new Set(result.manifest.components.map((component) => component.tier));
    expect([...tiers].sort()).toEqual(["atom", "molecule", "organism", "template"]);
    expect(result.manifest.components.find((component) => component.name === "ConfirmDialog")?.tier).toBe("organism");
  });

  it("reads a compound component's summary and example from the root it is built from, and a shared part's from the part it points at", () => {
    const menu = result.manifest.components.find((component) => component.name === "Menu");
    expect(menu?.summary).not.toBe("");
    expect(menu?.examples.length).toBeGreaterThan(0);
    const shared = result.manifest.components.find((component) => component.name === "ContextMenu")?.parts.find((part) => part.name === "ContextMenu.Item");
    expect(shared?.summary).not.toBe("");
  });

  it("lists the hooks and functions with their parameters, sorted by name", () => {
    const { utilities } = result.manifest;
    const names = utilities.map((utility) => utility.name);
    expect(names).toEqual([...names].sort((a, b) => (a < b ? -1 : 1)));
    const dismiss = utilities.find((utility) => utility.name === "usePersistentDismiss");
    expect(dismiss).toMatchObject({ kind: "hook" });
    expect(dismiss?.params.length).toBeGreaterThan(0);
    expect(dismiss?.source).toBeUndefined();
    const toast = utilities.find((utility) => utility.name === "useToast");
    expect(toast).toMatchObject({ kind: "hook", source: "src/organisms/Toast/Toast.tsx" });
    expect(utilities.find((utility) => utility.name === "formatRelativeTime")?.kind).toBe("function");
    expect(utilities.every((utility) => utility.summary !== "")).toBe(true);
  });

  it("accounts for every value the package exports: a component, a function or a constant", () => {
    const { constants, utilities, components } = result.manifest;
    expect(constants.map((constant) => constant.name)).toEqual(expect.arrayContaining(["pythonLanguage", "yamlLanguage"]));
    expect(constants.every((constant) => constant.summary !== "" && constant.type !== "")).toBe(true);
    const all = [...components.map((entry) => entry.name), ...utilities.map((entry) => entry.name), ...constants.map((entry) => entry.name)];
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBeGreaterThan(150);
  });

  it("finds nothing undocumented: no prop without a description, no component, part or function without a summary or example", () => {
    expect(result.diagnostics).toEqual([]);
  });

  it("is deterministic: a second run gives the same text", () => {
    const again = generateManifest({ packageRoot });
    expect(JSON.stringify(again.manifest)).toBe(JSON.stringify(result.manifest));
  }, 180_000);
});
