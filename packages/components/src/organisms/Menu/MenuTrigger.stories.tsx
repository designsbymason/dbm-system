import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.Trigger> = {
  title: "Components/Menu/Trigger",
  id: "organisms-navigation-menu-trigger",
  component: Menu.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      // A single element child is what asChild needs; the story's text child can't stand in for one.
      control: false,
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — use one of this system's own interactive components (Button, IconButton) as the visible trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The trigger's own content — a single element when asChild is set.",
    },
    disabled: {
      control: "boolean",
      description: "A disabled trigger can't open the menu.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-haspopup": {
      control: false,
      description: 'Set to "menu" on the trigger; Radix keeps it, so a value passed here is documentation only.',
    },
    "aria-expanded": {
      control: false,
      description: "Whether the menu is open; kept in step with the open state.",
    },
    "aria-label": {
      control: "text",
      description: "An accessible name, required on an icon-only trigger. The menu is named after its trigger.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the trigger.",
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
    children: "Open menu",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Menu>
      <Menu.Trigger {...args} />
      <Menu.Content>
        <Menu.Item>Edit</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};
