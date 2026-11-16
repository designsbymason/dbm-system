import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only — see DialogRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Dialog.Title> = {
  title: "Components/Dialog/Title",
  id: "organisms-overlay-dialog-title",
  component: Dialog.Title,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The title text. It names the dialog for assistive technology, so every dialog should have one.",
    },
    level: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description: "The heading level it is rendered as (h1–h6). Pick the level that fits the page's outline; it doesn't change the size.",
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
    children: "Edit profile", level: 2, size: "xl",
  },
};

export default meta;

type Story = StoryObj<typeof Dialog.Title>;

export const Default: Story = {
  render: (args) => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Example dialog">
        <Dialog.Header>
          <Dialog.Title {...args} />
        </Dialog.Header>
      </Dialog.Content>
    </Dialog>
  ),
};
