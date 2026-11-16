import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only — see DrawerRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Drawer.Trigger> = {
  title: "Components/Drawer/Trigger",
  id: "organisms-overlay-drawer-trigger",
  component: Drawer.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — use one of this system's own interactive components (Button, IconButton) as the visible trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The trigger's own content — a single element when asChild is set.",
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
    children: "Open drawer",
  },
};

export default meta;

type Story = StoryObj<typeof Drawer.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Drawer>
      <Drawer.Trigger {...args} />
      <Drawer.Content aria-label="Example drawer">
        <Drawer.Body>Content</Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
};
