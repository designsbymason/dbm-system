import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { send } from "../../molecules/CodeBlock/browserProtocol";
import { SkipLink } from "./SkipLink";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do — the link's hiding, its place in the corner, its ring, forced colours,
// right to left and print. A real key press is needed for `:focus-visible`: a synthetic one, or `focus()` from a script, does not set it.
const meta: Meta = {
  title: "Atoms/Utility/SkipLink/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A real key press through the Chrome DevTools Protocol. */
async function press(key: "Tab" | "Enter", windowsVirtualKeyCode: number, text?: string) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode, ...(text ? { text } : {}) });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode });
}

/** The page the link skips to, with some content before it, so the link is the first tab stop and sits over something. */
function Page({ dir }: { dir?: "rtl" }) {
  return (
    <div dir={dir} style={{ minBlockSize: "100dvh" }}>
      <SkipLink onClick={(event) => event.preventDefault()} />
      <header style={{ padding: "var(--dbm-space-4)", background: "var(--dbm-bg-canvas)" }}>
        <a href="#header-link">A link in the header</a>
      </header>
      <main id="main" tabIndex={-1} style={{ padding: "var(--dbm-space-4)" }}>
        The page
      </main>
    </div>
  );
}

const link = (canvasElement: HTMLElement) => within(canvasElement).getByRole("link", { name: "Skip to content" });

/** Puts the real keyboard on the link: the first Tab reaches it, because it comes first. */
async function reveal(canvasElement: HTMLElement) {
  (document.activeElement as HTMLElement | null)?.blur();
  await press("Tab", 9);
  await waitFor(() => expect(document.activeElement).toBe(link(canvasElement)));
}

export const HiddenUntilFocused: Story = {
  name: "Out of sight until it takes focus, yet the first tab stop, and in the accessibility tree — layout test",
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const skip = link(canvasElement);
    // Hidden: clipped to a pixel and out of the page's flow, not removed.
    const rect = skip.getBoundingClientRect();
    await expect(rect.width).toBeLessThanOrEqual(1);
    await expect(rect.height).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(skip).clipPath).not.toBe("none");
    await expect(getComputedStyle(skip).display).not.toBe("none");
    // It is the first thing a real Tab reaches.
    await reveal(canvasElement);
    await expect(document.activeElement).toBe(skip);
  },
};

export const RevealedInTheCorner: Story = {
  name: "A real Tab draws it in the top corner above the page, with an edge, a ring and a shadow — layout test",
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const skip = link(canvasElement);
    await reveal(canvasElement);
    await waitFor(() => expect(getComputedStyle(skip).position).toBe("fixed"));
    const style = getComputedStyle(skip);
    const rect = skip.getBoundingClientRect();
    // At the start edge of the window, a small step down from its top, and big enough to read and press.
    await expect(Math.abs(rect.left - 16)).toBeLessThan(2);
    await expect(rect.top).toBeGreaterThan(0);
    await expect(rect.top).toBeLessThan(24);
    await expect(rect.height).toBeGreaterThanOrEqual(24);
    // Drawn above everything: the topmost thing at its middle is the link.
    const above = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    await expect(skip.contains(above)).toBe(true);
    // An edge, a focus ring and an elevation shadow.
    await expect(style.borderTopStyle).toBe("solid");
    await expect(style.outlineStyle).toBe("solid");
    await expect(style.outlineWidth).toBe("2px");
    await expect(style.boxShadow).not.toBe("none");
    // Enter follows it: the page's own click handler stood in for a router's.
    await press("Enter", 13, "\r");
  },
};

export const RightToLeft: Story = {
  name: "In a right-to-left page it appears at the right edge — direction test",
  render: () => <Page dir="rtl" />,
  play: async ({ canvasElement }) => {
    const skip = link(canvasElement);
    await reveal(canvasElement);
    await waitFor(() => expect(getComputedStyle(skip).position).toBe("fixed"));
    const rect = skip.getBoundingClientRect();
    await expect(Math.abs(window.innerWidth - rect.right - 16)).toBeLessThan(2);
  },
};

export const ForcedColours: Story = {
  name: "In forced colours its edge and ring are still drawn — forced colours test",
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const skip = link(canvasElement);
    await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await reveal(canvasElement);
      await waitFor(() => expect(getComputedStyle(skip).position).toBe("fixed"));
      await expect(getComputedStyle(skip).borderTopStyle).toBe("solid");
      await expect(getComputedStyle(skip).outlineStyle).toBe("solid");
    } finally {
      // Clear the emulation by sending an empty feature list, not the default value, so it cannot leak into the next story.
      await send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};

export const NotPrinted: Story = {
  name: "Printed, the page has no skip link — print test",
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const skip = link(canvasElement);
    await expect(getComputedStyle(skip).display).not.toBe("none");
    await send("Emulation.setEmulatedMedia", { media: "print", features: [] });
    try {
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(true));
      await nextFrame();
      await expect(getComputedStyle(skip).display).toBe("none");
    } finally {
      await send("Emulation.setEmulatedMedia", { media: "", features: [] });
      await waitFor(() => expect(window.matchMedia("print").matches).toBe(false));
    }
  },
};
