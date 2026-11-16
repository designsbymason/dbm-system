import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

// Docs-only (guidelines/adr/0013) — `Alert.Title`'s own props get their own Properties table on Alert.mdx.
const meta: Meta<typeof Alert.Title> = {
  title: "Components/Alert/Title",
  id: "molecules-feedback-alert-title",
  component: Alert.Title,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The headline of the message — a few words." },
    asChild: {
      control: "boolean",
      description:
        "Renders the title onto your own single child element instead of a p — a real heading, say, where the message belongs in the page's outline.",
      table: { defaultValue: { summary: "false" } },
    },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { asChild: false },
};

export default meta;

type Story = StoryObj<typeof Alert.Title>;

export const Default: Story = {
  render: (args) => (
    <Alert>
      <Alert.Title {...args}>Payment failed</Alert.Title>
    </Alert>
  ),
};
