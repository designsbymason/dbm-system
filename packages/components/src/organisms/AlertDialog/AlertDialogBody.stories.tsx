import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Body> = {
  title: "Components/AlertDialog/Body",
  id: "organisms-overlay-alertdialog-body",
  component: AlertDialog.Body,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "Content between the header and the footer: a list of what is affected, say. It scrolls on its own.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction of the scroll region, which decides the side the scrollbar sits on.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    "aria-label": {
      control: "text",
      description: "Accessible name for the scroll region, read when keyboard focus lands on a body that scrolls.",
    },
    "aria-labelledby": {
      control: "text",
      description: "Points to the id of an existing element that names the scroll region.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization, on the scroll region's outer frame.",
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
    children: "report.pdf, summary.docx and notes.txt",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Body>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Delete 3 files?</AlertDialog.Title>
          <AlertDialog.Description>They will be removed.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Body {...args} />
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
