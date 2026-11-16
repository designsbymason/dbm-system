import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Trigger> = {
  title: "Components/Dialog/Trigger",
  id: "organisms-overlay-dialog-trigger",
  component: Dialog.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — use one of this system's own interactive components (Button, IconButton) as the visible trigger.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: "text",
      description: "The trigger's own content — a single element when asChild is set.",
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
    children: "Open dialog",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Trigger>;

export const Default: Story = {
  render: (args) => (
    <Dialog>
      <Dialog.Trigger {...args} />
      <Dialog.Content aria-label="Example dialog">
        <Dialog.Body>Content</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
};
