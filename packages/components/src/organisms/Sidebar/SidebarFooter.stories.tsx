import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Footer's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Footer> = {
  title: "Components/Sidebar/Footer",
  id: "organisms-navigation-sidebar-footer",
  component: Sidebar.Footer,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The bottom of the sidebar, which stays in view: an account menu, a help link. Read useSidebar().collapsed to draw a smaller version in the rail." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "John Doe" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Footer>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Footer {...args} />
    </Sidebar>
  ),
};
