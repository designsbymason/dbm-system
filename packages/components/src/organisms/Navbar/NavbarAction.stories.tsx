import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Action> = {
  title: "Components/Navbar/Action",
  id: "organisms-navigation-navbar-action",
  component: Navbar.Action,
  tags: ["!dev"],
  argTypes: {
    hideBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl"],
      description:
        "Hides this action in the bar below this width, a breakpoint step. Pair it with the same control in Navbar.PanelActions so a phone still has it in the menu panel.",
    },
    children: { control: false, description: "The action: a button, a search field, a menu." },
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

type Story = StoryObj<typeof Navbar.Action>;

export const Default: Story = {
  render: (args) => (
    <Navbar onClick={preventNavigation}>
      <Navbar.Actions>
        <Navbar.Action {...args}>
          <Button size="sm">Sign in</Button>
        </Navbar.Action>
      </Navbar.Actions>
    </Navbar>
  ),
};
