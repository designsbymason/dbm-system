import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.List> = {
  title: "Organisms/Navigation/NavigationMenu/List",
  component: NavigationMenu.List,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The NavigationMenu.Items, in reading order." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
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

type Story = StoryObj<typeof NavigationMenu.List>;

export const Default: Story = {
  render: (args) => (
    <NavigationMenu aria-label="Primary">
      <NavigationMenu.List {...args}>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#pricing">Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  ),
};
