import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Trigger> = {
  title: "Components/AlertDialog/Trigger",
  id: "organisms-overlay-alertdialog-trigger",
  component: AlertDialog.Trigger,
  tags: ["!dev"],
  argTypes: {
    asChild: {
      control: "boolean",
      description: "Renders as a single provided child element (Radix Slot) instead of the built-in, unstyled native <button> — use a Button as the visible trigger.",
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
    children: "Open alert",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Trigger>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog>
      <AlertDialog.Trigger {...args} />
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Sure?</AlertDialog.Title>
          <AlertDialog.Description>Really.</AlertDialog.Description>
        </AlertDialog.Header>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
