import type { Meta, StoryObj } from "@storybook/react-vite";
import { Form } from "./Form";

// Docs-only: resolves `Form.Error`'s own argTypes for the Properties table on `Form.mdx` (ADR-0013).
const meta: Meta<typeof Form.Error> = {
  title: "Components/Form/Error",
  id: "organisms-inputs-form-error",
  component: Form.Error,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "Replaces the message: the form's error, or labels.submitFailed after a rejected onSubmit. Shown only while the form has an error.",
    },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for the outer element." },
    style: { control: false, description: "Inline styles for the outer element." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { children: "" },
  render: (args) => (
    <Form aria-label="Demo" error="We couldn't reach the server.">
      <Form.Error {...args}>{args.children || undefined}</Form.Error>
    </Form>
  ),
};

export default meta;

type Story = StoryObj<typeof Form.Error>;

export const Default: Story = {};
