import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { preventNavigation } from "./SidebarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves Separator's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Separator> = {
  title: "Components/Sidebar/Separator",
  id: "organisms-navigation-sidebar-separator",
  component: Sidebar.Separator,
  tags: ["!dev"],
  argTypes: {
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {},
};

export default meta;

type Story = StoryObj<typeof Sidebar.Separator>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Nav>
        <Sidebar.Item href="#a" onClick={preventNavigation}>
          Home
        </Sidebar.Item>
        <Sidebar.Separator {...args} />
        <Sidebar.Item href="#b" onClick={preventNavigation}>
          Settings
        </Sidebar.Item>
      </Sidebar.Nav>
    </Sidebar>
  ),
};
