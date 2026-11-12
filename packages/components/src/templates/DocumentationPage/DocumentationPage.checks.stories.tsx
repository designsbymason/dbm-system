import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { nextFrame, pressEscape, pressKey, realClick, settled, wheel } from "../_shared/realInput";
import { DocumentationPage, documentationCopy } from "./DocumentationPageStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, a breakpoint, sticking, scrolling, a real press, print). They run in the
// `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Templates/Data pages/Documentation Page/Checks",
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
    // The row of pills is the outline below lg only: here the column is.
    await expect(canvas.queryByRole("navigation", { name: documentationCopy.contentsRowName })).toBeNull();
    // The header spans the window: the brand is at its start edge (over the navigation column) and the links are exactly in the middle of it.
    const brand = canvas.getByRole("link", { name: documentationCopy.brand });
    await expect(brand.getBoundingClientRect().left).toBeLessThan(40);
    const links = canvas.getByRole("navigation", { name: documentationCopy.mainNavigation }).getBoundingClientRect();
    await expect(Math.abs((links.left + links.right) / 2 - window.innerWidth / 2)).toBeLessThanOrEqual(1);
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

/** Which part of the page holds focus, by landmark. */
function where(element: Element | null): string {
  if (!element) return "none";
  if (element.closest("header")) return "header";
  if (element.closest("aside")) return "outline";
  if (element.closest(`nav[aria-label="${documentationCopy.sidebarName}"]`)) return "sidebar";
  if (element.closest("main")) return "page";
  if (element.closest("footer")) return "footer";
  return element.textContent?.includes("Skip") ? "skip" : "other";
}

export const PrimaryTaskByRealKeys: Story = {
  name: "With real keys only, Tab goes from the skip link through the header, the navigation, the page and the outline in markup order, and Enter on an outline entry jumps to its section with focus moved onto the section — interaction test",
  tags: ["!dev"],
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    const { header, outline } = parts(canvasElement);
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement | null)?.blur();
    // Tab through the page until the outline's "Usage" entry has focus, noting the part each stop is in; the order of the parts is the keyboard's path.
    const usage = within(outline as HTMLElement).getByRole("link", { name: "Usage" });
    const path: string[] = [];
    for (let step = 0; step < 60 && document.activeElement !== usage; step += 1) {
      await pressKey("Tab");
      const part = where(document.activeElement);
      if (path[path.length - 1] !== part) path.push(part);
    }
    await expect(document.activeElement).toBe(usage);
    await expect(path).toEqual(["skip", "header", "sidebar", "page", "outline"]);
    // Enter follows the link: the section is under the header, the entry is current, and focus moved onto the section (the outline hands it on, so the next Tab reads the section and does not start from the top of the page).
    await pressKey("Enter");
    await settled();
    const section = canvasElement.querySelector<HTMLElement>("#usage")!;
    await waitFor(() => expect(section.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - 2));
    await waitFor(() => expect(usage).toHaveAttribute("aria-current", "location"));
    await expect(document.activeElement).toBe(section);
    // Scrolled well down the page by a real wheel, the back-to-top button is offered.
    await wheel(1500);
    await settled();
    await waitFor(() => expect(within(document.body).getByRole("button", { name: "Back to top" })).toBeVisible());
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
  name: "On a tablet the navigation leaves for its panel, the outline is a sticky row of pills under the header, and the page does not scroll sideways — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    await expect(window.innerWidth).toBeLessThan(1024);
    const { canvas, header, main, sidebar, outline } = parts(canvasElement);
    // The sidebar is out of the page (its column is gone), reached through the header's menu button.
    await expect((sidebar as HTMLElement | null)?.getBoundingClientRect().width ?? 0).toBe(0);
    await expect(canvas.getByRole("button", { name: "Menu" })).toBeVisible();
    // The header's actions are at the window's end edge even though the links have left the bar.
    await expect(canvas.getByRole("button", { name: documentationCopy.search }).getBoundingClientRect().right).toBeGreaterThan(window.innerWidth - 40);
    // The column's outline is gone; the outline is a row of pills at the top of the page, which sticks under the header as the page scrolls.
    await expect(outline).toBeNull();
    const row = canvas.getByRole("navigation", { name: documentationCopy.contentsRowName });
    await expect(row).toBeVisible();
    await expect(within(row).getAllByRole("link").map((link) => link.textContent)).toEqual(documentationCopy.sections.map((section) => section.title));
    await expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(main.getBoundingClientRect().top - 1);
    window.scrollTo(0, 600);
    await nextFrame();
    await waitFor(() => expect(Math.abs(row.getBoundingClientRect().top - header.getBoundingClientRect().bottom)).toBeLessThan(2));
    window.scrollTo(0, 0);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const PhonePanelByRealPresses: Story = {
  name: "On a phone the one menu button opens a panel holding the site's links and then the navigation by a real click, focus goes into it, Escape closes it and focus returns to the button — interaction test",
  tags: ["!dev"],
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DocumentationPage />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const { canvas } = parts(canvasElement);
    // One menu button: the header's links are not in the bar on a phone, so there is nothing for a second one to open.
    await expect(canvas.getAllByRole("button", { name: "Menu" })).toHaveLength(1);
    const menu = canvas.getByRole("button", { name: "Menu" });
    await realClick(menu);
    const panel = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
    await waitFor(() => expect(within(panel).getByRole("link", { name: documentationCopy.title })).toBeVisible());
    // The panel is `panelWidth` (20rem) wide, or the window less a sliver where that is narrower (the test window can be 320px), and so wider than the column's
    // 16rem; the page still does not scroll sideways with it open.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const panelWidth = panel.getBoundingClientRect().width;
    await expect(panelWidth).toBeGreaterThan(16 * rem);
    await expect(panelWidth).toBeLessThanOrEqual(20 * rem);
    await expect(panelWidth).toBeLessThan(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The one drawer holds both: the site's links first, and the current one (Components) is an expandable group, open, holding its section.
    const order = within(panel).getAllByRole("link").map((link) => link.textContent);
    await expect(order.indexOf(documentationCopy.docs)).toBeGreaterThanOrEqual(0);
    await expect(order.indexOf(documentationCopy.docs)).toBeLessThan(order.indexOf(documentationCopy.sidebarItems[0] as string));
    const group = within(panel).getByRole("button", { name: documentationCopy.components });
    await expect(group).toHaveAttribute("aria-expanded", "true");
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

