import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timeline } from "./Timeline";

// Docs-only (guidelines/adr/0013) — `Timeline.End`'s own props get their own
// Properties table on Timeline.mdx. Rendered inside a real `Timeline`.
const meta: Meta<typeof Timeline.End> = {
  title: "Organisms/Data Display/Timeline/End",
  component: Timeline.End,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "What the end says (Order closed). Optional: a bar across the line alone also marks the end." },
    icon: { control: false, description: "An icon to draw in a disc in place of the bar: a component reference, not a string name." },
    tone: {
      control: "select",
      options: [undefined, "neutral", "brand", "info", "success", "warning", "danger", "highlight"],
      description: "The colour of the end's marker, in place of the timeline's tone.",
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
  args: { children: "Order closed" },
};

export default meta;

type Story = StoryObj<typeof Timeline.End>;

export const Default: Story = {
  render: (args) => (
    <Timeline aria-label="Order history">
      <Timeline.Item title="Delivered" time="14 Mar" />
      <Timeline.End {...args} />
    </Timeline>
  ),
};
