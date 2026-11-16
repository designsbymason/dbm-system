import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { preventNavigation } from "./SidebarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves Nav's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Nav> = {
  title: "Components/Sidebar/Nav",
  id: "organisms-navigation-sidebar-nav",
  component: Sidebar.Nav,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "A list of Sidebar.Items, Sidebar.Groups, Sidebar.Sections and Sidebar.Separators." },
    "aria-label": { control: "text", description: "The navigation's accessible name; defaults to labels.navigation (Main). Give each Sidebar.Nav its own, so they are told apart." },
    "aria-labelledby": { control: false, description: "Names the navigation from an element on the page instead of a string." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { "aria-label": "Main" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Nav>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Nav {...args}>
        <Sidebar.Item href="#a" onClick={preventNavigation}>
          Home
        </Sidebar.Item>
      </Sidebar.Nav>
    </Sidebar>
  ),
};
