import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { literalsOf, statusTable, validateEntry } from "./check-figma-map.mjs";

const typesText = `export type Size = "sm" | "md";`;
const manifest = {
  props: [
    { name: "size", type: "Size", default: "md" },
    { name: "disabled", type: "boolean", default: "false" },
    { name: "prefix", type: "ReactNode", default: "None" },
    { name: "id", type: "string", default: "None" },
  ],
};
const good = {
  tier: "atom",
  category: "Inputs",
  storybook: "atoms-inputs-x",
  figma: { set: "X", spec: "Spec: X" },
  status: { state: "reviewed", reviewed: "2026-01-01", approved: null },
  properties: {
    size: { kind: "variant", default: "md", values: { md: { props: { size: "md" } }, sm: { props: { size: "sm" } } } },
    state: { kind: "variant", default: "default", values: { default: { props: {} }, disabled: { props: { disabled: true } } } },
    prefix: { kind: "boolean", default: false, on: { props: { prefix: "<provided>" } } },
  },
  notModelled: ["id"],
};
const ctx = { manifest, catalog: { tier: "atom", category: "Inputs" }, storyId: "atoms-inputs-x", typesText, hasDecisionsFile: true };

describe("literalsOf", () => {
  it("reads an alias and an inline union, and knows a plain type has none", () => {
    assert.deepEqual(literalsOf("Size", typesText), ["sm", "md"]);
    assert.deepEqual(literalsOf('"a" | "b"'), ["a", "b"]);
    assert.equal(literalsOf("ReactNode", typesText), null);
    assert.deepEqual(literalsOf("Responsive<Size>", typesText), ["sm", "md"]);
  });
});

describe("validateEntry", () => {
  it("accepts a consistent entry", () => assert.deepEqual(validateEntry("X", good, ctx), []));
  it("flags a prop the manifest does not have, and a value its type does not allow", () => {
    const bad = structuredClone(good);
    bad.properties.size.values.md.props = { size: "huge" };
    bad.properties.state.values.disabled.props = { disabld: true };
    const e = validateEntry("X", bad, ctx).join("\n");
    assert.match(e, /"huge" is not a value of size/);
    assert.match(e, /"disabld" is not a prop/);
  });
  it("flags a default that is not the code's default", () => {
    const bad = structuredClone(good);
    bad.properties.size.default = "sm";
    assert.match(validateEntry("X", bad, ctx).join("\n"), /default maps size to sm, the code's default is md/);
  });
  it("flags a prop neither mapped nor in notModelled, and one that is both", () => {
    const missing = structuredClone(good);
    missing.notModelled = [];
    assert.match(validateEntry("X", missing, ctx).join("\n"), /neither mapped nor in notModelled: id/);
    const both = structuredClone(good);
    both.notModelled = ["id", "size"];
    assert.match(validateEntry("X", both, ctx).join("\n"), /"size" is both mapped and in notModelled/);
  });
  it("flags a wrong storybook id, a wrong tier and a missing decisions file", () => {
    const bad = { ...good, storybook: "nope", tier: "molecule" };
    const e = validateEntry("X", bad, { ...ctx, hasDecisionsFile: false }).join("\n");
    assert.match(e, /storybook id is nope/);
    assert.match(e, /tier or category differs/);
    assert.match(e, /X.md is missing/);
  });
  it("flags a state that is not drawn, reviewed or approved, and an approved date that does not match the state", () => {
    assert.match(validateEntry("X", { ...good, status: { state: "done" } }, ctx).join("\n"), /status.state is done/);
    assert.match(validateEntry("X", { ...good, status: { state: "reviewed", approved: "2026-01-02" } }, ctx).join("\n"), /approved is a date exactly when/);
  });
  it("checks that a slot maps to a part in the manifest", () => {
    const withSlot = structuredClone(good);
    withSlot.properties.header = { kind: "slot", maps: "X.Header" };
    const c = { ...ctx, manifest: { ...manifest, parts: [{ name: "X.Header" }] } };
    assert.deepEqual(validateEntry("X", withSlot, c), []);
    const kids = { ...c, manifest: { ...c.manifest, props: [...c.manifest.props, { name: "children", type: "ReactNode", default: "None" }] } };
    assert.deepEqual(validateEntry("X", withSlot, kids), [], "slots cover children");
    withSlot.properties.header.maps = "X.Nope";
    assert.match(validateEntry("X", withSlot, c).join("\n"), /"X.Nope" is not a part in the manifest/);
  });
  it("wants <provided> only for a prop a consumer supplies", () => {
    const bad = structuredClone(good);
    bad.properties.prefix.on.props = { size: "<provided>" };
    assert.match(validateEntry("X", bad, ctx).join("\n"), /write its value, not <provided>/);
  });
});

describe("statusTable", () => {
  it("lists components by tier then name, between the markers", () => {
    const t = statusTable({ components: { B: { tier: "molecule", category: "C", variants: 2, status: { state: "drawn", reviewed: null, approved: null } }, A: { tier: "atom", category: "C", variants: 1, status: { state: "reviewed", reviewed: "2026-01-01", approved: null } } } });
    assert.ok(t.indexOf("[A]") < t.indexOf("[B]"));
    assert.match(t, /^<!-- figma-status:start -->/);
    assert.match(t, /<!-- figma-status:end -->$/);
  });
});
