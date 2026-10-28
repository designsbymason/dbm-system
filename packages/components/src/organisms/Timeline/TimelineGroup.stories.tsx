import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timeline } from "./Timeline";

// Docs-only (guidelines/adr/0013) — `Timeline.Group`'s own props get their own
// Properties table on Timeline.mdx. Rendered inside a real `Timeline`.
const meta: Meta<typeof Timeline.Group> = {
  title: "Organisms/Data Display/Timeline/Group",
  component: Timeline.Group,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The name of the run of events that follows it (Today, 12 March)." },
    level: {
      control: "select",
      options: [2, 3, 4, 5, 6],
      description: "The heading level it announces, so it fits the page's outline.",
      table: { defaultValue: { summary: "3" } },
    },
    id: { control: false, description: "Standard DOM id, on the list entry." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "Today", level: 3 },
};

export default meta;

type Story = StoryObj<typeof Timeline.Group>;

export const Default: Story = {
  render: (args) => (
    <Timeline aria-label="Activity">
      <Timeline.Group {...args} />
      <Timeline.Item title="Deployed" time="10:31" />
    </Timeline>
  ),
};
