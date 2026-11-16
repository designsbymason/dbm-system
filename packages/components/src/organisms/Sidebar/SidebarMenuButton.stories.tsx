import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves MenuButton's own argTypes for its Properties table on the main Docs page.
const meta: Meta<typeof Sidebar.MenuButton> = {
  title: "Components/Sidebar/MenuButton",
  id: "organisms-navigation-sidebar-menubutton",
  component: Sidebar.MenuButton,
  tags: ["!dev"],
  argTypes: {
    icon: { control: false, description: "The icon, a component reference. Defaults to a menu (list) icon." },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's look: any IconButton variant, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description: "The button's colour family: brand or neutral.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size, on the same scale as IconButton. Defaults to the sidebar's own size.",
    },
    "aria-label": { control: "text", description: "The button's accessible name. Defaults to labels.menu (Menu)." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { variant: "ghost" },
};

export default meta;

type Story = StoryObj<typeof Sidebar.MenuButton>;

export const Default: Story = {
  render: (args) => (
    <Sidebar.Provider>
      <Sidebar.MenuButton {...args} />
      <Sidebar collapseBelow="md">
        <Sidebar.Header>dbM</Sidebar.Header>
      </Sidebar>
    </Sidebar.Provider>
  ),
};
