import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Trigger> = {
  title: "Organisms/Navigation/NavigationMenu/Trigger",
  component: NavigationMenu.Trigger,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The trigger's text." },
    icon: { control: false, description: "An icon (a component reference) drawn before the text." },
    current: {
      control: "boolean",
      description: "Marks the item whose panel holds the current page, in the menu's currentVariant. It sets no aria-current, since a button is not a page.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Stops the trigger opening its panel. A native disabled button, so it leaves the tab order.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": { control: "text", description: "Names the trigger when its text alone does not; it must contain the visible text as whole words, in order." },
    "aria-labelledby": { control: "text", description: "The id of an element that names the trigger." },
    "aria-describedby": { control: "text", description: "The id of an element that describes the trigger." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "Products", current: false, disabled: false },
};

export default meta;

type Story = StoryObj<typeof NavigationMenu.Trigger>;

export const Default: Story = {
  render: ({ children, ...args }) => (
    <NavigationMenu aria-label="Primary">
      <NavigationMenu.List>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger {...args}>{children}</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#analytics">Analytics</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  ),
};
