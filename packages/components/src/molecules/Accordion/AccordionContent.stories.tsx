import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../../atoms/Text";
import { Accordion } from "./Accordion";

// Docs-only (guidelines/adr/0013) — `Accordion.Content`'s own props get
// their own Properties table on Accordion.mdx. Rendered inside a real,
// pre-opened `Accordion.Item` (Radix's own context-scoped Content throws
// outside one, and stays unmounted when its own item is closed) so this
// story's own screenshot/reference purposes actually show something.
const meta: Meta<typeof Accordion.Content> = {
  title: "Components/Accordion/Content",
  id: "molecules-overlay-accordion-content",
  component: Accordion.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The panel's own content, revealed when this item is open.",
    },
    forceMount: {
      control: false,
      description:
        "Forces the panel to stay mounted while closed, instead of being removed from the DOM — for an external animation library that needs to control its own mount/unmount timing directly.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this panel.",
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

type Story = StoryObj<typeof Accordion.Content>;

export const Default: Story = {
  render: (args) => (
    <Accordion defaultValue="shipping">
      <Accordion.Item value="shipping">
        <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
        <Accordion.Content {...args}>
          <Text size="sm">Standard shipping takes 3-5 business days.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};
