import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "../Menu";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Sidebar.Account's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Account> = {
  title: "Components/Sidebar/Account",
  id: "organisms-navigation-sidebar-account",
  component: Sidebar.Account,
  tags: ["!dev"],
  argTypes: {
    name: {
      control: "text",
      description: "The account's or workspace's name, beside its avatar. In the rail it is hidden and is the button's tooltip and accessible name.",
    },
    description: { control: "text", description: "A quieter line under the name, such as an email address or a plan. Not shown in the rail." },
    avatar: {
      control: false,
      description: "What to draw in place of the avatar: a workspace logo, an icon. Left out, an Avatar made from name (and src).",
    },
    src: { control: "text", description: "The image for the default avatar. Left out, it shows the name's initials." },
    menuSide: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the button its menu opens toward. Left out, it opens above the button on the page and toward the page in the rail, which is right for a footer; give bottom for one in the header.",
    },
    children: {
      control: false,
      description: "The menu's items (Menu.Items, Menu.Separators…). Left out, the button opens nothing, so put your own action on it with onClick.",
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
  args: { name: "John Doe", description: "john@acme.com" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Account>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never">
      <Sidebar.Footer>
        <Sidebar.Account {...args}>
          <Menu.Item>Profile</Menu.Item>
          <Menu.Item>Sign out</Menu.Item>
        </Sidebar.Account>
      </Sidebar.Footer>
    </Sidebar>
  ),
};
