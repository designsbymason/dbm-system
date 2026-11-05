import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

// Docs-only (guidelines/adr/0013). This resolves Root's own argTypes for its Properties table on the main Docs page.
// Controls with no live editing, listed so the table names every prop the sidebar takes.
const readOnly = (description: string) => ({ control: false as const, description });

const meta: Meta<typeof Sidebar> = {
  title: "Organisms/Navigation/Sidebar/Root",
  component: Sidebar,
  tags: ["!dev"],
  argTypes: {
    children: readOnly(
      "The sidebar's parts, in reading order: Sidebar.Header, Sidebar.Content holding one or more Sidebar.Navs, and Sidebar.Footer, any of them optional. The Playground draws a fixed one; see the stories below for other arrangements.",
    ),
    variant: {
      control: "select",
      options: ["outlined", "filled", "ghost"],
      description:
        "How the sidebar itself is drawn: a surface with a line along its inner edge, the same surface with no line, or nothing of its own so the items sit on the page.",
      table: { defaultValue: { summary: '"outlined"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description:
        "The height of an item and its icon and text size, on the same scale as Navbar's links. The collapsed rail is as wide as an item of this step plus the sidebar's padding.",
      table: { defaultValue: { summary: '"md"' } },
    },
    currentVariant: {
      control: "select",
      options: ["subtle", "bar", "solid"],
      description:
        "How the current item is marked: a tinted pill, a brand line along its start edge, or a brand fill. aria-current is set whichever it is, and the look is the same in the phone panel.",
      table: { defaultValue: { summary: '"subtle"' } },
    },
    currentPath: readOnly(
      "The path of the page the reader is on (from your router), so each item marks itself from its href with no current written on it, and a group that holds one is current too. The Playground's items are marked by hand, so see the story below.",
    ),
    rounded: {
      control: "boolean",
      description:
        "Fully rounded items: each item and group button is a pill, with the current item's tint or fill following the shape. The items round, not the sidebar.",
      table: { defaultValue: { summary: "false" } },
    },
    width: {
      control: "text",
      placeholder: "16rem",
      description:
        "The expanded width, a CSS length such as 18rem (a number in code is pixels). Empty leaves the sidebar.width token. The rail's width does not change with it.",
      table: { defaultValue: { summary: "the sidebar.width token" } },
    },
    panelWidth: {
      control: "text",
      placeholder: "20rem",
      description:
        "The width of the phone panel alone, below collapseBelow: a CSS length such as 20rem (a number in code is pixels). Empty leaves it the same as width. The panel is never wider than the window less a sliver of the page.",
      table: { defaultValue: { summary: "width" } },
    },
    side: {
      control: "radio",
      options: ["start", "end"],
      description:
        "Which edge of the page the sidebar sits against: it sets which edge its line is on and which side the phone panel slides in from. start is the right in right-to-left text.",
      table: { defaultValue: { summary: '"start"' } },
    },
    peek: {
      control: "boolean",
      description:
        "Lets a sidebar collapsed to a rail open as an overlay while the pointer is over it or focus is inside it, so the labels can be read without expanding it for good. The rail keeps its width in the page; the open sidebar is drawn over the content. A mouse only (focus works everywhere).",
      table: { defaultValue: { summary: "false" } },
    },
    collapsed: readOnly(
      "Whether the sidebar is a rail of icons (controlled). Pair with onCollapsedChange. The Playground lets the sidebar manage it (see defaultCollapsed).",
    ),
    defaultCollapsed: {
      control: "boolean",
      description: "Starts the sidebar as a rail. Only read when the sidebar mounts, so changing it redraws the sidebar.",
      table: { defaultValue: { summary: "false" } },
    },
    onCollapsedChange: readOnly("Called with the new value when the collapse button is pressed or setCollapsed is called."),
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which the sidebar leaves the page for a menu button and a panel. It follows the window's width, not the demo's frame: resize the window to see it.",
      table: { defaultValue: { summary: '"md"' } },
    },
    menuOpen: readOnly(
      "Whether the phone panel is open (controlled). Pair with onMenuOpenChange. The Playground lets the sidebar manage it (see defaultMenuOpen).",
    ),
    defaultMenuOpen: {
      control: "boolean",
      description: "Starts with the phone panel open. Only read when the sidebar mounts, so changing it redraws the sidebar.",
      table: { defaultValue: { summary: "false" } },
    },
    onMenuOpenChange: readOnly("Called when the phone panel opens or closes, with the new state and { reason }."),
    onMenuOpenChangeComplete: readOnly("Called with true once the phone panel has finished opening and with false once it has finished closing."),
    closeMenuOnNavigate: {
      control: "boolean",
      description: "Closes the phone panel when a link in it is chosen, including a router's link that prevents the browser's own navigation.",
      table: { defaultValue: { summary: "true" } },
    },
    exclusive: {
      control: "boolean",
      description: "Keeps one group open at a time among the groups that share a parent: opening one closes the others beside it.",
      table: { defaultValue: { summary: "false" } },
    },
    menuContainer: readOnly("The element the phone panel is drawn into instead of document.body. The Playground gives it its own frame."),
    sticky: {
      control: "boolean",
      description:
        "Keeps the sidebar in view while the page scrolls: it sticks to the top (below stickyOffset) and is as tall as the rest of the window. The Playground's frame doesn't scroll the page, so see the page-shell story.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      if: { arg: "sticky" },
      description: "How far from the top a sticky sidebar sticks, from the spacing scale: the height of a sticky Navbar above it. No effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the sidebar and the phone panel. Not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: readOnly("The text the sidebar supplies itself: navigation, collapse, expand, menu, close and externalLink."),
    id: { control: "text", description: "Standard DOM id. Empty leaves it out. Avoid it: the sidebar's children are drawn twice while the phone panel is open." },
    className: readOnly("Additional CSS classes, on the sidebar's root."),
    style: readOnly("Inline styles, merged onto the component's own internal styles."),
    "data-testid": readOnly(
      "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    ),
  },
  args: {},
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: (args) => (
    <Sidebar collapseBelow="never" {...args}>
      <Sidebar.Header>dbM</Sidebar.Header>
    </Sidebar>
  ),
};
