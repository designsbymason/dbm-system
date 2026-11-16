import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "./Stat";

// Docs-only (guidelines/adr/0013) — `Stat.Trend`'s own props get their own
// Properties table on Stat.mdx, separate from the umbrella table. Rendered
// inside a real `Stat`, beside a real `Stat.Value`, so the sub-part is shown
// in its real context.
const meta: Meta<typeof Stat.Trend> = {
  title: "Components/Stat/Trend",
  id: "molecules-data-display-stat-trend",
  component: Stat.Trend,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "number",
      description:
        "The signed change since whatever this is being compared to — positive for an increase, negative for a decrease, 0 for no change. The icon and the colour both follow its sign, not its formatted text, so a negative value always reads as a decrease even if formatNumber drops the sign.",
    },
    goodDirection: {
      control: "radio",
      options: ["increase", "decrease"],
      description:
        "Which direction of change counts as an improvement — coloured text.success/icon.success — and which counts as a regression, coloured text.danger/icon.danger. A change of exactly 0 is always neutral, regardless of this.",
      table: { defaultValue: { summary: "'increase'" } },
    },
    formatNumber: {
      control: false,
      description:
        "Formats value for display and for the accessible name. Given the plain signed number; write your own sign, unit, or locale numerals as needed.",
    },
    labels: {
      control: false,
      description:
        "The accessible name, built from the plain number and the same text formatNumber already wrote on screen.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this trend.",
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
    value: 4.2,
    goodDirection: "increase",
  },
};

export default meta;

type Story = StoryObj<typeof Stat.Trend>;

export const Default: Story = {
  render: (args) => (
    <Stat>
      <Stat.Label>Active users</Stat.Label>
      <Stat.Value>
        12,480
        <Stat.Trend {...args} />
      </Stat.Value>
    </Stat>
  ),
};
