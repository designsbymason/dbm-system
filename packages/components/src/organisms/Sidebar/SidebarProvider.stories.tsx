import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Provider's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.Provider> = {
  title: "Components/Sidebar/Provider",
  id: "organisms-navigation-sidebar-provider",
  component: Sidebar.Provider,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The page shell: a Sidebar, and any Sidebar.MenuButton or Sidebar.Toggle that sits outside it (in a Navbar).",
    },
    collapsed: { control: false, description: "Whether the sidebar is a rail of icons (controlled). Pair with onCollapsedChange." },
    defaultCollapsed: {
      control: "boolean",
      description: "Whether the sidebar starts as a rail (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onCollapsedChange: { control: false, description: "Called with the new value when the collapse button is pressed or setCollapsed is called." },
    menuOpen: { control: false, description: "Whether the phone panel is open (controlled). Pair with onMenuOpenChange." },
    defaultMenuOpen: {
      control: "boolean",
      description: "Whether the phone panel starts open (uncontrolled).",
      table: { defaultValue: { summary: "false" } },
    },
    onMenuOpenChange: { control: false, description: "Called when the phone panel opens or closes, with the new state and { reason }." },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the sidebar leaves the page for a menu button and a panel. It also decides where a Sidebar.MenuButton and a Sidebar.Toggle show, so they agree with the sidebar.",
      table: { defaultValue: { summary: '"md"' } },
    },
    labels: { control: false, description: "The text the sidebar supplies itself, such as the collapse button's name. Merged over the English defaults." },
  },
  args: { collapseBelow: "md", defaultCollapsed: false, defaultMenuOpen: false },
};

export default meta;

type Story = StoryObj<typeof Sidebar.Provider>;

export const Default: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar.MenuButton />
      <Sidebar collapseBelow="never">
        <Sidebar.Header>dbM</Sidebar.Header>
      </Sidebar>
    </Sidebar.Provider>
  ),
};
