import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.MenuButton> = {
  title: "Components/Navbar/MenuButton",
  id: "organisms-navigation-navbar-menubutton",
  component: Navbar.MenuButton,
  tags: ["!dev"],
  argTypes: {
    icon: { control: false, description: "The icon, a component reference. Defaults to a three-line menu icon." },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's look, in place of the quiet one it has by default: any IconButton variant, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description: "The button's colour family: brand or neutral, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size, in place of its row's: the same scale as IconButton.",
    },
    column: {
      control: "select",
      options: ["start", "center", "end"],
      description: "The column this part sits in when its row is drawn in columns, in place of the one it belongs in by default. Ignored otherwise.",
      table: { defaultValue: { summary: '"start"' } },
    },
    "aria-label": { control: "text", description: "The button's accessible name. Defaults to labels.menu (\"Menu\")." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Navbar.MenuButton>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Links>
        <Navbar.Link href="#a">Products</Navbar.Link>
      </Navbar.Links>
      <Navbar.MenuButton {...args} />
    </Navbar>
  ),
};
