import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Header's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Header> = {
  title: "Organisms/Navigation/Sidebar/Header",
  component: Sidebar.Header,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The top of the sidebar: a brand, a workspace switcher. Read useSidebar().collapsed to draw a smaller version in the rail." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "dbM" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Header>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Header {...args} />
    </Sidebar>
  ),
};
