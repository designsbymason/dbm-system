import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Form } from "./Form";

// Docs-only: resolves `Form.Actions`' argTypes for the Properties table on `Form.mdx` (ADR-0013).
const meta: Meta<typeof Form.Actions> = {
  title: "Components/Form/Actions",
  id: "organisms-inputs-form-actions",
  component: Form.Actions,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The buttons." },
    align: {
      control: "select",
      options: ["start", "end", "between"],
      description:
        "Where the buttons sit along the row: at the start, at the end, or the first at one end and the rest at the other.",
      table: { defaultValue: { summary: '"start"' } },
    },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { align: "start" },
  render: (args) => (
    <Form.Actions {...args}>
      <Button type="reset" variant="ghost">
        Reset
      </Button>
      <Form.Submit>Save</Form.Submit>
    </Form.Actions>
  ),
};

export default meta;

type Story = StoryObj<typeof Form.Actions>;

export const Default: Story = {};
