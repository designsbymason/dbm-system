import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.PanelActions> = {
  title: "Components/Navbar/PanelActions",
  id: "organisms-navigation-navbar-panelactions",
  component: Navbar.PanelActions,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "What to show at the foot of the menu panel, such as a full-width Sign in button. Drawn only in the panel, never in the bar. Put it among the bar's children or in a row (a fragment is fine; another component around it hides it from the bar).",
    },
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

type Story = StoryObj<typeof Navbar.PanelActions>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Links>
        <Navbar.Link href="#a">Products</Navbar.Link>
      </Navbar.Links>
      <Navbar.PanelActions {...args}>
        <Button>Sign in</Button>
      </Navbar.PanelActions>
    </Navbar>
  ),
};
