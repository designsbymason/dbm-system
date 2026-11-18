import { describe, expect, it } from "vitest";
import { SHELL_DESCRIPTION, SHELL_TITLE, patchManagerShell } from "./generate-seo.mjs";

const shell = `<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <title>storybook - Storybook</title>\n    <meta name="viewport" content="width=device-width" />\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`;

describe("patchManagerShell", () => {
  const patched = patchManagerShell(shell);

  it("replaces Storybook's default title and adds a description and share tags", () => {
    expect(patched).toContain(`<title>${SHELL_TITLE}</title>`);
    expect(patched).not.toContain("storybook - Storybook");
    expect(patched).toContain(`<meta name="description" content="${SHELL_DESCRIPTION}" />`);
    expect(patched).toContain('property="og:image" content="https://dbm-system.com/social.png"');
  });

  it("opens the body with a noscript block of absolute links to the Markdown copies", () => {
    expect(patched).toMatch(/<body>\s*<noscript>/);
    for (const href of ["llms.txt", "llms-full.txt", "docs/getting-started-introduction.md"]) {
      expect(patched).toContain(`href="https://dbm-system.com/${href}"`);
    }
  });

  it("writes no canonical (it differs per page; the manager script sets it)", () => {
    expect(patched).not.toContain("canonical");
  });

  it("changes nothing when run twice", () => {
    expect(patchManagerShell(patched)).toBe(patched);
  });

  it("refuses a shell it cannot place its tags in", () => {
    expect(() => patchManagerShell("<html></html>")).toThrow(/no <title> or <body>/);
  });
});
