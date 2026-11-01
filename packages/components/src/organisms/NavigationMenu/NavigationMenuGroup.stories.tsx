import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";
import { MenuStage } from "./NavigationMenuStoryKit";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Group> = {
  title: "Organisms/Navigation/NavigationMenu/Group",
  component: NavigationMenu.Group,
  tags: ["!dev"],
  argTypes: {
    label: { control: "text", description: "The group's heading: it names the list of links beneath it." },
    href: { control: "text", description: "Makes the heading a link to the group's own page, which closes the panel as any link does." },
    children: { control: false, description: "The NavigationMenu.Links of the group." },
    columns: {
      control: "radio",
      options: [1, 2, 3],
      description: "How many columns the group's links run in, from the width the panel gives it.",
      table: { defaultValue: { summary: "1" } },
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
  args: { label: "Platform", columns: 1 },
};

export default meta;

type Story = StoryObj<typeof NavigationMenu.Group>;

export const Default: Story = {
  render: (args) => (
    <MenuStage height="14rem">
      <NavigationMenu aria-label="Primary" presentation="stacked" defaultValue="products">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Group {...args}>
                <NavigationMenu.Link href="#analytics">Analytics</NavigationMenu.Link>
                <NavigationMenu.Link href="#automation">Automation</NavigationMenu.Link>
              </NavigationMenu.Group>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </MenuStage>
  ),
};
