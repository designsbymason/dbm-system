import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Close> = {
  title: "Components/Dialog/Close",
  id: "organisms-overlay-dialog-close",
  component: Dialog.Close,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — for a Button reading \"Cancel\" or \"Done\" that should still close the dialog on click.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The close control's own content — a single element when asChild is set.",
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
    children: "Done",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Close>;

export const Default: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Example dialog">
        <Dialog.Body>Content</Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close {...args} />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};
