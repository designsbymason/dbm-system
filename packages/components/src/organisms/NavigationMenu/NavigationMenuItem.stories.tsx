import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Item> = {
  title: "Organisms/Navigation/NavigationMenu/Item",
  component: NavigationMenu.Item,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description: "What identifies the item for the menu's value. Left out, one is generated, which is fine unless you control the open item.",
    },
    children: { control: false, description: "A NavigationMenu.Trigger with its NavigationMenu.Content, or a NavigationMenu.Link." },
    defaultOpen: {
      control: "boolean",
      description: "Starts the item expanded in the stacked form. Left out, an item starts expanded when a link in its panel is the current page; false keeps it closed. Ignored once any item has been pressed, and when value is controlled.",
    },
    panelAlign: {
      control: "select",
      options: ["start", "center", "end", "auto"],
      description: "Where this item's panel sits when panels hang from their own items (viewport false), in place of the menu's panelAlign.",
    },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { value: "products" },
};

export default meta;

type Story = StoryObj<typeof NavigationMenu.Item>;

export const Default: Story = {
  render: (args) => (
    <NavigationMenu aria-label="Primary">
      <NavigationMenu.List>
        <NavigationMenu.Item {...args}>
          <NavigationMenu.Link href="#pricing">Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  ),
};
