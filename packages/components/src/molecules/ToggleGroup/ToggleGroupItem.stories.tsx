import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleGroup } from "./ToggleGroup";

// Docs-only (guidelines/adr/0013) — `ToggleGroup.Item`'s own props get their own Properties table on
// ToggleGroup.mdx. Rendered inside a real `ToggleGroup` (Radix's own context-scoped Item throws outside one).
const meta: Meta<typeof ToggleGroup.Item> = {
  title: "Molecules/Inputs/ToggleGroup/Item",
  component: ToggleGroup.Item,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description:
        "This item's value: what the group's value holds while it is chosen. Required, and unique within the group.",
    },
    children: {
      control: false,
      description: "The item's label. Left out, the item is icon-only and needs an aria-label.",
    },
    icon: {
      control: false,
      description: "An icon before the label, sized to the group's size. With asChild it is drawn inside your element, before its own content.",
    },
    disabled: {
      control: "boolean",
      description: "Disables this item. The group's disabled disables every item either way.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description:
        "Renders the item as its only child, for a wrapper such as a Tooltip trigger. The child must be a single element that takes the item's props; the icon is drawn inside it, before its own content.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": {
      control: "text",
      description: "Names an icon-only item, which has no visible label of its own.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of a visible element that names this item, in place of aria-label.",
    },
    id: {
      control: false,
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
    value: "week",
    disabled: false,
    asChild: false,
  },
};

export default meta;

type Story = StoryObj<typeof ToggleGroup.Item>;

export const Default: Story = {
  render: ({ children: _children, ...args }) => (
    <ToggleGroup aria-label="View" defaultValue="week">
      <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
      <ToggleGroup.Item {...args}>Week</ToggleGroup.Item>
    </ToggleGroup>
  ),
};
