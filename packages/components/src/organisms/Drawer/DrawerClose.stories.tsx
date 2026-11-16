import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Close> = {
  title: "Components/Drawer/Close",
  id: "organisms-overlay-drawer-close",
  component: Drawer.Close,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — for a Button reading \"Cancel\" or \"Done\" that should still close the drawer on click.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The close control's own content — a single element when asChild is set.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    children: "Done",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Close>;

export const Default: Story = {
  render: (args) => (
    <Drawer defaultOpen>
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Body>Content</Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close {...args} />
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};
