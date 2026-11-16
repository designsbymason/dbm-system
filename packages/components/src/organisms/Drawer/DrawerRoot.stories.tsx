import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";

// Docs-only (guidelines/adr/0013). This resolves the *root* component's own argTypes for the main Properties
// table: the Playground's meta also carries `Drawer.Content`'s props (one render drives both), so a table built
// from it would list `size`, `divided`… as root props and omit `open`.
const meta: Meta<typeof Drawer> = {
  title: "Components/Drawer/Root",
  id: "organisms-overlay-drawer-root",
  component: Drawer,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Drawer.Trigger and Drawer.Content.",
    },
    open: {
      control: "boolean",
      description: "The controlled open state. Omit (along with defaultOpen) to let the drawer manage its own open state.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever it changes — a trigger click, Escape, a press on the scrim, a Drawer.Close, or the built-in close button. The second argument, { reason }, says which: \"trigger\", \"escape\", \"outside\", \"close-button\" or \"close\".",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once it has finished opening (its entrance has finished) and with false once it has finished closing and is out of the page. onOpenChange says a change started; this says it is over, the place to reset a form or release something heavy.",
    },
    modal: {
      control: "boolean",
      description:
        "Dims the page behind a scrim, locks its scroll, traps focus and makes the rest of the page inert. Turn off for a docked panel that coexists with the page.",
      table: { defaultValue: { summary: "true" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>Open</Drawer.Trigger>
      <Drawer.Content aria-label="Example drawer">Content</Drawer.Content>
    </Drawer>
  ),
};
