import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Description> = {
  title: "Components/Dialog/Description",
  id: "organisms-overlay-dialog-description",
  component: Dialog.Description,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "One or two sentences saying what the dialog is for. Read out after the title when the dialog opens.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    children: "Changes are saved to your account.",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Description>;

export const Default: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Example dialog">
        <Dialog.Header>
          <Dialog.Description {...args} />
        </Dialog.Header>
      </Dialog.Content>
    </Dialog>
  ),
};
