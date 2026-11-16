import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Footer> = {
  title: "Components/AlertDialog/Footer",
  id: "organisms-overlay-alertdialog-footer",
  component: AlertDialog.Footer,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The footer's buttons: a Cancel and an Action.",
    },
    align: {
      control: "select",
      options: ["start", "end", "between", "stretch"],
      description: "Where the buttons sit along the row from sm up. Below sm they stack full width, Action on top.",
      table: { defaultValue: { summary: '"end"' } },
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
    align: "end",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Footer>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer {...args}>
          <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
          <AlertDialog.Action>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
