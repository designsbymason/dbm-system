import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Cancel> = {
  title: "Components/AlertDialog/Cancel",
  id: "organisms-overlay-alertdialog-cancel",
  component: AlertDialog.Cancel,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The label of the safe way out: Cancel, Keep it. It takes focus when the alert opens.",
    },
    value: {
      control: "text",
      description:
        "A name for this choice, reported as details.value by onOpenChange when it closes the alert. Give each Action one when there are two.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The look of the button.",
      table: { defaultValue: { summary: '"secondary"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size, on the shared scale.",
      table: { defaultValue: { summary: '"md"' } },
    },
    isLoading: {
      control: "boolean",
      description: "Shows a spinner in place of the label and makes the button inert. Use it on the Action while a request runs.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the button.",
      table: { defaultValue: { summary: "false" } },
    },
    onClick: {
      control: false,
      description: "Runs before the alert closes. Call event.preventDefault() to keep it open.",
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
    children: "Keep it",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Cancel>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel {...args} />
          <AlertDialog.Action>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
