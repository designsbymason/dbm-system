import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Group> = {
  title: "Organisms/Navigation/Menubar/Group",
  component: Menubar.Group,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The items of the group, with an optional Menubar.Label that names it.",
    },
    "aria-label": {
      control: "text",
      description:
        "An accessible name for the group, when there is no Menubar.Label inside it.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "The id of an element that names the group. Without it, a Menubar.Label inside the group names it.",
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
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Group>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Group {...args}>
            <Menubar.Label>Account</Menubar.Label>
            <Menubar.Item>Profile</Menubar.Item>
          </Menubar.Group>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
