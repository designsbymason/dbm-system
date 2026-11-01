import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";

// Docs-only (guidelines/adr/0013). This resolves the *root* component's own argTypes for the main Properties table:
// the Playground's meta carries only the bar's own props, but the root, `Menubar.Menu` and `Menubar.Content` are
// separate components that each get their own table from their own hidden stories file.
const meta: Meta<typeof Menubar> = {
  title: "Organisms/Navigation/Menubar/Root",
  component: Menubar,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The menus: Menubar.Menu, each holding a Menubar.Trigger and a Menubar.Content.",
    },
    value: {
      control: false,
      description:
        "The value of the menu that is open, or an empty string when none is. Omit it (with defaultValue) to let the bar manage its own state. Set it to open a menu from code, for an app's own shortcut.",
    },
    defaultValue: {
      control: false,
      description:
        "The menu that is open to begin with, for uncontrolled usage. Ignored once value is provided.",
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: {
      control: false,
      description:
        "Called with the value of the menu that opened, or an empty string when the open one closed.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with a menu's value and true once it has finished opening, or false once it has finished closing, its focus is back and it is out of the page. onValueChange says a change started; this says it is over.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The height and type size of the triggers, and the row size of every menu the bar opens.",
      table: { defaultValue: { summary: '"md"' } },
    },
    surface: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description:
        "How the bar is drawn: ghost (no surface; the triggers sit on the page or on a header), outlined (a bordered bar) or filled (a tinted bar).",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand"],
      description:
        "The colour of the triggers' hover and open fills and of the bar's own border and fill: brand (the system's identity colour) or neutral. Every colour is a subtle one. It does not change the menus the bar opens.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    overflow: {
      control: "select",
      options: ["scroll", "menu"],
      description:
        "What the bar does when its menus do not fit its container: scroll (sideways, with a fade at each end that has more behind it) or menu (the menus that do not fit move into a More menu, each as a submenu). Each Menubar.Menu and Menubar.Action tells the bar what it is, so they can sit inside a component of your own. menu sizes the bar against its container, which has to be sized by the layout and not by the bar.",
      table: { defaultValue: { summary: '"scroll"' } },
    },
    hotkeys: {
      control: false,
      description:
        'Keys that open a menu from anywhere on the page: an object from a menu\'s value to a combination ("alt+f", "mod+shift+e"), where mod is ⌘ on an Apple platform and Ctrl elsewhere, or false to turn one off. Nothing is bound by default. A press that matches is kept from the browser and opens the menu with focus on its first item.',
    },
    controllerRef: {
      control: false,
      description:
        "Hands the bar's controls (open, close, value) to code outside it, such as a button or a key you handle yourself. Inside the bar, useMenubarController() returns the same object.",
    },
    labels: {
      control: false,
      description:
        "The text the bar supplies itself, each with an English default: more, the More menu's label. Pass any subset.",
    },
    sticky: {
      control: "boolean",
      description:
        "Keeps the bar at the top of the page (or of scrollContainerRef) as the reader scrolls, with a surface behind it and a shadow while it is stuck. Built on Affix.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: false,
      description:
        "How far from the top a sticky bar sticks, from the spacing token scale. Has no effect without sticky.",
      table: { defaultValue: { summary: "0" } },
    },
    scrollContainerRef: {
      control: false,
      description:
        "The scrollable container a sticky bar sticks within, if it isn't the page itself. Has no effect without sticky.",
    },
    loop: {
      control: "boolean",
      description:
        "Whether the arrow keys wrap from the last trigger to the first and back.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "The reading direction, passed to the bar and its menus: it decides which arrow key moves to the next trigger and which side a submenu opens on.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    "aria-label": {
      control: "text",
      description:
        'An accessible name for the bar ("Application menu"). A page with more than one menubar needs one on each.',
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the bar.",
    },
    id: {
      control: "text",
      description: "Standard DOM id.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    "aria-label": "Application menu",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar>;

export const Default: Story = {
  render: (args) => (
    <Menubar {...args}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
