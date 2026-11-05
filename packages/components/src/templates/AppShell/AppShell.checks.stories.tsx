import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { DemoShell } from "./AppShellStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, a breakpoint, scrolling, forced colours). They run in the
// `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Templates/Application shells/AppShell/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen", fullBleed: true },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The shell, its slots and the page that scrolls. */
function slots(canvasElement: HTMLElement) {
  const shell = canvasElement.querySelector<HTMLElement>("[data-scroll]")!;
  const main = within(canvasElement).getByRole("main");
  const header = within(canvasElement).getByRole("banner");
  const footer = within(canvasElement).getByRole("contentinfo");
  return { shell, main, header, footer };
}

export const DesktopLayout: Story = {
  name: "On a desktop, the sidebar is a column beside the header and main, and only the main area scrolls — layout test",
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { shell, main, header, footer } = slots(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });

    // The frame is exactly the window's height and the document does not scroll.
    await expect(Math.round(shell.getBoundingClientRect().height)).toBe(window.innerHeight);
    await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);

    // The sidebar is at the start edge, beside (not above) the header and main, which share one column.
    const navBox = nav.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();
    const headerBox = header.getBoundingClientRect();
    await expect(navBox.left).toBeLessThan(mainBox.left);
    await expect(navBox.right).toBeLessThanOrEqual(mainBox.left + 1);
    await expect(Math.round(headerBox.left)).toBe(Math.round(mainBox.left));
    await expect(headerBox.bottom).toBeLessThanOrEqual(mainBox.top + 1);
    await expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(mainBox.bottom - 1);

    // The main area is the one scroller: it has more to show than it has room, the header does not move when it scrolls, and the page does not scroll.
    await expect(main.scrollHeight).toBeGreaterThan(main.clientHeight);
    const headerTop = header.getBoundingClientRect().top;
    main.scrollTop = 200;
    await nextFrame();
    await expect(main.scrollTop).toBeGreaterThan(0);
    await expect(header.getBoundingClientRect().top).toBe(headerTop);
    await expect(window.scrollY).toBe(0);
    main.scrollTop = 0;
  },
};

export const TabletLayout: Story = {
  name: "On a tablet, the sidebar is still a column — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const { main } = slots(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    await expect(nav.getBoundingClientRect().width).toBeGreaterThan(0);
    await expect(nav.getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().left + 1);
  },
};

export const PhoneLayout: Story = {
  name: "On a phone, the sidebar column is gone, the main area takes the whole width, and the menu button opens the panel — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    // Fails loudly if the pinned viewport did not apply.
    await expect(window.innerWidth).toBeLessThan(768);
    const { shell, main, header } = slots(canvasElement);

    await expect(Math.round(main.getBoundingClientRect().width)).toBe(window.innerWidth);
    await expect(Math.round(header.getBoundingClientRect().width)).toBe(window.innerWidth);
    // A table wider than the window scrolls inside its own box and does not push the frame or the page wider.
    await expect(shell.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // The sidebar's page copy is not drawn at all.
    await expect(within(canvasElement).queryByRole("navigation", { name: "Main" })).toBeNull();

    // The menu button, in the header outside the sidebar, opens the sidebar's panel (a real click, through the shell's provider).
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Menu" }));
    const panel = await within(document.body).findByRole("dialog");
    // The panel slides in, so wait for it to settle.
    await waitFor(() => expect(within(panel).getByRole("link", { name: "Home" })).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

export const EndSidebarLayout: Story = {
  name: "With sidebarSide end, the sidebar is at the end edge — layout test",
  render: () => <DemoShell sidebarSide="end" />,
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    await expect(nav.getBoundingClientRect().left).toBeGreaterThanOrEqual(main.getBoundingClientRect().right - 1);
    await expect(Math.round(nav.getBoundingClientRect().right)).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const RightToLeftInteraction: Story = {
  name: "In right to left, the sidebar is on the right and the main area on the left — layout test",
  render: () => <DemoShell dir="rtl" />,
  play: async ({ canvasElement }) => {
    const { shell, main, header } = slots(canvasElement);
    await expect(getComputedStyle(shell).direction).toBe("rtl");
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    await expect(nav.getBoundingClientRect().left).toBeGreaterThanOrEqual(main.getBoundingClientRect().right - 1);
    await expect(Math.round(header.getBoundingClientRect().right)).toBe(Math.round(main.getBoundingClientRect().right));
  },
};

export const SkipLinkInteraction: Story = {
  name: "The skip link is the first tab stop and moves focus to the main area — keyboard test",
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    await userEvent.tab();
    const skip = within(canvasElement).getByRole("link", { name: "Skip to content" });
    await expect(skip).toHaveFocus();
    // The link points at the main area's id. (The demo's link moves focus itself, so a click does not change the preview's address.)
    await expect(skip).toHaveAttribute("href", `#${main.id}`);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(main).toHaveFocus());
    // The main area is focused programmatically and draws no ring of its own.
    await expect(getComputedStyle(main).outlineStyle).toBe("none");
    await userEvent.tab();
    await expect(main.contains(document.activeElement)).toBe(true);
  },
};

export const PageScrollLayout: Story = {
  name: "With scroll page, the frame grows with its content and the page scrolls — layout test",
  render: () => <DemoShell scroll="page" />,
  play: async ({ canvasElement }) => {
    const { shell, main } = slots(canvasElement);
    await expect(shell.getBoundingClientRect().height).toBeGreaterThan(window.innerHeight);
    await expect(document.documentElement.scrollHeight).toBeGreaterThan(window.innerHeight);
    await expect(getComputedStyle(main).overflowY).toBe("visible");
  },
};

export const ForcedColoursInteraction: Story = {
  name: "In forced colours the frame keeps its layout and takes the system colours — forced colours test",
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    const { shell, main } = slots(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const before = main.getBoundingClientRect().width;
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      // The theme's surface colour is replaced by the system `Canvas` colour.
      const probe = document.createElement("div");
      probe.style.backgroundColor = "Canvas";
      document.body.append(probe);
      const canvas = getComputedStyle(probe).backgroundColor;
      probe.remove();
      await expect(getComputedStyle(shell).backgroundColor).toBe(canvas);
      await expect(getComputedStyle(main).overflowY).toBe("auto");
      await expect(Math.abs(main.getBoundingClientRect().width - before)).toBeLessThan(2);
    } finally {
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};
