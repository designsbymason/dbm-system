import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DemoTopNavShell } from "./TopNavShellStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, a breakpoint, scrolling, forced colours, print, a real wheel).
// They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another. The page scrolls as a whole, so
// each check that scrolls uses the window.
const meta: Meta = {
  title: "Templates/Application shells/TopNavShell/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen", fullBleed: true },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A real key press through the Chrome DevTools Protocol: a synthetic one neither sets `:focus-visible` nor scrolls anything. */
async function press(key: "Tab" | "Enter", windowsVirtualKeyCode: number, text?: string) {
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

/** The shell's pieces. The banner of a `Navbar` is its `<header>`; the slot around it is the shell's header. */
function slots(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const shell = canvasElement.querySelector<HTMLElement>("[data-sticky-header], [data-scrolled-edge]") as HTMLElement;
  const bar = canvas.getByRole("banner");
  const slot = bar.parentElement as HTMLElement;
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
  render: () => <DemoTopNavShell subNav />,
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
  render: () => <DemoTopNavShell subNav banner />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const { shell } = slots(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(shell.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const PhoneLayout: Story = {
  name: "On a phone the bar's links are behind a menu button, the sub-navigation scrolls inside its own row, and the page does not scroll sideways — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DemoTopNavShell subNav banner />,
  play: async ({ canvasElement }) => {
    // Fails loudly if the pinned viewport did not apply.
    await expect(window.innerWidth).toBeLessThan(768);
    const { canvas, shell, slot } = slots(canvasElement);
    await expect(canvas.queryByRole("navigation", { name: "Main" })).toBeNull();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(shell.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The sub-navigation does not fit a phone: it scrolls inside its own row, which is no wider than the window.
    const row = slot.querySelector<HTMLElement>("[data-sub-nav-scroller]") as HTMLElement;
    await expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    await expect(row.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    // It fades at the edge that has more links beyond it (the end, at its start), and the fade takes no click.
    const rowBox = row.parentElement as HTMLElement;
    await waitFor(() => expect(rowBox).toHaveAttribute("data-overflow-end"));
    await expect(rowBox).not.toHaveAttribute("data-overflow-start");
    await waitFor(() => expect(getComputedStyle(rowBox, "::after").opacity).toBe("1"));
    await expect(getComputedStyle(rowBox, "::after").pointerEvents).toBe("none");
    await expect(getComputedStyle(rowBox, "::before").opacity).toBe("0");
    // The menu button opens the bar's links in a panel, and Escape closes it.
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(within(panel).getByRole("link", { name: "Reports" })).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const HeaderStaysUnderARealWheel: Story = {
  name: "A real wheel scroll leaves the header and the sub-navigation at the top, with a shadow, and the page back at its top clears it — layout test",
  render: () => <DemoTopNavShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, shell, bar, slot } = slots(canvasElement);
    const subNav = canvas.getByRole("navigation", { name: "Project sections" });
    await atTop();
    await expect(shell).not.toHaveAttribute("data-scrolled");
    const height = slot.getBoundingClientRect().height;
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    // The slot, the bar in it and the sub-navigation under the bar are all where they were: at the top of the window.
    await expect(Math.abs(slot.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(Math.abs(bar.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(Math.abs(slot.getBoundingClientRect().height - height)).toBeLessThan(1);
    await expect(subNav.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom - 1);
    await expect(subNav.getBoundingClientRect().bottom).toBeLessThanOrEqual(slot.getBoundingClientRect().bottom + 1);
    // It is above the page's content as that passes under it, and casts a shadow once the page has scrolled.
    await expect(getComputedStyle(slot).position).toBe("sticky");
    await expect(Number(getComputedStyle(slot).zIndex)).toBeGreaterThan(0);
    await waitFor(() => expect(shell).toHaveAttribute("data-scrolled"));
    await waitFor(() => expect(getComputedStyle(slot).boxShadow).not.toBe("none"));
    await atTop();
    await waitFor(() => expect(shell).not.toHaveAttribute("data-scrolled"));
    await waitFor(() => expect(getComputedStyle(slot).boxShadow).toBe("none"));
  },
};

export const HeaderScrollsAwayWhenNotSticky: Story = {
  name: "With stickyHeader off the header scrolls away with the page and there is no shadow — layout test",
  render: () => <DemoTopNavShell stickyHeader={false} subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { shell, slot } = slots(canvasElement);
    await atTop();
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(getComputedStyle(slot).position).toBe("relative");
    await expect(slot.getBoundingClientRect().bottom).toBeLessThan(0);
    await expect(getComputedStyle(slot).boxShadow).toBe("none");
    await expect(shell).not.toHaveAttribute("data-sticky-header");
    await atTop();
  },
};

export const BannerScrollsAway: Story = {
  name: "A banner above the header scrolls away, and the header then sticks at the very top — layout test",
  render: () => <DemoTopNavShell banner rows={80} />,
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
  render: () => <DemoTopNavShell rows={1} />,
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
  render: () => <DemoTopNavShell rows={80} />,
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
  render: () => <DemoTopNavShell subNav />,
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
  return <DemoTopNavShell pageKey={page} pageTitle={titles[page]} onNavigate={setPage} />;
}

export const BusyBarLiesAlongTheTopOfTheMain: Story = {
  name: "While busy, a bar lies along the top of the main area, takes no room, and the page stays where it is — layout test",
  render: () => <DemoTopNavShell busy rows={6} />,
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
  render: () => <DemoTopNavShell dir="rtl" subNav />,
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
  render: () => <DemoTopNavShell />,
  play: async ({ canvasElement }) => {
    const { shell } = slots(canvasElement);
    await expect(shell).not.toHaveAttribute("lang");
  },
};

export const ForcedColoursInteraction: Story = {
  name: "In forced colours the frame takes the system colours, and a scrolled header gets a line of its own, since shadows are dropped — forced colours test",
  render: () => <DemoTopNavShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { shell, slot } = slots(canvasElement);
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
      await expect(getComputedStyle(slot).borderBlockEndStyle).toBe("none");
      window.scrollTo(0, 600);
      await nextFrame();
      await waitFor(() => expect(shell).toHaveAttribute("data-scrolled"));
      // The shadow is gone and a one-pixel line in the text colour takes its place.
      await expect(getComputedStyle(slot).borderBlockEndStyle).toBe("solid");
      await expect(getComputedStyle(slot).borderBlockEndWidth).toBe("1px");
    } finally {
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
      await atTop();
    }
  },
};

export const ReducedMotionKeepsTheShadowInstant: Story = {
  name: "With reduced motion the header's shadow appears without a transition — layout test",
  render: () => <DemoTopNavShell rows={80} />,
  play: async ({ canvasElement }) => {
    const { slot } = slots(canvasElement);
    const emulate = (value: "reduce" | "no-preference") => send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
    await atTop();
    await expect(getComputedStyle(slot).transitionProperty).toContain("box-shadow");
    await emulate("reduce");
    try {
      await waitFor(() => expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true));
      await expect(getComputedStyle(slot).transitionDuration).toBe("0s");
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};

export const SafeAreaInsetsKeepTheFrameClear: Story = {
  name: "The frame leaves the device's safe-area insets clear, the header keeps the top inset, and the stylesheet asks the device for them — layout test",
  render: () => <DemoTopNavShell subNav rows={80} />,
  play: async ({ canvasElement }) => {
    const { shell, bar, slot, footer } = slots(canvasElement);
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
    shell.style.setProperty("--top-nav-shell-safe-top", "30px");
    shell.style.setProperty("--top-nav-shell-safe-left", "10px");
    shell.style.setProperty("--top-nav-shell-safe-right", "12px");
    shell.style.setProperty("--top-nav-shell-safe-bottom", "20px");
    await nextFrame();
    // The bar starts below the notch, though the slot is still at the top of the window, stuck or not.
    await expect(Math.abs(bar.getBoundingClientRect().top - 30)).toBeLessThan(1);
    await expect(Math.abs(slot.getBoundingClientRect().top)).toBeLessThan(1);
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    await expect(Math.abs(footer.getBoundingClientRect().bottom - (window.innerHeight - 20))).toBeLessThan(1);
    await expect(Math.abs(slot.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(Math.abs(bar.getBoundingClientRect().top - 30)).toBeLessThan(1);
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
  name: "Printed, the banner, header and footer are in the flow in order, nothing is kept in view, and the skip link and the loading bar are left out — layout test",
  render: () => <DemoTopNavShell banner subNav busy rows={80} />,
  play: async ({ canvasElement }) => {
    const { canvas, shell, slot, main, footer } = slots(canvasElement);
    const skip = canvas.getByText("Skip to content");
    const banner = canvas.getByText(/maintenance/i);
    const bar = main.querySelector<HTMLElement>("[aria-hidden='true']") as HTMLElement;
    await atTop();
    await expect(getComputedStyle(slot).position).toBe("sticky");
    await whilePrinting(async () => {
      await expect(getComputedStyle(slot).position).toBe("static");
      await expect(getComputedStyle(footer).position).toBe("static");
      await expect(getComputedStyle(slot).boxShadow).toBe("none");
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
  render: () => <DemoTopNavShell subNav rows={80} />,
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

export const SubNavCentresAndKeepsTheCurrentLinkInView: Story = {
  name: "The sub-navigation's links are centred while they fit, and on a phone the current link is scrolled into view — layout test",
  render: () => <DemoTopNavShell subNav />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, slot } = slots(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Project sections" });
    const links = within(nav).getAllByRole("link");
    // The links sit in the middle of the window, not at its start.
    const first = links[0]!.getBoundingClientRect();
    const last = links[links.length - 1]!.getBoundingClientRect();
    await expect(Math.abs((first.left + last.right) / 2 - window.innerWidth / 2)).toBeLessThan(2);
    // No line under the row in this demo, and no edge fade, since everything fits.
    await expect(getComputedStyle(slot.querySelector("[data-sub-nav-scroller]")!.parentElement as HTMLElement).borderBlockEndStyle).toBe("none");
    await expect(slot.querySelector("[data-overflow-start], [data-overflow-end]")).toBeNull();
    // The current link is a round ghost button in the subtle tint, and marks itself.
    const current = within(nav).getByRole("link", { name: "Overview" });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(getComputedStyle(current).borderRadius).not.toBe("0px");
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--dbm-bg-brand-subtle)";
    document.body.append(probe);
    const tint = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect(getComputedStyle(current).backgroundColor).toBe(tint);
    await expect(getComputedStyle(links[1]!).backgroundColor).not.toBe(tint);
  },
};

export const SubNavCurrentLinkScrollsIntoViewOnAPhone: Story = {
  name: "On a phone a current link beyond the edge is scrolled into view when the row appears — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <DemoTopNavShell subNav>
      {/* The page is the demo's; the current section is the last one, which a phone cannot show without scrolling. */}
    </DemoTopNavShell>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const { canvas, slot } = slots(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Project sections" });
    const scroller = slot.querySelector<HTMLElement>("[data-sub-nav-scroller]") as HTMLElement;
    const last = within(nav).getByRole("link", { name: "Project settings" });
    await expect(last.getBoundingClientRect().right).toBeGreaterThan(scroller.getBoundingClientRect().right);
    // A real click on the last link makes it the current one, and the row brings it into view and the fade at the end goes.
    await realClick(last);
    await waitFor(() => expect(last).toHaveAttribute("aria-current", "page"));
    await waitFor(() => expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(scroller.getBoundingClientRect().right + 1));
    await waitFor(() => expect(scroller.parentElement).toHaveAttribute("data-overflow-start"));
    // Only the row scrolled: the page did not move.
    await expect(window.scrollY).toBe(0);
  },
};

export const HeaderHidesOnAScrollDownAndReturnsOnAScrollUp: Story = {
  name: "With stickyHeader auto a real wheel down slides the header out of view, a wheel up brings it back, and focus inside keeps it — layout test",
  render: () => <DemoTopNavShell stickyHeader="auto" subNav rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, shell, slot } = slots(canvasElement);
    await atTop();
    await waitFor(() => expect(shell).not.toHaveAttribute("data-header-hidden"));
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await waitFor(() => expect(shell).toHaveAttribute("data-header-hidden"));
    // Out of view: its lower edge is at or above the top of the window.
    await waitFor(() => expect(slot.getBoundingClientRect().bottom).toBeLessThanOrEqual(1));
    // A key press into it: focus is inside it, so it is back, whatever the scroll did.
    await press("Tab", 9);
    await press("Tab", 9);
    await expect(slot.contains(document.activeElement)).toBe(true);
    await waitFor(() => expect(slot.getBoundingClientRect().top).toBeGreaterThanOrEqual(-1));
    (document.activeElement as HTMLElement).blur();
    // A wheel up brings it back for good.
    await wheel(-300);
    await settled();
    await waitFor(() => expect(shell).not.toHaveAttribute("data-header-hidden"));
    await waitFor(() => expect(Math.abs(slot.getBoundingClientRect().top)).toBeLessThan(1));
    await expect(canvas.getByRole("banner")).toBeVisible();
    await atTop();
  },
};

export const SubNavScrollsAwayLeavingTheBar: Story = {
  name: "With sticky off on the sub-navigation only the bar stays at the top of the window while the row scrolls away — layout test",
  render: () => <DemoTopNavShell subNav subNavProps={{ sticky: false }} rows={80} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, bar } = slots(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Project sections" });
    await atTop();
    await expect(nav.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar.getBoundingClientRect().bottom - 1);
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(Math.abs(bar.getBoundingClientRect().top)).toBeLessThan(1);
    await expect(nav.getBoundingClientRect().bottom).toBeLessThanOrEqual(bar.getBoundingClientRect().bottom + 1);
    await atTop();
  },
};

export const ActionsFooterStaysAtTheBottomOfTheWindow: Story = {
  name: "The actions footer stays at the bottom of the window over a long page, and ends the page in place — layout test",
  render: () => <DemoTopNavShell footerVariant="actions" rows={60} />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { footer } = slots(canvasElement);
    await atTop();
    await expect(getComputedStyle(footer).position).toBe("sticky");
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(1);
    await wheel(900);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(300));
    await settled();
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(1);
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(1);
    await atTop();
  },
};
