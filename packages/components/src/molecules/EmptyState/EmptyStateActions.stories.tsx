import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { EmptyState } from "./EmptyState";

// Docs-only (guidelines/adr/0013) — `EmptyState.Actions`'s own props get their own
// Properties table on EmptyState.mdx, separate from the umbrella table. Rendered
// inside a real `EmptyState` so the sub-part is shown in its real context.
const meta: Meta<typeof EmptyState.Actions> = {
  title: "Components/EmptyState/Actions",
  id: "molecules-data-display-emptystate-actions",
  component: EmptyState.Actions,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The next step — usually one primary Button (the way out of the empty state), optionally with a secondary one or a Link. Laid out in a row that wraps on a narrow screen.",
    },
    stackOnMobile: {
      control: "boolean",
      description:
        "Below the sm breakpoint (a phone), stacks the actions in a column with each one the full width of the empty state — bigger touch targets, and the primary action first. From sm up they sit in a row as usual. The breakpoint is a viewport width, as everywhere else in the system.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at these actions.",
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
    stackOnMobile: false,
  },
};

export default meta;

type Story = StoryObj<typeof EmptyState.Actions>;

export const Default: Story = {
  render: (args) => (
    <EmptyState>
      <EmptyState.Title>No invoices yet</EmptyState.Title>
      <EmptyState.Actions {...args}>
        <Button size="sm">Create invoice</Button>
        <Button size="sm" variant="tertiary">
          Import
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  ),
};
