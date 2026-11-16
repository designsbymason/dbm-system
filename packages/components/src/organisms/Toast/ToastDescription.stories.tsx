import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

// Docs-only (guidelines/adr/0013): resolves `Toast.Description`'s own argTypes for its sub-part Properties table.
const meta: Meta<typeof Toast.Description> = {
  title: "Components/Toast/Description",
  id: "organisms-feedback-toast-description",
  component: Toast.Description,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The message itself — text, or anything a message can hold, such as a link." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    id: { control: false, description: "Standard DOM id." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Toast.Description>;

export const Default: Story = {
  render: (args) => (
    <Toast.Provider>
      <Toast>
        <Toast.Description {...args}>Saved</Toast.Description>
      </Toast>
    </Toast.Provider>
  ),
};
