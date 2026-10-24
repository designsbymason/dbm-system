import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only (guidelines/adr/0013). This resolves the *root* component's own argTypes for the main Properties table:
// the Playground's meta also carries `ContextMenu.Content`'s props (one render drives both), so a table built from it would
// list `size`, `alignOffset`… as root props and omit `open`.
const meta: Meta<typeof ContextMenu> = {
  title: "Organisms/Overlay/ContextMenu/Root",
  component: ContextMenu,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "ContextMenu.Trigger and ContextMenu.Content.",
    },
    open: {
      control: "boolean",
      description:
        "The controlled open state. Omit (along with defaultOpen) to let the menu manage its own open state. It is for following and closing the menu from outside: a menu can only be opened at a point by a press on the trigger.",
    },
    defaultOpen: {
      control: "boolean",
      description:
        "The initial open state for uncontrolled usage — ignored once open is provided. For a story or a test: a menu that opens before any press has no position to open at, so it is drawn at the top-left corner of the page.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever it changes: a right-click, a long press, the context-menu key, Escape, a press outside, or an item chosen.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once the menu has finished opening and with false once it has finished closing, its focus is back where it was and it is out of the page. onOpenChange says a change started; this says it is over.",
    },
    modal: {
      control: "boolean",
      description:
        "Makes the rest of the page inert and locks its scroll while the menu is open, and has a press outside only close it, as a native menu does. Set false for a menu that leaves the page usable behind it.",
      table: { defaultValue: { summary: "true" } },
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

type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu {...args}>
      <ContextMenu.Trigger>Right-click me</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>Edit</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
