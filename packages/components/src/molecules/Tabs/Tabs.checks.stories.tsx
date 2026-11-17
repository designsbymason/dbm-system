import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Navbar } from "../../organisms/Navbar";
import { Tabs } from "./Tabs";

// Hidden real-browser checks (guidelines/adr/0013): what jsdom can't do, which is real layout and hit-testing across a scrolled page.
const meta: Meta = {
  title: "Components/Tabs/Checks",
  id: "molecules-navigation-tabs-checks",
  tags: ["!dev"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

// The values have no space: a space in one is an id that `aria-controls` reads as two.
const sections = Array.from({ length: 14 }, (_, index) => ({ value: `section-${index + 1}`, label: `Section ${index + 1}` }));

export const ScrollButtonStaysUnderAStickyBar: Story = {
  name: "A scroll button stays under a sticky bar the page scrolls it beneath",
  render: () => (
    <div>
      <Navbar sticky aria-label="Site">
        <span>Site header</span>
      </Navbar>
      <div style={{ height: "20rem" }}>Content above the tabs</div>
      <div style={{ inlineSize: "22rem" }}>
        <Tabs defaultValue="section-1">
          <Tabs.List aria-label="Sections">
            {sections.map((section) => (
              <Tabs.Trigger key={section.value} value={section.value}>
                {section.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="section-1">The first section.</Tabs.Content>
        </Tabs>
      </div>
      <div style={{ height: "90rem" }}>Content below the tabs</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("banner");
    const button = await canvas.findByRole("button", { name: "Scroll tabs to the end" });
    const list = canvas.getByRole("tablist");
    // Scroll the page until the tabs's top edge is 20px under the bar's bottom edge, so the button and the bar overlap. The bar changes height
    // once it sticks, so measure again after each scroll until the edge has settled.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const wanted = bar.getBoundingClientRect().bottom - 20;
      const gap = list.getBoundingClientRect().top - wanted;
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
