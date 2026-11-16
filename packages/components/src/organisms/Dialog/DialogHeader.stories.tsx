import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Header> = {
  title: "Components/Dialog/Header",
  id: "organisms-overlay-dialog-header",
  component: Dialog.Header,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The header's content, usually a Dialog.Title and optionally a Dialog.Description.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
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
    children: "Header",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Header>;

export const Default: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Example dialog">
        <Dialog.Header {...args} />
      </Dialog.Content>
    </Dialog>
  ),
};
