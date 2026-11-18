import { emeraldDark, purpleLight } from "@dbm-system/tokens";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Storybook's manager (the sidebar, toolbar and addon panel around the preview) is customised in `.storybook/manager.ts`, `theme.ts` and
 * `main.ts`'s manager head by reaching into Storybook's own markup (`.sidebar-header`, `#storybook-panel-root`, the "About Storybook" link),
 * which a Storybook upgrade can rename without a type error or a failing story. These tests open the real manager and check that each
 * customisation still applies, so an upgrade that breaks one fails here instead of showing in the published site
 * (`guidelines/07-storybook-and-documentation-standards.md` §9). The expected colours come from the token package, not typed here.
 */

const STORY = "/?path=/story/atoms-inputs-button--playground";
const DOCS = "/?path=/docs/atoms-inputs-button--docs";

/** `#rrggbb` as the `rgb(r, g, b)` a computed style reports. */
function rgb(hex: string): string {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

const computed = (page: Page, selector: string, property: "backgroundColor") =>
  page.evaluate(([css, prop]) => {
    const element = document.querySelector(css as string);
    return element ? getComputedStyle(element)[prop as "backgroundColor"] : null;
  }, [selector, property]);

test.describe("Storybook manager customisations", () => {
  test("the sidebar logo follows the Mode", async ({ page }) => {
    await page.goto(`${STORY}&globals=brand:purple;mode:light`);
    await expect(page.locator(".sidebar-header img").first()).toHaveAttribute("src", /logo-light\.svg$/);
    await page.goto(`${STORY}&globals=brand:purple;mode:dark`);
    await expect(page.locator(".sidebar-header img").first()).toHaveAttribute("src", /logo-dark\.svg$/);
  });

  test("the addon panel takes bg.surface of the active theme", async ({ page }) => {
    await page.goto(`${STORY}&globals=brand:purple;mode:light`);
    await expect.poll(() => computed(page, "#storybook-panel-root", "backgroundColor")).toBe(rgb(purpleLight.bg.surface));
    await page.goto(`${STORY}&globals=brand:emerald;mode:dark`);
    await expect.poll(() => computed(page, "#storybook-panel-root", "backgroundColor")).toBe(rgb(emeraldDark.bg.surface));
  });

  test("the Settings gear is drawn as a filled button in the active theme", async ({ page }) => {
    await page.goto(`${STORY}&globals=brand:purple;mode:light`);
    await expect.poll(() => computed(page, 'button[aria-label="Settings"]', "backgroundColor")).toBe(rgb(purpleLight["bg"]["neutral-subtle"]));
    await page.goto(`${STORY}&globals=brand:emerald;mode:dark`);
    await expect.poll(() => computed(page, 'button[aria-label="Settings"]', "backgroundColor")).toBe(rgb(emeraldDark["bg"]["neutral-subtle"]));
  });

  test("a story path is noindex and a Docs path has a canonical address on the site", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.locator('meta[name="robots"][data-dbm-seo]')).toHaveAttribute("content", "noindex");
    await page.goto(DOCS);
    await expect(page.locator('link[rel="canonical"][data-dbm-seo]')).toHaveAttribute("href", "https://dbm-system.com/storybook/?path=/docs/atoms-inputs-button--docs");
    await expect(page.locator('meta[name="robots"][data-dbm-seo]')).toHaveCount(0);
  });

  test("a Docs path links its Markdown copy and a story path does not", async ({ page }) => {
    await page.goto(DOCS);
    await expect(page.locator('link[rel="alternate"][type="text/markdown"][data-dbm-seo]')).toHaveAttribute("href", "https://dbm-system.com/docs/atoms-inputs-button.md");
    await page.goto(STORY);
    await expect(page.locator('meta[name="robots"][data-dbm-seo]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveCount(0);
  });

  test("a stored dark mode is applied before the page is drawn", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("dbm-mode", "dark"));
    await page.goto(DOCS);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.dbmMode)).toBe("dark");
  });

  test("on a phone the settings link opens the DBM menu in place of the About page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(DOCS);
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.locator('a[aria-label="About Storybook"]').click();
    await expect(page.locator("#dbm-mobile-settings-menu.dbm-open")).toBeVisible();
    expect(page.url()).not.toContain("settings/about");
  });
});
