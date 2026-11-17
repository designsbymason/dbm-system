import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Navbar } from "../../organisms/Navbar";
import { Toolbar } from "./Toolbar";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do, which is real layout and hit-testing across a scrolled page.
const meta: Meta = {
  title: "Components/Toolbar/Checks",
  id: "molecules-inputs-toolbar-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const actions = Array.from({ length: 14 }, (_, index) => `Action ${index + 1}`);

export const ScrollButtonStaysUnderAStickyBar: Story = {
  name: "A scroll button stays under a sticky bar the page scrolls it beneath",
  render: () => (
    <div>
      <Navbar sticky aria-label="Site">
        <span>Site header</span>
      </Navbar>
      <div style={{ height: "20rem" }}>Content above the toolbar</div>
      <div style={{ inlineSize: "22rem" }}>
        <Toolbar aria-label="Actions">
          {actions.map((action) => (
            <Toolbar.Button key={action}>{action}</Toolbar.Button>
          ))}
        </Toolbar>
      </div>
      <div style={{ height: "90rem" }}>Content below the toolbar</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("banner");
    const toolbar = canvas.getByRole("toolbar", { name: "Actions" });
    // The scroll buttons are for a pointer and hidden from assistive technology, so they are found by their place: the last one is the end button.
    const buttons = Array.from(canvasElement.querySelectorAll<HTMLElement>('button[aria-hidden="true"]'));
    const button = buttons[buttons.length - 1] as HTMLElement;
    await waitFor(() => expect(getComputedStyle(button).pointerEvents).not.toBe("none"));
    // Scroll the page until the toolbar's top edge is 20px under the bar's bottom edge, so the button and the bar overlap. The bar changes height
    // once it sticks, so measure again after each scroll until the edge has settled.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const wanted = bar.getBoundingClientRect().bottom - 20;
      const gap = toolbar.getBoundingClientRect().top - wanted;
      if (Math.abs(gap) < 2) break;
      window.scrollTo(0, window.scrollY + gap);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await waitFor(() => expect(button.getBoundingClientRect().top).toBeLessThan(bar.getBoundingClientRect().bottom - 14));
    // A point inside the button and inside the bar, above the arrow itself: whatever is drawn there is what a click would reach.
    const box = button.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, bar.getBoundingClientRect().bottom - 14);
    await expect(hit).not.toBeNull();
    await expect(bar.contains(hit)).toBe(true);
  },
};
