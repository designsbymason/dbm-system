import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only (guidelines/adr/0013). This resolves the *root* component's own argTypes for the main Properties table:
// the Playground's meta also carries `Menu.Content`'s props (one render drives both), so a table built from it would
// list `size`, `side`… as root props and omit `open`.
const meta: Meta<typeof Menu> = {
  title: "Organisms/Navigation/Menu/Root",
  component: Menu,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Menu.Trigger and Menu.Content.",
    },
    open: {
      control: "boolean",
      description: "The controlled open state. Omit (along with defaultOpen) to let the menu manage its own open state.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever it changes: a trigger press, Escape, a press outside, or an item chosen.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once the menu has finished opening and with false once it has finished closing, its focus is back on the trigger and it is out of the page. onOpenChange says a change started; this says it is over.",
    },
    modal: {
      control: "boolean",
      description:
        "Makes the rest of the page inert and locks its scroll while the menu is open, and has a press outside only close it, as a native menu does. Set false for a menu that leaves the page usable behind it.",
      table: { defaultValue: { summary: "true" } },
    },
    presentation: {
      control: "inline-radio",
      options: ["menu", "sheet"],
      description:
        "How the menu is drawn, a single value or a mobile-first map keyed by breakpoint ({ base: 'sheet', md: 'menu' } for a sheet on a phone and a floating menu from md up). A sheet is anchored to the bottom edge across the full width with taller rows and a scrim behind it; side, align and sideOffset don't apply to it. A submenu covers the menu it opened from, under a Back row.",
      table: { defaultValue: { summary: '"menu"' } },
    },
    labels: {
      control: false,
      description:
        "The text the menu supplies itself, each with an English default: back, the row at the top of a submenu in a sheet. Pass any subset.",
    },
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction, passed to the menu and its submenus: it decides which side a submenu opens on and which arrow key opens and closes it. Defaulted, not read from the page.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: (args) => (
    <Menu {...args}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Edit</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};
