import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Affix } from "./Affix";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do — an `IntersectionObserver` over a real scroll, to a rest position where the
// one-pixel sentinel is partly or only just in view.
const meta: Meta = {
  title: "Atoms/Layout/Affix/Checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Scrolls the page down far enough to stick the bar, then back to its very top by the way a hand or a trackpad does, and reports what it says there. */
async function scrollUpTo(bar: HTMLElement, pattern: "ease" | "steps of 3" | "steps of 7.3") {
  window.scrollTo(0, 400);
  await waitFor(() => expect(bar).toHaveAttribute("data-stuck"));
  if (pattern === "ease") {
    // a momentum scroll slows through fractions of a pixel
    let y = 400;
    while (y > 0.01) {
      y *= 0.9;
      window.scrollTo(0, y);
      await frame();
    }
  } else {
    // a slow drag: whole steps, which rest one pixel short of the top for a step of 3
    const step = pattern === "steps of 3" ? 3 : 7.3;
    for (let y = 400; y > 0; y -= step) {
      window.scrollTo(0, y);
      await frame();
    }
  }
  window.scrollTo(0, 0);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await expect(window.scrollY).toBe(0);
}

export const NotStuckAfterASoftScrollBackToTheTop: Story = {
  name: "After a soft scroll back to the very top the bar is not stuck, however the scroll came to rest — scroll test",
  render: () => (
    <div>
      <Affix asChild>
        <header data-testid="bar" style={{ background: "var(--dbm-bg-surface)", padding: "var(--dbm-space-2)", marginBlockStart: "calc(var(--dbm-space-px) * -1)" }}>
          Bar
        </header>
      </Affix>
      <div style={{ blockSize: "300vh" }}>A long page</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector<HTMLElement>("[data-testid=bar]")!;
    for (const pattern of ["ease", "steps of 3", "steps of 7.3"] as const) {
      await scrollUpTo(bar, pattern);
      // The stuck state is what a shadow is drawn from, so it must not stay on at the top.
      await expect(bar, `stuck after "${pattern}"`).not.toHaveAttribute("data-stuck");
    }
  },
};
