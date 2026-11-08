import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DemoPageShell } from "./PageShellStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, a breakpoint, scrolling, forced colours, print, a real wheel).
// They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another. The page scrolls as a whole, so
// each check that scrolls uses the window.
const meta: Meta = {
  title: "Templates/Application shells/PageShell/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen", fullBleed: true },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A real key press through the Chrome DevTools Protocol: a synthetic one neither sets `:focus-visible` nor scrolls anything. */
async function press(key: "Tab" | "Enter" | "Escape", windowsVirtualKeyCode: number, text?: string) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode, ...(text ? { text } : {}) });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode });
}

/** A real wheel turn over the middle of the page, mapping the test iframe's scale. */
async function wheel(deltaY: number) {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (window.innerWidth / 2) * scale;
  const y = (frame?.top ?? 0) + (window.innerHeight / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY });
}

/** A real mouse click through the Chrome DevTools Protocol, mapping the test iframe's scale. */
async function realClick(element: Element) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  // The middle of the part of the element that is inside the window: an element half off its edge is clicked where it can be.
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, window.innerWidth);
  const x = (frame?.left ?? 0) + ((left + right) / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

/** The shell's pieces. The header is the app's own `Navbar`, a direct child of the shell (which wraps nothing), so the bar and the "slot" are one. */
function slots(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const bar = canvas.getByRole("banner");
  const shell = bar.parentElement as HTMLElement;
  const slot = bar;
  const main = canvas.getByRole("main");
  const footer = canvas.getByRole("contentinfo");
  return { canvas, shell, bar, slot, main, footer };
}

/** Waits for a smooth scroll (a wheel turn) to finish: the page has not moved for a few frames. */
async function settled() {
  let last = -1;
  let still = 0;
  while (still < 4) {
    await nextFrame();
    if (window.scrollY === last) still += 1;
    else {
      still = 0;
      last = window.scrollY;
    }
  }
}

/** Waits for the page to be back at its top before a check that measures from there. */
async function atTop() {
  window.scrollTo(0, 0);
  await nextFrame();
}

export const DesktopLayout: Story = {
  name: "On a desktop the bar's links are in the bar, the page does not scroll sideways, and the shell's parts stack in order — layout test",
  render: () => <DemoPageShell subNav />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, shell, bar, slot, main, footer } = slots(canvasElement);
    await expect(canvas.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Menu" })).toBeNull();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(shell.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The header slot, the main area and the footer stack in that order, and the content is centred in the main area.
    await expect(bar.getBoundingClientRect().top).toBeGreaterThanOrEqual(slot.getBoundingClientRect().top - 1);
    await expect(slot.getBoundingClientRect().bottom).toBeLessThanOrEqual(main.getBoundingClientRect().top + 1);
    await expect(main.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1);
    // The root sets no overflow, which would stop the header sticking to the window.
    await expect(getComputedStyle(shell).overflowY).toBe("visible");
    await expect(getComputedStyle(shell).overflowX).toBe("visible");
  },
};

export const TabletLayout: Story = {
  name: "On a tablet the page does not scroll sideways — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <DemoPageShell subNav banner />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const { shell } = slots(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(shell.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const PhoneLayout: Story = {
  name: "On a phone the bar's links are behind a menu button, the second row of links stays and scrolls inside its own row, and the page does not scroll sideways — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DemoPageShell subNav banner />,
  play: async ({ canvasElement }) => {
    // Fails loudly if the pinned viewport did not apply.
    await expect(window.innerWidth).toBeLessThan(768);
    const { canvas, shell } = slots(canvasElement);
    await expect(canvas.queryByRole("navigation", { name: "Main" })).toBeNull();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(shell.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The second row of links does not fit a phone: it stays in the bar and scrolls inside its own row, which is no wider than the window.
    const sections = canvas.getByRole("navigation", { name: "Project sections" });
    const row = sections.querySelector<HTMLElement>("div") as HTMLElement;
    await expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    await expect(row.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    await waitFor(() => expect(sections).toHaveAttribute("data-overflow-end"));
    // The menu button opens the bar's links in a panel, and Escape closes it.
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(within(panel).getByRole("link", { name: "Reports" })).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const HeaderStaysUnderARealWheel: Story = {
  name: "A real wheel scroll leaves the Navbar at the top with a shadow while its second row scrolls away, and the page back at its top clears it — layout test",
  render: () => <DemoPageShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, bar } = slots(canvasElement);
    const sections = canvas.getByRole("navigation", { name: "Project sections" });
    await atTop();
    await expect(bar).not.toHaveAttribute("data-stuck");
    // At the start the second row is under the bar.
    await expect(sections.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom - 1);
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    // The bar sticks at the top of the window by its own `sticky`, over the page's content, and the row has scrolled away under it.
    await expect(Math.abs(bar.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(getComputedStyle(bar).position).toBe("sticky");
    await expect(Number(getComputedStyle(bar).zIndex)).toBeGreaterThan(0);
    await expect(sections.getBoundingClientRect().bottom).toBeLessThanOrEqual(bar.getBoundingClientRect().bottom + 1);
    await waitFor(() => expect(bar).toHaveAttribute("data-stuck"));
    await waitFor(() => expect(getComputedStyle(bar).boxShadow).not.toBe("none"));
    await atTop();
    await waitFor(() => expect(bar).not.toHaveAttribute("data-stuck"));
    await waitFor(() => expect(getComputedStyle(bar).boxShadow).toBe("none"));
  },
};

export const HeaderScrollsAwayWhenNotSticky: Story = {
  name: "A Navbar without sticky scrolls away with the page and has no shadow — layout test",
  render: () => <DemoPageShell sticky={false} subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { bar } = slots(canvasElement);
    await atTop();
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(getComputedStyle(bar).position).not.toBe("sticky");
    await expect(bar.getBoundingClientRect().bottom).toBeLessThan(0);
    await expect(getComputedStyle(bar).boxShadow).toBe("none");
    await atTop();
  },
};

export const BannerScrollsAway: Story = {
  name: "A banner above the header scrolls away, and the header then sticks at the very top — layout test",
  render: () => <DemoPageShell banner rows={80} />,
  play: async ({ canvasElement }) => {
    const { canvas, slot } = slots(canvasElement);
    const banner = canvas.getByText(/maintenance/i);
    await atTop();
    // The notice's alert eases into place; measure once it has.
    await finiteAnimations();
    await nextFrame();
    await expect(banner.getBoundingClientRect().bottom).toBeLessThanOrEqual(slot.getBoundingClientRect().top + 1);
    await wheel(1200);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(banner.getBoundingClientRect().bottom).toBeLessThan(1);
    await expect(Math.abs(slot.getBoundingClientRect().top)).toBeLessThan(1);
    await atTop();
  },
};

export const FooterSitsAtTheBottomOfAShortPage: Story = {
  name: "On a page too short to fill the window the footer sits at the bottom of the window, and the page does not scroll — layout test",
  render: () => <DemoPageShell rows={1} />,
  play: async ({ canvasElement }) => {
    const { main, footer, slot } = slots(canvasElement);
    await atTop();
    await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(2);
    // The main area takes the room between the header and the footer, so it is taller than its content.
    await expect(main.getBoundingClientRect().top).toBeGreaterThanOrEqual(slot.getBoundingClientRect().bottom - 1);
    await expect(Math.abs(main.getBoundingClientRect().bottom - footer.getBoundingClientRect().top)).toBeLessThan(2);
  },
};

export const FooterFollowsALongPage: Story = {
  name: "On a long page the footer is at the end of the page, not stuck to the window — layout test",
  render: () => <DemoPageShell rows={80} />,
  play: async ({ canvasElement }) => {
    const { footer } = slots(canvasElement);
    await atTop();
    await expect(footer.getBoundingClientRect().top).toBeGreaterThan(window.innerHeight);
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(2);
    await atTop();
  },
};

export const SkipLinkIsTheFirstTabStopAndWorks: Story = {
  name: "A real Tab reaches the skip link first and draws it, and Enter moves focus to the main area — interaction test",
  tags: ["!dev"],
  render: () => <DemoPageShell subNav />,
  play: async ({ canvasElement }) => {
    const { canvas, main } = slots(canvasElement);
    await atTop();
    (document.activeElement as HTMLElement | null)?.blur();
    await press("Tab", 9);
    const link = canvas.getByRole("link", { name: "Skip to content" });
    await expect(link).toHaveFocus();
    // Drawn only while focused: visible, at the top of the window, with a ring.
    await expect(getComputedStyle(link).position).toBe("fixed");
    await expect(link.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
    await expect(link.getBoundingClientRect().width).toBeGreaterThan(40);
    await expect(getComputedStyle(link).outlineStyle).toBe("solid");
    await press("Enter", 13, "\r");
    await waitFor(() => expect(main).toHaveFocus());
    // A real Tab after the main area's focus carries on into its content, and the main area is not itself a tab stop afterwards.
    await expect(main).toHaveAttribute("tabindex", "-1");
  },
};

export const PageChangeByARealClick: Story = {
  name: "Choosing a link in the bar with a real click moves focus to the main area, and the title is announced — interaction test",
  tags: ["!dev"],
  render: () => <PageChangeStory />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, main } = slots(canvasElement);
    const status = () => within(canvasElement).getAllByRole("status").map((region) => region.textContent ?? "");
    await expect(status().some((text) => text !== "")).toBe(false);
    await realClick(canvas.getByRole("link", { name: "Reports" }));
    await waitFor(() => expect(main).toHaveFocus());
    await waitFor(() => expect(status()).toContain("Reports"));
  },
};

/** The shell with a router's part played by state: choosing a link of the bar changes the page's key and title. */
function PageChangeStory() {
  const [page, setPage] = useState<"projects" | "reports" | "team" | "settings">("projects");
  const titles = { projects: "Projects", reports: "Reports", team: "Team", settings: "Settings" };
  return <DemoPageShell pageKey={page} pageTitle={titles[page]} onNavigate={setPage} />;
}

export const BusyBarLiesAlongTheTopOfTheMain: Story = {
  name: "While busy, a bar lies along the top of the main area, takes no room, and the page stays where it is — layout test",
  render: () => <DemoPageShell busy rows={6} />,
  play: async ({ canvasElement }) => {
    const { canvas, main } = slots(canvasElement);
    await atTop();
    await expect(main).toHaveAttribute("aria-busy", "true");
    const bar = main.querySelector<HTMLElement>("[aria-hidden='true']") as HTMLElement;
    await expect(Math.abs(bar.getBoundingClientRect().top - main.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(bar.getBoundingClientRect().height).toBe(0);
    await expect(canvas.getAllByRole("status").some((region) => region.textContent === "Loading")).toBe(true);
    // The first thing in the content starts where it would without the bar: at the main area's top plus the content's padding.
    const heading = within(main).getByRole("heading", { level: 1 });
    await expect(heading.getBoundingClientRect().top - main.getBoundingClientRect().top).toBeLessThan(60);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right to left, in Persian: the bar, the sub-navigation and the page mirror, and lang and dir are both set — direction test",
  render: () => <DemoPageShell dir="rtl" subNav />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, shell, bar, main } = slots(canvasElement);
    await expect(shell).toHaveAttribute("dir", "rtl");
    await expect(shell).toHaveAttribute("lang", "fa");
    // The brand is at the start (right) edge of the bar, with the links to its left and the account at the far left.
    const brand = within(bar).getAllByRole("link")[0] as HTMLElement;
    const links = canvas.getByRole("navigation", { name: "پیمایش اصلی" });
    await expect(brand.getBoundingClientRect().left).toBeGreaterThan(links.getBoundingClientRect().left);
    await expect(window.innerWidth - brand.getBoundingClientRect().right).toBeLessThan(window.innerWidth / 2);
    // The sub-navigation starts at the right edge too, and the page's heading is at the right of the content.
    const sub = canvas.getByRole("navigation", { name: "بخش‌های پروژه" });
    const first = within(sub).getAllByRole("link")[0] as HTMLElement;
    await expect(first.getBoundingClientRect().right).toBeGreaterThan(window.innerWidth / 2);
    const heading = within(main).getByRole("heading", { level: 1 });
    // The heading's text, not its box (a block's box spans its row wherever its words sit).
    const text = document.createRange();
    text.selectNodeContents(heading);
    await expect(text.getBoundingClientRect().left).toBeGreaterThan(window.innerWidth / 2);
    await expect(heading).toHaveTextContent("پروژه‌ها");
  },
};

export const LeftToRightDemoLeavesLangAlone: Story = {
  name: "A left-to-right demo sets no lang — direction test",
  render: () => <DemoPageShell />,
  play: async ({ canvasElement }) => {
    const { shell } = slots(canvasElement);
    await expect(shell).not.toHaveAttribute("lang");
  },
};

export const ForcedColoursInteraction: Story = {
  name: "In forced colours the frame takes the system colours — forced colours test",
  render: () => <DemoPageShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { shell } = slots(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await atTop();
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      // The theme's surface colour is replaced by the system `Canvas` colour.
      const probe = document.createElement("div");
      probe.style.backgroundColor = "Canvas";
      document.body.append(probe);
      const canvasColour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      await expect(getComputedStyle(shell).backgroundColor).toBe(canvasColour);
    } finally {
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
      await atTop();
    }
  },
};

export const SafeAreaInsetsKeepTheFrameClear: Story = {
  name: "The frame leaves the device's safe-area insets clear, the Navbar pads itself with the published top inset, and the stylesheet asks the device for them — layout test",
  render: () => <DemoPageShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { shell, bar, footer } = slots(canvasElement);
    // The stylesheet reads each side from the device's own inset...
    const source = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText);
        } catch {
          return []; // a sheet from another origin (a font) can't be read, and has nothing of ours
        }
      })
      .join("\n");
    for (const side of ["top", "right", "bottom", "left"]) await expect(source).toContain(`env(safe-area-inset-${side}`);
    // ...and a desktop has none, so stand one in through the custom properties it is read into.
    await atTop();
    const before = bar.getBoundingClientRect().top;
    await expect(Math.abs(before)).toBeLessThan(1);
    const row = bar.firstElementChild as HTMLElement;
    shell.style.setProperty("--page-shell-safe-top", "30px");
    shell.style.setProperty("--page-shell-safe-left", "10px");
    shell.style.setProperty("--page-shell-safe-right", "12px");
    shell.style.setProperty("--page-shell-safe-bottom", "20px");
    await nextFrame();
    // The bar pads itself with the published inset, so its content starts below the notch, while the bar itself is still at the top of the window.
    await expect(Math.abs(row.getBoundingClientRect().top - 30)).toBeLessThan(1);
    await expect(Math.abs(bar.getBoundingClientRect().top)).toBeLessThan(1);
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    await expect(Math.abs(footer.getBoundingClientRect().bottom - (window.innerHeight - 20))).toBeLessThan(1);
    await expect(Math.abs(bar.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(Math.abs(row.getBoundingClientRect().top - 30)).toBeLessThan(1);
    await atTop();
  },
};

/** Waits for what is still easing to finish; a loop that never ends (the loading bar's) is not waited for. */
async function finiteAnimations() {
  await Promise.all(
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}

/** Emulates the print media type, runs `check`, and always puts the page back: the type is cleared with an empty list so it cannot leak. */
async function whilePrinting(check: () => Promise<void>) {
  // Anything still easing (the banner's alert grows into place) or loading (a web font) changes a height while it is measured.
  await document.fonts.ready;
  await finiteAnimations();
  await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
  try {
    await waitFor(() => expect(window.matchMedia("print").matches).toBe(true));
    await nextFrame();
    await finiteAnimations();
    await nextFrame();
    await check();
  } finally {
    await send("Emulation.setEmulatedMedia", { media: "", features: [] });
    await waitFor(() => expect(window.matchMedia("print").matches).toBe(false));
    await nextFrame();
  }
}

export const PrintsThePageWithoutKeepingPartsInView: Story = {
  name: "Printed, the banner, header, main and footer are in the flow in order, and the skip link and the loading bar are left out — layout test",
  render: () => <DemoPageShell banner subNav busy rows={80} />,
  play: async ({ canvasElement }) => {
    const { canvas, shell, slot, main, footer } = slots(canvasElement);
    const skip = canvas.getByText("Skip to content");
    const banner = canvas.getByText(/maintenance/i);
    const bar = main.querySelector<HTMLElement>("[aria-hidden='true']") as HTMLElement;
    await atTop();
    await whilePrinting(async () => {
      await expect(getComputedStyle(footer).position).toBe("static");
      await expect(getComputedStyle(skip).display).toBe("none");
      await expect(getComputedStyle(bar).display).toBe("none");
      await expect(getComputedStyle(shell).minBlockSize).not.toBe(`${window.innerHeight}px`);
      // Banner, header, main and footer, one under the other, from the top of the page.
      await expect(banner.getBoundingClientRect().bottom).toBeLessThanOrEqual(slot.getBoundingClientRect().top + 1);
      await expect(slot.getBoundingClientRect().bottom).toBeLessThanOrEqual(main.getBoundingClientRect().top + 1);
      await expect(main.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1);
      await expect(Math.abs(shell.getBoundingClientRect().top)).toBeLessThan(1);
    });
  },
};

export const StaysTheSameWhenItGrowsATallPage: Story = {
  name: "A page that grows while the page is scrolled leaves the header where it is — layout test",
  render: () => <DemoPageShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { slot, main } = slots(canvasElement);
    await atTop();
    window.scrollTo(0, 500);
    await nextFrame();
    const top = slot.getBoundingClientRect().top;
    const extra = document.createElement("div");
    extra.style.blockSize = "800px";
    main.append(extra);
    await nextFrame();
    await expect(Math.abs(slot.getBoundingClientRect().top - top)).toBeLessThan(1);
    extra.remove();
    await atTop();
  },
};


export const CustomHeaderSticksByAffix: Story = {
  name: "A header of the app's own sticks by Affix, with a shadow once stuck, and the shell wraps nothing around it — layout test",
  render: () => <DemoPageShell customHeader rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, bar, shell } = slots(canvasElement);
    await expect(canvas.getAllByRole("banner")).toHaveLength(1);
    await expect(bar.tagName).toBe("HEADER");
    await expect(bar.parentElement).toBe(shell);
    await atTop();
    await expect(getComputedStyle(bar).boxShadow).toBe("none");
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(getComputedStyle(bar).position).toBe("sticky");
    await expect(Math.abs(bar.getBoundingClientRect().top)).toBeLessThan(1);
    await waitFor(() => expect(getComputedStyle(bar).boxShadow).not.toBe("none"));
    await atTop();
    await waitFor(() => expect(getComputedStyle(bar).boxShadow).toBe("none"));
  },
};

// --- The aside ---

const asideOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole("complementary");

export const AsideBesideThePage: Story = {
  name: "On a desktop the aside is a column beside the page at the end edge, as wide as its width, with no page overflow — layout test",
  render: () => <DemoPageShell aside rows={12} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { main } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    const body = aside.parentElement as HTMLElement;
    await expect(main.parentElement).toBe(body);
    await expect(main.getBoundingClientRect().right).toBeLessThanOrEqual(aside.getBoundingClientRect().left + 1);
    await expect(Math.abs(aside.getBoundingClientRect().top - main.getBoundingClientRect().top)).toBeLessThan(2);
    // The width is the token's (a CSS length), the same wherever the page is.
    const probe = document.createElement("div");
    probe.style.inlineSize = "var(--dbm-app-shell-aside-width)";
    document.body.append(probe);
    const tokenWidth = probe.getBoundingClientRect().width;
    probe.remove();
    await expect(Math.abs(aside.getBoundingClientRect().width - tokenWidth)).toBeLessThan(1);
    await expect(Math.abs(aside.getBoundingClientRect().right - (body.getBoundingClientRect().right - parseFloat(getComputedStyle(body).paddingRight)))).toBeLessThan(2);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const AsideStacksUnderThePageOnAPhone: Story = {
  name: "On a phone an aside that stacks drops under the page, full width, in the order written, with no page overflow — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DemoPageShell aside rows={3} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const { main } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    await expect(aside.getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().bottom - 1);
    await expect(Math.abs(aside.getBoundingClientRect().width - main.getBoundingClientRect().width)).toBeLessThan(2);
    await expect(getComputedStyle(aside).display).not.toBe("none");
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const AsideFollowsTheOrderWrittenAndMirrors: Story = {
  name: "An aside written first is at the start, and in right-to-left text the sides swap — direction test",
  render: () => <DemoPageShell aside asideSide="start" rows={6} />,
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    await expect(aside.getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().left + 1);
    // The tab order is the written order: the aside comes before the page's content.
    await expect(aside.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  },
};

export const AsideMirrorsInRightToLeft: Story = {
  name: "In right-to-left text an aside written after the page is at the left — direction test",
  render: () => <DemoPageShell dir="rtl" aside rows={6} />,
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    await expect(aside.getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().left + 1);
  },
};

export const AsideScrollsWithThePageUnlessSticky: Story = {
  name: "An aside scrolls away with the page, and with sticky stays under the Navbar at its measured height — layout test",
  render: () => <DemoPageShell aside asideSticky rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { bar, shell } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    await atTop();
    const start = aside.getBoundingClientRect().top;
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    // Stuck: at the bar's bottom edge (the header's height as the shell measured it), not scrolled away with the page.
    // (the aside eases to its offset, so wait for it to arrive)
    await waitFor(() => expect(Math.abs(aside.getBoundingClientRect().top - bar.getBoundingClientRect().bottom)).toBeLessThan(2), { timeout: 3000 });
    await expect(Math.abs(parseFloat(shell.style.getPropertyValue("--page-shell-header-height")) - bar.getBoundingClientRect().height)).toBeLessThan(1);
    await expect(start).toBeGreaterThan(bar.getBoundingClientRect().bottom);
    await atTop();
  },
};

export const AsideThatIsNotStickyScrollsAway: Story = {
  name: "Without sticky the aside scrolls away with the page — layout test",
  render: () => <DemoPageShell aside rows={80} />,
  play: async ({ canvasElement }) => {
    const aside = asideOf(canvasElement);
    await atTop();
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(aside.getBoundingClientRect().bottom).toBeLessThan(0);
    await atTop();
  },
};

export const StickyOffsetOverridesTheMeasuredHeight: Story = {
  name: "A sticky aside with its own stickyOffset sticks at that offset — layout test",
  render: () => <DemoPageShell aside asideSticky asideStickyOffset="120px" rows={80} />,
  play: async ({ canvasElement }) => {
    const aside = asideOf(canvasElement);
    await atTop();
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await waitFor(() => expect(Math.abs(aside.getBoundingClientRect().top - 120)).toBeLessThan(2), { timeout: 3000 });
    await atTop();
  },
};

export const TallStickyAsideScrollsInsideItself: Story = {
  name: "A sticky aside taller than the room below the header scrolls inside itself and is a tab stop while it does — layout test",
  render: () => <DemoPageShell aside asideSticky rows={80} />,
  play: async ({ canvasElement }) => {
    const aside = asideOf(canvasElement);
    await atTop();
    const tall = document.createElement("div");
    tall.style.blockSize = "2400px";
    aside.append(tall);
    await waitFor(() => expect(aside).toHaveAttribute("tabindex", "0"));
    await expect(getComputedStyle(aside).overflowY).toBe("auto");
    await expect(aside.scrollHeight).toBeGreaterThan(aside.clientHeight);
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    // Stuck, and no taller than the window less what is above it.
    await expect(aside.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight + 1);
    tall.remove();
    await atTop();
  },
};

export const StickyAsideScrollsWithThePageOnAPhone: Story = {
  name: "On a phone a sticky aside is no longer sticky and no longer scrolls inside itself — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DemoPageShell aside asideSticky rows={3} />,
  play: async ({ canvasElement }) => {
    const aside = asideOf(canvasElement);
    await expect(getComputedStyle(aside).position).toBe("static");
    await expect(getComputedStyle(aside).overflowY).toBe("visible");
  },
};

export const AsideDrawerByARealClick: Story = {
  tags: ["!dev"],
  name: "An aside that is a drawer leaves the page below its step, a real click on the toggle opens it with focus inside, Escape closes it and focus returns — interaction test",
  render: () => <DemoPageShell aside asideCollapse="drawer" asideCollapseBelow="3xl" rows={6} framed />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const aside = canvasElement.querySelector<HTMLElement>("aside[data-collapse='drawer']")!;
    await expect(getComputedStyle(aside).display).toBe("none");
    const toggle = canvas.getByRole("button", { name: "Show details" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await realClick(toggle);
    const drawer = await within(canvasElement).findByRole("dialog");
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    // the drawer eases in: wait for it before reading what is visible
    await waitFor(() => expect(within(drawer).getByRole("navigation", { name: "On this page" })).toBeVisible());
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await press("Escape", 27);
    await waitFor(() => expect(within(canvasElement).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(toggle).toHaveFocus());
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  },
};

export const AsideDrawerStaysOnThePageAtItsStep: Story = {
  name: "At and above its step an aside that is a drawer is on the page and the toggle is gone — layout test",
  render: () => <DemoPageShell aside asideCollapse="drawer" asideCollapseBelow="md" rows={6} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const aside = asideOf(canvasElement);
    await expect(aside).toBeVisible();
    await expect(getComputedStyle(within(canvasElement).getByLabelText("Show details")).display).toBe("none");
  },
};

export const FooterSitsAtTheBottomOfAShortPageWithAnAside: Story = {
  name: "On a page with an aside too short to fill the window the footer still sits at the bottom of the window — layout test",
  render: () => <DemoPageShell aside rows={1} />,
  play: async ({ canvasElement }) => {
    const { footer } = slots(canvasElement);
    await atTop();
    await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(2);
  },
};

export const AsideFocusRingInForcedColours: Story = {
  tags: ["!dev"],
  name: "In forced colours a sticky aside that scrolls inside itself is reached by a real Tab and draws a focus ring — forced colours test",
  render: () => <DemoPageShell aside asideSticky rows={12} />,
  play: async ({ canvasElement }) => {
    const aside = asideOf(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await atTop();
    const tall = document.createElement("div");
    tall.style.blockSize = "2400px";
    aside.append(tall);
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await waitFor(() => expect(aside).toHaveAttribute("tabindex", "0"));
      (document.activeElement as HTMLElement | null)?.blur();
      for (let step = 0; step < 40 && document.activeElement !== aside; step += 1) {
        await press("Tab", 9);
        await nextFrame();
      }
      await expect(aside).toHaveFocus();
      await expect(aside.matches(":focus-visible")).toBe(true);
      await expect(getComputedStyle(aside).outlineStyle).not.toBe("none");
      await expect(parseFloat(getComputedStyle(aside).outlineWidth)).toBeGreaterThan(0);
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [] });
      tall.remove();
      await atTop();
    }
  },
};

export const AsideFollowsAHidingHeaderUnderARealWheel: Story = {
  name: "A sticky aside eases up to the top of the window while the Navbar slides away on a real wheel scroll down, and back under it on a scroll up — layout test",
  render: () => <DemoPageShell aside asideSticky hideOnScroll rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { bar } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    await atTop();
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await waitFor(() => expect(bar).toHaveAttribute("data-away"));
    // The bar is out of the window and the aside has risen to its top edge.
    await waitFor(() => expect(bar.getBoundingClientRect().bottom).toBeLessThanOrEqual(1));
    await waitFor(() => expect(Math.abs(aside.getBoundingClientRect().top)).toBeLessThan(2), { timeout: 3000 });
    await wheel(-300);
    await settled();
    await waitFor(() => expect(bar).not.toHaveAttribute("data-away"));
    // The bar is back, and the aside sticks under it again, not under its old place.
    await waitFor(() => expect(Math.abs(aside.getBoundingClientRect().top - bar.getBoundingClientRect().bottom)).toBeLessThan(2), { timeout: 3000 });
    await atTop();
  },
};

export const NavigatingBarIsAlongTheTopOfTheWindowAboveTheHeader: Story = {
  name: "While navigating a loading bar is fixed along the top of the window, above a sticky header, and says Loading — layout test",
  render: () => <DemoPageShell navigating rows={80} />,
  play: async ({ canvasElement }) => {
    const { bar } = slots(canvasElement);
    const track = canvasElement.querySelector<HTMLElement>("[role='progressbar']")!;
    const holder = track.closest<HTMLElement>("[aria-hidden='true']")!;
    await expect(getComputedStyle(holder).position).toBe("fixed");
    await atTop();
    await expect(Math.abs(holder.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(Number(getComputedStyle(holder).zIndex)).toBeGreaterThan(Number(getComputedStyle(bar).zIndex));
    // Still along the top when the page has scrolled.
    window.scrollTo(0, 600);
    await nextFrame();
    await expect(Math.abs(holder.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Loading");
    await atTop();
  },
};

export const NavigatingBarIsLeftOutOfPrint: Story = {
  name: "Printed, the navigating bar is left out — print test",
  render: () => <DemoPageShell navigating rows={6} />,
  play: async ({ canvasElement }) => {
    const holder = canvasElement.querySelector<HTMLElement>("[role='progressbar']")!.closest<HTMLElement>("[aria-hidden='true']")!;
    await expect(getComputedStyle(holder).display).not.toBe("none");
    await whilePrinting(async () => {
      await expect(getComputedStyle(holder).display).toBe("none");
    });
  },
};

export const DismissedBannerGoesAway: Story = {
  tags: ["!dev"],
  name: "A banner dismissed with its button goes away, and the dismissal is remembered for the session — interaction test",
  render: () => <DemoPageShell dismissibleBanner rows={4} />,
  play: async ({ canvasElement }) => {
    const key = "dbm-dismissed:dbm-demo-page-shell-banner";
    const canvas = within(canvasElement);
    const dismiss = await canvas.findByRole("button", { name: "Dismiss" });
    await userEvent.click(dismiss);
    // It eases out, then it is gone from the page.
    await waitFor(() => expect(canvas.queryByText(/maintenance/i)).toBeNull(), { timeout: 4000 });
    await expect(sessionStorage.getItem(key)).not.toBeNull();
    // Leave nothing behind for the next run.
    sessionStorage.removeItem(key);
  },
};

export const BleedRunsEdgeToEdgeWithItsContentLinedUp = {
  name: "A Bleed band is as wide as the main area, has the canvas fill, and its content starts where the page's content starts, while a plain section's runs edge to edge — layout test",
  // A reading width, narrower than the window, so the page's content is clearly inside the band.
  render: () => <DemoPageShell fullBleed contentWidth="reading" rows={2} />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { main } = slots(canvasElement);
    const band = within(canvasElement).getByText(/band as wide as the window/i).closest("section") as HTMLElement;
    const page = main.querySelector("h1")!;
    // As wide as the main area, not as wide as the page's content.
    await expect(Math.abs(band.getBoundingClientRect().width - main.getBoundingClientRect().width)).toBeLessThan(1);
    await expect(band.getBoundingClientRect().width).toBeGreaterThan(page.getBoundingClientRect().width + 100);
    // The fill is the canvas token.
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--dbm-bg-canvas)";
    document.body.append(probe);
    const canvasColour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect(getComputedStyle(band).backgroundColor).toBe(canvasColour);
    // The content starts where the page's content starts.
    // A plain section beside it runs edge to edge: its content starts at the window's edge, well outside the page's content.
    const plain = within(canvasElement).getByText(/plain section/i);
    await expect(plain.getBoundingClientRect().left).toBeLessThan(page.getBoundingClientRect().left - 20);
    const text = within(band).getByText(/band as wide as the window/i);
    await expect(Math.abs(text.getBoundingClientRect().left - page.getBoundingClientRect().left)).toBeLessThan(1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
} satisfies Story;

export const AsidePrintsUnderThePage: Story = {
  name: "Printed, the aside is in the flow under the page, in full, whether it is a column or a drawer on screen — print test",
  render: () => <DemoPageShell aside asideCollapse="drawer" asideCollapseBelow="3xl" asideSticky rows={6} />,
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    const aside = canvasElement.querySelector<HTMLElement>("aside")!;
    await whilePrinting(async () => {
      await expect(getComputedStyle(aside).display).toBe("block");
      await expect(getComputedStyle(aside).position).toBe("static");
      await expect(aside.getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().bottom - 1);
      await expect(getComputedStyle(within(canvasElement).getByLabelText("Show details")).display).toBe("none");
    });
  },
};
