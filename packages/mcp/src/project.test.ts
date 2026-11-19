import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openData } from "./data";
import { projectFolders } from "./project";
import { locatePackage } from "./sources";

const packages = new URL("../..", import.meta.url).pathname;
const base = mkdtempSync(join(tmpdir(), "dbm-mcp-project-"));
const folder = (name: string) => {
  const path = join(base, name);
  mkdirSync(path, { recursive: true });
  return path;
};

describe("projectFolders", () => {
  const cwd = folder("started-here");
  const project = folder("project");

  it("searches the working folder first when nothing is set", () => {
    expect(projectFolders([], {}, cwd)).toEqual({ folders: [cwd], warnings: [] });
  });

  it("puts an explicit setting first, then the working folder, then CLAUDE_PROJECT_DIR", () => {
    const claude = folder("claude");
    expect(projectFolders([], { DBM_SYSTEM_PROJECT_DIR: project, CLAUDE_PROJECT_DIR: claude }, cwd).folders).toEqual([project, cwd, claude]);
  });

  it("takes the --project argument, in either form, over the environment variable", () => {
    const other = folder("other");
    expect(projectFolders(["--project", project], { DBM_SYSTEM_PROJECT_DIR: other }, cwd).folders).toEqual([project, cwd]);
    expect(projectFolders([`--project=${project}`], {}, cwd).folders).toEqual([project, cwd]);
  });

  it("resolves a relative setting against the working folder", () => {
    expect(projectFolders(["--project", "../project"], {}, join(base, "started-here")).folders[0]).toBe(project);
  });

  it("names a setting that is not a folder, and an empty one, and still searches the working folder", () => {
    const missing = projectFolders([], { DBM_SYSTEM_PROJECT_DIR: join(base, "nope") }, cwd);
    expect(missing.folders).toEqual([cwd]);
    expect(missing.warnings).toEqual([`DBM_SYSTEM_PROJECT_DIR is "${join(base, "nope")}", which is not a folder.`]);
    expect(projectFolders(["--project"], {}, cwd).warnings).toEqual(["--project is empty."]);
    expect(projectFolders([], { DBM_SYSTEM_PROJECT_DIR: "" }, cwd).warnings).toEqual(["DBM_SYSTEM_PROJECT_DIR is empty."]);
  });

  it("does not search a folder twice", () => {
    expect(projectFolders([], { CLAUDE_PROJECT_DIR: cwd }, cwd).folders).toEqual([cwd]);
  });
});

describe("finding the packages from several folders", () => {
  // A project whose packages are linked into `node_modules`, the way a package manager installs them, and a folder with none.
  const project = folder("installed/app");
  const nested = folder("installed/app/packages/web/src");
  const bare = folder("bare");
  mkdirSync(join(project, "node_modules", "@dbm-system"), { recursive: true });
  for (const name of ["components", "tokens"]) symlinkSync(join(packages, name), join(project, "node_modules", "@dbm-system", name));

  it("finds them from the first folder, and says which it was", () => {
    // `bare` comes second: under `pnpm test`, NODE_PATH lets any folder resolve this package's own dependencies.
    const found = locatePackage("@dbm-system/components", [project, bare]);
    expect(found).toMatchObject({ origin: "project", foundFrom: project });
  });

  it("finds them from a folder nested inside the project", () => {
    expect(locatePackage("@dbm-system/components", [nested]).origin).toBe("project");
    expect(openData([nested]).info().components.origin).toBe("project");
  });

  it("reads the project's packages when the working folder has none and a setting names the project", () => {
    const data = openData(projectFolders(["--project", project], {}, bare).folders);
    expect(data.info().components.origin).toBe("project");
    expect(data.note()).toBeUndefined();
  });
});
