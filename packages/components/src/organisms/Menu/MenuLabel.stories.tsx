import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.Label> = {
  title: "Components/Menu/Label",
  id: "organisms-navigation-menu-label",
  component: Menu.Label,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The heading text. It names the Menu.Group or Menu.RadioGroup it sits in.",
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
    children: "Account",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.Label>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Group>
          <Menu.Label {...args} />
          <Menu.Item>Profile</Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu>
  ),
};
