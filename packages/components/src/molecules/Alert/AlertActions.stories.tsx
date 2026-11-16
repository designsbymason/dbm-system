import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Alert } from "./Alert";

// Docs-only (guidelines/adr/0013) — `Alert.Actions`' own props get their own Properties table on Alert.mdx.
const meta: Meta<typeof Alert.Actions> = {
  title: "Components/Alert/Actions",
  id: "molecules-feedback-alert-actions",
  component: Alert.Actions,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "What the reader can do about it — usually one or two Buttons or Links. They wrap onto more lines when there is no room.",
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
};

export default meta;

type Story = StoryObj<typeof Alert.Actions>;

export const Default: Story = {
  render: (args) => (
    <Alert>
      <Alert.Description>Your card was declined.</Alert.Description>
      <Alert.Actions {...args}>
        <Button size="sm">Update card</Button>
      </Alert.Actions>
    </Alert>
  ),
};
