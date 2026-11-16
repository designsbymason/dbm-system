import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Group> = {
  title: "Components/Navbar/Group",
  id: "organisms-navigation-navbar-group",
  component: Navbar.Group,
  tags: ["!dev"],
  argTypes: {
    label: { control: "text", description: "The group's name, shown on its button." },
    children: {
      control: false,
      description:
        "The group's Navbar.Link items. In the bar they are the items of a floating menu; in the phone panel they are listed under the button.",
    },
    current: {
      control: "boolean",
      description:
        "Gives the button the current-page look (the bar's currentVariant), for a group that holds it. The caller decides. Also starts the group expanded in the phone panel, unless defaultOpen says otherwise.",
      table: { defaultValue: { summary: "false" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether the group starts expanded in the phone panel. No effect in the bar, where the group is a menu that opens on a press.",
      table: { defaultValue: { summary: "current" } },
    },
    disabled: {
      control: "boolean",
      description: "Makes the group's button inert, as a native disabled does: it leaves the tab order.",
      table: { defaultValue: { summary: "false" } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "How the floating menu lines up with its button in the bar. Logical, so start is the right edge in right-to-left text.",
      table: { defaultValue: { summary: '"start"' } },
    },
    "aria-label": { control: "text", description: "Names the button when label alone doesn't say it." },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes, on the group's button." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { label: "Resources", current: false, disabled: false, align: "start" },
};

export default meta;

type Story = StoryObj<typeof Navbar.Group>;

export const Default: Story = {
  render: (args) => (
    <Navbar collapseBelow="never" onClick={preventNavigation}>
      <Navbar.Links>
        <Navbar.Group {...args}>
          <Navbar.Link href="#blog">Blog</Navbar.Link>
          <Navbar.Link href="#guides">Guides</Navbar.Link>
        </Navbar.Group>
      </Navbar.Links>
    </Navbar>
  ),
};
