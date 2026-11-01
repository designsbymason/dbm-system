import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";
import { MenuStage } from "./NavigationMenuStoryKit";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Content> = {
  title: "Organisms/Navigation/NavigationMenu/Content",
  component: NavigationMenu.Content,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The panel's content: NavigationMenu.Groups, NavigationMenu.Links and anything else (a featured block)." },
    layout: {
      control: "radio",
      options: ["stack", "columns"],
      description: "How the children are laid out: stacked one under another, or side by side in columns that wrap. Not read in the stacked form.",
      table: { defaultValue: { summary: '"stack"' } },
    },
    forceMount: {
      control: false,
      description: "Keeps the panel mounted while it is closed, for an animation of your own or to keep its state.",
      table: { defaultValue: { summary: "false" } },
    },
    onEscapeKeyDown: { control: false, description: "Called when Escape is pressed in the open panel. Call event.preventDefault() to keep it open." },
    onPointerDownOutside: { control: false, description: "Called when a pointer goes down outside the open panel. Call event.preventDefault() to keep it open." },
    onFocusOutside: { control: false, description: "Called when focus moves outside the open panel. Call event.preventDefault() to keep it open." },
    onInteractOutside: { control: false, description: "Called on a pointer or focus interaction outside the open panel. Call event.preventDefault() to keep it open." },
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

type Story = StoryObj<typeof NavigationMenu.Content>;

export const Default: Story = {
  render: (args) => (
    <MenuStage>
      <NavigationMenu aria-label="Primary">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content {...args}>
              <NavigationMenu.Link href="#analytics">Analytics</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    </MenuStage>
  ),
};
