import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";
import { MenuStage } from "./NavigationMenuStoryKit";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Feature> = {
  title: "Organisms/Navigation/NavigationMenu/Feature",
  component: NavigationMenu.Feature,
  tags: ["!dev"],
  argTypes: {
    media: { control: false, description: "A picture or other media drawn above the text: an <img>, an Image. It sets its own height." },
    title: { control: "text", description: "The block's heading." },
    children: { control: "text", description: "The block's text." },
    href: { control: "text", description: "Makes the whole block a link to this address, which closes the panel as any link does. Without it the block is plain content." },
    onSelect: { control: false, description: "Called when the block is chosen, when it is a link. Call event.preventDefault() to keep the panel open." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { title: "Launch week", children: "Everything we shipped this quarter.", href: "/launch" },
};

export default meta;

type Story = StoryObj<typeof NavigationMenu.Feature>;

export const Default: Story = {
  render: (args) => (
    <MenuStage height="16rem">
      <NavigationMenu aria-label="Primary" presentation="stacked" defaultValue="products">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Feature {...args} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </MenuStage>
  ),
};
