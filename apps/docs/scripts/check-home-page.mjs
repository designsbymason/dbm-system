#!/usr/bin/env node
/**
 * The home-page check: the built home page behaves. The accessibility scan only loads the pages, so a toggle that stops persisting, a menu
 * that stops opening by keyboard, a search that finds nothing, or a scroll animation that a minifier quietly broke (the theme section's
 * four compositions once stayed at opacity 0 in the build, which looked fine in development) would reach a reader. This drives the
 * assembled site (the home page with Storybook beside it) in headless Chromium and fails on:
 *
 * - the mode toggle: it sets the page's mode and theme, remembers the choice across a reload, and switches back;
 * - the header menus: they open by keyboard, hold their links with no external mark (no new tab, no icon), and close on Escape;
 * - the search: it opens, finds "Button" in Storybook's index and opens its page in Storybook;
 * - the theme section: it steps through the themes as the page scrolls, Purple light first in light mode and Purple dark first in dark
 *   mode, and the scroll timelines of that and of the hero's tilt are applied;
 * - reduced motion: the section is static and complete, and its Brand and Mode controls pick one composition and follow the page's mode;
 * - a phone: the menu panel opens with the Docs groups, its Storybook button opens Storybook's Introduction, and the page does not scroll sideways;
 * - the first load: no console error, no failed request, no preloaded font left unused.
 *
 *   node scripts/check-home-page.mjs [root]
 *
 * `root` is the assembled artifact (the site at the root, Storybook in `storybook/`), default `_artifact`.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serveFolder } from "./lib/static-server.mjs";

/* eslint-disable no-console -- a CLI check's report */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", process.argv[2] ?? "_artifact");
if (!existsSync(join(root, "index.html")) || !existsSync(join(root, "storybook", "index.json"))) {
  console.error(`check-home-page: ${root} needs index.html and storybook/index.json; assemble the site first`);
  process.exit(1);
}

const failures = [];
const started = Date.now();
const { origin, close } = await serveFolder(root);
const browser = await chromium.launch();

/** Runs a scenario in its own context; its thrown error, console errors and failed requests are its failures. */
async function scenario(name, options, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`an uncaught error: ${error.message.split("\n")[0].slice(0, 140)}`));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") problems.push(`a console error: ${text.split("\n")[0].slice(0, 140)}`);
    if (/preloaded using link preload but not used/.test(text)) problems.push(`an unused preload: ${text.slice(0, 140)}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(origin)) problems.push(`a failed request (${response.status()}): ${response.url().slice(origin.length)}`);
  });
  try {
    await run(page);
    await page.waitForTimeout(150);
  } catch (error) {
    problems.push(error.message.split("\n")[0].slice(0, 300));
  }
  for (const problem of new Set(problems)) failures.push(`${name}: ${problem}`);
  await context.close();
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
/** Polls a value until it equals what is wanted (an animation and a layout take a moment to settle), and throws what it was if it never does. */
async function settles(read, wanted, what, timeout = 4000) {
  const deadline = Date.now() + timeout;
  let value;
  while (Date.now() < deadline) {
    value = await read();
    if (JSON.stringify(value) === JSON.stringify(wanted)) return;
    await new Promise((done) => setTimeout(done, 150));
  }
  throw new Error(`${what}: wanted ${JSON.stringify(wanted)}, got ${JSON.stringify(value)}`);
}
const open = (page, path = "/") => page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
const themeOf = (page) => page.evaluate(() => ({ mode: document.documentElement.dataset.mode, theme: document.documentElement.dataset.theme }));

/** The themes the section shows at a place in its scroll (a fraction of the run), as `data-theme-key`s. */
async function themesAt(page, fraction) {
  return page.evaluate((f) => {
    const run = document.querySelector(".themes__run");
    const top = run.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + f * (run.offsetHeight - innerHeight), behavior: "instant" });
    return [...document.querySelectorAll(".themes__copy")].filter((copy) => Number(getComputedStyle(copy).opacity) > 0.5).map((copy) => copy.dataset.themeKey);
  }, fraction);
}
async function stepsThrough(page, order, label) {
  for (const [index, fraction] of [0.02, 0.3, 0.55, 0.8].entries()) {
    await settles(async () => {
      await page.waitForTimeout(250);
      return themesAt(page, fraction);
    }, [order[index]], `${label}, at ${Math.round(fraction * 100)}% of the section`);
  }
}

await scenario("the mode toggle", {}, async (page) => {
  await open(page);
  assert((await themeOf(page)).mode === "light", "a first visit is not light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await settles(() => themeOf(page), { mode: "dark", theme: "purple-dark" }, "after switching to dark");
  await page.reload({ waitUntil: "networkidle" });
  await settles(() => themeOf(page), { mode: "dark", theme: "purple-dark" }, "after a reload");
  assert((await page.evaluate(() => localStorage.getItem("dbm-mode"))) === "dark", "the choice is not remembered under dbm-mode");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await settles(() => themeOf(page), { mode: "light", theme: "purple-light" }, "after switching back to light");
});

await scenario("the header menus", {}, async (page) => {
  await open(page);
  for (const name of ["Docs", "Foundations"]) {
    const trigger = page.getByRole("button", { name, exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await settles(() => trigger.getAttribute("aria-expanded"), "true", `${name} after Enter`);
    const links = await page.evaluate(() => [...document.querySelectorAll("header a")].filter((a) => a.offsetParent && a.closest("[data-radix-collection-item], [role=menu], [data-state=open]") !== null || a.closest("header li")).filter((a) => a.offsetParent).map((a) => ({ text: a.textContent.trim(), target: a.getAttribute("target"), icon: !!a.querySelector("svg"), cue: /new tab/i.test(a.textContent) })));
    assert(links.filter((link) => link.text).length >= 3, `${name} opened with fewer than three links`);
    const marked = links.filter((link) => link.target === "_blank" || link.cue || (link.icon && link.text && link.text !== "DBM System v0.2.1, home" && !/^v\d/.test(link.text)));
    assert(marked.length === 0, `${name} has links marked as external or opening a new tab: ${marked.map((link) => link.text).join(", ")}`);
    await page.keyboard.press("Escape");
    await settles(() => trigger.getAttribute("aria-expanded"), "false", `${name} after Escape`);
  }
  const components = page.getByRole("link", { name: "Components", exact: true });
  assert((await components.getAttribute("href"))?.startsWith("/storybook/") === true, "the Components link does not go into /storybook/");
  assert((await components.getAttribute("target")) === null, "the Components link opens a new tab");
});

await scenario("the search", {}, async (page) => {
  await open(page);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("combobox", { name: /search/i }).waitFor({ timeout: 8000 });
  await page.keyboard.type("Button");
  await page.getByRole("option").first().waitFor({ timeout: 8000 });
  const first = await page.getByRole("option").first().textContent();
  assert(/^Button/.test(first ?? ""), `the first result for "Button" is "${first}"`);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/storybook\/\?path=/, { timeout: 8000 });
});

await scenario("the theme section in light mode", {}, async (page) => {
  await open(page);
  await page.waitForTimeout(500);
  const timeline = await page.evaluate(() => getComputedStyle(document.querySelector(".themes__copy")).animationTimeline);
  assert(timeline !== "auto" && timeline !== "none", `the compositions' scroll timeline is ${timeline}, so they never step`);
  await stepsThrough(page, ["purple-light", "purple-dark", "emerald-light", "emerald-dark"], "light mode");
  const tilt = await page.evaluate(() => {
    const paper = document.querySelector(".paper__scroll");
    return paper ? { name: getComputedStyle(paper).animationName, timeline: getComputedStyle(paper).animationTimeline } : null;
  });
  assert(tilt && tilt.name !== "none" && tilt.timeline !== "auto", `the hero's tilt has no scroll timeline (${JSON.stringify(tilt)})`);
});

await scenario("the theme section in dark mode", {}, async (page) => {
  await open(page);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await settles(() => themeOf(page), { mode: "dark", theme: "purple-dark" }, "after switching to dark");
  await stepsThrough(page, ["purple-dark", "purple-light", "emerald-dark", "emerald-light"], "dark mode");
  const rows = await page.evaluate(() => [...document.querySelectorAll(".themes__row")].filter((row) => row.offsetParent).map((row) => row.dataset.themeKey));
  assert(JSON.stringify(rows) === JSON.stringify(["purple-dark", "purple-light", "emerald-dark", "emerald-light"]), `the readout's rows are ${rows.join(", ")} in dark mode`);
});

await scenario("reduced motion", { reducedMotion: "reduce" }, async (page) => {
  await open(page);
  const section = await page.evaluate(() => [...document.querySelectorAll(".themes__copy")].map((copy) => ({ opacity: getComputedStyle(copy).opacity, animation: getComputedStyle(copy).animationName })));
  assert(section.length === 4 && section.every((copy) => copy.opacity === "1" && copy.animation === "none"), `the section is not static and complete: ${JSON.stringify(section)}`);
  await page.locator("[data-themes-controls]").scrollIntoViewIfNeeded();
  await settles(() => page.evaluate(() => document.querySelector("[data-themes]")?.dataset.picked), "purple-light", "the controls' pick once they are on screen");
  assert((await page.evaluate(() => [...document.querySelectorAll(".themes__copy")].filter((copy) => copy.offsetParent).length)) === 1, "the controls do not show one composition");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await settles(() => page.evaluate(() => document.querySelector("[data-themes]")?.dataset.picked), "purple-dark", "the Mode control after the header's toggle");
});

await scenario("a phone", { viewport: { width: 375, height: 812 }, hasTouch: true }, async (page) => {
  await open(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Introduction" }).first().waitFor({ state: "visible", timeout: 5000 }).catch(async () => {
    await page.getByRole("button", { name: "Docs" }).first().click();
    await page.getByRole("link", { name: "Introduction" }).first().waitFor({ state: "visible", timeout: 5000 });
  });
  const storybook = await page.getByRole("link", { name: "Storybook", exact: true }).first().getAttribute("href");
  assert(storybook?.includes("?path=/docs/getting-started-introduction--docs") === true, `the panel's Storybook button goes to ${storybook}, not Storybook's Introduction`);
  await page.keyboard.press("Escape");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, `the page scrolls sideways by ${overflow}px on a phone`);
});

await browser.close();
close();
if (failures.length > 0) {
  console.error(`check-home-page: ${failures.length} problem(s)\n${[...failures].sort().map((line) => `  ${line}`).join("\n")}`);
  process.exit(1);
}
console.log(`check-home-page: the toggle, menus, search, theme section (both orders), reduced motion and a phone all behave (${((Date.now() - started) / 1000).toFixed(0)} s)`);
