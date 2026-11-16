import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

// Docs-only (guidelines/adr/0013) — `EmptyState.Title`'s own props get their own
// Properties table on EmptyState.mdx, separate from the umbrella table. Rendered
// inside a real `EmptyState` so the sub-part is shown in its real context.
const meta: Meta<typeof EmptyState.Title> = {
  title: "Components/EmptyState/Title",
  id: "molecules-data-display-emptystate-title",
  component: EmptyState.Title,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The title — a short statement of what is empty, or of what happened (\"No results found\", \"You're all caught up\").",
    },
    level: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description:
        "The heading level, 1–6, rendered as the matching h1–h6. Match it to where the empty state sits in the page's outline — one level below the heading of the section it's in.",
      table: { defaultValue: { summary: "3" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this title (e.g. to name the empty state).",
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
    level: 3,
  },
};

export default meta;

type Story = StoryObj<typeof EmptyState.Title>;

export const Default: Story = {
  render: (args) => (
    <EmptyState>
      <EmptyState.Title {...args}>No invoices yet</EmptyState.Title>
    </EmptyState>
  ),
};
