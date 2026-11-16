import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Brand> = {
  title: "Components/Navbar/Brand",
  id: "organisms-navigation-navbar-brand",
  component: Navbar.Brand,
  tags: ["!dev"],
  argTypes: {
    children: { control: "text", description: "The brand: a logo and a name. A logo that is an image needs its own alt." },
    href: {
      control: "text",
      description: "Where the brand links to, usually home. With an href the brand is an <a>; without one (and without asChild) a plain <div>.",
    },
    asChild: {
      control: "boolean",
      description: "Renders as a single provided child element (Radix Slot) instead of the built-in <a>/<div>, to use a router's link.",
      table: { defaultValue: { summary: "false" } },
    },
    column: {
      control: "select",
      options: ["start", "center", "end"],
      description: "The column this part sits in when its row is drawn in columns, in place of the one it belongs in by default. Ignored otherwise.",
      table: { defaultValue: { summary: '"center"' } },
    },
    "aria-label": { control: "text", description: "Names the brand for assistive tech when its content is only a logo." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { href: "#", children: "dbM" },
};

export default meta;

type Story = StoryObj<typeof Navbar.Brand>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Brand {...args} />
    </Navbar>
  ),
};
