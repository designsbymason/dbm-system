import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only — see NavbarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Navbar.Link> = {
  title: "Organisms/Navigation/Navbar/Link",
  component: Navbar.Link,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The link's text. With asChild, the child's own content instead, and icon, badge and the external mark are drawn inside the child, around it.",
    },
    href: { control: "text", description: "Where the link goes. With asChild, put it on the child instead." },
    icon: {
      control: false,
      description: "An icon before the text, a component reference. It follows the text's colour, so it tracks hover and the current look.",
    },
    badge: {
      control: "text",
      description:
        "What to show after the text, such as a count or a dot. It is part of the link's name, so a count is read with it; give a bare dot its own visually hidden text.",
    },
    external: {
      control: "boolean",
      description:
        "Marks the link as leading off the site: a new tab with rel noopener noreferrer, a trailing icon and a hidden cue. Worked out from href when left out (http(s):// or //).",
      table: { defaultValue: { summary: "from href" } },
    },
    current: {
      control: "boolean",
      description: "Marks the link as the page the reader is on: aria-current=\"page\" and the bar's currentVariant look (an underline unless set). The caller decides which one it is.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Makes the link inert: aria-disabled plus a blocked click. It stays in the tab order, as Link does.",
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      control: "boolean",
      description:
        "Renders as a single provided child element (Radix Slot) instead of the built-in <a>, to use a router's link. The icon, the badge and an external link's icon and cue are drawn inside that element.",
      table: { defaultValue: { summary: "false" } },
    },
    "aria-label": { control: "text", description: "Names the link when its content is only an icon." },
    id: { control: "text", description: "Standard DOM id. Avoid it inside Navbar.Links, whose items can be on the page twice." },
    className: { control: false, description: "Additional CSS classes, on the link element." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: { children: "Products", href: "#products", current: false, disabled: false },
};

export default meta;

type Story = StoryObj<typeof Navbar.Link>;

export const Default: Story = {
  render: (args) => (
    <Navbar collapseBelow="never" onClick={preventNavigation}>
      <Navbar.Links>
        <Navbar.Link {...args} />
      </Navbar.Links>
    </Navbar>
  ),
};
