import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): resolves the sub-part's own argTypes for its Properties table on the
// AlertDialog Docs page.
const meta: Meta<typeof AlertDialog.Title> = {
  title: "Components/AlertDialog/Title",
  id: "organisms-overlay-alertdialog-title",
  component: AlertDialog.Title,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The question or statement, short enough to read at a glance. It names the alert.",
    },
    level: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description: "The heading level it is rendered as (h1–h6). It doesn't change the size.",
      table: { defaultValue: { summary: "2" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description: "The text size, from Heading's scale.",
      table: { defaultValue: { summary: '"xl"' } },
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
    children: "Delete project?", level: 2, size: "xl",
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog.Title>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog defaultOpen>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title {...args} />
          <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
        </AlertDialog.Header>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
