import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Accordion } from "./Accordion";

// Docs-only (guidelines/adr/0013) — `Accordion.Trigger`'s own props get
// their own Properties table on Accordion.mdx. Rendered inside a real
// `Accordion.Item` (Radix's own context-scoped Trigger throws outside one).
const meta: Meta<typeof Accordion.Trigger> = {
  title: "Components/Accordion/Trigger",
  id: "molecules-overlay-accordion-trigger",
  component: Accordion.Trigger,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The trigger's own visible label.",
    },
    icon: {
      control: false,
      description:
        "The disclosure indicator icon, rotated 180° when this item is open. Pass a different Phosphor icon reference to replace the default caret.",
      table: { defaultValue: { summary: "CaretDownIcon" } },
    },
    hideIcon: {
      control: "boolean",
      description: "Hides the disclosure indicator icon entirely.",
    },
    asChild: {
      control: false,
      description:
        "Renders as a single provided child element instead of the built-in label+icon row — the child is responsible for its own disclosure indicator in this mode.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this trigger.",
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
    children: "How long does shipping take?",
    hideIcon: false,
  },
};

export default meta;

type Story = StoryObj<typeof Accordion.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Accordion defaultValue="shipping">
      <Accordion.Item value="shipping">
        <Accordion.Trigger {...args} />
        <Accordion.Content>
          <Text size="sm">Standard shipping takes 3-5 business days.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};
