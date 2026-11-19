import { describe, expect, it } from "vitest";
import { openData } from "./data";
import { locatePackage, SourceError } from "./sources";

const here = new URL("..", import.meta.url).pathname;

describe("openData", () => {
  const data = openData(here);

  it("reads the installed packages from the project it is started in", () => {
    const { components, tokens } = data.info();
    expect(components).toMatchObject({ name: "@dbm-system/components", origin: "project" });
    expect(tokens).toMatchObject({ name: "@dbm-system/tokens", origin: "project" });
  });

  it("says how to install a package that is nowhere to be found", () => {
    expect(() => locatePackage("@dbm-system/not-a-package", here)).toThrow(SourceError);
    expect(() => locatePackage("@dbm-system/not-a-package", here)).toThrow(/npm install @dbm-system\/not-a-package/);
  });

  it("reads the manifest index", () => {
    const index = data.index();
    expect(index.schemaVersion).toBe(1);
    expect(index.components.some((row) => row.name === "Button")).toBe(true);
    expect(index.utilities.length).toBeGreaterThan(0);
  });

  it("finds a component by name without regard to case, and a helper too", () => {
    expect(data.component("button")?.row.name).toBe("Button");
    expect((data.component("Button")?.entry as { name: string }).name).toBe("Button");
    expect(data.component("TooltipProvider")?.row.helperOf).toBe("Tooltip");
  });

  it("does not build a path from the name it is given", () => {
    expect(data.component("../../package")).toBeUndefined();
    expect(data.component("Button.json")).toBeUndefined();
  });

  it("reads the utilities, the token index and the consumer guide", () => {
    expect(data.utilities().utilities.length).toBeGreaterThan(0);
    expect(data.tokens().tokens.length).toBeGreaterThan(0);
    expect(data.agentsGuide()).toContain("@dbm-system/components");
  });

  it("suggests close names", () => {
    const names = data.index().components.map((row) => row.name);
    expect(data.suggest("Buton", names)).toContain("Button");
    expect(data.suggest("zzzzzzzz", names)).toEqual([]);
  });
});
