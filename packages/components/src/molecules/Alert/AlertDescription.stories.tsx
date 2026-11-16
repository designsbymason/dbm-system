import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

// Docs-only (guidelines/adr/0013) — `Alert.Description`'s own props get their own Properties table on Alert.mdx.
const meta: Meta<typeof Alert.Description> = {
  title: "Components/Alert/Description",
  id: "molecules-feedback-alert-description",
  component: Alert.Description,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The message itself — text, or anything a message can hold, such as a link." },
    id: {
      control: false,
      description: "Standard DOM id — what an alert's aria-describedby can point at.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Alert.Description>;

export const Default: Story = {
  render: (args) => (
    <Alert>
      <Alert.Description {...args}>Your card was declined.</Alert.Description>
    </Alert>
  ),
};
