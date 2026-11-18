import { describe, expect, it } from "vitest";
import { PACKAGES, RELEASE_LIMIT, buildPage, collectReleases } from "./generate-changelog.mjs";

/** A package's CHANGELOG.md with a section per version: its entry, or "No changes" when the entry is `null`. */
const changelog = (name, entries) =>
  `# @dbm-system/${name}\n\n${entries.map(([version, entry]) => `## ${version}\n\n${entry === null ? "No changes in this release." : `### Patch Changes\n\n- ${entry}`}\n`).join("\n")}`;

/** The reads for a set of releases: the components package changes in each, and the others in the ones named. */
function reads(versions, alsoIn = []) {
  return (dir) =>
    changelog(
      dir,
      versions.map((version) => [version, dir === "components" || alsoIn.includes(version) ? `${dir} ${version} entry` : null]),
    );
}

const many = ["0.3.1", "0.3.0", "0.2.4", "0.2.3", "0.2.2", "0.2.1", "0.2.0", "0.1.3", "0.1.2", "0.1.1", "0.1.0"];

describe("collectReleases", () => {
  it("makes one release of each version, newest first (0.10.0 after 0.9.0), with only the packages that changed", () => {
    const releases = collectReleases(reads(["0.9.0", "0.10.0", "0.2.0"], ["0.2.0"]));
    expect(releases.map((release) => release.version)).toEqual(["0.10.0", "0.9.0", "0.2.0"]);
    expect(releases[2]?.packages.map((entry) => entry.dir)).toEqual(["components", "tokens", "icons", "utils"]);
    expect(releases[0]?.packages.map((entry) => entry.dir)).toEqual(["components"]);
  });

  it("fails when a package's changelog has no version section", () => {
    expect(() => collectReleases((dir) => (dir === "icons" ? "# @dbm-system/icons\n" : changelog(dir, [["0.1.0", "x"]])))).toThrow(/icons\/CHANGELOG.md has no version section/);
  });
});

describe("buildPage", () => {
  const page = buildPage(reads(many, ["0.1.1"]));

  it("shows the latest releases and no more, with each version as a heading for the table of contents", () => {
    const headings = [...page.matchAll(/^## (\d+\.\d+\.\d+)$/gm)].map((match) => match[1]);
    expect(headings).toEqual(many.slice(0, RELEASE_LIMIT));
    expect(page).not.toMatch(/^## 0\.1\.0$/m);
  });

  it("leaves the newest series open and folds each earlier series, keeping its releases in the page", () => {
    expect(page.indexOf("## 0.3.1")).toBeLessThan(page.indexOf("<details>"));
    expect(page.match(/<details>/g)).toHaveLength(2);
    expect(page).toContain("<summary>Earlier releases: 0.2.x (5)</summary>");
    expect(page).toContain("<summary>Earlier releases: 0.1.x (3)</summary>");
    expect(page.indexOf("## 0.2.4")).toBeGreaterThan(page.indexOf("<summary>Earlier releases: 0.2.x"));
  });

  it("says how many releases are not shown and where they are", () => {
    expect(page).toContain("1 earlier release is not shown here (before 0.1.1)");
    expect(page).toContain("https://github.com/designsbymason/dbm-system/releases");
    for (const { dir } of PACKAGES) expect(page).toContain(`packages/${dir}/CHANGELOG.md`);
  });

  it("lists a package only in the releases where it changed", () => {
    expect(page.match(/^### @dbm-system\/tokens$/gm)).toHaveLength(1);
    expect(page.match(/^### @dbm-system\/components$/gm)).toHaveLength(RELEASE_LIMIT);
  });

  it("folds nothing and says it is every release when there are few", () => {
    const small = buildPage(reads(["0.2.0", "0.1.0"]));
    expect(small).toContain("<details>");
    expect(small).toContain("This is every release so far");
    expect(buildPage(reads(["0.2.1", "0.2.0"]))).not.toContain("<details>");
  });
});
