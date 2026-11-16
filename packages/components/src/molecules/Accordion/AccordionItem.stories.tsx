import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Accordion } from "./Accordion";

// Docs-only (guidelines/adr/0013) — `Accordion.Item`'s own props get their
// own Properties table on Accordion.mdx, separate from the umbrella table.
// Rendered inside a real `Accordion` (Radix's own context-scoped Item throws
// outside one) with the item pre-opened so its own Trigger/Content are both
// visible for this story's own screenshot/reference purposes.
const meta: Meta<typeof Accordion.Item> = {
  title: "Components/Accordion/Item",
  id: "molecules-overlay-accordion-item",
  component: Accordion.Item,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description:
        "This item's unique identifier within the accordion — what value/defaultValue/onValueChange refer to.",
      type: { name: "string", required: true },
    },
    disabled: {
      control: "boolean",
      description: "Disables this item's own trigger, on top of any accordion-wide disabled.",
    },
    asChild: {
      control: false,
      description:
        "Renders the item's own root behavior onto a single provided child instead of wrapping it in its own <div>.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: false,
      description: "An Accordion.Trigger followed by an Accordion.Content.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this item.",
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
    value: "shipping",
  },
};

export default meta;

type Story = StoryObj<typeof Accordion.Item>;

export const Default: Story = {
  render: (args) => (
    <Accordion defaultValue={args.value}>
      <Accordion.Item {...args}>
        <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
        <Accordion.Content>
          <Text size="sm">Standard shipping takes 3-5 business days.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};
