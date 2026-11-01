import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";
import { MenuStage } from "./NavigationMenuStoryKit";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Footer> = {
  title: "Organisms/Navigation/NavigationMenu/Footer",
  component: NavigationMenu.Footer,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "What the footer holds: links (\"View all\"), a help line." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationMenu.Footer>;

export const Default: Story = {
  render: (args) => (
    <MenuStage height="14rem">
      <NavigationMenu aria-label="Primary" presentation="stacked" defaultValue="products">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="/analytics">Analytics</NavigationMenu.Link>
              <NavigationMenu.Footer {...args}>
                <NavigationMenu.Link href="/all">View all</NavigationMenu.Link>
              </NavigationMenu.Footer>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </MenuStage>
  ),
};
