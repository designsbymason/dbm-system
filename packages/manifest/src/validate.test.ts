import { describe, expect, it } from "vitest";
import { validateManifest } from "./validate";

const valid = {
  schemaVersion: 1,
  package: "@dbm-system/components",
  version: "0.1.0",
  components: [
    {
      name: "Button",
      tier: "atom",
      category: "Inputs",
      summary: "A button.",
      importName: "Button",
      source: "src/atoms/Button/Button.tsx",
      asChild: true,
      as: false,
      extends: ['ComponentPropsWithoutRef<"button">'],
      props: [{ name: "variant", type: "ButtonVariant", required: false, default: "'primary'", description: "Visual style.", values: ["primary"] }],
      parts: [],
      examples: [{ code: "<Button>Save</Button>" }],
    },
  ],
};

describe("validateManifest", () => {
  it("accepts a manifest that follows the schema, with or without the added sections", () => {
    expect(validateManifest(valid)).toEqual([]);
    expect(validateManifest({ ...valid, utilities: [], constants: [] })).toEqual([]);
  });
  it("names a missing required field", () => {
    const { version: _version, ...withoutVersion } = valid;
    expect(validateManifest(withoutVersion)).toEqual(["manifest.version: missing"]);
  });
  it("names a field the schema does not have", () => {
    expect(validateManifest({ ...valid, extra: true })).toEqual(["manifest.extra: not in the schema"]);
  });
  it("names a wrong value, type and enum", () => {
    const broken = { ...valid, schemaVersion: 2, components: [{ ...valid.components[0], tier: "page", asChild: "yes" }] };
    expect(validateManifest(broken)).toEqual([
      "manifest.schemaVersion: expected 1",
      'manifest.components[0].tier: "page" is not one of ["atom","molecule","organism","template"]',
      "manifest.components[0].asChild: expected a boolean",
    ]);
  });
  it("names a part or prop that is the wrong shape", () => {
    const broken = { ...valid, components: [{ ...valid.components[0], props: [{ name: "x" }] }] };
    expect(validateManifest(broken)).toEqual(["manifest.components[0].props[0].type: missing", "manifest.components[0].props[0].required: missing", "manifest.components[0].props[0].description: missing"]);
  });
});
