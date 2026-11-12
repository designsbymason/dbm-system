import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { nextFrame, pressEscape, pressKey, realClick, settled, wheel } from "../_shared/realInput";
import { MarketingPage, marketingCopy } from "./MarketingPageStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, a breakpoint, sticking, scrolling, a real press, print). They run in the
// `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Templates/Data pages/Marketing Page/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen", fullBleed: true },
};

export default meta;

type Story = StoryObj;

/** The page's parts. */
function parts(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  return {
    canvas,
    header: canvas.getByRole("banner"),
    main: canvas.getByRole("main"),
    footer: canvas.getByRole("contentinfo"),
    features: canvas.getByRole("region", { name: marketingCopy.featuresTitle }),
    proof: canvas.queryByRole("region", { name: marketingCopy.proofName }),
    cta: canvas.getByRole("region", { name: marketingCopy.ctaTitle }),
  };
}

/** How long a real press or click may take to show its effect on a busy machine, in milliseconds (the default is one second). */
const slow = 4000;

/** The distinct left edges of some boxes, rounded: how many columns a row of cards is in. */
function columnsOf(elements: Element[]): number {
  return new Set(elements.map((element) => Math.round(element.getBoundingClientRect().left))).size;
}

/** The figures' values, by their row: how many sit on each line (the same top), in order. */
function figureRows(proof: HTMLElement | null): number[] {
  const values = marketingCopy.proof.map((figure) => within(proof as HTMLElement).getByText(figure.value));
  const tops = new Map<number, number>();
  for (const value of values) {
    const top = Math.round(value.getBoundingClientRect().top);
    tops.set(top, (tops.get(top) ?? 0) + 1);
  }
  return [...tops.entries()].sort((a, b) => a[0] - b[0]).map(([, count]) => count);
}

export const DesktopLayout: Story = {
  name: "On a desktop each landmark is there once, the three feature cards are in one row and the page does not scroll sideways — layout test",
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, header, footer, features } = parts(canvasElement);
    await expect(canvas.getAllByRole("banner")).toHaveLength(1);
    await expect(canvas.getAllByRole("main")).toHaveLength(1);
    await expect(canvas.getAllByRole("contentinfo")).toHaveLength(1);
    // The header's links are a navigation named "Main"; the footer holds a navigation for each column, every one with its own name.
    await expect(within(header).getByRole("navigation", { name: marketingCopy.mainNavigation })).toBeVisible();
    const columns = within(footer).getAllByRole("navigation");
    await expect(columns).toHaveLength(marketingCopy.footerColumns.length);
    await expect(columns.map((nav) => nav.getAttribute("aria-label"))).toEqual(marketingCopy.footerColumns.map((column) => column.name));
    // The header's call to action is in the bar, and the cards are side by side.
    await expect(within(header).getByRole("link", { name: marketingCopy.getStarted })).toBeVisible();
    const cards = marketingCopy.features.map((feature) => within(features).getByRole("heading", { level: 3, name: feature.title }));
    await expect(columnsOf(cards)).toBe(3);
    await expect(new Set(cards.map((card) => Math.round(card.getBoundingClientRect().top))).size).toBe(1);
    // The footer's four columns are in one row, and so are the four figures.
    await expect(columnsOf(columns)).toBe(4);
    await expect(figureRows(parts(canvasElement).proof)).toEqual([4]);
    // The figures are the same width, spread to the container's two ends with the same space between each.
    const cells = marketingCopy.proof.map((figure) => within(parts(canvasElement).proof as HTMLElement).getByText(figure.value).parentElement as HTMLElement).map((cell) => cell.getBoundingClientRect());
    await expect(new Set(cells.map((cell) => Math.round(cell.width))).size).toBe(1);
    const gaps = cells.slice(1).map((cell, index) => Math.round(cell.left - (cells[index] as DOMRect).right));
    await expect(new Set(gaps).size).toBe(1);
    await expect(Math.abs((cells[3] as DOMRect).right - (cells[0] as DOMRect).left - Math.min(window.innerWidth, 1024))).toBeLessThan(2);
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const BandsHaveTheirWidths: Story = {
  name: "The call to action's band is as wide as the window with its content kept to the page, the strip of figures is full width and the hero stays at its reading width — layout test",
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    const { canvas, main, proof, cta } = parts(canvasElement);
    const window_ = window.innerWidth;
    const mainBox = main.getBoundingClientRect();
    // The `bleed` band is edge to edge: as wide as `main`, which is as wide as the window; its content is narrower, centred.
    const band = cta.getBoundingClientRect();
    await expect(Math.abs(band.left - mainBox.left)).toBeLessThan(1);
    await expect(Math.abs(band.right - mainBox.right)).toBeLessThan(1);
    await expect(Math.abs(band.width - window_)).toBeLessThan(2);
    // The band's content lines up with the page: the same reading width and the same edges as the hero's, which is not a band.
    const heroContent = canvas.getByRole("heading", { level: 1 }).parentElement as HTMLElement;
    const bandContent = cta.firstElementChild as HTMLElement;
    await expect(Math.abs(bandContent.getBoundingClientRect().left - heroContent.getBoundingClientRect().left)).toBeLessThan(1);
    await expect(Math.abs(bandContent.getBoundingClientRect().width - heroContent.getBoundingClientRect().width)).toBeLessThan(1);
    const ctaHeading = within(cta).getByRole("heading", { level: 2 }).getBoundingClientRect();
    await expect(ctaHeading.width).toBeLessThan(band.width);
    await expect(Math.abs((ctaHeading.left + ctaHeading.right) / 2 - window_ / 2)).toBeLessThan(2);
    // The hero is kept to a reading width and centred: its heading is centred and no wider than the band's content.
    const hero = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
    await expect(Math.abs((hero.left + hero.right) / 2 - window_ / 2)).toBeLessThan(2);
    await expect(hero.width).toBeLessThan(window_);
    // The strip is `full`: the whole window, with no centred limit, so its section is as wide as the band.
    const strip = (proof as HTMLElement).getBoundingClientRect();
    await expect(Math.abs(strip.width - band.width)).toBeLessThan(2);
  },
};

export const MegaMenuByRealClickAndKeys: Story = {
  name: "A real click on Product opens its panel with the links, Escape closes it and returns focus to Product, and Enter and Space on Product from the keyboard do the same — interaction test",
  tags: ["!dev"],
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    const { header } = parts(canvasElement);
    const trigger = within(header).getByRole("button", { name: marketingCopy.product });
    window.scrollTo(0, 0);
    // The real pointer is shared by every check in the run, so park it somewhere neutral first: a pointer left over the bar by an earlier check starts the
    // menu's hover timer (200ms), and a press that lands as it fires would be read as closing the panel it just opened.
    // The real pointer and the page's window are shared with whatever else a full run is doing, so a press can land when the menu's hover timer has just opened it and read
    // as closing it: try again, from a parked pointer, up to three times, and a press that never opens it fails the check.
    for (let attempt = 0; attempt < 3 && trigger.getAttribute("aria-expanded") !== "true"; attempt += 1) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 });
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      await realClick(trigger);
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
    }
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"), { timeout: slow });
    // The panel is the element the trigger controls; the footer has its own "Analytics", so the links are read inside the panel.
    const panel = document.getElementById(trigger.getAttribute("aria-controls") as string) as HTMLElement;
    for (const link of marketingCopy.productLinks) {
      await waitFor(() => expect(within(panel).getByRole("link", { name: new RegExp(link.label) })).toBeVisible(), { timeout: slow });
    }
    await pressEscape();
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"), { timeout: slow });
    await waitFor(() => expect(trigger).toHaveFocus(), { timeout: slow });
    // From the keyboard, with the pointer parked away from the bar so a hover can't be what opens it: focus is on the trigger, and each of Enter and Space opens the panel and Escape closes it with focus back on the trigger.
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 });
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
    for (const key of ["Enter", "Space"] as const) {
      await pressKey(key);
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"), { timeout: slow });
      await pressEscape();
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"), { timeout: slow });
      await waitFor(() => expect(trigger).toHaveFocus(), { timeout: slow });
    }
  },
};

/** Which part of the page holds focus, by landmark. */
function where(element: Element | null): string {
  if (!element) return "none";
  if (element.closest("header")) return "header";
  if (element.closest("footer")) return "footer";
  if (element.closest("main")) return "page";
  return element.textContent?.includes("Skip") ? "skip" : "other";
}

export const PrimaryTaskByRealKeys: Story = {
  name: "With real keys only, Tab goes from the skip link through the header, the page and the footer in markup order — interaction test",
  tags: ["!dev"],
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    const { canvas } = parts(canvasElement);
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement | null)?.blur();
    const last = within(canvas.getByRole("contentinfo")).getAllByRole("link").at(-1) as HTMLElement;
    const path: string[] = [];
    for (let step = 0; step < 80 && document.activeElement !== last; step += 1) {
      await pressKey("Tab");
      const part = where(document.activeElement);
      if (path[path.length - 1] !== part) path.push(part);
    }
    await expect(document.activeElement).toBe(last);
    await expect(path).toEqual(["skip", "header", "page", "footer"]);
    window.scrollTo(0, 0);
  },
};

export const SkipLinkGoesToMain: Story = {
  name: "With real keys only, the first Tab reaches the skip link and Enter on it puts focus on the main area, past the header — interaction test",
  tags: ["!dev"],
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    const { main } = parts(canvasElement);
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement | null)?.blur();
    await pressKey("Tab");
    await expect(where(document.activeElement)).toBe("skip");
    await pressKey("Enter");
    await waitFor(() => expect(main).toHaveFocus(), { timeout: slow });
  },
};

export const FooterEndsThePageAndBackToTopAppears: Story = {
  name: "The footer ends the page with no gap under it, and a real wheel scroll brings up the back-to-top button — layout test",
  render: () => <MarketingPage features={1} proof={false} />,
  play: async ({ canvasElement }) => {
    const { footer, cta } = parts(canvasElement);
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(2);
    await expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(cta.getBoundingClientRect().bottom - 1);
    window.scrollTo(0, 0);
    await wheel(1500);
    await settled();
    await waitFor(() => expect(within(document.body).getByRole("button", { name: "Back to top" })).toBeVisible(), { timeout: slow });
    window.scrollTo(0, 0);
  },
};

export const TabletLayout: Story = {
  name: "On a tablet the feature cards are in two columns, the header keeps its links, and the page does not scroll sideways — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    await expect(window.innerWidth).toBeLessThan(1024);
    const { canvas, header, features, footer } = parts(canvasElement);
    await expect(within(header).getByRole("navigation", { name: marketingCopy.mainNavigation })).toBeVisible();
    const cards = marketingCopy.features.map((feature) => within(features).getByRole("heading", { level: 3, name: feature.title }));
    await expect(columnsOf(cards)).toBe(2);
    await expect(columnsOf(within(footer).getAllByRole("navigation"))).toBe(4);
    // The four figures are still on one row on a tablet.
    await expect(figureRows(parts(canvasElement).proof)).toEqual([4]);
    await expect(canvas.queryByRole("button", { name: "Menu" })).toBeNull();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const PhonePanelByRealPresses: Story = {
  name: "On a phone the cards and footer columns reflow, and the one menu button opens a panel holding the links and the sign-in and get-started buttons by a real click, focus goes into it, Escape closes it and focus returns to the button — interaction test",
  tags: ["!dev"],
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const { canvas, features, footer } = parts(canvasElement);
    const cards = marketingCopy.features.map((feature) => within(features).getByRole("heading", { level: 3, name: feature.title }));
    await expect(columnsOf(cards)).toBe(1);
    // The footer's columns wrap to two across, and so do the figures: two to a row.
    await expect(columnsOf(within(footer).getAllByRole("navigation"))).toBe(2);
    await expect(figureRows(parts(canvasElement).proof)).toEqual([2, 2]);
    // The figures fill the row (each cell grows to share it, so the two cells and the gap span the section) with each one's label and value centred in its cell.
    const proofSection = parts(canvasElement).proof as HTMLElement;
    const cells = marketingCopy.proof.map((figure) => within(proofSection).getByText(figure.value).parentElement as HTMLElement);
    const [first, second] = cells.map((cell) => cell.getBoundingClientRect());
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect((first as DOMRect).width).toBeGreaterThan(8 * rem);
    await expect(Math.abs((second as DOMRect).right - (first as DOMRect).left - proofSection.getBoundingClientRect().width + 2 * parseFloat(getComputedStyle(proofSection).paddingInlineStart))).toBeLessThan(2);
    for (const figure of marketingCopy.proof) {
      const value = within(proofSection).getByText(figure.value);
      const range = document.createRange();
      range.selectNodeContents(value);
      const text = range.getBoundingClientRect();
      const cell = (value.parentElement as HTMLElement).getBoundingClientRect();
      await expect(Math.abs((text.left + text.right) / 2 - (cell.left + cell.right) / 2)).toBeLessThan(2);
    }
    // The bar has no links of its own and one menu button; the call to action is not in the bar.
    await expect(canvas.getAllByRole("button", { name: "Menu" })).toHaveLength(1);
    const menu = canvas.getByRole("button", { name: "Menu" });
    await realClick(menu);
    const panel = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true), { timeout: slow });
    // The drawer slides in, so what it holds is visible once it has settled.
    await waitFor(() => expect(within(panel).getByRole("button", { name: marketingCopy.product })).toBeVisible(), { timeout: slow });
    await waitFor(() => expect(within(panel).getByRole("link", { name: marketingCopy.pricing })).toBeVisible(), { timeout: slow });
    await waitFor(() => expect(within(panel).getByRole("link", { name: marketingCopy.getStarted })).toBeVisible(), { timeout: slow });
    await waitFor(() => expect(within(panel).getByRole("link", { name: marketingCopy.signIn })).toBeVisible(), { timeout: slow });
    await expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await pressEscape();
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull(), { timeout: slow });
    await waitFor(() => expect(menu).toHaveFocus(), { timeout: slow });
    // And from the keyboard: Enter on the menu button opens the panel again, focus goes into it, and Escape closes it with focus back on the button.
    await pressKey("Enter");
    const again = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(again.contains(document.activeElement)).toBe(true), { timeout: slow });
    await pressEscape();
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull(), { timeout: slow });
    await waitFor(() => expect(menu).toHaveFocus(), { timeout: slow });
  },
};

export const PrintsFromTheTop: Story = {
  name: "Printed, nothing sticks, the page is in the flow in full from the top and the page does not scroll sideways — print test",
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    const { header, main } = parts(canvasElement);
    await document.fonts.ready;
    await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
    try {
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(true));
      await nextFrame();
      window.scrollTo(0, 0);
      // A fixed element would print on every sheet; only the back-to-top button is fixed, and it is transparent until the page has scrolled. The `Navbar` prints
      // as a row in the flow (its own print rule), not kept in view.
      await expect(getComputedStyle(header).position).toBe("static");
      const shown = [...canvasElement.querySelectorAll<HTMLElement>("*")].filter((element) => getComputedStyle(element).position === "fixed" && getComputedStyle(element).opacity !== "0");
      await expect(shown.map((element) => element.tagName + "." + element.className)).toEqual([]);
      await expect(main.getBoundingClientRect().left).toBeLessThan(2);
      await expect(header.getBoundingClientRect().top).toBeLessThan(2);
      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    } finally {
      await send("Emulation.setEmulatedMedia", { media: "", features: [] });
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(false));
    }
  },
};

export const ForcedColoursTakeTheSystemColours: Story = {
  name: "In forced colours the page takes the system colours and keeps its layout — forced colours test",
  render: () => <MarketingPage />,
  play: async ({ canvasElement }) => {
    const { header, cta, features } = parts(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      const probe = document.createElement("div");
      probe.style.backgroundColor = "Canvas";
      document.body.append(probe);
      const canvasColour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      await expect(getComputedStyle(header.parentElement as HTMLElement).backgroundColor).toBe(canvasColour);
      // The call to action's tint is dropped, so the band is the system's canvas and its text stays readable against it.
      await expect(getComputedStyle(cta).backgroundColor).toBe(canvasColour);
      const cards = marketingCopy.features.map((feature) => within(features).getByRole("heading", { level: 3, name: feature.title }));
      await expect(columnsOf(cards)).toBe(3);
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};

// A real click that is not used elsewhere is kept out of the way of the linter.
void userEvent;
