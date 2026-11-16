import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

// Docs-only (guidelines/adr/0013) — `EmptyState.Media`'s own props get their own
// Properties table on EmptyState.mdx, separate from the umbrella table. Rendered
// inside a real `EmptyState` so the sub-part is shown in its real context.
const meta: Meta<typeof EmptyState.Media> = {
  title: "Components/EmptyState/Media",
  id: "molecules-data-display-emptystate-media",
  component: EmptyState.Media,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The illustration — an img, picture, video, or inline svg. It is never wider than the empty state or than the largest size for the empty state's size (6rem at xs up to 15rem at xl): a larger image is scaled down, keeping its proportions, and a smaller one keeps its own size. Give a purely decorative illustration empty alt text, since the title already says what is empty.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this media.",
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

type Story = StoryObj<typeof EmptyState.Media>;

export const Default: Story = {
  render: (args) => (
    <EmptyState>
      <EmptyState.Media {...args}>
        <svg width="160" height="120" viewBox="0 0 160 120" aria-hidden="true">
          <rect x="20" y="30" width="120" height="76" rx="12" fill="var(--dbm-bg-neutral-subtle)" stroke="var(--dbm-border-neutral)" strokeWidth="2" />
        </svg>
      </EmptyState.Media>
      <EmptyState.Title>No invoices yet</EmptyState.Title>
    </EmptyState>
  ),
};
