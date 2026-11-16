import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Action> = {
  title: "Components/AlertDialog/Action",
  id: "organisms-overlay-alertdialog-action",
  component: AlertDialog.Action,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The label of the choice the alert exists to ask for.",
    },
    value: {
      control: "text",
      description:
        "A name for this choice, reported as details.value by onOpenChange when it closes the alert. Give each Action one when there are two.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The look of the button. Follows the tone set on the content by default: destructive for danger, otherwise primary.",
      table: { defaultValue: { summary: '"primary"' } },
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
      description: "Runs before the alert closes. Call event.preventDefault() to keep it open, for example while a request runs.",
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
    children: "Delete",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Action>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content tone="danger">
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action {...args} />
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
