import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationMenu } from "./NavigationMenu";

// Docs-only: this file exists so the Docs page can show this part's own Properties table (guidelines/adr/0013).
const meta: Meta<typeof NavigationMenu.Link> = {
  title: "Organisms/Navigation/NavigationMenu/Link",
  component: NavigationMenu.Link,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The link's text, or (with asChild) the element that is the link." },
    href: { control: "text", description: "Where the link goes." },
    icon: { control: false, description: "An icon (a component reference) drawn before the text." },
    description: { control: "text", description: "A second line under the text, in a panel: what the link leads to. It is part of the link's name." },
    badge: { control: "text", description: "A mark after the text (a count, a \"New\"), part of the link's name." },
    external: {
      control: "boolean",
      description: "Opens the link in a new tab with an external mark. Worked out from href when left out: a full http(s):// URL is external.",
    },
    current: {
      control: "boolean",
      description: "Marks the page the reader is on (aria-current=\"page\"), drawn in the menu's currentVariant when the link is a top-level item.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Blocks the click and marks the link aria-disabled, keeping it in the tab order as Link does.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: false,
      description: "Draws the look on the child element (a router's link) instead of an <a>.",
      table: { defaultValue: { summary: "false" } },
    },
    onSelect: { control: false, description: "Called when the link is chosen (a click, or Enter). Call event.preventDefault() to keep the panel open." },
    "aria-label": { control: "text", description: "Names the link when its text alone does not; it must contain the visible text as whole words, in order." },
    "aria-labelledby": { control: "text", description: "The id of an element that names the link." },
    "aria-describedby": { control: "text", description: "The id of an element that describes the link." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "Pricing", href: "#pricing", current: false, disabled: false },
};

export default meta;

type Story = StoryObj<typeof NavigationMenu.Link>;

export const Default: Story = {
  render: ({ children, ...args }) => (
    <NavigationMenu aria-label="Primary">
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link {...args}>{children}</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu>
  ),
};
