import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DocumentationPage, documentationCopy } from "./DocumentationPageStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, a breakpoint, sticking, scrolling, a real press, print). They run in the
// `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Templates/Application shells/Documentation Page/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen", fullBleed: true },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

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
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

/** A real key press through the Chrome DevTools Protocol. */
async function pressEscape() {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
}

/** Waits for a smooth scroll to finish: the page has not moved for a few frames. */
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

/** The page's parts. */
function parts(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  return {
    canvas,
    header: canvas.getByRole("banner"),
    main: canvas.getByRole("main"),
    footer: canvas.getByRole("contentinfo"),
    sidebar: canvas.queryByRole("navigation", { name: documentationCopy.sidebarName }),
    outline: canvas.queryByRole("complementary", { name: documentationCopy.contentsTitle }),
  };
}

export const DesktopLayout: Story = {
  name: "On a desktop the navigation, the page and the outline are three columns, each landmark is there once, and the page does not scroll sideways — layout test",
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { canvas, main, sidebar, outline } = parts(canvasElement);
    // The header's links are a navigation named "Main", beside the sidebar's own (a name each, so they are told apart).
    await expect(canvas.getByRole("navigation", { name: documentationCopy.mainNavigation })).toBeVisible();
    await expect(sidebar).not.toBeNull();
    await expect(outline).not.toBeNull();
    const navBox = (sidebar as HTMLElement).getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();
    const outlineBox = (outline as HTMLElement).getBoundingClientRect();
    await expect(navBox.right).toBeLessThanOrEqual(mainBox.left + 1);
    await expect(mainBox.right).toBeLessThanOrEqual(outlineBox.left + 1);
    await expect(Math.abs(navBox.left)).toBeLessThan(1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
};

export const SidebarAndOutlineStayUnderTheHeader: Story = {
  name: "A real wheel scroll leaves the navigation and the outline stuck under the header, the navigation as tall as the rest of the window — layout test",
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    const { header, sidebar, outline } = parts(canvasElement);
    window.scrollTo(0, 0);
    await wheel(300);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(150));
    await settled();
    const bottom = header.getBoundingClientRect().bottom;
    // Stuck at the header's measured height, which is no step of the spacing scale, and not behind the bar.
    const column = (sidebar as HTMLElement).closest("[class*='sticky']") as HTMLElement;
    await waitFor(() => expect(Math.abs(column.getBoundingClientRect().top - bottom)).toBeLessThan(2));
    await expect(Math.abs(column.getBoundingClientRect().height - (window.innerHeight - bottom))).toBeLessThan(2);
    await waitFor(() => expect(Math.abs((outline as HTMLElement).getBoundingClientRect().top - bottom)).toBeLessThan(2), { timeout: 3000 });
    window.scrollTo(0, 0);
  },
};

export const OutlineLinkJumpsAndFollowsTheScroll: Story = {
  name: "A real click on an outline entry scrolls to its section and marks it current, and a real scroll moves the mark on — interaction test",
  tags: ["!dev"],
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    const { header, outline } = parts(canvasElement);
    const links = within(outline as HTMLElement).getAllByRole("link");
    const usage = links.find((link) => link.textContent === "Usage") as HTMLElement;
    window.scrollTo(0, 0);
    await realClick(usage);
    await settled();
    const section = canvasElement.querySelector<HTMLElement>("#usage")!;
    // The section's heading is in view under the header, not behind it.
    await waitFor(() => expect(section.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - 2));
    await waitFor(() => expect(usage).toHaveAttribute("aria-current", "location"));
    await wheel(1500);
    await settled();
    await waitFor(() => expect(usage).not.toHaveAttribute("aria-current", "location"));
    await expect(links.filter((link) => link.getAttribute("aria-current") === "location")).toHaveLength(1);
    window.scrollTo(0, 0);
  },
};

export const FooterEndsAShortPage: Story = {
  name: "On a short page the footer follows the navigation column and ends the page, with no gap under it — layout test",
  render: () => <DocumentationPage sections={1} contents={false} />,
  play: async ({ canvasElement }) => {
    const { footer, main } = parts(canvasElement);
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    // The footer is the last thing on the page, at the bottom of the window once the page is scrolled to its end, and under the page's own text.
    await expect(Math.abs(footer.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(2);
    await expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().bottom - 1);
    window.scrollTo(0, 0);
  },
};

export const TabletLayout: Story = {
  name: "On a tablet the navigation leaves for its panel, the outline drops under the page, and the page does not scroll sideways — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    await expect(window.innerWidth).toBeLessThan(1024);
    const { canvas, main, sidebar, outline } = parts(canvasElement);
    // The sidebar is out of the page (its column is gone), reached through the header's menu button.
    await expect((sidebar as HTMLElement | null)?.getBoundingClientRect().width ?? 0).toBe(0);
    await expect(canvas.getByRole("button", { name: documentationCopy.sidebarMenu })).toBeVisible();
    // The outline is under the page, in the order written, at the page's full width.
    await expect((outline as HTMLElement).getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().bottom - 1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const PhonePanelByRealPresses: Story = {
  name: "On a phone the menu button opens the navigation panel by a real click, focus goes into it, Escape closes it and focus returns to the button — interaction test",
  tags: ["!dev"],
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const { canvas } = parts(canvasElement);
    const menu = canvas.getByRole("button", { name: documentationCopy.sidebarMenu });
    await realClick(menu);
    const panel = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
    await waitFor(() => expect(within(panel).getByRole("link", { name: documentationCopy.title })).toBeVisible());
    await pressEscape();
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(menu).toHaveFocus());
  },
};

export const PrintsThePageWithoutItsNavigation: Story = {
  name: "Printed, the navigation column and the outline are left out and the page is in the flow in full — print test",
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    const { main, sidebar, outline } = parts(canvasElement);
    const column = (sidebar as HTMLElement).closest("[class*='sticky']") as HTMLElement;
    await expect(getComputedStyle(column).display).not.toBe("none");
    await document.fonts.ready;
    await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
    try {
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(true));
      await nextFrame();
      await expect(getComputedStyle(column).display).toBe("none");
      await expect(getComputedStyle(outline as HTMLElement).display).toBe("none");
      await expect(main.getBoundingClientRect().left).toBeLessThan(2);
    } finally {
      await send("Emulation.setEmulatedMedia", { media: "", features: [] });
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(false));
    }
  },
};

export const ForcedColoursTakeTheSystemColours: Story = {
  name: "In forced colours the page takes the system colours and keeps its columns — forced colours test",
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    const { header, main, sidebar } = parts(canvasElement);
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
      await expect((sidebar as HTMLElement).getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().left + 1);
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};

// A real click that is not used elsewhere is kept out of the way of the linter.
void userEvent;

