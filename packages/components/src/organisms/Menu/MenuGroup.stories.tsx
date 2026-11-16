import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.Group> = {
  title: "Components/Menu/Group",
  id: "organisms-navigation-menu-group",
  component: Menu.Group,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The items of the group, with an optional Menu.Label that names it.",
    },
    "aria-label": {
      control: "text",
      description: "An accessible name for the group, when there is no Menu.Label inside it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the group. Without it, a Menu.Label inside the group names it.",
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
};

export default meta;

type Story = StoryObj<typeof Menu.Group>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Group {...args}>
          <Menu.Label>Account</Menu.Label>
          <Menu.Item>Profile</Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu>
  ),
};
