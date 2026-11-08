import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { UserCircleIcon, ShoppingCartIcon } from "@dbm-system/icons";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { Navbar } from "./Navbar";
import { DemoColumnsBars, DemoNavbar, DemoRowsNavbar, DemoSectionsNavbar, GalleryBar, NavbarStage, NavbarViewModeContext, StickyDemo } from "./NavbarStoryKit";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do (layout, the cascade, a breakpoint, stacking, forced
// colours). They run in the `storybook` (Chromium) project; the test window is 1200px wide unless a story pins another.
const meta: Meta = {
  title: "Organisms/Navigation/Navbar/Checks",
  tags: ["!dev"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <NavbarViewModeContext.Provider value="docs">
        <Story />
      </NavbarViewModeContext.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj;

const px = (value: string) => Number.parseFloat(value);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Reads any CSS colour (the tokens are OKLCH) as sRGB channels, by painting one pixel of it. */
function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r!, g!, b!];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(toRgb(foreground));
  const b = luminance(toRgb(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const tokenPx = (name: string) => px(getComputedStyle(document.documentElement).getPropertyValue(name));

export const WideLayout: Story = {
  name: "At a wide window the links are in the bar and the menu button is gone",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Main" });
    expect(getComputedStyle(nav).display).not.toBe("none");
    // a hidden element has no computed name, so the button is found by its attribute
    expect(getComputedStyle(canvasElement.querySelector('button[aria-label="Menu"]')!).display).toBe("none");
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Products", "Pricing", "Docs", "Beta"]);
    // the zones read in order: brand, links, actions, left to right
    const brand = canvas.getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const first = links[0]!.getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Sign in" }).getBoundingClientRect();
    expect(brand.right).toBeLessThanOrEqual(first.left);
    expect(links.at(-1)!.getBoundingClientRect().right).toBeLessThanOrEqual(action.left);
  },
};

export const HeightsAndTargets: Story = {
  name: "The bar is as tall as its token says at every size, and every target is 24 pixels or more",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar size={size} linksLabel={`${size} navigation`} collapseBelow="3xl" menuContainer={menuContainer} />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    // `space.N` tokens are in rem
    const room = { sm: tokenPx("--dbm-space-1") * 16, md: tokenPx("--dbm-space-2") * 16, lg: tokenPx("--dbm-space-2") * 16 };
    const buttonSize = { sm: "--dbm-icon-button-size-sm", md: "--dbm-icon-button-size-md", lg: "--dbm-icon-button-size-lg" };
    for (const size of ["sm", "md", "lg"] as const) {
      const bar = within(canvasElement).getByRole("region", { name: `${size} bar` });
      const header = bar.querySelector("header")!;
      const button = within(bar).getByRole("button", { name: "Menu" });
      const rect = button.getBoundingClientRect();
      // the bar is the button's own height plus the room above and below
      const expected = tokenPx(buttonSize[size]) + 2 * room[size];
      // (the row holds the content in an inner box; the bar is that box's height, and the row's line under an outlined bar)
      const inner = header.firstElementChild!.firstElementChild!.getBoundingClientRect();
      expect(Math.abs(inner.height - expected)).toBeLessThan(1);
      expect(rect.top - inner.top).toBeGreaterThanOrEqual(room[size] - 1);
      expect(inner.bottom - rect.bottom).toBeGreaterThanOrEqual(room[size] - 1);
      for (const control of [button, ...within(bar).getAllByRole("link", { hidden: true })]) {
        const box = control.getBoundingClientRect();
        // the links are display: none below the collapse step, and measure zero then; the button is the one on show
        if (box.width === 0) continue;
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const LinkTargetsWhenInTheBar: Story = {
  name: "A link in the bar is a 24 pixel target at every size",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar size={size} linksLabel={`${size} navigation`} collapseBelow="never" menuContainer={menuContainer} />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["sm", "md", "lg"] as const) {
      const bar = within(canvasElement).getByRole("region", { name: `${size} bar` });
      for (const link of within(bar).getAllByRole("link")) {
        const box = link.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const ColoursAreReadable: Story = {
  name: "Link text clears 4.5:1 on its own surface, in each variant",
  render: () => (
    <NavbarStage minBlockSize="18rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["outlined", "filled", "ghost"] as const).map((variant) => (
            <GalleryBar key={variant} name={`${variant} bar`}>
              <DemoNavbar
                variant={variant}
                currentVariant="subtle"
                linksLabel={`${variant} navigation`}
                collapseBelow="never"
                menuContainer={menuContainer}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of ["outlined", "filled"] as const) {
      const bar = within(canvasElement).getByRole("region", { name: `${variant} bar` });
      // (the surface is the first row's)
      const surface = getComputedStyle(bar.querySelector("header")!.firstElementChild!).backgroundColor;
      const pricing = within(bar).getByRole("link", { name: "Pricing" });
      expect(contrast(getComputedStyle(pricing).color, surface)).toBeGreaterThanOrEqual(4.5);
      const current = within(bar).getByRole("link", { name: "Products" });
      const style = getComputedStyle(current);
      expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    }
  },
};

export const RightToLeftOrder: Story = {
  name: "In right-to-left text the brand is at the right and the actions at the left",
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar dir="rtl" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brand = canvas.getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const links = within(canvas.getByRole("navigation", { name: "Main" })).getAllByRole("link");
    const action = canvas.getByRole("button", { name: "Sign in" }).getBoundingClientRect();
    expect(brand.left).toBeGreaterThan(links[0]!.getBoundingClientRect().right);
    expect(links[0]!.getBoundingClientRect().left).toBeGreaterThan(links.at(-1)!.getBoundingClientRect().left);
    expect(links.at(-1)!.getBoundingClientRect().left).toBeGreaterThan(action.right);
  },
};

export const StickyAndForcedColours: Story = {
  name: "A sticky bar stays at the top, takes a shadow when stuck, and an outline in forced colours",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoNavbar sticky currentVariant="subtle" scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    expect(getComputedStyle(header).position).toBe("sticky");
    expect(getComputedStyle(header).boxShadow).toBe("none");
    // Stuck is reported by a marker watched with an IntersectionObserver, so scroll until it has been seen.
    for (let attempt = 0; attempt < 4 && !header.hasAttribute("data-stuck"); attempt += 1) {
      scroller.scrollTop = 0;
      await nextFrame();
      await nextFrame();
      scroller.scrollTop = 200;
      try {
        await waitFor(() => expect(header).toHaveAttribute("data-stuck"), { timeout: 1200 });
      } catch {
        // not reported yet: the next attempt scrolls again, and the assertion below is what fails the test
      }
    }
    await expect(header).toHaveAttribute("data-stuck");
    // it is at the top of the box while the page has moved under it, and lifted by a shadow
    expect(Math.abs(header.getBoundingClientRect().top - scroller.getBoundingClientRect().top)).toBeLessThan(2);
    expect(getComputedStyle(header).boxShadow).not.toBe("none");
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      // A shadow isn't drawn in forced colours, so a stuck bar is bounded by an outline instead.
      await expect(getComputedStyle(header).outlineStyle).toBe("solid");
      await expect(getComputedStyle(header).outlineWidth).not.toBe("0px");
      // The current link is told apart by fill alone, which forced colours replaces, so it has an outline too.
      const current = within(canvasElement).getByRole("link", { name: "Products", hidden: true });
      await expect(getComputedStyle(current).outlineStyle).toBe("solid");
    } finally {
      await emulate("none");
    }
  },
};

export const MenuOpensAboveAStickyBar: Story = {
  name: "An account menu opens above the bar and its items can be pressed",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar sticky actions="rich" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Account" }));
    const item = await within(document.body).findByRole("menuitem", { name: "Profile" });
    await waitFor(() => {
      const box = item.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(top === item || item.contains(top)).toBe(true);
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Account" })).toHaveFocus());
  },
};

export const PanelFromAWideWindow: Story = {
  name: "The menu panel lists the same links, is no wider than the window, and its links are 24 pixels or more",
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar collapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Menu" });
    await userEvent.click(button);
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    await nextFrame();
    const links = within(panel).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Products", "Pricing", "Docs", "Beta"]);
    for (const link of links) expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
    // the panel opens from the inline start edge, at the left in left-to-right text
    expect(panel.getBoundingClientRect().left).toBeLessThanOrEqual(panel.offsetParent!.getBoundingClientRect().left + 2);
    // Escape closes it and focus returns to the button
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(button).toHaveFocus());
  },
};

export const GroupMenuInTheBar: Story = {
  name: "A group in the bar opens a menu above a sticky bar, and its items are pressable targets",
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar sticky withGroup actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Resources" });
    const box = trigger.getBoundingClientRect();
    expect(box.height).toBeGreaterThanOrEqual(24);
    // it is drawn like the links beside it: the same height and text colour
    const sibling = canvas.getByRole("link", { name: "Docs" });
    expect(Math.abs(box.height - sibling.getBoundingClientRect().height)).toBeLessThan(1);
    expect(getComputedStyle(trigger).color).toBe(getComputedStyle(sibling).color);
    expect(getComputedStyle(trigger).borderTopWidth).toBe("0px");
    await userEvent.click(trigger);
    const menu = await within(document.body).findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Blog", "Guides", "Changelog"]);
    await waitFor(() => expect(menu.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(24);
      // the menu is the top thing at each item's centre, above the sticky bar it opened from
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect(top === item || item.contains(top)).toBe(true);
    }
    // the caret turns while it is open
    expect(getComputedStyle(trigger.querySelector("svg")!).transform).not.toBe("none");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const GroupInThePanel: Story = {
  name: "A group in the menu panel expands in place, indented, and leaves the panel open",
  render: () => (
    <NavbarStage minBlockSize="30rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar withGroup collapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menuButton = canvas.getByRole("button", { name: "Menu" });
    await userEvent.click(menuButton);
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    const toggle = within(panel).getByRole("button", { name: "Resources" });
    const nested = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    // collapsed: the links take no room and can't be reached
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(getComputedStyle(nested).display).toBe("none");
    const before = panel.getBoundingClientRect();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(getComputedStyle(nested).display).not.toBe("none");
    const links = within(nested).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Blog", "Guides", "Changelog"]);
    for (const link of links) expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    // indented beneath the button, inside the panel, and the panel kept its size and stayed open
    const toggleBox = toggle.getBoundingClientRect();
    const first = links[0]!.getBoundingClientRect();
    expect(first.left).toBeGreaterThan(toggleBox.left + 8);
    expect(first.top).toBeGreaterThanOrEqual(toggleBox.bottom - 1);
    expect(panel.getBoundingClientRect().width).toBe(before.width);
    expect(canvas.getByRole("dialog")).toBe(panel);
    // a link in it closes the panel, as the plain ones do
    links[1]!.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(links[1]!);
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());
  },
};

export const CurrentLinkLooks: Story = {
  name: "Each way of marking the current link is readable, and the solid one keeps a visible focus ring",
  render: () => (
    <NavbarStage minBlockSize="18rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["underline", "subtle", "solid"] as const).map((currentVariant) => (
            <GalleryBar key={currentVariant} name={`${currentVariant} bar`}>
              <DemoNavbar
                currentVariant={currentVariant}
                linksLabel={`${currentVariant} navigation`}
                collapseBelow="never"
                menuContainer={menuContainer}
              />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const bar = (name: string) => within(canvasElement).getByRole("region", { name: `${name} bar` });
    const surface = (name: string) => getComputedStyle(bar(name).querySelector("header")!.firstElementChild!).backgroundColor;
    const current = (name: string) => within(bar(name)).getByRole("link", { name: "Products" });

    // subtle: brand text on the tint
    const subtle = getComputedStyle(current("subtle"));
    expect(contrast(subtle.color, subtle.backgroundColor)).toBeGreaterThanOrEqual(4.5);

    // underline: primary text on the bar, and a brand line of 2px along the link's bottom edge that clears 3:1 against it
    const underline = current("underline");
    expect(contrast(getComputedStyle(underline).color, surface("underline"))).toBeGreaterThanOrEqual(4.5);
    const line = getComputedStyle(underline, "::after");
    expect(line.content).not.toBe("none");
    expect(line.position).toBe("absolute");
    expect(px(line.height)).toBe(2);
    expect(line.bottom).toBe("0px");
    expect(contrast(line.backgroundColor, surface("underline"))).toBeGreaterThanOrEqual(3);
    // and nothing else is marked: the other links carry no line
    expect(getComputedStyle(within(bar("underline")).getByRole("link", { name: "Pricing" }), "::after").content).toBe("none");

    // solid: on-brand text on the fill, the fill itself clearing 3:1 against the bar, and a ring inside the link that shows
    const solid = current("solid");
    const solidStyle = getComputedStyle(solid);
    expect(contrast(solidStyle.color, solidStyle.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(solidStyle.backgroundColor, surface("solid"))).toBeGreaterThanOrEqual(3);
    solid.focus();
    await userEvent.keyboard("{Shift>}{/Shift}");
    await waitFor(() => expect(solid).toHaveFocus());
    const ring = getComputedStyle(solid);
    expect(ring.outlineStyle).toBe("solid");
    expect(px(ring.outlineOffset)).toBeLessThan(0);
    expect(contrast(ring.outlineColor, ring.backgroundColor)).toBeGreaterThanOrEqual(3);
  },
};

export const CurrentLinkInThePanelAndForcedColours: Story = {
  name: "The underline is a bar at the start edge in the menu panel, and every look stays visible in forced colours",
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar currentVariant="underline" collapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    const link = within(panel).getByRole("link", { name: "Products" });
    const mark = getComputedStyle(link, "::after");
    expect(px(mark.width)).toBe(2);
    expect(mark.insetInlineStart).toBe("0px");
    expect(px(mark.height)).toBeGreaterThan(8);
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      // the line names a system colour, so it differs from the panel's own (forced) background
      const forced = getComputedStyle(link, "::after");
      await expect(forced.backgroundColor).not.toBe(getComputedStyle(panel).backgroundColor);
      // and it marks the link by itself, so no outline is drawn on top of it
      await expect(getComputedStyle(link).outlineStyle).toBe("none");
    } finally {
      await emulate("none");
    }
  },
};

export const RoundedLinks: Story = {
  name: "Rounded links are pills, including their focus ring, and the bar keeps its shape",
  render: () => (
    <NavbarStage minBlockSize="18rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          <GalleryBar name="rounded bar">
            <DemoNavbar rounded currentVariant="subtle" withGroup linksLabel="Rounded" collapseBelow="never" menuContainer={menuContainer} />
          </GalleryBar>
          <GalleryBar name="square bar">
            <DemoNavbar currentVariant="subtle" linksLabel="Square" collapseBelow="never" menuContainer={menuContainer} />
          </GalleryBar>
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const rounded = within(within(canvasElement).getByRole("region", { name: "rounded bar" }));
    const square = within(within(canvasElement).getByRole("region", { name: "square bar" }));
    // a pill: the radius is at least half the height, so the ends are semicircles (the token is a huge number, not half)
    // (the brand is not one of the links: it keeps its own shape)
    const navigation = within(rounded.getByRole("navigation", { name: "Rounded" }));
    for (const control of [...navigation.getAllByRole("link"), navigation.getByRole("button", { name: "Resources" })]) {
      expect(px(getComputedStyle(control).borderTopLeftRadius)).toBeGreaterThanOrEqual(control.getBoundingClientRect().height / 2);
    }
    // not rounded: a link keeps its own corners
    const plain = square.getByRole("link", { name: "Pricing" });
    expect(px(getComputedStyle(plain).borderTopLeftRadius)).toBeLessThan(plain.getBoundingClientRect().height / 2);
    // the bar itself isn't a pill either way
    const bar = canvasElement.querySelector("header")!;
    expect(px(getComputedStyle(bar).borderTopLeftRadius)).toBeLessThan(bar.getBoundingClientRect().height / 2);
    // and the keyboard focus ring follows the shape: a pill, not the square-cornered ring a link otherwise gets
    const link = navigation.getByRole("link", { name: "Pricing" });
    link.focus();
    await userEvent.keyboard("{Shift>}{/Shift}");
    await waitFor(() => expect(link).toHaveFocus());
    expect(px(getComputedStyle(link).borderTopLeftRadius)).toBeGreaterThanOrEqual(link.getBoundingClientRect().height / 2);
    expect(getComputedStyle(link).outlineStyle).toBe("solid");
  },
};

export const UnderlineGrowsIn: Story = {
  name: "The underline grows in from the start edge when a link becomes current, and not on load or under reduced motion",
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar currentVariant="underline" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // (a finished animation that fills forwards stays listed, so "growing" is one still running)
    const growing = (link: HTMLElement) =>
      link
        .getAnimations({ subtree: true })
        .filter((animation) => (animation.effect as KeyframeEffect).pseudoElement === "::after" && animation.playState === "running");
    const products = canvas.getByRole("link", { name: "Products" });
    const pricing = canvas.getByRole("link", { name: "Pricing" });
    // nothing is animating on load, and the line is at full size
    expect(growing(products)).toHaveLength(0);
    expect(getComputedStyle(products, "::after").transform).toBe("none");
    // choosing another link grows its line, from the left edge
    await userEvent.click(pricing);
    await waitFor(() => expect(growing(pricing).length).toBeGreaterThan(0));
    expect(getComputedStyle(pricing, "::after").transformOrigin.split(" ")[0]).toBe("0px");
    await waitFor(() => expect(growing(pricing)).toHaveLength(0), { timeout: 3000 });
    // it ends at full size, and the link that lost the mark has no line
    expect(getComputedStyle(pricing, "::after").content).not.toBe("none");
    expect(getComputedStyle(products, "::after").content).toBe("none");
    // under reduced motion the line is simply there
    const emulate = (value: "reduce" | "no-preference") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
    await emulate("reduce");
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await userEvent.click(products);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(growing(products)).toHaveLength(0);
      await expect(getComputedStyle(products, "::after").content).not.toBe("none");
    } finally {
      await emulate("no-preference");
    }
  },
};

export const UnderlineGrowsInRightToLeft: Story = {
  name: "In right-to-left text the underline grows from the right edge",
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar dir="rtl" currentVariant="underline" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const pricing = within(canvasElement).getByRole("link", { name: "Pricing" });
    await userEvent.click(pricing);
    await waitFor(() => expect(pricing.getAnimations({ subtree: true }).length).toBeGreaterThan(0));
    const [x] = getComputedStyle(pricing, "::after").transformOrigin.split(" ");
    // the origin is the line's right edge: its full width
    expect(px(x!)).toBeGreaterThan(8);
  },
};

export const ActionsMoveToThePanel: Story = {
  name: "An action hidden from the bar comes back at the foot of the menu panel, and the others stay",
  render: () => (
    <NavbarStage minBlockSize="30rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar actions="responsive" collapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // in the bar, below the step: the search stays, the button has left (it takes no room and has no name to find)
    expect(getComputedStyle(canvas.getByRole("searchbox")).display).not.toBe("none");
    expect(canvas.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    const signIn = within(panel).getByRole("button", { name: "Sign in" });
    const links = within(panel).getByRole("navigation").getBoundingClientRect();
    const box = signIn.getBoundingClientRect();
    // at the foot of the panel: after the links, the width of the panel's content, a real target
    expect(box.top).toBeGreaterThanOrEqual(links.bottom);
    expect(box.height).toBeGreaterThanOrEqual(24);
    expect(box.width).toBeGreaterThan(links.width * 0.8);
    // and nothing of it is left in the bar once the panel has closed
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    expect(canvas.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  },
};

export const SkipLinkAppearsOnFocus: Story = {
  name: "The skip link is out of sight until it has focus, then clear over the top corner",
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar skipLink menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skip = canvas.getByRole("link", { name: "Skip to content" });
    // out of sight, but not removed: a pixel, clipped
    const rest = skip.getBoundingClientRect();
    expect(rest.width).toBeLessThanOrEqual(2);
    expect(getComputedStyle(skip).clipPath).not.toBe("none");
    expect(getComputedStyle(skip).display).not.toBe("none");
    // a keyboard reaches it first, before the brand
    await userEvent.tab();
    await waitFor(() => expect(skip).toHaveFocus());
    const shown = skip.getBoundingClientRect();
    expect(getComputedStyle(skip).clipPath).toBe("none");
    expect(shown.height).toBeGreaterThanOrEqual(24);
    expect(shown.width).toBeGreaterThan(48);
    expect(getComputedStyle(skip).outlineStyle).toBe("solid");
    expect(contrast(getComputedStyle(skip).color, getComputedStyle(skip).backgroundColor)).toBeGreaterThanOrEqual(4.5);
    // it is the top thing at its own centre, above the bar it sits in
    const top = document.elementFromPoint(shown.left + shown.width / 2, shown.top + shown.height / 2);
    expect(top === skip || skip.contains(top)).toBe(true);
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole("link", { name: "dbM" })).toHaveFocus());
    expect(skip.getBoundingClientRect().width).toBeLessThanOrEqual(2);
  },
};

export const LinkExtrasLayout: Story = {
  name: "An icon comes before the text, a count after it, an external mark last, and the link stays on one line",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar extras actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(within(canvasElement).getByRole("navigation", { name: "Main" }));
    const plain = nav.getByRole("link", { name: "Products" }).getBoundingClientRect();
    const docs = nav.getByRole("link", { name: "Docs" });
    const inbox = nav.getByRole("link", { name: /^Inbox\s*3$/ });
    const status = nav.getByRole("link", { name: /^Status/ });
    for (const link of [docs, inbox, status]) {
      // one line, at the height of a plain link
      expect(Math.abs(link.getBoundingClientRect().height - plain.height)).toBeLessThan(1);
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
    // icon first, then the text, then the count
    const icon = inbox.querySelector("svg")!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(inbox);
    const badge = inbox.querySelector("span")!.getBoundingClientRect();
    expect(icon.right).toBeLessThanOrEqual(badge.left);
    expect(icon.width).toBeGreaterThan(8);
    // the count is inside the link's hit area
    const box = inbox.getBoundingClientRect();
    expect(badge.right).toBeLessThanOrEqual(box.right + 0.5);
    expect(badge.left).toBeGreaterThanOrEqual(box.left);
    // the external link opens in a new tab and ends with an icon after its text
    expect(status).toHaveAttribute("target", "_blank");
    const mark = status.querySelector("svg")!.getBoundingClientRect();
    expect(mark.left).toBeGreaterThan(status.getBoundingClientRect().left + 20);
  },
};

export const LinksAlignPlacement: Story = {
  name: "The links sit at the start, the centre of the room between the brand and the actions, or the end",
  render: () => (
    <NavbarStage minBlockSize="20rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start", display: "grid", gap: "1rem" }}>
          {(["start", "center", "end"] as const).map((align) => (
            <GalleryBar key={align} name={`${align} links`}>
              <DemoNavbar linksAlign={align} linksLabel={`${align} navigation`} collapseBelow="never" menuContainer={menuContainer} />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const measure = (align: string) => {
      const bar = within(canvasElement).getByRole("region", { name: `${align} links` });
      const brand = within(bar).getByRole("link", { name: "dbM" }).getBoundingClientRect();
      const nav = within(bar).getByRole("navigation").getBoundingClientRect();
      const action = within(bar).getByRole("button", { name: "Sign in" }).getBoundingClientRect();
      return { brand, nav, action };
    };
    const start = measure("start");
    const center = measure("center");
    const end = measure("end");
    // start: close to the brand, a gap and no more
    expect(start.nav.left - start.brand.right).toBeLessThan(24);
    // end: close to the actions
    expect(end.action.left - end.nav.right).toBeLessThan(24);
    expect(end.nav.left - end.brand.right).toBeGreaterThan(24);
    // centre: the middle of the room between the brand and the actions, within a pixel or two
    const room = (center.brand.right + center.action.left) / 2;
    expect(Math.abs((center.nav.left + center.nav.right) / 2 - room)).toBeLessThan(2);
    // and the actions stay at the end whichever it is
    for (const { action } of [start, center, end]) expect(Math.abs(action.right - start.action.right)).toBeLessThan(1);
  },
};

export const GhostBecomesASurface: Story = {
  name: "A sticky ghost bar is transparent until stuck, then takes a surface and a shadow, and is transparent again at the top",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef} hero>
        {(ref) => <DemoNavbar sticky variant="ghost" scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    const transparent = (value: string) => value === "rgba(0, 0, 0, 0)" || value === "transparent";
    expect(transparent(getComputedStyle(header).backgroundColor)).toBe(true);
    expect(getComputedStyle(header).boxShadow).toBe("none");
    for (let attempt = 0; attempt < 4 && !header.hasAttribute("data-stuck"); attempt += 1) {
      scroller.scrollTop = 0;
      await nextFrame();
      await nextFrame();
      scroller.scrollTop = 300;
      try {
        await waitFor(() => expect(header).toHaveAttribute("data-stuck"), { timeout: 1200 });
      } catch {
        // not reported yet: the next attempt scrolls again, and the assertion below is what fails the test
      }
    }
    await expect(header).toHaveAttribute("data-stuck");
    await waitFor(() => expect(transparent(getComputedStyle(header).backgroundColor)).toBe(false));
    expect(getComputedStyle(header).boxShadow).not.toBe("none");
    scroller.scrollTop = 0;
    await waitFor(() => expect(header).not.toHaveAttribute("data-stuck"), { timeout: 3000 });
    await waitFor(() => expect(transparent(getComputedStyle(header).backgroundColor)).toBe(true));
  },
};

export const HidesWhileScrollingDown: Story = {
  name: "A bar that hides on scroll leaves on a scroll down, returns on a scroll up, and stays while it has focus",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoNavbar sticky hideOnScroll stickyOffset={6} currentVariant="subtle" scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    // "out of view" is nothing of the bar below the scroller's top edge, though it sticks 24px (`stickyOffset={6}`) below it
    const outside = () => header.getBoundingClientRect().bottom <= scroller.getBoundingClientRect().top + 1;
    const settle = async () => {
      await waitFor(() => expect(header.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
      await nextFrame();
    };
    expect(outside()).toBe(false);
    // down: it leaves
    scroller.scrollTop = 120;
    await waitFor(() => expect(getComputedStyle(header).translate).not.toBe("none"), { timeout: 3000 });
    await settle();
    expect(outside()).toBe(true);
    // up: it returns
    scroller.scrollTop = 40;
    await waitFor(() => expect(getComputedStyle(header).translate).toBe("none"), { timeout: 3000 });
    await settle();
    expect(outside()).toBe(false);
    // down again, then a keyboard reaches a link in it: it shows while it has focus
    scroller.scrollTop = 200;
    await waitFor(() => expect(getComputedStyle(header).translate).not.toBe("none"), { timeout: 3000 });
    await settle();
    expect(outside()).toBe(true);
    within(header).getByRole("link", { name: "Pricing" }).focus();
    await waitFor(() => expect(getComputedStyle(header).translate).toBe("none"), { timeout: 3000 });
    await settle();
    expect(outside()).toBe(false);
  },
};

export const GroupMenuMarksTheCurrentItem: Story = {
  name: "The current item of a group's menu is marked in colour and by a tint, and the menu is drawn in the container",
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar withGroup actions="none" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Resources" }));
    await userEvent.click(await within(document.body).findByRole("menuitem", { name: "Guides" }));
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Resources" }));
    const menu = await within(document.body).findByRole("menu");
    // the menu is drawn inside the container the bar was given, as the panel is
    expect(canvasElement.contains(menu)).toBe(true);
    await waitFor(() => expect(menu.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    const current = within(menu).getByRole("menuitem", { name: "Guides" });
    const other = within(menu).getByRole("menuitem", { name: "Blog" });
    const style = getComputedStyle(current);
    // a different colour from the others, a tint behind it, and the text clearing 4.5:1 on that tint
    expect(style.color).not.toBe(getComputedStyle(other).color);
    expect(style.backgroundColor).not.toBe(getComputedStyle(other).backgroundColor);
    expect(style.backgroundImage).toBe("none");
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    // forced colours replace the fill, so an outline marks it instead
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(getComputedStyle(current).outlineStyle).toBe("solid");
      await expect(getComputedStyle(other).outlineStyle).not.toBe("solid");
    } finally {
      await emulate("none");
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument());
  },
};

const rows = (header: HTMLElement) => Array.from(header.children) as HTMLElement[];

export const RowsLayout: Story = {
  name: "Rows stack inside one banner, at their own heights, and the search field sits between the brand and the actions",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar navigable menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("banner")).toHaveLength(1);
    const header = canvas.getByRole("banner");
    const [courtesy, main, categories] = rows(header) as [HTMLElement, HTMLElement, HTMLElement];
    // stacked in order, each under the one before, with no gap
    expect(courtesy.getBoundingClientRect().bottom).toBeCloseTo(main.getBoundingClientRect().top, 0);
    expect(main.getBoundingClientRect().bottom).toBeCloseTo(categories.getBoundingClientRect().top, 0);
    // each row is its own step: the strip a thin 24px target plus room, the logo row lg, the categories sm (an IconButton of that step plus room)
    const innerHeight = (row: HTMLElement) => row.firstElementChild!.getBoundingClientRect().height;
    const space = (name: string) => tokenPx(name) * 16;
    expect(Math.abs(innerHeight(courtesy) - (space("--dbm-space-6") + 2 * space("--dbm-space-1")))).toBeLessThan(1);
    expect(Math.abs(innerHeight(main) - (tokenPx("--dbm-icon-button-size-lg") + 2 * space("--dbm-space-2")))).toBeLessThan(1);
    expect(Math.abs(innerHeight(categories) - (tokenPx("--dbm-icon-button-size-sm") + 2 * space("--dbm-space-1")))).toBeLessThan(1);
    expect(innerHeight(courtesy)).toBeLessThan(innerHeight(categories));
    expect(innerHeight(categories)).toBeLessThan(innerHeight(main));
    // the search landmark takes the room between the brand and the actions, within its token widths
    const brand = within(main).getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const search = within(main).getByRole("search").getBoundingClientRect();
    const actions = within(main).getByRole("button", { name: "Account" }).getBoundingClientRect();
    expect(brand.right).toBeLessThanOrEqual(search.left);
    expect(search.right).toBeLessThanOrEqual(actions.left);
    expect(search.width).toBeGreaterThanOrEqual(tokenPx("--dbm-navbar-search-min-width") * 16 - 1);
    expect(search.width).toBeLessThanOrEqual(tokenPx("--dbm-navbar-search-max-width") * 16 + 1);
    // the field is the field: its icon is set apart from its text, as it is in `SearchInput` on its own
    const field = within(main).getByRole("searchbox");
    const icon = field.parentElement!.querySelector("svg")!;
    expect(field.getBoundingClientRect().left - icon.getBoundingClientRect().right).toBeGreaterThanOrEqual(4);
    // and with room to spare it takes the most it is allowed, centred in the room between the brand and the buttons
    expect(Math.abs(search.width - tokenPx("--dbm-navbar-search-max-width") * 16)).toBeLessThan(2);
    // measured to the actions' own box: a caption wider than its button (a wider font, as on Linux) centres the button in a wider cell
    const actionsBox = within(main).getByRole("button", { name: "Account" }).closest("div")!.getBoundingClientRect();
    expect(Math.abs(search.left - brand.right - (actionsBox.left - search.right))).toBeLessThan(2);
    // the courtesy links sit at the end of their row, quieter than the categories
    const help = within(courtesy).getByRole("navigation", { name: "Help" }).getBoundingClientRect();
    expect(courtesy.getBoundingClientRect().right - help.right).toBeLessThan(40);
    const quiet = getComputedStyle(within(courtesy).getByRole("link", { name: "Help" }));
    const loud = getComputedStyle(within(categories).getByRole("link", { name: "Men" }));
    expect(px(quiet.fontSize)).toBeLessThanOrEqual(px(loud.fontSize));
    // the primary links: centred in their row, in capitals, bold and larger than the courtesy links, and none is marked as the current page
    const nav = within(categories).getByRole("navigation", { name: "Categories" });
    const navBox = nav.getBoundingClientRect();
    const centre = (navBox.left + navBox.right) / 2;
    const rowBox = categories.getBoundingClientRect();
    expect(Math.abs(centre - (rowBox.left + rowBox.right) / 2)).toBeLessThan(2);
    const link = getComputedStyle(within(categories).getByRole("link", { name: "Men" }));
    expect(link.textTransform).toBe("uppercase");
    expect(link.fontWeight).toBe("700");
    expect(px(link.fontSize)).toBeGreaterThan(px(getComputedStyle(within(courtesy).getByRole("link", { name: "Help" })).fontSize));
    expect(canvasElement.querySelector('[aria-current="page"]')).toBeNull();
    // choosing a primary link makes it the current one, and choosing another moves the mark
    await userEvent.click(within(categories).getByRole("link", { name: "Men" }));
    expect(within(categories).getByRole("link", { name: "Men" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(categories).getByRole("link", { name: "Sale" }));
    expect(within(categories).getByRole("link", { name: "Sale" })).toHaveAttribute("aria-current", "page");
    expect(within(categories).getByRole("link", { name: "Men" })).not.toHaveAttribute("aria-current");
    // the buttons in the logo row are medium tertiary icon buttons, the search field a size down
    const buttons = within(main).getAllByRole("button", { name: /Account|Cart/ });
    for (const button of buttons) expect(button.getBoundingClientRect().height).toBeGreaterThan(tokenPx("--dbm-icon-button-size-md"));
    expect(within(main).getByRole("searchbox").parentElement!.getBoundingClientRect().height).toBeLessThan(tokenPx("--dbm-icon-button-size-md"));
    // on a wide window each of those buttons has a caption under its icon, inside the button, for the eye only
    for (const [name, label] of [["Account", /^Account$/], ["Cart", /^Cart/]] as const) {
      const button = within(main).getByRole("button", { name: label });
      const caption = within(button).getByText(name);
      expect(caption).toHaveAttribute("aria-hidden", "true");
      expect(getComputedStyle(caption).display).not.toBe("none");
      expect(caption.getBoundingClientRect().top).toBeGreaterThanOrEqual(button.querySelector("svg")!.getBoundingClientRect().bottom - 1);
      expect(caption.getBoundingClientRect().bottom).toBeLessThanOrEqual(button.getBoundingClientRect().bottom + 0.5);
    }
    // only the first row scrolls away, and the categories' line is the one under the bar
    expect(courtesy).toHaveAttribute("data-scroll-away");
    expect(categories.getBoundingClientRect().height - innerHeight(categories)).toBeCloseTo(1, 0);
  },
};

export const RowsPanelOrder: Story = {
  name: "Every set of links is in the one menu panel, the quiet ones last under a line, and the panel is drawn once",
  render: () => (
    <NavbarStage minBlockSize="34rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar collapseBelow="3xl" searchCollapseBelow="3xl" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner");
    // the bar's links are all out of sight at this width; the menu button is in the main row (the one with the brand)
    const [courtesy, main] = rows(header) as [HTMLElement, HTMLElement];
    const button = canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Menu"]')!;
    expect(main.contains(button)).toBe(true);
    expect(courtesy.contains(button)).toBe(false);
    await userEvent.click(button);
    const panel = await canvas.findByRole("dialog", { name: "Menu" });
    await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    expect(canvas.getAllByRole("dialog")).toHaveLength(1);
    // the rows that held only links went with them: no empty bands above and below the row that has the brand
    expect(getComputedStyle(courtesy).display).toBe("none");
    expect(getComputedStyle(rows(header)[2]!).display).toBe("none");
    expect(getComputedStyle(main).display).not.toBe("none");
    expect(Math.round(header.getBoundingClientRect().height)).toBe(Math.round(main.getBoundingClientRect().height));
    const navs = within(panel).getAllByRole("navigation");
    expect(navs.map((nav) => nav.getAttribute("aria-label"))).toEqual(["Categories", "Help"]);
    // on screen as in the DOM: the categories above the help links, which are separated by a line and set smaller
    const [categories, help] = navs as [HTMLElement, HTMLElement];
    expect(categories.getBoundingClientRect().bottom).toBeLessThanOrEqual(help.getBoundingClientRect().top);
    expect(getComputedStyle(help.parentElement!).borderTopWidth).toBe("1px");
    expect(px(getComputedStyle(within(help).getAllByRole("link")[0]!).fontSize)).toBeLessThan(
      px(getComputedStyle(within(categories).getAllByRole("link")[0]!).fontSize),
    );
    for (const link of within(panel).getAllByRole("link")) expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const SearchSheet: Story = {
  name: "The search field becomes a button below its step, and the button opens it in a sheet from the top, focused",
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar searchCollapseBelow="3xl" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const landmark = canvas.getByRole("search");
    const button = within(landmark).getByRole("button", { name: "Search" });
    const field = landmark.querySelector("input")!;
    // the field is out of the bar and the button stands in, at a target size
    expect(getComputedStyle(field.closest("[class*=searchField]") ?? field).display).toBe("none");
    expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(landmark.getBoundingClientRect().width).toBeLessThan(80);
    await step("open the sheet", async () => {
      await userEvent.click(button);
      const sheet = await canvas.findByRole("dialog", { name: "Search" });
      await waitFor(() => expect(sheet.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
      const sheetField = within(sheet).getByRole("searchbox", { name: "Search" });
      await waitFor(() => expect(sheetField).toHaveFocus());
      // from the top of the container it was given, as wide as it, with a field a person can hit
      const frame = sheet.offsetParent!.getBoundingClientRect();
      expect(Math.abs(sheet.getBoundingClientRect().top - frame.top)).toBeLessThan(2);
      expect(sheet.getBoundingClientRect().width).toBeGreaterThan(frame.width * 0.9);
      // (the field a finger hits is its box, which holds the text input)
      expect(sheetField.parentElement!.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      await userEvent.type(sheetField, "shoes{Enter}");
    });
    await step("Enter closes it and focus returns to the button", async () => {
      await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(button).toHaveFocus());
    });
  },
};

export const SearchGivesWayInACrowdedRow: Story = {
  name: "The search field gives way, without overlapping its neighbour or vanishing, when the row is crowded",
  render: () => (
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "22rem", maxInlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const min = tokenPx("--dbm-navbar-search-min-width") * 16;
    const bar = within(canvasElement).getByRole("banner");
    const search = within(bar).getByRole("search").getBoundingClientRect();
    const actions = within(bar).getByRole("button", { name: "Account" }).getBoundingClientRect();
    // the minimum is the width it asks for, so a crowded row squeezes it, but never into its neighbour and never to nothing
    expect(search.width).toBeLessThan(min);
    expect(search.width).toBeGreaterThan(40);
    expect(search.right).toBeLessThanOrEqual(actions.left + 0.5);
  },
};

export const RowsScrollAwayCheck: Story = {
  name: "The strip scrolls away while the rest sticks, and the bar is stuck only once it has gone",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>{(ref) => <DemoRowsNavbar sticky scrollContainerRef={ref} />}</StickyDemo>
    );
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    const [courtesy, main, categories] = rows(header) as [HTMLElement, HTMLElement, HTMLElement];
    const top = () => scroller.getBoundingClientRect().top;
    const strip = courtesy.getBoundingClientRect().height;
    expect(strip).toBeGreaterThan(20);
    // at the start the strip is on screen, and nothing is stuck
    expect(courtesy.getBoundingClientRect().top).toBeCloseTo(top(), -1);
    // a little scroll, less than the strip: still on screen in part, and not stuck (no shadow yet)
    scroller.scrollTop = Math.floor(strip / 2);
    await waitFor(() => expect(courtesy.getBoundingClientRect().bottom).toBeGreaterThan(top()));
    await nextFrame();
    expect(header).not.toHaveAttribute("data-navbar-stuck");
    expect(getComputedStyle(header).boxShadow).toBe("none");
    // past the strip: it is off the top, the main row is at the top, the categories follow, and the bar is stuck with its shadow
    scroller.scrollTop = 300;
    await waitFor(() => expect(header).toHaveAttribute("data-navbar-stuck"));
    expect(courtesy.getBoundingClientRect().bottom).toBeLessThanOrEqual(top() + 1);
    expect(Math.abs(main.getBoundingClientRect().top - top())).toBeLessThan(2);
    expect(categories.getBoundingClientRect().top).toBeCloseTo(main.getBoundingClientRect().bottom, 0);
    expect(getComputedStyle(header).boxShadow).not.toBe("none");
    // back to the top and it is as it began
    scroller.scrollTop = 0;
    await waitFor(() => expect(header).not.toHaveAttribute("data-navbar-stuck"));
    expect(courtesy.getBoundingClientRect().top).toBeCloseTo(top(), -1);
  },
};

export const RowsHideOnScroll: Story = {
  name: "A bar with a strip that scrolls away hides completely on a scroll down, with a sticky offset too",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoRowsNavbar sticky hideOnScroll stickyOffset={6} scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    const settle = async () => {
      await waitFor(() => expect(header.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
      await nextFrame();
    };
    scroller.scrollTop = 300;
    await waitFor(() => expect(getComputedStyle(header).translate).not.toBe("none"), { timeout: 3000 });
    await settle();
    expect(header.getBoundingClientRect().bottom).toBeLessThanOrEqual(scroller.getBoundingClientRect().top + 1);
    scroller.scrollTop = 200;
    await waitFor(() => expect(getComputedStyle(header).translate).toBe("none"), { timeout: 3000 });
    await settle();
    expect(header.getBoundingClientRect().top).toBeLessThan(scroller.getBoundingClientRect().top + 30);
    expect(header.getBoundingClientRect().bottom).toBeGreaterThan(scroller.getBoundingClientRect().top + 40);
  },
};

function ColumnsBar({ columns }: { columns: string }) {
  return (
    <NavbarStage minBlockSize="12rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <Navbar menuContainer={menuContainer}>
            <Navbar.Row columns={columns} variant="outlined">
              <Navbar.Brand href="#">dbM</Navbar.Brand>
              <Navbar.Actions>
                <IconButton icon={UserCircleIcon} aria-label="Account" variant="tertiary" size="sm" />
                <IconButton icon={ShoppingCartIcon} aria-label="Cart" variant="tertiary" size="sm" />
              </Navbar.Actions>
              <Navbar.MenuButton variant="tertiary" size="sm" />
              <Navbar.Links aria-label="Main" column="start">
                <Navbar.Link href="#a">A</Navbar.Link>
              </Navbar.Links>
            </Navbar.Row>
          </Navbar>
        </div>
      )}
    </NavbarStage>
  );
}

export const ColumnsKeepTheLogoCentral: Story = {
  name: "In columns the logo stays central with one button at the start and two at the end",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <ColumnsBar columns="balanced" />,
  play: async ({ canvasElement, step }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const row = canvas.getByRole("banner").firstElementChild as HTMLElement;
    const menu = canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')!.getBoundingClientRect();
    const brand = within(row).getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const account = within(row).getByRole("button", { name: "Account" }).getBoundingClientRect();
    const cart = within(row).getByRole("button", { name: "Cart" }).getBoundingClientRect();
    const box = row.getBoundingClientRect();
    await step("the logo is at the row's centre although the sides differ", async () => {
      expect(Math.abs((brand.left + brand.right) / 2 - (box.left + box.right) / 2)).toBeLessThan(2);
    });
    await step("the one button is at the start and the two are at the end", async () => {
      expect(menu.right).toBeLessThanOrEqual(brand.left);
      expect(brand.right).toBeLessThanOrEqual(account.left);
      expect(account.right).toBeLessThanOrEqual(cart.left);
      expect(box.right - cart.right).toBeLessThan(24);
    });
    await step("the page has the groups in the order their first part is written: the logo, the end, then the start", async () => {
      const order = [...row.querySelectorAll("a, button")].map((element) => element.getAttribute("aria-label") ?? element.textContent);
      expect(order.slice(0, 4)).toEqual(["dbM", "Account", "Cart", "Menu"]);
    });
  },
};

export const ColumnsTakeTheWidthsGiven: Story = {
  name: "In columns the widths come from the track list",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <ColumnsBar columns="auto 1fr auto" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("banner").firstElementChild as HTMLElement;
    const brand = within(row).getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const box = row.getBoundingClientRect();
    // the sides are not equal here, so the middle track, and the logo in it, is off the row's centre by half the difference
    expect(Math.abs((brand.left + brand.right) / 2 - (box.left + box.right) / 2)).toBeGreaterThan(10);
  },
};

export const ColumnsStayInTheirTracks: Story = {
  name: "In columns a group never grows past its track, so the field keeps a gap from its neighbours",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    // 17rem, narrower than a phone, so the free track (about 9.5rem) is narrower than the field's usual minimum (12rem) whatever the window
    <NavbarStage minBlockSize="16rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "17rem", alignSelf: "start" }}>
          <DemoColumnsBars menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const bar = within(canvasElement).getByRole("region", { name: "Columns of your own widths" });
    const brand = within(bar).getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const field = within(bar).getByRole("searchbox", { name: "Search help" }).getBoundingClientRect();
    const account = within(bar).getByRole("button", { name: "Help account" }).getBoundingClientRect();
    const gap = tokenPx("--dbm-space-2") * 16; // the token is in rem
    // the field's room is the free track, which at this width is narrower than the field's usual minimum, so it gives way
    expect(field.left - brand.right).toBeGreaterThanOrEqual(gap - 1);
    expect(account.left - field.right).toBeGreaterThanOrEqual(gap - 1);
  },
};

/** A colour token as the browser computes it, to compare with what an element is drawn in. */
function tokenColorOf(name: string): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

export const PanelStoryIsBrandAndFollowsClicks: Story = {
  name: "The panel story's icon buttons are brand-coloured, and the primary link last clicked is the current one, in the panel",
  render: () => (
    <NavbarStage minBlockSize="34rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar collapseBelow="3xl" searchCollapseBelow="3xl" iconTone="brand" navigable menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brand = tokenColorOf("--dbm-icon-brand");
    expect(brand).not.toBe(tokenColorOf("--dbm-icon-default"));
    for (const selector of ['button[aria-label="Menu"]', 'button[aria-label="Search"]', 'button[aria-label="Account"]', 'button[aria-label^="Cart"]']) {
      expect(getComputedStyle(canvasElement.querySelector<HTMLElement>(selector)!).color).toBe(brand);
    }
    const open = async () => {
      await userEvent.click(canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Menu"]')!);
      const panel = await canvas.findByRole("dialog", { name: "Menu" });
      await waitFor(() => expect(panel.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
      return panel;
    };
    // none is current to begin with, as on a home page; choosing one makes it current and the panel closes, and the mark is still there when it reopens
    let panel = await open();
    expect(panel.querySelector('[aria-current="page"]')).toBeNull();
    await userEvent.click(within(panel).getByRole("link", { name: "Men" }));
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    panel = await open();
    expect(within(panel).getByRole("link", { name: "Men" })).toHaveAttribute("aria-current", "page");
    expect(panel.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    // and choosing another moves it
    await userEvent.click(within(panel).getByRole("link", { name: "Kids" }));
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
    panel = await open();
    expect(within(panel).getByRole("link", { name: "Kids" })).toHaveAttribute("aria-current", "page");
    expect(within(panel).getByRole("link", { name: "Men" })).not.toHaveAttribute("aria-current");
    await userEvent.keyboard("{Escape}");
    // end with the panel gone: an accessibility check run mid-exit sees the page still hidden behind it
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

const searchStory = (menuContainer?: HTMLElement | null) => (
  <div style={{ inlineSize: "100%", alignSelf: "start" }}>
    <DemoRowsNavbar
      searchCollapseBelow="3xl"
      iconTone="brand"
      labels={false}
      courtesyRow={false}
      primaryRow={false}
      linksInLogoRow
      columns="auto 1fr auto"
      searchWithActions
      navigable
      menuContainer={menuContainer}
    />
  </div>
);

export const SearchSheetStoryLayout: Story = {
  name: "The search story is one row: the links centred between the logo and the buttons, the search button last of them, all brand-coloured with no captions",
  render: () => <NavbarStage minBlockSize="24rem">{searchStory}</NavbarStage>,
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner");
    // one row, with the links in it; the menu button is gone at this width
    expect(rows(header)).toHaveLength(1);
    expect(getComputedStyle(canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')!).display).toBe("none");
    const brand = canvas.getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const nav = canvas.getByRole("navigation", { name: "Main" }).getBoundingClientRect();
    const search = canvas.getByLabelText("Search", { selector: "button" });
    const account = canvas.getByRole("button", { name: "Account" });
    const cart = canvas.getByRole("button", { name: /^Cart/ });
    const group = account.closest("div")!;
    expect(group.contains(search)).toBe(true);
    expect(group.contains(cart)).toBe(true);
    // the links are centred in the room between the logo and the buttons
    const groupBox = group.getBoundingClientRect();
    expect(Math.abs(nav.left - brand.right - (groupBox.left - nav.right))).toBeLessThan(2);
    // the search button is the last of the buttons, at the end of the row, in order after the account and the cart
    const [accountBox, cartBox, searchBox] = [account, cart, search].map((button) => button.getBoundingClientRect()) as [DOMRect, DOMRect, DOMRect];
    expect(accountBox.right).toBeLessThanOrEqual(cartBox.left);
    expect(cartBox.right).toBeLessThanOrEqual(searchBox.left);
    expect(header.getBoundingClientRect().right - searchBox.right).toBeLessThan(40);
    for (const button of [search, account, cart]) expect(getComputedStyle(button).color).toBe(tokenColorOf("--dbm-icon-brand"));
    // no captions
    expect(canvas.queryByText("Account")).toBeNull();
    expect(canvas.queryByText("Cart")).toBeNull();
    expect(within(group).queryByText("Search")).toBeNull();
    // choosing a link makes it current
    // the default links, with Products the current page to begin with
    expect(within(header).getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(header).getByRole("link", { name: "Docs" }));
    expect(within(header).getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
    expect(within(header).getByRole("link", { name: "Products" })).not.toHaveAttribute("aria-current");
    // the search button opens the sheet
    await userEvent.click(search);
    expect(await canvas.findByRole("dialog", { name: "Search" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const SearchSheetStoryOnAPhone: Story = {
  name: "On a phone the search story is the menu button at the start, the logo central, and the account, cart and search buttons at the end",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <NavbarStage minBlockSize="24rem">{searchStory}</NavbarStage>,
  play: async ({ canvasElement }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner");
    const row = rows(header)[0]!.getBoundingClientRect();
    const menu = canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')!.getBoundingClientRect();
    const brand = canvas.getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const account = canvas.getByRole("button", { name: "Account" }).getBoundingClientRect();
    const cart = canvas.getByRole("button", { name: /^Cart/ }).getBoundingClientRect();
    const search = canvas.getByLabelText("Search", { selector: "button" }).getBoundingClientRect();
    // the links have gone into the menu panel
    // (a hidden element has no accessible name, so it is found by its attribute)
    expect(getComputedStyle(canvasElement.querySelector<HTMLElement>("header nav[aria-label=\"Main\"]")!).display).toBe("none");
    expect(menu.right).toBeLessThanOrEqual(brand.left);
    expect(brand.right).toBeLessThanOrEqual(account.left);
    expect(account.right).toBeLessThanOrEqual(cart.left);
    expect(cart.right).toBeLessThanOrEqual(search.left);
    // one button at the start and three at the end, all inside the row, and the logo is centred in the room between them
    expect(Math.abs((brand.left + brand.right) / 2 - (menu.right + account.left) / 2)).toBeLessThan(2);
    expect(search.right).toBeLessThanOrEqual(row.right);
    expect(row.right - search.right).toBeLessThan(24);
    expect(menu.left).toBeGreaterThanOrEqual(row.left);
  },
};

export const ScrollAwayStoryHasNoCaptionsAndFollowsClicks: Story = {
  name: "The scroll-away story's icon buttons have no captions, and the primary link last clicked is the current one",
  render: function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return (
      <StickyDemo boxRef={boxRef}>
        {(ref) => <DemoRowsNavbar sticky labels={false} navigable scrollContainerRef={ref} />}
      </StickyDemo>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner");
    expect(canvas.queryByText("Account")).toBeNull();
    expect(canvas.queryByText("Cart")).toBeNull();
    expect(header.querySelector('[aria-current="page"]')).toBeNull();
    await userEvent.click(within(header).getByRole("link", { name: "Men" }));
    expect(within(header).getByRole("link", { name: "Men" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(header).getByRole("link", { name: "Sale" }));
    expect(within(header).getByRole("link", { name: "Sale" })).toHaveAttribute("aria-current", "page");
    expect(within(header).getByRole("link", { name: "Men" })).not.toHaveAttribute("aria-current");
    expect(header.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  },
};

export const ColumnsStoryButtonsAreMedium: Story = {
  name: "The columns story's icon buttons are the medium size, one step up",
  render: () => <NavbarStage minBlockSize="16rem">{(menuContainer) => <DemoColumnsBars menuContainer={menuContainer} />}</NavbarStage>,
  play: async ({ canvasElement }) => {
    const medium = Math.round(tokenPx("--dbm-icon-button-size-md"));
    const buttons = [...canvasElement.querySelectorAll<HTMLElement>("header button")];
    expect(buttons.length).toBeGreaterThanOrEqual(4);
    for (const button of buttons) expect(Math.round(button.getBoundingClientRect().height)).toBe(medium);
  },
};

// A real pointer, through the Chrome DevTools Protocol: Storybook's `userEvent` sends synthetic events, which never set `:hover`.
// The test page scales its iframe, so a point inside the story is mapped to the page it is drawn on.
async function pointAt(element: Element | null) {
  const rect = element?.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame ? frame.width / window.innerWidth : 1;
  const x = (frame?.left ?? 0) + (rect ? rect.left + rect.width / 2 : -10) * scale;
  const y = (frame?.top ?? 0) + (rect ? rect.top + rect.height / 2 : -10) * scale;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

export const LinkHoverIsATint: Story = {
  name: "A hovered link takes the brand tint and nothing else changes: its text and icon keep their colour, with the contrast text needs",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoNavbar menuContainer={menuContainer} extras />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tint = tokenColorOf("--dbm-bg-brand-subtle");
    // every link, the current one (Products, in the underline look) and one with an icon among them
    for (const name of ["Pricing", "Docs", "Products"]) {
      const link = canvas.getByRole("link", { name: new RegExp(name) });
      const icon = link.querySelector("svg");
      const resting = { text: getComputedStyle(link).color, icon: icon ? getComputedStyle(icon).color : undefined, fill: getComputedStyle(link).backgroundColor };
      expect(resting.fill).not.toBe(tint);
      await pointAt(link);
      await waitFor(() => expect(getComputedStyle(link).backgroundColor).toBe(tint));
      await new Promise((resolve) => setTimeout(resolve, 250));
      const style = getComputedStyle(link);
      // the colour of the text and of the icon is what it was
      expect(style.color).toBe(resting.text);
      if (icon) expect(getComputedStyle(icon).color).toBe(resting.icon);
      // and it is still readable on the tint
      expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(4.5);
      await pointAt(null);
      await waitFor(() => expect(getComputedStyle(link).backgroundColor).toBe(resting.fill));
    }
    expect(canvas.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("link", { name: /Docs/ }).querySelector("svg")).not.toBeNull();
  },
};

export const LinkSizeSteps: Story = {
  name: "The link size grows the links' text, icon and padding step by step, apart from the bar's height",
  render: () => (
    <NavbarStage minBlockSize="40rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "1rem", alignSelf: "start" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((linkSize) => (
            <GalleryBar key={linkSize} name={`${linkSize} links`}>
              <DemoNavbar linkSize={linkSize} linksLabel={`${linkSize} links`} menuContainer={menuContainer} collapseBelow="never" extras />
            </GalleryBar>
          ))}
          <GalleryBar name="default links">
            <DemoNavbar linksLabel="default links" menuContainer={menuContainer} collapseBelow="never" extras />
          </GalleryBar>
          <GalleryBar name="tall bar, small links">
            <DemoNavbar size="lg" linkSize="xs" linksLabel="tall bar, small links" menuContainer={menuContainer} collapseBelow="never" />
          </GalleryBar>
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const linkOf = (name: string) => within(canvas.getByRole("navigation", { name })).getByRole("link", { name: "Products" });
    const steps = ["xs", "sm", "md", "lg", "xl"] as const;
    const metrics = steps.map((step) => {
      const link = linkOf(`${step} links`);
      const style = getComputedStyle(link);
      return { font: px(style.fontSize), height: link.getBoundingClientRect().height, padInline: px(style.paddingInlineStart) };
    });
    // each step is larger than the last in text and in the box, and the fixed steps are the font tokens themselves
    for (let i = 1; i < metrics.length; i++) {
      expect(metrics[i]!.font).toBeGreaterThan(metrics[i - 1]!.font);
      expect(metrics[i]!.height).toBeGreaterThan(metrics[i - 1]!.height - 0.5);
    }
    expect(metrics[0]!.font).toBeCloseTo(tokenPx("--dbm-font-size-xs") * 16, 1);
    expect(metrics[1]!.font).toBeCloseTo(tokenPx("--dbm-font-size-sm") * 16, 1);
    expect(metrics[2]!.font).toBeCloseTo(tokenPx("--dbm-font-size-base") * 16, 1);
    // no setting follows the height step: the default md bar reads the md step exactly
    const plain = getComputedStyle(linkOf("default links"));
    expect(px(plain.fontSize)).toBeCloseTo(metrics[2]!.font, 1);
    expect(px(plain.paddingInlineStart)).toBeCloseTo(metrics[2]!.padInline, 1);
    // the bar's height is its own: it does not move with the links (all md bars, links shorter than the row's floor)
    const headerHeight = (name: string) => canvas.getByRole("region", { name }).querySelector("header")!.getBoundingClientRect().height;
    const heights = [...steps.map((step) => `${step} links`), "default links"].map(headerHeight);
    for (const height of heights) expect(Math.abs(height - heights[0]!)).toBeLessThan(1);
    // a tall bar with small links keeps its own height and the small step's text
    expect(headerHeight("tall bar, small links")).toBeGreaterThan(heights[0]! + 4);
    expect(px(getComputedStyle(linkOf("tall bar, small links")).fontSize)).toBeCloseTo(metrics[0]!.font, 1);
  },
};

export const BarSizeScalesLinksAndActions: Story = {
  name: "A taller bar has larger links and larger action buttons: each step is the size of the same name",
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "1rem", alignSelf: "start" }}>
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <GalleryBar key={size} name={`${size} bar`}>
              <DemoNavbar size={size} linksLabel={`${size} links`} menuContainer={menuContainer} collapseBelow="never" />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const steps = ["xs", "sm", "md", "lg"] as const;
    const linkFont = steps.map((step) => px(getComputedStyle(within(canvas.getByRole("navigation", { name: `${step} links` })).getByRole("link", { name: "Products" })).fontSize));
    const button = steps.map((step) => within(canvas.getByRole("region", { name: `${step} bar` })).getByRole("button", { name: "Sign in" }).getBoundingClientRect().height);
    const bar = steps.map((step) => canvas.getByRole("region", { name: `${step} bar` }).querySelector("header")!.getBoundingClientRect().height);
    for (let i = 1; i < steps.length; i++) {
      expect(linkFont[i]!).toBeGreaterThan(linkFont[i - 1]!);
      expect(button[i]!).toBeGreaterThan(button[i - 1]!);
      expect(bar[i]!).toBeGreaterThan(bar[i - 1]!);
    }
    // each action button is the box of its step, as an IconButton of that step is (they match a Button's height to the pixel)
    steps.forEach((step, i) => {
      expect(Math.abs(button[i]! - tokenPx(`--dbm-icon-button-size-${step}`))).toBeLessThan(1.5);
    });
  },
};

export const LinkExtrasFollowTheLinkSize: Story = {
  name: "A link's icon, trailing arrow and badge grow with the link size, and the badge looks like a badge",
  render: () => (
    <NavbarStage minBlockSize="40rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "1rem", alignSelf: "start" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((linkSize) => (
            <GalleryBar key={linkSize} name={`${linkSize} links`}>
              <DemoNavbar linkSize={linkSize} linksLabel={`${linkSize} links`} menuContainer={menuContainer} collapseBelow="never" extras />
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const steps = ["xs", "sm", "md", "lg", "xl"] as const;
    const widthOf = (element: Element | null) => element!.getBoundingClientRect().width;
    const measured = steps.map((step) => {
      const nav = canvas.getByRole("navigation", { name: `${step} links` });
      const docs = within(nav).getByRole("link", { name: "Docs" });
      const status = within(nav).getByRole("link", { name: /Status/ });
      const pricing = within(nav).getByRole("link", { name: /Pricing/ });
      return { leading: widthOf(docs.querySelector("svg")), trailing: widthOf(status.querySelector("svg")), badge: pricing.querySelector<HTMLElement>("[class*=badge], span")! };
    });
    // the leading icon and the trailing arrow both scale (the arrow a step behind, so it is never the larger)
    expect(measured[4]!.leading).toBeGreaterThan(measured[0]!.leading);
    expect(measured[4]!.trailing).toBeGreaterThan(measured[0]!.trailing);
    for (let i = 1; i < steps.length; i++) {
      expect(measured[i]!.leading).toBeGreaterThanOrEqual(measured[i - 1]!.leading);
      expect(measured[i]!.trailing).toBeGreaterThanOrEqual(measured[i - 1]!.trailing);
    }
    for (const m of measured) expect(m.trailing).toBeLessThanOrEqual(m.leading);
    // a badge: its own fill, round ends, and padding, not plain text beside the link's
    for (const step of steps) {
      const nav = canvas.getByRole("navigation", { name: `${step} links` });
      const badge = [...within(nav).getByRole("link", { name: /Pricing/ }).querySelectorAll<HTMLElement>("span")].find((span) => span.textContent === "New")!;
      const style = getComputedStyle(badge);
      expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(px(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(badge.getBoundingClientRect().height / 2 - 1);
      expect(px(style.paddingInlineStart)).toBeGreaterThan(0);
    }
    // its text is held to 4.5:1 on its own fill
    const sample = [...within(canvas.getByRole("navigation", { name: "md links" })).getByRole("link", { name: /Pricing/ }).querySelectorAll<HTMLElement>("span")].find((span) => span.textContent === "New")!;
    expect(contrast(getComputedStyle(sample).color, getComputedStyle(sample).backgroundColor)).toBeGreaterThanOrEqual(4.5);
  },
};

export const StyleOnLinksSetsTheTextStyle: Story = {
  name: "A style on Navbar.Links sets the weight and case of its links, in the bar only",
  render: function Render() {
    return (
      <NavbarStage minBlockSize="24rem">
        {(menuContainer) => (
          <div style={{ inlineSize: "100%", display: "grid", gap: "1rem", alignSelf: "start" }}>
            <GalleryBar name="default">
              <Navbar menuContainer={menuContainer}>
                <Navbar.Links aria-label="default">
                  <Navbar.Link href="#a">Products</Navbar.Link>
                </Navbar.Links>
              </Navbar>
            </GalleryBar>
            <GalleryBar name="styled">
              <Navbar menuContainer={menuContainer}>
                <Navbar.Links aria-label="styled" style={{ fontWeight: "var(--dbm-font-weight-bold)", textTransform: "uppercase" }}>
                  <Navbar.Link href="#b">Products</Navbar.Link>
                </Navbar.Links>
              </Navbar>
            </GalleryBar>
          </div>
        )}
      </NavbarStage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = (name: string) => getComputedStyle(within(canvas.getByRole("navigation", { name })).getByRole("link", { name: "Products" }));
    expect(link("default").fontWeight).toBe("500");
    expect(link("default").textTransform).toBe("none");
    expect(link("styled").fontWeight).toBe("700");
    expect(link("styled").textTransform).toBe("uppercase");
  },
};

export const FrostedInForcedColours: Story = {
  name: "A frosted bar is an opaque Canvas surface with no blur in forced colours, and keeps its line",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ position: "relative", inlineSize: "100%", alignSelf: "start", background: "var(--dbm-bg-brand)" }}>
          <DemoNavbar variant="frosted" menuContainer={menuContainer} collapseBelow="never" />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByRole("banner").firstElementChild as HTMLElement;
    // by default it is blurred and translucent
    expect(getComputedStyle(row).backdropFilter).toMatch(/blur\(/);
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(window.matchMedia("(forced-colors: active)").matches).toBe(true);
      const style = getComputedStyle(row);
      expect(style.backdropFilter).toBe("none");
      const probe = document.createElement("span");
      probe.style.backgroundColor = "Canvas";
      canvasElement.append(probe);
      const canvasColor = getComputedStyle(probe).backgroundColor;
      probe.remove();
      expect(style.backgroundColor).toBe(canvasColor);
      expect(px(style.borderBottomWidth)).toBeGreaterThan(0);
    } finally {
      await emulate("none");
    }
  },
};

export const FilledIsSurfaceAndBackgroundIsOverridable: Story = {
  name: "A filled bar is the surface with no line, and a style on the row (or on a ghost bar) changes its fill",
  render: () => (
    <NavbarStage minBlockSize="22rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "1rem", alignSelf: "start" }}>
          <GalleryBar name="filled">
            <DemoNavbar variant="filled" linksLabel="filled" menuContainer={menuContainer} collapseBelow="never" />
          </GalleryBar>
          <GalleryBar name="row style">
            <Navbar variant="filled" menuContainer={menuContainer}>
              <Navbar.Row style={{ backgroundColor: "var(--dbm-bg-brand-subtle)" }} data-testid="row-style">
                <Navbar.Brand href="#">dbM</Navbar.Brand>
              </Navbar.Row>
            </Navbar>
          </GalleryBar>
          <GalleryBar name="bar style">
            <Navbar variant="ghost" style={{ backgroundColor: "var(--dbm-bg-brand-subtle)" }} menuContainer={menuContainer}>
              <Navbar.Row data-testid="ghost-row">
                <Navbar.Brand href="#">dbM</Navbar.Brand>
              </Navbar.Row>
            </Navbar>
          </GalleryBar>
          <GalleryBar name="header style only">
            <Navbar variant="filled" style={{ backgroundColor: "var(--dbm-bg-brand-subtle)" }} menuContainer={menuContainer}>
              <Navbar.Row data-testid="covered-row">
                <Navbar.Brand href="#">dbM</Navbar.Brand>
              </Navbar.Row>
            </Navbar>
          </GalleryBar>
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = tokenColorOf("--dbm-bg-surface");
    const tint = tokenColorOf("--dbm-bg-brand-subtle");
    const rowOf = (name: string) => canvas.getByRole("region", { name }).querySelector("header")!.firstElementChild as HTMLElement;
    // the filled bar is the surface, with no line under it
    expect(getComputedStyle(rowOf("filled")).backgroundColor).toBe(surface);
    expect(getComputedStyle(rowOf("filled")).borderBottomWidth).toBe("0px");
    // a style on the row beats the variant's class
    expect(getComputedStyle(canvas.getByTestId("row-style")).backgroundColor).toBe(tint);
    // on a ghost bar the rows are transparent, so the header's style is what shows
    expect(getComputedStyle(canvas.getByTestId("ghost-row")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(canvas.getByRole("region", { name: "bar style" }).querySelector("header")!).backgroundColor).toBe(tint);
    // and on a filled bar it does not: the row paints over the header (which is why the Docs say to style the row)
    expect(getComputedStyle(canvas.getByTestId("covered-row")).backgroundColor).toBe(surface);
  },
};

export const PassedBadgeIsDrawnAsWritten: Story = {
  name: "A Badge passed as a link's badge keeps its own tone and variant, is one pill, and stays within the link's height",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <Navbar menuContainer={menuContainer} collapseBelow="never">
            <Navbar.Links aria-label="Main">
              <Navbar.Link href="#a">Plain</Navbar.Link>
              <Navbar.Link href="#b" badge={<Badge tone="danger" variant="solid">2</Badge>}>
                Alerts
              </Navbar.Link>
              <Navbar.Link href="#c" badge="New">
                Pricing
              </Navbar.Link>
            </Navbar.Links>
          </Navbar>
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = (link: string, text: string) =>
      [...within(canvas.getByRole("link", { name: new RegExp(link) })).getAllByText(text)].filter((element) => element.tagName === "SPAN");
    // the passed Badge is danger-solid (its own fill), the plain text is the link's solid brand one: different fills
    const danger = pill("Alerts", "2");
    expect(danger).toHaveLength(1);
    expect(getComputedStyle(danger[0]!).backgroundColor).toBe(tokenColorOf("--dbm-bg-danger"));
    const brand = pill("Pricing", "New")[0]!;
    expect(getComputedStyle(brand).backgroundColor).not.toBe(getComputedStyle(danger[0]!).backgroundColor);
    // neither makes its link taller than a plain one
    const plain = canvas.getByRole("link", { name: "Plain" }).getBoundingClientRect().height;
    for (const name of ["Alerts", "Pricing"]) {
      expect(Math.abs(canvas.getByRole("link", { name: new RegExp(name) }).getBoundingClientRect().height - plain)).toBeLessThan(1);
    }
  },
};

export const FrostedBar: Story = {
  name: "A frosted bar is translucent and blurs what is behind it, with a line under it, and keeps 4.5:1 over the worst case",
  render: () => (
    <NavbarStage minBlockSize="14rem">
      {(menuContainer) => (
        <div style={{ position: "relative", inlineSize: "100%", alignSelf: "start", background: "var(--dbm-bg-brand)" }}>
          <DemoNavbar variant="frosted" menuContainer={menuContainer} collapseBelow="never" />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const row = header.firstElementChild as HTMLElement;
    const style = getComputedStyle(row);
    expect(style.backdropFilter).toMatch(/blur\(/);
    // translucent: some of what is behind shows (the alpha is under 1), but mostly surface
    const alpha = style.backgroundColor.match(/\/\s*([\d.]+)\s*\)|rgba\([^)]*,\s*([\d.]+)\)/);
    const value = Number(alpha?.[1] ?? alpha?.[2]);
    expect(value).toBeGreaterThan(0.5);
    expect(value).toBeLessThan(1);
    expect(px(style.borderBottomWidth)).toBeGreaterThan(0);
    // the worst case for a light surface is black behind it: the link text still meets 4.5:1 on that blend
    const surface = tokenColorOf("--dbm-bg-surface");
    const [r, g, b] = [0, 1, 2].map((i) => {
      const probe = document.createElement("canvas");
      probe.width = probe.height = 1;
      const context = probe.getContext("2d", { willReadFrequently: true })!;
      context.fillStyle = "#000";
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = surface;
      context.globalAlpha = value;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[i]!;
    }) as [number, number, number];
    const link = within(header).getByRole("link", { name: "Pricing" });
    expect(contrast(getComputedStyle(link).color, `rgb(${r}, ${g}, ${b})`)).toBeGreaterThanOrEqual(4.5);
  },
};

export const ColumnsAreFlowAboveTheStep: Story = {
  name: "Above the step the parts flow as they do without columns",
  render: () => <ColumnsBar columns="balanced" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("banner").firstElementChild as HTMLElement;
    const inner = row.firstElementChild as HTMLElement;
    expect(getComputedStyle(inner).display).toBe("flex");
    expect(getComputedStyle(inner.firstElementChild as HTMLElement).display).toBe("contents");
  },
};

export const RowsOnAPhone: Story = {
  name: "On a phone the menu and search buttons are at the start, the logo is centred, and the other buttons are at the end",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <NavbarStage minBlockSize="24rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement, step }) => {
    expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner");
    const [courtesy, main, categories] = rows(header) as [HTMLElement, HTMLElement, HTMLElement];
    // the strip and the categories held only links, which have moved into the menu panel, so they are gone
    expect(getComputedStyle(courtesy).display).toBe("none");
    expect(getComputedStyle(categories).display).toBe("none");
    const menu = canvasElement.querySelector<HTMLElement>('button[aria-label="Menu"]')!.getBoundingClientRect();
    const search = within(main).getByRole("button", { name: "Search" }).getBoundingClientRect();
    const brand = within(main).getByRole("link", { name: "dbM" }).getBoundingClientRect();
    const account = within(main).getByRole("button", { name: "Account" }).getBoundingClientRect();
    const cart = within(main).getByRole("button", { name: /Cart/ }).getBoundingClientRect();
    const row = main.getBoundingClientRect();
    await step("the order on screen: menu, search, logo, account, cart", async () => {
      expect(menu.right).toBeLessThanOrEqual(search.left);
      expect(search.right).toBeLessThanOrEqual(brand.left);
      expect(brand.right).toBeLessThanOrEqual(account.left);
      expect(account.right).toBeLessThanOrEqual(cart.left);
    });
    await step("the logo is centred, the first two at the start and the last two at the end", async () => {
      expect(Math.abs((brand.left + brand.right) / 2 - (row.left + row.right) / 2)).toBeLessThan(2);
      expect(menu.left - row.left).toBeLessThan(24);
      expect(row.right - cart.right).toBeLessThan(24);
    });
    await step("the captions under the buttons are not drawn on a phone", async () => {
      for (const name of ["Account", "Cart"]) expect(getComputedStyle(within(main).getByText(name)).display).toBe("none");
    });
    await step("all four buttons are neutral, in the default icon colour, not the brand's", async () => {
      const probe = document.createElement("span");
      probe.style.color = "var(--dbm-icon-default)";
      canvasElement.append(probe);
      const neutral = getComputedStyle(probe).color;
      probe.style.color = "var(--dbm-icon-brand)";
      const brand = getComputedStyle(probe).color;
      probe.remove();
      expect(neutral).not.toBe(brand);
      for (const label of ["Menu", "Search", "Account", /Cart/]) {
        const button = canvasElement.querySelector<HTMLElement>(typeof label === "string" ? `button[aria-label="${label}"]` : 'button[aria-label^="Cart"]')!;
        expect(getComputedStyle(button).color).toBe(neutral);
      }
    });
    await step("all four buttons are medium tertiary icon buttons", async () => {
      for (const button of [menu, search, account, cart]) {
        expect(Math.round(button.height)).toBe(Math.round(tokenPx("--dbm-icon-button-size-md")));
      }
    });
    await step("the logo is first in the page, as on a wide window", async () => {
      const order = [...main.querySelectorAll("a, button")].map((element) => element.getAttribute("aria-label") ?? element.textContent);
      expect(order.indexOf("dbM")).toBeLessThan(order.indexOf("Search"));
    });
  },
};

export const SearchSheetIsCompact: Story = {
  name: "The search sheet has a small heading and a medium field",
  render: () => (
    <NavbarStage minBlockSize="26rem">
      {(menuContainer) => (
        <div style={{ inlineSize: "100%", alignSelf: "start" }}>
          <DemoRowsNavbar searchCollapseBelow="3xl" collapseBelow="never" menuContainer={menuContainer} />
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(within(canvas.getByRole("search")).getByLabelText("Search", { selector: "button" }));
    const sheet = await canvas.findByRole("dialog", { name: "Search" });
    await waitFor(() => expect(sheet.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
    const heading = within(sheet).getByRole("heading", { name: "Search" });
    // (the heading scale is fluid, so this is the large step's size on a 1200px window, not a token read)
    expect(px(getComputedStyle(heading).fontSize)).toBeLessThanOrEqual(25);
    const field = within(sheet).getByRole("searchbox", { name: "Search" }).parentElement!;
    expect(Math.abs(field.getBoundingClientRect().height - tokenPx("--dbm-icon-button-size-md"))).toBeLessThan(1);
    await userEvent.keyboard("{Escape}");
    // end with the sheet gone: an accessibility check run mid-exit sees the page still hidden behind it
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const CountBadgeIsACircleAtEveryLinkSize: Story = {
  name: "A two-digit count is a round 20px at every link size, and a badged link is as tall as a plain one",
  render: () => (
    <NavbarStage minBlockSize="30rem">
      {() => (
        <div style={{ inlineSize: "100%", display: "grid", gap: "1rem", alignSelf: "start" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((linkSize) => (
            <GalleryBar key={linkSize} name={`${linkSize} links`}>
              <Navbar collapseBelow="never" linkSize={linkSize}>
                <Navbar.Links aria-label={`${linkSize} counts`}>
                  <Navbar.Link href="#a">Plain</Navbar.Link>
                  <Navbar.Link href="#b" badge="12" current={linkSize === "md"}>
                    Inbox
                  </Navbar.Link>
                </Navbar.Links>
              </Navbar>
            </GalleryBar>
          ))}
        </div>
      )}
    </NavbarStage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = { xs: "--dbm-space-5", sm: "--dbm-space-5", md: "--dbm-space-5", lg: "--dbm-space-5", xl: "--dbm-space-5" } as const;
    for (const step of ["xs", "sm", "md", "lg", "xl"] as const) {
      const nav = canvas.getByRole("navigation", { name: `${step} counts` });
      const inbox = within(nav).getByRole("link", { name: /Inbox/ });
      const badge = within(inbox).getByText("12");
      const box = badge.getBoundingClientRect();
      // `space.N` tokens are in rem
      expect(Math.round(box.height)).toBe(Math.round(tokenPx(token[step]) * 16));
      // round: as wide as it is tall (a glyph or two wider than the diameter's own room would make an oval)
      expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(2.5);
      expect(Math.abs(inbox.getBoundingClientRect().height - within(nav).getByRole("link", { name: "Plain" }).getBoundingClientRect().height)).toBeLessThan(1);
    }
  },
};

// --- A second row of links (ADR-0187): the row at the end that scrolls away, and a set that scrolls ---

const sectionsStory = (props: Partial<React.ComponentProps<typeof Navbar>> = {}) =>
  function Render() {
    const boxRef = useRef<HTMLDivElement | null>(null);
    return <StickyDemo boxRef={boxRef}>{(ref) => <DemoSectionsNavbar sticky scrollContainerRef={ref} {...props} />}</StickyDemo>;
  };

const sectionsOf = (canvasElement: HTMLElement) => within(canvasElement).getByRole("navigation", { name: "Project sections" });

export const SecondRowScrollsAwayLeavingTheBar: Story = {
  name: "A row at the end scrolls away under the bar, which sticks on its own, with one banner",
  render: sectionsStory(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("banner")).toHaveLength(1);
    const header = canvas.getByRole("banner");
    const scroller = header.parentElement!;
    const sections = sectionsOf(canvasElement);
    const top = () => scroller.getBoundingClientRect().top;
    // outside the banner, under the bar at the start
    await expect(sections.closest("header")).toBeNull();
    await expect(sections.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - 1);
    scroller.scrollTop = 300;
    await waitFor(() => expect(sections.getBoundingClientRect().bottom).toBeLessThanOrEqual(header.getBoundingClientRect().bottom + 1));
    await expect(Math.abs(header.getBoundingClientRect().top - top())).toBeLessThan(3);
    await waitFor(() => expect(getComputedStyle(header).boxShadow).not.toBe("none"));
    scroller.scrollTop = 0;
    await waitFor(() => expect(sections.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - 1));
  },
};

export const SecondRowWithHideOnScroll: Story = {
  name: "A bar that hides on scroll still hides and returns with a row after it",
  render: sectionsStory({ hideOnScroll: true }),
  play: async ({ canvasElement }) => {
    const header = within(canvasElement).getByRole("banner");
    const scroller = header.parentElement!;
    const settle = async () => {
      await waitFor(() => expect(header.getAnimations().every((animation) => animation.playState === "finished")).toBe(true));
      await nextFrame();
    };
    scroller.scrollTop = 300;
    await waitFor(() => expect(getComputedStyle(header).translate).not.toBe("none"), { timeout: 3000 });
    await settle();
    await expect(header.getBoundingClientRect().bottom).toBeLessThanOrEqual(scroller.getBoundingClientRect().top + 1);
    scroller.scrollTop = 200;
    await waitFor(() => expect(getComputedStyle(header).translate).toBe("none"), { timeout: 3000 });
    await settle();
    await expect(header.getBoundingClientRect().top).toBeLessThan(scroller.getBoundingClientRect().top + 30);
  },
};

export const ScrollingSetCentresWhenItFits: Story = {
  name: "A scrolling set is centred while its links fit, with no fade, and keeps its own look beside the bar's",
  render: sectionsStory(),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const sections = sectionsOf(canvasElement);
    const links = within(sections).getAllByRole("link");
    const first = links[0]!.getBoundingClientRect();
    const last = links[links.length - 1]!.getBoundingClientRect();
    const row = sections.closest("[data-navbar-trailing]")!.getBoundingClientRect();
    await expect(Math.abs((first.left + last.right) / 2 - (row.left + row.right) / 2)).toBeLessThan(2);
    await expect(sections).not.toHaveAttribute("data-overflow-start");
    await expect(sections).not.toHaveAttribute("data-overflow-end");
    await expect(getComputedStyle(sections, "::after").opacity).toBe("0");
    // its own look: the current link is a round tint, where the bar's current link is an underline with no fill
    const current = within(sections).getByRole("link", { name: "Overview" });
    const mainCurrent = within(within(canvasElement).getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Projects" });
    await expect(getComputedStyle(current).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(px(getComputedStyle(current).borderTopLeftRadius)).toBeGreaterThan(current.getBoundingClientRect().height / 2 - 1);
    await expect(getComputedStyle(mainCurrent).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

export const ScrollingSetOnAPhone: Story = {
  name: "On a phone the row stays, scrolls with a fade at the end, and a real click on a link beyond the edge brings it into view, clear of the fade",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: sectionsStory(),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    const sections = sectionsOf(canvasElement);
    // the bar's own links went into the menu, and the row of sections did not
    await expect(canvas.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(sections).toBeVisible();
    const scroller = sections.querySelector<HTMLElement>("div")!;
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await waitFor(() => expect(sections).toHaveAttribute("data-overflow-end"));
    await expect(sections).not.toHaveAttribute("data-overflow-start");
    await waitFor(() => expect(getComputedStyle(sections, "::after").opacity).toBe("1"));
    await expect(getComputedStyle(sections, "::after").pointerEvents).toBe("none");
    // a link partly beyond the edge, with another after it: choosing it makes it current and scrolls it in, kept clear of the fade (a browser's own
    // scroll on focus would stop at the edge)
    const billing = within(sections).getByRole("link", { name: "Billing" });
    await expect(billing.getBoundingClientRect().right).toBeGreaterThan(scroller.getBoundingClientRect().right - tokenPx("--dbm-space-8"));
    await userEvent.click(billing);
    await waitFor(() => expect(billing).toHaveAttribute("aria-current", "page"));
    await waitFor(() => expect(scroller.getBoundingClientRect().right - billing.getBoundingClientRect().right).toBeGreaterThanOrEqual(tokenPx("--dbm-space-8") - 2));
    await waitFor(() => expect(sections).toHaveAttribute("data-overflow-start"));
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const ScrollingSetFadesMirrorInRightToLeft: Story = {
  name: "In right-to-left text the fade at the end is on the left, and the set starts at the right",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: sectionsStory({ dir: "rtl" }),
  play: async ({ canvasElement }) => {
    const sections = sectionsOf(canvasElement);
    await waitFor(() => expect(sections).toHaveAttribute("data-overflow-end"));
    await expect(sections).not.toHaveAttribute("data-overflow-start");
    // the end edge is the left one: its fade runs from the left edge inward
    await expect(getComputedStyle(sections, "::after").backgroundImage).toContain("to right");
    const scroller = sections.querySelector<HTMLElement>("div")!;
    const first = within(sections).getByRole("link", { name: "Overview" });
    await expect(first.getBoundingClientRect().right).toBeGreaterThan(scroller.getBoundingClientRect().right - 40);
  },
};

export const ScrollingSetInForcedColoursAndPrint: Story = {
  name: "In forced colours the current pill is still marked, and printed the fades go and the row is printed in order",
  render: sectionsStory(),
  play: async ({ canvasElement }) => {
    const sections = sectionsOf(canvasElement);
    const current = within(sections).getByRole("link", { name: "Overview" });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(getComputedStyle(current).outlineStyle).not.toBe("none");
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
    await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
    try {
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(true));
      await nextFrame();
      await expect(getComputedStyle(sections, "::after").display).toBe("none");
      await expect(sections).toBeVisible();
    } finally {
      await send("Emulation.setEmulatedMedia", { media: "", features: [] });
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(false));
    }
  },
};
