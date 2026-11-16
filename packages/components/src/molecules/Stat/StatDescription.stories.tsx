import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "./Stat";

// Docs-only (guidelines/adr/0013) — `Stat.Description`'s own props get their own
// Properties table on Stat.mdx, separate from the umbrella table. Rendered
// inside a real `Stat` so the sub-part is shown in its real context.
const meta: Meta<typeof Stat.Description> = {
  title: "Components/Stat/Description",
  id: "molecules-data-display-stat-description",
  component: Stat.Description,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The supporting text — what the metric is being compared to, or any other context (\"vs. last month\", \"as of today\").",
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
  args: {
    children: "vs. last month",
  },
};

export default meta;

type Story = StoryObj<typeof Stat.Description>;

export const Default: Story = {
  render: (args) => (
    <Stat>
      <Stat.Label>Active users</Stat.Label>
      <Stat.Value>12,480</Stat.Value>
      <Stat.Description {...args} />
    </Stat>
  ),
};
