import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Header> = {
  title: "Components/AlertDialog/Header",
  id: "organisms-overlay-alertdialog-header",
  component: AlertDialog.Header,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The header's content: a Title and a Description. The tone's icon is drawn beside it.",
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
    
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Header>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content tone="warning">
        <AlertDialog.Header {...args}>
          <AlertDialog.Title>Discard changes?</AlertDialog.Title>
          <AlertDialog.Description>These edits will be lost.</AlertDialog.Description>
        </AlertDialog.Header>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
