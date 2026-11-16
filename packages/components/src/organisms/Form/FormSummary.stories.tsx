import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../../atoms/Input";
import { FormField } from "../../molecules/FormField";
import { Form } from "./Form";

// Docs-only: exists purely to resolve `Form.Summary`'s own argTypes for its Properties table on `Form.mdx` — a
// compound sub-part, not an independently browsable component (ADR-0013), so `tags: ["!dev"]` keeps it out of the
// sidebar while leaving it indexed for the Docs page.
const meta: Meta<typeof Form.Summary> = {
  title: "Components/Form/Summary",
  id: "organisms-inputs-form-summary",
  component: Form.Summary,
  tags: ["!dev"],
  argTypes: {
    title: {
      control: "text",
      description:
        "The summary's heading, in place of the count sentence from the form's labels (\"There are 3 problems with this form\").",
    },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for the summary's outer element." },
    style: { control: false, description: "Inline styles for the summary's outer element." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { title: "" },
  render: (args) => (
    <Form aria-label="Demo" errors={{ email: "Enter an email address" }}>
      <FormField label="Email" name="email">
        {(field) => <Input {...field} />}
      </FormField>
      <Form.Summary {...args} title={args.title || undefined} />
    </Form>
  ),
};

export default meta;

type Story = StoryObj<typeof Form.Summary>;

export const Default: Story = {};
