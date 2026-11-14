import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { generateManifest } from "./generate";
import type { GenerateResult } from "./generate";

// Runs against the real components package, so what is checked is what ships. One run takes a few seconds, more on a slow runner.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "components");
const schema = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "schema", "manifest.schema.json"), "utf8")) as Schema;

interface Schema {
  type?: string;
  const?: unknown;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  $ref?: string;
  $defs?: Record<string, Schema>;
}

/** The part of JSON Schema the manifest schema uses: type, const, enum, required, properties, no extra keys, items and local references. */
function conforms(value: unknown, node: Schema, path: string, problems: string[]): void {
  const resolved = node.$ref ? (schema.$defs?.[node.$ref.replace("#/$defs/", "")] as Schema) : node;
  if (resolved.const !== undefined) {
    if (value !== resolved.const) problems.push(`${path}: expected ${JSON.stringify(resolved.const)}`);
    return;
  }
  if (resolved.enum) {
    if (!resolved.enum.includes(value)) problems.push(`${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(resolved.enum)}`);
    return;
  }
  if (resolved.type === "array") {
    if (!Array.isArray(value)) return void problems.push(`${path}: expected an array`);
    value.forEach((item, index) => conforms(item, resolved.items as Schema, `${path}[${index}]`, problems));
  } else if (resolved.type === "object") {
    if (typeof value !== "object" || value === null) return void problems.push(`${path}: expected an object`);
    const record = value as Record<string, unknown>;
    for (const key of resolved.required ?? []) if (!(key in record)) problems.push(`${path}.${key}: missing`);
    for (const [key, child] of Object.entries(record)) {
      const childSchema = resolved.properties?.[key];
      if (!childSchema) problems.push(`${path}.${key}: not in the schema`);
      else conforms(child, childSchema, `${path}.${key}`, problems);
    }
  } else if (resolved.type === "string" || resolved.type === "boolean") {
    if (typeof value !== resolved.type) problems.push(`${path}: expected a ${resolved.type}`);
  }
}

describe("generateManifest on the components package", () => {
  let result: GenerateResult;
  beforeAll(() => {
    result = generateManifest({ packageRoot });
  }, 180_000);

  it("conforms to the schema", () => {
    const problems: string[] = [];
    conforms(result.manifest, schema, "manifest", problems);
    expect(problems).toEqual([]);
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

  it("is deterministic: a second run gives the same text", () => {
    const again = generateManifest({ packageRoot });
    expect(JSON.stringify(again.manifest)).toBe(JSON.stringify(result.manifest));
  }, 180_000);
});
