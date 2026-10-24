import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof ContextMenu.RadioGroup> = {
  title: "Organisms/Overlay/ContextMenu/RadioGroup",
  component: ContextMenu.RadioGroup,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "ContextMenu.RadioItems, with an optional ContextMenu.Label.",
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
  args: {
    defaultValue: "name",
    "aria-label": "Sort by",
  },
};

export default meta;

type Story = StoryObj<typeof ContextMenu.RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger>Sort</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.RadioGroup {...args}>
          <ContextMenu.RadioItem value="name">Name</ContextMenu.RadioItem>
          <ContextMenu.RadioItem value="date">Date</ContextMenu.RadioItem>
        </ContextMenu.RadioGroup>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
