import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

// Docs-only (guidelines/adr/0013): resolves `Toast.Title`'s own argTypes for its sub-part Properties table.
const meta: Meta<typeof Toast.Title> = {
  title: "Components/Toast/Title",
  id: "organisms-feedback-toast-title",
  component: Toast.Title,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The headline of the message — a few words." },
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

type Story = StoryObj<typeof Toast.Title>;

export const Default: Story = {
  render: (args) => (
    <Toast.Provider>
      <Toast>
        <Toast.Title {...args}>Saved</Toast.Title>
      </Toast>
    </Toast.Provider>
  ),
};
