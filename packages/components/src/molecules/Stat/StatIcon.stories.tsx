import { UsersIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat } from "./Stat";

// Docs-only (guidelines/adr/0013) — `Stat.Icon`'s own props get their own
// Properties table on Stat.mdx, separate from the umbrella table. Rendered
// inside a real `Stat` so the sub-part is shown in its real context.
const meta: Meta<typeof Stat.Icon> = {
  title: "Components/Stat/Icon",
  id: "molecules-data-display-stat-icon",
  component: Stat.Icon,
  tags: ["!dev"],
  argTypes: {
    icon: {
      control: false,
      description:
        "The Phosphor icon component to show — a component reference, not a string name, so unused icons stay tree-shaken and references are type-checked.",
    },
    label: {
      control: "text",
      description:
        "A text alternative for the icon. Unset by default, which hides the icon from assistive technology — right when Stat.Label already says what the icon shows. Set it only when the icon conveys something the label doesn't.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this icon.",
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
    label: "",
  },
};

export default meta;

type Story = StoryObj<typeof Stat.Icon>;

export const Default: Story = {
  render: (args) => (
    <Stat>
      <Stat.Icon {...args} icon={UsersIcon} label={args.label || undefined} />
      <Stat.Label>Active users</Stat.Label>
      <Stat.Value>12,480</Stat.Value>
    </Stat>
  ),
};
