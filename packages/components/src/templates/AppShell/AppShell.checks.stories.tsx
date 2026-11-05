import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { AppShell } from "./AppShell";
import { DemoNavigationShell, DemoPlainHeaderShell, DemoShell, DemoStickyBarShell } from "./AppShellStoryKit";

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

/** A real key press through the Chrome DevTools Protocol: a synthetic one neither sets `:focus-visible` nor scrolls anything. */
async function press(key: "Tab" | "ArrowDown", windowsVirtualKeyCode: number) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode });
}

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
    // The keyboard moved focus here, so the ring is drawn, inside the edge (an outer one would be clipped by the scrolling box).
    await expect(main.matches(":focus-visible")).toBe(true);
    const ring = getComputedStyle(main);
    await expect(ring.outlineStyle).toBe("solid");
    await expect(Number.parseFloat(ring.outlineWidth)).toBeGreaterThan(0);
    await expect(Number.parseFloat(ring.outlineOffset)).toBeLessThan(0);
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
    // Not a tab stop: the page scrolls, so the main area has nothing of its own to scroll.
    await expect(main).toHaveAttribute("tabindex", "-1");
  },
};

export const PageScrollStickyInteraction: Story = {
  name: "With scroll page, the header and the sidebar stay in view while the page scrolls — layout test",
  render: () => <DemoShell scroll="page" />,
  play: async ({ canvasElement }) => {
    const { shell, main, header } = slots(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    // The header is measured after the first paint; the shell flags it once it is.
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    const headerHeight = header.getBoundingClientRect().height;
    // The main area starts exactly where the header ends, though the header now spans every row.
    await expect(Math.abs(main.getBoundingClientRect().top - headerHeight)).toBeLessThan(1);

    window.scrollTo(0, 400);
    await nextFrame();
    await expect(window.scrollY).toBeGreaterThan(0);
    await expect(Math.abs(header.getBoundingClientRect().top)).toBeLessThan(1);
    // The sidebar's column: the slot that holds it, a direct child of the shell.
    let sidebarSlot: HTMLElement = nav;
    while (sidebarSlot.parentElement !== shell) sidebarSlot = sidebarSlot.parentElement!;
    await expect(Math.abs(sidebarSlot.getBoundingClientRect().top)).toBeLessThan(1);
    // It is as tall as the window, not as tall as the page, so its own content scrolls and its footer is in view.
    await expect(Math.round(sidebarSlot.getBoundingClientRect().height)).toBe(window.innerHeight);
    // The header is above the page's content as it passes under.
    let headerSlot: HTMLElement = header;
    while (headerSlot.parentElement !== shell) headerSlot = headerSlot.parentElement!;
    await expect(getComputedStyle(headerSlot).position).toBe("sticky");
    await expect(Number(getComputedStyle(headerSlot).zIndex)).toBeGreaterThan(0);
    window.scrollTo(0, 0);
  },
};

export const TextOnlyMainInteraction: Story = {
  name: "A scrolling main area with nothing focusable in it is a tab stop that the keyboard can scroll, with a visible ring — keyboard test",
  render: () => (
    <DemoShell>
      <h1>Text only</h1>
      {Array.from({ length: 80 }, (_, index) => (
        <p key={index}>Paragraph {index + 1} of plain text with no links or controls in it.</p>
      ))}
    </DemoShell>
  ),
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    await waitFor(() => expect(main).toHaveAttribute("tabindex", "0"));
    // Tab from the last control before it (the sidebar's collapse button) lands on the main area.
    const toggle = within(canvasElement).getByRole("button", { name: "Collapse sidebar" });
    toggle.focus();
    await press("Tab", 9);
    await waitFor(() => expect(main).toHaveFocus());
    await expect(main.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(main).outlineStyle).toBe("solid");
    // The arrow keys scroll it.
    for (let step = 0; step < 3; step += 1) await press("ArrowDown", 40);
    await waitFor(() => expect(main.scrollTop).toBeGreaterThan(0));
    main.scrollTop = 0;
  },
};

export const FittingMainInteraction: Story = {
  name: "A main area whose content fits is not a tab stop — keyboard test",
  render: () => (
    <DemoShell>
      <h1>Short</h1>
      <p>Nothing to scroll.</p>
    </DemoShell>
  ),
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    await expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight);
    await expect(main).toHaveAttribute("tabindex", "-1");
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

// --- The aside, the header's reach, the safe-area insets, a page change and the standalone skip link ---

const px = (value: string) => Number.parseFloat(value);
/** The main area of a shell that has no footer. */
const mainOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole("main");
const rootRem = () => px(getComputedStyle(document.documentElement).fontSize);
const asideOf = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("complementary", { name: "Order details" });

/** The slot (a direct child of the shell) that holds an element: where the grid places it. */
function slotOf(shell: HTMLElement, element: HTMLElement): HTMLElement {
  let slot = element;
  while (slot.parentElement !== shell) slot = slot.parentElement!;
  return slot;
}

export const AsideOnADesktop: Story = {
  name: "On a desktop the aside is a column at the end edge, as wide as its token, beside the main area and under the header — layout test",
  render: () => <DemoShell aside />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const { shell, main, header, footer } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    const box = aside.getBoundingClientRect();
    await expect(Math.abs(box.right - window.innerWidth)).toBeLessThan(1);
    await expect(Math.abs(box.width - 20 * rootRem())).toBeLessThan(1);
    // beside the main area, not above or below it
    await expect(box.left).toBeGreaterThanOrEqual(
      main.getBoundingClientRect().right - 1,
    );
    // the header runs over both the main area and the aside (the default `headerSpan="content"`), and the aside starts under it
    await expect(
      Math.abs(header.getBoundingClientRect().right - box.right),
    ).toBeLessThan(1);
    await expect(box.top).toBeGreaterThanOrEqual(
      header.getBoundingClientRect().bottom - 1,
    );
    // the aside runs down beside the footer too
    await expect(
      Math.abs(box.bottom - footer.getBoundingClientRect().bottom),
    ).toBeLessThan(1);
    // a line along its inner edge, and its own scroller
    await expect(getComputedStyle(aside).borderInlineStartWidth).not.toBe(
      "0px",
    );
    await expect(getComputedStyle(aside).overflowY).toBe("auto");
    // the toggle is there for the drawer, and hidden while the aside is on the page
    await expect(
      getComputedStyle(
        shell.querySelector<HTMLElement>('button[aria-label="Show details"]')!,
      ).display,
    ).toBe("none");
  },
};

export const AsideDrawerOnATablet: Story = {
  name: "Below its collapse width the aside leaves the page, and the toggle opens the same content in a drawer that gives focus back — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => <DemoShell aside />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(1024);
    const { shell, main } = slots(canvasElement);
    // the aside is out of the page (and the accessibility tree), and the main area has its room
    const aside = shell.querySelector<HTMLElement>("aside")!;
    await expect(getComputedStyle(aside).display).toBe("none");
    await expect(within(canvasElement).queryByRole("complementary")).toBeNull();
    const toggle = within(canvasElement).getByRole("button", {
      name: "Show details",
    });
    await expect(getComputedStyle(toggle).display).not.toBe("none");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(main.getBoundingClientRect().right).toBeLessThanOrEqual(
      window.innerWidth + 1,
    );

    await userEvent.click(toggle);
    const drawer = await within(document.body).findByRole("dialog", {
      name: "Order details",
    });
    await waitFor(() =>
      expect(
        drawer
          .getAnimations()
          .every((animation) => animation.playState === "finished"),
      ).toBe(true),
    );
    await expect(within(drawer).getByText("Order #1042")).toBeVisible();
    // as wide as the token, from the end edge
    await expect(
      Math.abs(drawer.getBoundingClientRect().width - 20 * rootRem()),
    ).toBeLessThan(1);
    await expect(
      Math.abs(drawer.getBoundingClientRect().right - window.innerWidth),
    ).toBeLessThan(1);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(within(document.body).queryByRole("dialog")).toBeNull(),
    );
    await waitFor(() => expect(toggle).toHaveFocus());
  },
};

export const AsideHiddenOnAPhone: Story = {
  name: "With asideCollapseTo hidden the aside is gone below its collapse width and there is no toggle — layout test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DemoShell aside asideCollapseTo="hidden" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const { shell, main } = slots(canvasElement);
    await expect(
      getComputedStyle(shell.querySelector<HTMLElement>("aside")!).display,
    ).toBe("none");
    await expect(
      getComputedStyle(
        shell.querySelector<HTMLElement>('button[aria-label="Show details"]')!,
      ).display,
    ).toBe("none");
    await expect(Math.round(main.getBoundingClientRect().width)).toBe(
      window.innerWidth,
    );
    await expect(within(document.body).queryByRole("dialog")).toBeNull();
  },
};

export const AsideInRightToLeftInteraction: Story = {
  name: "In right to left the aside is at the left edge and the sidebar at the right — layout test",
  render: () => <DemoShell aside dir="rtl" />,
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    const aside = asideOf(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    await expect(Math.abs(aside.getBoundingClientRect().left)).toBeLessThan(1);
    await expect(aside.getBoundingClientRect().right).toBeLessThanOrEqual(
      main.getBoundingClientRect().left + 1,
    );
    await expect(nav.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      main.getBoundingClientRect().right - 1,
    );
  },
};

export const HeaderOverTheSidebar: Story = {
  name: "With headerSpan full the header runs across the top, over the sidebar, which starts under it — layout test",
  render: () => <DemoShell headerSpan="full" aside />,
  play: async ({ canvasElement }) => {
    const { shell, main, header } = slots(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    const sidebarSlot = slotOf(shell, nav);
    const bar = header.getBoundingClientRect();
    await expect(
      Math.abs(bar.left - shell.getBoundingClientRect().left),
    ).toBeLessThan(1);
    await expect(Math.abs(bar.right - window.innerWidth)).toBeLessThan(1);
    await expect(
      Math.abs(sidebarSlot.getBoundingClientRect().top - bar.bottom),
    ).toBeLessThan(1);
    await expect(
      Math.abs(asideOf(canvasElement).getBoundingClientRect().top - bar.bottom),
    ).toBeLessThan(1);
    await expect(
      Math.abs(main.getBoundingClientRect().top - bar.bottom),
    ).toBeLessThan(1);
    // with the default the sidebar spans the header's row too
  },
};

export const HeaderOverTheSidebarEndSide: Story = {
  name: "With headerSpan full and the sidebar at the end edge the header still runs across the whole top — layout test",
  render: () => <DemoShell headerSpan="full" sidebarSide="end" aside />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    await expect(
      Math.abs(header.getBoundingClientRect().right - window.innerWidth),
    ).toBeLessThan(1);
    await expect(
      Math.abs(
        header.getBoundingClientRect().left -
          shell.getBoundingClientRect().left,
      ),
    ).toBeLessThan(1);
    await expect(nav.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      header.getBoundingClientRect().bottom - 1,
    );
  },
};

export const PageScrollWithAsideAndFullHeader: Story = {
  name: "With scroll page the sidebar and the aside stick below the header, as tall as the rest of the window — layout test",
  render: () => <DemoShell scroll="page" headerSpan="full" aside />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    const sidebarSlot = slotOf(shell, nav);
    const aside = asideOf(canvasElement);
    const height = header.getBoundingClientRect().height;
    window.scrollTo(0, 500);
    await nextFrame();
    await expect(window.scrollY).toBeGreaterThan(0);
    await expect(Math.abs(header.getBoundingClientRect().top)).toBeLessThan(1);
    for (const column of [sidebarSlot, aside]) {
      await expect(
        Math.abs(column.getBoundingClientRect().top - height),
      ).toBeLessThan(1);
      await expect(
        Math.abs(
          column.getBoundingClientRect().height - (window.innerHeight - height),
        ),
      ).toBeLessThan(1.5);
    }
    window.scrollTo(0, 0);
  },
};

export const SafeAreaInsetsKeepTheFrameClear: Story = {
  name: "The frame leaves the device's safe-area insets clear on every side, and the stylesheet asks the device for them — layout test",
  render: () => <DemoShell aside />,
  play: async ({ canvasElement }) => {
    const { shell, header, footer } = slots(canvasElement);
    // The stylesheet reads each side from the device's own inset...
    const rules = Array.from(document.styleSheets).flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText);
      } catch {
        return []; // a sheet from another origin (a font) can't be read, and has nothing of ours
      }
    });
    const source = rules.join("\n");
    for (const side of ["top", "right", "bottom", "left"])
      await expect(source).toContain(`env(safe-area-inset-${side}`);
    // ...and a desktop has none, so stand one in through the custom properties it is read into (the way the drawer's check does).
    const before = {
      header: header.getBoundingClientRect().top,
      footer: footer.getBoundingClientRect().bottom,
    };
    await expect(Math.abs(before.header)).toBeLessThan(1);
    shell.style.setProperty("--app-shell-safe-top", "30px");
    shell.style.setProperty("--app-shell-safe-right", "12px");
    shell.style.setProperty("--app-shell-safe-bottom", "20px");
    shell.style.setProperty("--app-shell-safe-left", "10px");
    await nextFrame();
    await expect(
      Math.abs(header.getBoundingClientRect().top - 30),
    ).toBeLessThan(1);
    await expect(
      Math.abs(
        footer.getBoundingClientRect().bottom - (window.innerHeight - 20),
      ),
    ).toBeLessThan(1);
    const nav = within(canvasElement).getByRole("navigation", { name: "Main" });
    await expect(
      Math.abs(slotOf(shell, nav).getBoundingClientRect().left - 10),
    ).toBeLessThan(1);
    await expect(
      Math.abs(
        asideOf(canvasElement).getBoundingClientRect().right -
          (window.innerWidth - 12),
      ),
    ).toBeLessThan(1);
    // the frame is still exactly the window (the insets are inside it)
    await expect(Math.round(shell.getBoundingClientRect().height)).toBe(
      window.innerHeight,
    );
  },
};

export const SafeAreaTopBelongsToTheHeaderWhenThePageScrolls: Story = {
  name: "With scroll page the top inset is the header's own padding, so the header covers the strip under a notch — layout test",
  render: () => <DemoShell scroll="page" />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    // Let the page finish laying out (a late font would re-measure the header and hide a missed padding change), then change the inset alone.
    await document.fonts.ready;
    await nextFrame();
    await nextFrame();
    shell.style.setProperty("--app-shell-safe-top", "30px");
    await nextFrame();
    const slot = slotOf(shell, header);
    await expect(px(getComputedStyle(slot).paddingTop)).toBe(30);
    // the measured height includes it, so the first row and the sticky header agree
    await waitFor(() =>
      expect(
        Math.abs(
          slot.getBoundingClientRect().height -
            px(
              getComputedStyle(shell).getPropertyValue(
                "--app-shell-header-height",
              ),
            ),
        ) < 1,
      ).toBe(true),
    );
    window.scrollTo(0, 400);
    await nextFrame();
    await expect(Math.abs(slot.getBoundingClientRect().top)).toBeLessThan(1);
    window.scrollTo(0, 0);
  },
};

export const PageChangeMovesFocusAndAnnounces: Story = {
  name: "Moving to another page moves focus to the main area, scrolls it back to the top and announces the new title — keyboard test",
  render: () => <DemoNavigationShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = mainOf(canvasElement);
    // not on the first render
    await expect(main).not.toHaveFocus();
    await waitFor(() =>
      expect(main.scrollHeight).toBeGreaterThan(main.clientHeight),
    );
    main.scrollTop = 400;
    await expect(main.scrollTop).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole("link", { name: "Reports" }));
    await waitFor(() => expect(main).toHaveFocus());
    await expect(main.scrollTop).toBe(0);
    await expect(
      within(main).getByRole("heading", { name: "Reports", level: 1 }),
    ).toBeVisible();
    await waitFor(
      () =>
        expect(within(canvasElement).getByRole("status")).toHaveTextContent(
          "Reports",
        ),
      { timeout: 2000 },
    );
    // and again for another page
    main.scrollTop = 300;
    await userEvent.click(canvas.getByRole("link", { name: "Settings" }));
    await waitFor(() => expect(main).toHaveFocus());
    await expect(main.scrollTop).toBe(0);
  },
};

export const StandaloneSkipLinkAndRealHeader: Story = {
  name: "AppShell.SkipLink is the first tab stop, appears on screen while focused and moves focus to the main area; as header is the banner — keyboard test",
  render: () => <DemoPlainHeaderShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = mainOf(canvasElement);
    await expect(canvas.getByRole("banner")).toBe(
      canvas.getByTestId("plain-header"),
    );
    await expect(canvas.getByTestId("plain-header").tagName).toBe("HEADER");
    const link = canvas.getByRole("link", { name: "Skip to content" });
    // hidden until focused: no larger than a pixel
    await expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(2);
    await press("Tab", 9);
    await waitFor(() => expect(link).toHaveFocus());
    const box = link.getBoundingClientRect();
    await expect(box.width).toBeGreaterThan(20);
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(getComputedStyle(link).position).toBe("fixed");
    await expect(link).toHaveAttribute("href", "#main");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(main).toHaveFocus());
  },
};

export const StickyBarFollowsTheHeaderHeight: Story = {
  name: "A bar that sticks at the header's height stays just below the header, and useAppShell reports that height — layout test",
  render: () => <DemoStickyBarShell />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    const bar = within(canvasElement).getByTestId("sticky-bar");
    const height = slotOf(shell, header).getBoundingClientRect().height;
    await expect(bar).toHaveTextContent(
      `the header is ${Math.round(height)}px tall`,
    );
    window.scrollTo(0, 600);
    await nextFrame();
    await expect(
      Math.abs(bar.getBoundingClientRect().top - height),
    ).toBeLessThan(1.5);
    window.scrollTo(0, 0);
  },
};

// --- The rail, the banner, the content wrapper, the sticky footer, the resizable sidebar, the remembered layout and the scrolled-edge cue ---

/** A real mouse drag from one point to another, through the Chrome DevTools Protocol, mapped through the test iframe's scale. */
async function realDrag(element: Element, deltaX: number, during?: () => Promise<void> | void) {
  const rect = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect.left + rect.width / 2) * scale;
  const y = (frame?.top ?? 0) + (rect.top + rect.height / 2) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x + (deltaX * scale * step) / 6, y, button: "left", buttons: 1 });
    if (step === 3) await during?.();
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x + deltaX * scale, y, button: "left", clickCount: 1 });
}

/** A token's length in pixels: the spacing and breakpoint tokens are in rem or px. */
function tokenPx(name: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.endsWith("rem") ? px(value) * rootRem() : px(value);
}

const sidebarColumn = (canvasElement: HTMLElement) => {
  const { shell } = slots(canvasElement);
  return slotOf(shell, within(canvasElement).getByRole("navigation", { name: "Main" }));
};

export const RailBelowTheStep: Story = {
  name: "With railBelow the sidebar is a rail below the step and expanded above it, and the reader's toggle holds — layout test",
  globals: { viewport: { value: "tablet", isRotated: false } },
  render: () => (
    <>
      <div data-testid="railed">
        <DemoShell railBelow="lg" />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    // the tablet is wider than the drawer's step (md) and narrower than the rail's (lg)
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    await expect(window.innerWidth).toBeLessThan(1024);
    const column = sidebarColumn(canvasElement);
    // the window may reach this width a moment after the story mounts, and the shell follows it
    await waitFor(() => expect(column.getBoundingClientRect().width).toBeLessThan(100));
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Expand sidebar" }));
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(Math.round(16 * rootRem())));
    // the reader's choice holds while the window stays where it is
    await nextFrame();
    await expect(Math.round(column.getBoundingClientRect().width)).toBe(Math.round(16 * rootRem()));
  },
};

export const RailIsExpandedWhereThereIsRoom: Story = {
  name: "With railBelow the sidebar is expanded in a window wider than the step — layout test",
  render: () => <DemoShell railBelow="md" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    await expect(Math.round(sidebarColumn(canvasElement).getBoundingClientRect().width)).toBe(Math.round(16 * rootRem()));
  },
};

export const BannerSitsAboveTheHeader: Story = {
  name: "The banner runs across the top, above the header and the sidebar, which start under it — layout test",
  render: () => <DemoShell banner aside />,
  play: async ({ canvasElement }) => {
    const { shell, header, main } = slots(canvasElement);
    const banner = slotOf(shell, within(canvasElement).getByText(/Scheduled maintenance/));
    const box = banner.getBoundingClientRect();
    await expect(Math.abs(box.top)).toBeLessThan(1);
    await expect(Math.abs(box.width - window.innerWidth)).toBeLessThan(1);
    await expect(header.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.bottom - 1);
    await expect(Math.abs(slotOf(shell, within(canvasElement).getByRole("navigation", { name: "Main" })).getBoundingClientRect().top - box.bottom)).toBeLessThan(1);
    await expect(Math.abs(main.getBoundingClientRect().top - header.getBoundingClientRect().bottom)).toBeLessThan(1);
    // the frame is still exactly the window
    await expect(Math.round(shell.getBoundingClientRect().height)).toBe(window.innerHeight);
  },
};

export const StickyBannerStaysAndTheHeaderSticksBelowIt: Story = {
  name: "A sticky banner stays at the top of the window and the header, the sidebar and the aside stick below it — layout test",
  render: () => <DemoShell scroll="page" banner="sticky" headerSpan="full" aside />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-banner-measured"));
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    const banner = slotOf(shell, within(canvasElement).getByText(/Scheduled maintenance/));
    const headerSlot = slotOf(shell, header);
    const sidebar = slotOf(shell, within(canvasElement).getByRole("navigation", { name: "Main" }));
    window.scrollTo(0, 600);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    // the heights are read as they are now, not once: a font or a line of wrapped text settles after the page is up, and the shell follows it
    await waitFor(() => expect(Math.abs(banner.getBoundingClientRect().top)).toBeLessThan(1));
    await waitFor(() => expect(Math.abs(headerSlot.getBoundingClientRect().top - banner.getBoundingClientRect().height)).toBeLessThan(1));
    for (const column of [sidebar, asideOf(canvasElement)]) {
      await waitFor(() =>
        expect(Math.abs(column.getBoundingClientRect().top - (banner.getBoundingClientRect().height + headerSlot.getBoundingClientRect().height))).toBeLessThan(1.5),
      );
    }
    window.scrollTo(0, 0);
  },
};

export const BannerScrollsAwayAndTheHeaderSticksAtTheTop: Story = {
  name: "A banner that is not sticky scrolls away and the header sticks at the top of the window — layout test",
  render: () => <DemoShell scroll="page" banner />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    const banner = slotOf(shell, within(canvasElement).getByText(/Scheduled maintenance/));
    await waitFor(() => expect(banner.getBoundingClientRect().height).toBeGreaterThan(20));
    const bannerHeight = banner.getBoundingClientRect().height;
    window.scrollTo(0, 600);
    await nextFrame();
    await expect(banner.getBoundingClientRect().bottom).toBeLessThanOrEqual(1);
    await expect(Math.abs(slotOf(shell, header).getBoundingClientRect().top)).toBeLessThan(1);
    await expect(bannerHeight).toBeGreaterThan(20);
    window.scrollTo(0, 0);
  },
};

export const ContentIsKeptToAWidthAndPadded: Story = {
  name: "AppShell.Content centres the page at the width asked for and pads it on the spacing scale — layout test",
  render: () => (
    <DemoShell>
      <AppShell.Content size="sm" paddingInline={4} paddingBlock={8} data-testid="content">
        <p>Narrow content</p>
      </AppShell.Content>
    </DemoShell>
  ),
  play: async ({ canvasElement }) => {
    const { main } = slots(canvasElement);
    const content = within(canvasElement).getByTestId("content");
    const box = content.getBoundingClientRect();
    // `sm` is the breakpoint.sm token's width, centred in the main area
    await expect(Math.abs(box.width - tokenPx("--dbm-breakpoint-sm"))).toBeLessThan(1);
    const mainBox = main.getBoundingClientRect();
    await expect(Math.abs(box.left - mainBox.left - (mainBox.right - box.right))).toBeLessThan(1);
    await expect(Math.abs(px(getComputedStyle(content).paddingTop) - tokenPx("--dbm-space-8"))).toBeLessThan(0.5);
    await expect(Math.abs(px(getComputedStyle(content).paddingInlineStart) - tokenPx("--dbm-space-4"))).toBeLessThan(0.5);
  },
};

export const StickyFooterStaysAtTheBottom: Story = {
  name: "A sticky footer stays at the bottom of the window while the page scrolls, and the end of the page is not hidden under it — layout test",
  render: () => <DemoShell scroll="page" stickyFooter />,
  play: async ({ canvasElement }) => {
    const { shell, footer } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-footer-measured"));
    const slot = slotOf(shell, footer);
    await expect(Math.abs(slot.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(1);
    window.scrollTo(0, 400);
    await nextFrame();
    await expect(Math.abs(slot.getBoundingClientRect().bottom - window.innerHeight)).toBeLessThan(1);
    await expect(getComputedStyle(slot).position).toBe("sticky");
    // at the very end of the page the last of the content is above the footer, not under it
    window.scrollTo(0, document.documentElement.scrollHeight);
    await nextFrame();
    const main = within(canvasElement).getByRole("main");
    await expect(main.getBoundingClientRect().bottom).toBeLessThanOrEqual(slot.getBoundingClientRect().top + 1);
    window.scrollTo(0, 0);
  },
};

export const ResizeHandleByMouseAndKeyboard: Story = {
  name: "A resizable sidebar follows a real mouse drag and the arrow, Home, End and double press keys, within its bounds — layout test",
  render: () => <DemoShell resizable />,
  play: async ({ canvasElement }) => {
    window.localStorage.clear();
    const column = sidebarColumn(canvasElement);
    const handle = within(canvasElement).getByRole("separator", { name: "Resize sidebar" });
    const start = Math.round(column.getBoundingClientRect().width);
    await expect(start).toBe(Math.round(16 * rootRem()));
    await expect(handle).toHaveAttribute("aria-valuenow", String(start));
    // the handle sits on the column's inner edge
    await expect(Math.abs(handle.getBoundingClientRect().left + handle.getBoundingClientRect().width / 2 - column.getBoundingClientRect().right)).toBeLessThan(2);

    // a real mouse, 80px toward the content; while it drags the sidebar follows at once, with no width transition to lag behind the pointer
    await realDrag(handle, 80, async () => {
      await expect(getComputedStyle(column.firstElementChild as HTMLElement).transitionDuration).toBe("0s");
    });
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(start + 80));
    await expect(handle).toHaveAttribute("aria-valuenow", String(start + 80));

    // real keys
    handle.focus();
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(start + 80 + Math.round(rootRem())));
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35 });
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(Math.round(28 * rootRem())));
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Home", code: "Home", windowsVirtualKeyCode: 36 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Home", code: "Home", windowsVirtualKeyCode: 36 });
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(Math.round(12 * rootRem())));
    // a drag past the bounds stops at them
    await realDrag(handle, -400);
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(Math.round(12 * rootRem())));
    // a double press gives the sidebar its own width back
    await userEvent.dblClick(handle);
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(start));
  },
};

export const ResizeHandleInRightToLeftInteraction: Story = {
  name: "In right to left the handle is on the sidebar's left edge and a drag toward the content widens it — layout test",
  render: () => <DemoShell resizable dir="rtl" />,
  play: async ({ canvasElement }) => {
    window.localStorage.clear();
    const column = sidebarColumn(canvasElement);
    const handle = within(canvasElement).getByRole("separator", { name: "Resize sidebar" });
    const start = Math.round(column.getBoundingClientRect().width);
    await expect(Math.abs(handle.getBoundingClientRect().left + handle.getBoundingClientRect().width / 2 - column.getBoundingClientRect().left)).toBeLessThan(2);
    // toward the content is to the left here
    await realDrag(handle, -60);
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(start + 60));
  },
};

export const ResizeHandleIsNotThereOnARail: Story = {
  name: "There is no resize handle while the sidebar is a rail — layout test",
  render: () => <DemoShell resizable defaultCollapsed />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("separator", { name: "Resize sidebar" })).toBeNull();
  },
};

export const RememberedLayoutIsRestored: Story = {
  name: "A remembered layout is in place once the page is up: the width and the rail the reader left — layout test",
  loaders: [
    async () => {
      window.localStorage.setItem("dbm-app-shell:check-restore", JSON.stringify({ collapsed: false, width: 320 }));
      return {};
    },
  ],
  render: () => <DemoShell resizable persistKey="check-restore" />,
  play: async ({ canvasElement }) => {
    const column = sidebarColumn(canvasElement);
    await waitFor(() => expect(Math.round(column.getBoundingClientRect().width)).toBe(320));
    // and a change the reader makes is remembered
    const handle = within(canvasElement).getByRole("separator", { name: "Resize sidebar" });
    await realDrag(handle, 40);
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("dbm-app-shell:check-restore") ?? "{}").width).toBe(360));
    window.localStorage.removeItem("dbm-app-shell:check-restore");
  },
};

export const ScrolledEdgeCue: Story = {
  name: "The header casts a shadow once the main area is scrolled and the footer shows a line while there is more below — layout test",
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    const { shell, main, header, footer } = slots(canvasElement);
    const headerSlot = slotOf(shell, header);
    const footerSlot = slotOf(shell, footer);
    await waitFor(() => expect(main.scrollHeight).toBeGreaterThan(main.clientHeight));
    // at the top: no shadow, and the footer shows its line (there is more below)
    await expect(getComputedStyle(headerSlot).boxShadow).toBe("none");
    await waitFor(() => expect(shell).toHaveAttribute("data-more-below"));
    await waitFor(() => expect(getComputedStyle(footerSlot).borderTopColor).not.toBe("rgba(0, 0, 0, 0)"));
    main.scrollTop = 120;
    await waitFor(() => expect(shell).toHaveAttribute("data-scrolled"));
    await waitFor(() => expect(getComputedStyle(headerSlot).boxShadow).not.toBe("none"));
    // at the end: no line over the footer
    main.scrollTop = main.scrollHeight;
    await waitFor(() => expect(shell).not.toHaveAttribute("data-more-below"));
    await waitFor(() => expect(getComputedStyle(footerSlot).borderTopColor).toBe("rgba(0, 0, 0, 0)"));
    main.scrollTop = 0;
    await waitFor(() => expect(shell).not.toHaveAttribute("data-scrolled"));
    await waitFor(() => expect(getComputedStyle(headerSlot).boxShadow).toBe("none"));
  },
};

export const ScrolledEdgeCueWhenThePageScrolls: Story = {
  name: "With scroll page the cue follows the page's own scrolling — layout test",
  render: () => <DemoShell scroll="page" />,
  play: async ({ canvasElement }) => {
    const { shell, header } = slots(canvasElement);
    await waitFor(() => expect(shell).toHaveAttribute("data-header-measured"));
    const headerSlot = slotOf(shell, header);
    await expect(getComputedStyle(headerSlot).boxShadow).toBe("none");
    window.scrollTo(0, 300);
    await waitFor(() => expect(shell).toHaveAttribute("data-scrolled"));
    await waitFor(() => expect(getComputedStyle(headerSlot).boxShadow).not.toBe("none"));
    window.scrollTo(0, 0);
    await waitFor(() => expect(getComputedStyle(headerSlot).boxShadow).toBe("none"));
  },
};

export const ScrolledEdgeCueCanBeTurnedOff: Story = {
  name: "With scrolledEdge off the header casts no shadow and the footer shows no line — layout test",
  render: () => <DemoShell scrolledEdge={false} />,
  play: async ({ canvasElement }) => {
    const { shell, main, header, footer } = slots(canvasElement);
    main.scrollTop = 120;
    await waitFor(() => expect(shell).toHaveAttribute("data-scrolled"));
    await expect(getComputedStyle(slotOf(shell, header)).boxShadow).toBe("none");
    await expect(getComputedStyle(slotOf(shell, footer)).borderTopColor).toBe("rgba(0, 0, 0, 0)");
    main.scrollTop = 0;
  },
};

export const ScrolledEdgeCueInForcedColours: Story = {
  name: "In forced colours the scrolled header gets a line of its own, since shadows are dropped — forced colours test",
  render: () => <DemoShell />,
  play: async ({ canvasElement }) => {
    const { shell, main, header } = slots(canvasElement);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      main.scrollTop = 120;
      await waitFor(() => expect(shell).toHaveAttribute("data-scrolled"));
      await waitFor(() => expect(px(getComputedStyle(slotOf(shell, header)).borderBottomWidth)).toBeGreaterThan(0));
    } finally {
      main.scrollTop = 0;
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};
