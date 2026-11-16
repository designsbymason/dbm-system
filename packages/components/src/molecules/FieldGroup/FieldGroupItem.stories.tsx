import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldGroup } from "./FieldGroup";

// Docs-only: exists purely to resolve `FieldGroup.Item`'s own argTypes for the "FieldGroup.Item properties" table
// on `FieldGroup.mdx` — it is a compound sub-part, not an independently browsable component (see ADR-0013), so
// `tags: ["!dev"]` keeps every story here out of the sidebar while leaving it indexed for the Docs page.
const meta: Meta<typeof FieldGroup.Item> = {
  title: "Components/FieldGroup/Item",
  id: "molecules-inputs-fieldgroup-item",
  component: FieldGroup.Item,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The field (or fields) this cell holds." },
    span: {
      control: "number",
      description:
        "How many of the group's columns this cell spans — a positive whole number, or a breakpoint map. Clamped to the columns the group has right now. Does nothing unless the group sets columns.",
      table: { defaultValue: { summary: "1" } },
    },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for the cell." },
    style: { control: false, description: "Inline styles for the cell." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { span: 1 },
  render: (args) => (
    <FieldGroup legend="Group" columns={3}>
      <FieldGroup.Item {...args}>Cell</FieldGroup.Item>
    </FieldGroup>
  ),
};

export default meta;

type Story = StoryObj<typeof FieldGroup.Item>;

export const Default: Story = {};
