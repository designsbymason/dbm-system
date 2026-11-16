import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Navbar } from "./Navbar";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Actions> = {
  title: "Components/Navbar/Actions",
  id: "organisms-navigation-navbar-actions",
  component: Navbar.Actions,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "What sits at the bar's end: a search field, icon buttons, a Menu for the account, a call to action." },
    column: {
      control: "select",
      options: ["start", "center", "end"],
      description: "The column this part sits in when its row is drawn in columns, in place of the one it belongs in by default. Ignored otherwise.",
      table: { defaultValue: { summary: '"end"' } },
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

type Story = StoryObj<typeof Navbar.Actions>;

export const Default: Story = {
  render: (args) => (
    <Navbar>
      <Navbar.Actions {...args}>
        <Button size="sm">Sign in</Button>
      </Navbar.Actions>
    </Navbar>
  ),
};
