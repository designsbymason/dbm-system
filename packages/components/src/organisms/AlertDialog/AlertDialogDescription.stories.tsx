import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Description> = {
  title: "Components/AlertDialog/Description",
  id: "organisms-overlay-alertdialog-description",
  component: AlertDialog.Description,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "What the choice will do, and what can't be undone. Read out after the title when the alert opens.",
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
    children: "This removes it for good.",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Description>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description {...args} />
        </AlertDialog.Header>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
