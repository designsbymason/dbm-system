import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.SkipLink> = {
  title: "Components/Navbar/SkipLink",
  id: "organisms-navigation-navbar-skiplink",
  component: Navbar.SkipLink,
  tags: ["!dev"],
  argTypes: {
    href: {
      control: "text",
      description: "The id of the page's main content, as a hash link. Give that element tabIndex -1 so focus lands in it.",
      table: { defaultValue: { summary: '"#main"' } },
    },
    children: { control: "text", description: 'The link\'s text. Defaults to labels.skipLink ("Skip to content").' },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { href: "#main" },
};

export default meta;

type Story = StoryObj<typeof Navbar.SkipLink>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.SkipLink {...args} />
      <Navbar.Brand href="#">dbM</Navbar.Brand>
    </Navbar>
  ),
};
