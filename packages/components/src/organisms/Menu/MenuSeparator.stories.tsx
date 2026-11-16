import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.Separator> = {
  title: "Components/Menu/Separator",
  id: "organisms-navigation-menu-separator",
  component: Menu.Separator,
  tags: ["!dev"],
  argTypes: {
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
};

export default meta;

type Story = StoryObj<typeof Menu.Separator>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Edit</Menu.Item>
        <Menu.Separator {...args} />
        <Menu.Item>Delete</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};
