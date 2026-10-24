import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof ContextMenu.Group> = {
  title: "Organisms/Overlay/ContextMenu/Group",
  component: ContextMenu.Group,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The items of the group, with an optional ContextMenu.Label that names it.",
    },
    "aria-label": {
      control: "text",
      description: "An accessible name for the group, when there is no ContextMenu.Label inside it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the group. Without it, a ContextMenu.Label inside the group names it.",
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

type Story = StoryObj<typeof ContextMenu.Group>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger>Right-click me</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Group {...args}>
          <ContextMenu.Label>Account</ContextMenu.Label>
          <ContextMenu.Item>Profile</ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
