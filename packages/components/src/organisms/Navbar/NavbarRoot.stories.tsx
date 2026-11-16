import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "./Navbar";
import { preventNavigation } from "./NavbarStoryKit";

// Docs-only (guidelines/adr/0013). This resolves the root component's own argTypes for the main Properties table.
const meta: Meta<typeof Navbar> = {
  title: "Components/Navbar/Root",
  id: "organisms-navigation-navbar-root",
  component: Navbar,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "Either the parts directly (Navbar.SkipLink first if there is one, then Navbar.Brand, Navbar.Links, Navbar.Search, Navbar.Actions), drawn as one row, or one or more Navbar.Rows holding them; and optionally Navbar.PanelActions (drawn only in the menu panel's footer) and Navbar.MenuButton. The bar finds the links, the panel actions and the menu button among its children and in its rows, through fragments; one wrapped in another component still draws but isn't noticed.",
    },
    variant: {
      control: "select",
      options: ["outlined", "filled", "ghost", "frosted"],
      description: "How the bar itself is drawn: a surface with a line under it, the same surface with no line, nothing of its own, or a translucent blurred surface. The fill is the row's, so a different colour is a style on the Navbar.Row (or on the bar with ghost), not a prop.",
      table: { defaultValue: { summary: '"outlined"' } },
    },
    currentVariant: {
      control: "select",
      options: ["underline", "subtle", "solid"],
      description:
        "How the current page's link is marked: a brand line under it (a bar at the start edge in the phone panel), a tinted pill, or a brand fill. One look for the whole bar, not overridable per link; aria-current is set whichever it is.",
      table: { defaultValue: { summary: '"underline"' } },
    },
    rounded: {
      control: "boolean",
      description:
        "Fully rounded links: each link and group button is a pill, with the current link's tint or fill following the shape. The links round, not the bar.",
      table: { defaultValue: { summary: "false" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description:
        "The bar's height, and the default for its rows: as tall as an IconButton of the same step plus room above and below.",
      table: { defaultValue: { summary: '"md"' } },
    },
    linkSize: {
      control: "select",
      options: ["auto", "xs", "sm", "md", "lg", "xl"],
      mapping: { auto: undefined },
      description:
        "The text size, icon size and padding of the links, on Menu's five steps, apart from the bar's height. auto follows size (xs and sm read xs and sm, md reads sm, lg reads md), so nothing changes; a quiet set reads one step below it when one is set. A group's dropdown takes the same step for its items.",
    },
    contained: {
      control: "boolean",
      description: "Keeps the content to the page's reading width with Container, centred, instead of edge to edge.",
      table: { defaultValue: { summary: "false" } },
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl", "never"],
      description:
        "The width below which Navbar.Links leaves the bar and is offered in a menu behind a button. Decided by the stylesheet, so a server-rendered page is right at first paint.",
      table: { defaultValue: { summary: '"md"' } },
    },
    menuSide: {
      control: "select",
      options: ["start", "end", "top", "bottom"],
      description: "Which edge the menu panel slides in from. start and end are logical and swap in right-to-left.",
      table: { defaultValue: { summary: '"start"' } },
    },
    closeMenuOnNavigate: {
      control: "boolean",
      description: "Closes the menu panel when a link in it is chosen.",
      table: { defaultValue: { summary: "true" } },
    },
    menuOpen: {
      control: "boolean",
      description: "The controlled open state of the menu panel. Omit (with defaultMenuOpen) to let the bar manage it.",
    },
    defaultMenuOpen: {
      control: "boolean",
      description: "The initial open state of the menu panel for uncontrolled usage — ignored once menuOpen is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onMenuOpenChange: {
      control: false,
      description:
        "Called with the new open state of the menu panel, and { reason }: trigger, escape, outside, close-button or close (a link chosen).",
    },
    onMenuOpenChangeComplete: {
      control: false,
      description:
        "Called with true once the menu panel has finished opening and with false once it has finished closing and is out of the page. onMenuOpenChange says a change started; this says it is over.",
    },
    menuContainer: {
      control: false,
      description:
        "The element the bar's overlays are drawn into instead of the end of document.body: the menu panel with its scrim, and a group's floating menu. For a shadow root, or a frame.",
    },
    sticky: {
      control: "boolean",
      description: "Keeps the bar at the top of the page as it scrolls, with a surface behind it and a shadow while stuck.",
      table: { defaultValue: { summary: "false" } },
    },
    hideOnScroll: {
      control: "boolean",
      description:
        "Hides a sticky bar while the reader scrolls down, and brings it back on a scroll up or near the top. It stays shown while anything in it has keyboard focus. Needs sticky; without it a development warning says so.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description: "How far from the top a sticky bar sticks, from the spacing scale. No effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    scrollContainerRef: {
      control: false,
      description: "The scrollable container a sticky bar sticks within, if it isn't the page. No effect without sticky.",
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description: "The reading direction, passed to the bar and the menu panel. Not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: {
      control: false,
      description:
        "The text the bar supplies itself: menu (the button's name and the panel's title), navigation, close, skipLink (the skip link's text), externalLink (the cue read after an external link) and search (the name of Navbar.Search's field, button and sheet).",
    },
    "aria-label": {
      control: "text",
      description: "Names the banner landmark, for a page with more than one header.",
    },
    "aria-labelledby": {
      control: "text",
      description: "The id of a visible element that names the banner landmark, in place of aria-label.",
    },
    "aria-describedby": {
      control: "text",
      description: "The id of a description for the bar.",
    },
    id: { control: "text", description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes, on the <header> element." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: (args) => (
    <Navbar {...args} onClick={preventNavigation}>
      <Navbar.Brand href="#">dbM</Navbar.Brand>
    </Navbar>
  ),
};
