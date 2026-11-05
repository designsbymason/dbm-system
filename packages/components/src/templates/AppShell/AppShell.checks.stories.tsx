import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
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
