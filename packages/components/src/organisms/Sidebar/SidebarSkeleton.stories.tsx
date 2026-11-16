import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Skeleton's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Skeleton> = {
  title: "Components/Sidebar/Skeleton",
  id: "organisms-navigation-sidebar-skeleton",
  component: Sidebar.Skeleton,
  tags: ["!dev"],
  argTypes: {
    rows: {
      control: { type: "number", min: 0, max: 12 },
      description: "How many placeholder rows to draw. Each is the height of an item, with an icon and a line of text whose width varies from row to row.",
      table: { defaultValue: { summary: "5" } },
    },
    animated: {
      control: "boolean",
      description: "Whether the placeholder is pulsing. Turn it off for a dense screen with many loading regions; the reduced-motion preference turns it off anyway.",
      table: { defaultValue: { summary: "true" } },
    },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { rows: 5, animated: true },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Skeleton>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Nav>
        <Sidebar.Skeleton {...args} />
      </Sidebar.Nav>
    </Sidebar>
  ),
};
