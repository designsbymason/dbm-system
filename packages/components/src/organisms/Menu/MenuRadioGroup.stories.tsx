import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.RadioGroup> = {
  title: "Components/Menu/RadioGroup",
  id: "organisms-navigation-menu-radiogroup",
  component: Menu.RadioGroup,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Menu.RadioItems, with an optional Menu.Label.",
    },
    value: {
      control: false,
      description: "The value of the chosen item (controlled). Omit it, with defaultValue, to let the group keep its own.",
    },
    defaultValue: {
      control: "text",
      description: "The initially chosen value for uncontrolled usage — ignored once value is provided.",
    },
    onValueChange: {
      control: false,
      description: "Called with the new value when an item is chosen.",
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
  args: {
    defaultValue: "name",
    "aria-label": "Sort by",
  },
};

export default meta;

type Story = StoryObj<typeof Menu.RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Sort</Menu.Trigger>
      <Menu.Content>
        <Menu.RadioGroup {...args}>
          <Menu.RadioItem value="name">Name</Menu.RadioItem>
          <Menu.RadioItem value="date">Date</Menu.RadioItem>
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu>
  ),
};
