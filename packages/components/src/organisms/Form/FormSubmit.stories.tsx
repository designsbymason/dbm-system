import type { Meta, StoryObj } from "@storybook/react-vite";
import { Form } from "./Form";

// Docs-only: resolves `Form.Submit`'s argTypes for the Properties table on `Form.mdx` (ADR-0013). It is a `Button`
// with `type="submit"`, so only what it changes is listed; every other `Button` prop passes through.
const meta: Meta<typeof Form.Submit> = {
  title: "Components/Form/Submit",
  id: "organisms-inputs-form-submit",
  component: Form.Submit,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The button's label." },
    isLoading: {
      control: "boolean",
      description:
        "Shows the loading state. Follows the form while its onSubmit promise is running; set it to take over.",
      table: { defaultValue: { summary: "follows the form" } },
    },
    loadingText: { control: "text", description: "Text shown in place of the label while loading." },
    disabled: {
      control: "boolean",
      description: "Disables the button. It is also disabled while the form is.",
      table: { defaultValue: { summary: "false" } },
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's style, as on Button.",
      table: { defaultValue: { summary: '"primary"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size, as on Button.",
      table: { defaultValue: { summary: '"md"' } },
    },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles." },
    id: { control: false, description: "Standard DOM id." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { children: "Save", disabled: false, variant: "primary", size: "md" },
  render: (args) => (
    <Form aria-label="Demo">
      <Form.Submit {...args} />
    </Form>
  ),
};

export default meta;

type Story = StoryObj<typeof Form.Submit>;

export const Default: Story = {};
