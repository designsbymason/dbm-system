import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "./Stat";

// Docs-only (guidelines/adr/0013) — `Stat.Value`'s own props get their own
// Properties table on Stat.mdx, separate from the umbrella table. Rendered
// inside a real `Stat` so the sub-part is shown in its real context.
const meta: Meta<typeof Stat.Value> = {
  title: "Components/Stat/Value",
  id: "molecules-data-display-stat-value",
  component: Stat.Value,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The metric itself, already formatted however you want it shown (\"1,204\", \"$42.5K\", \"98%\") — write it however you like, this component doesn't reformat it. Usually followed by a Stat.Trend, which this renders beside it on the same line.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this value.",
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
    children: "12,480",
  },
};

export default meta;

type Story = StoryObj<typeof Stat.Value>;

export const Default: Story = {
  render: (args) => (
    <Stat>
      <Stat.Label>Active users</Stat.Label>
      <Stat.Value {...args} />
    </Stat>
  ),
};
