import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

// Docs-only (guidelines/adr/0013) — `EmptyState.Description`'s own props get their
// own Properties table on EmptyState.mdx, separate from the umbrella table.
// Rendered inside a real `EmptyState` so the sub-part is shown in its real context.
const meta: Meta<typeof EmptyState.Description> = {
  title: "Components/EmptyState/Description",
  id: "molecules-data-display-emptystate-description",
  component: EmptyState.Description,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The supporting text — why it's empty and, ideally, what to do about it. Kept to a comfortable line length however wide the empty state is.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this description.",
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
  args: {},
};

export default meta;

type Story = StoryObj<typeof EmptyState.Description>;

export const Default: Story = {
  render: (args) => (
    <EmptyState>
      <EmptyState.Title>No invoices yet</EmptyState.Title>
      <EmptyState.Description {...args}>Invoices you create will show up here.</EmptyState.Description>
    </EmptyState>
  ),
};
