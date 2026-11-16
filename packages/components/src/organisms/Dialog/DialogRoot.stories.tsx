import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";

// Docs-only (guidelines/adr/0013). This resolves the *root* component's own argTypes for the main Properties
// table: the Playground's meta also carries `Dialog.Content`'s props (one render drives both), so a table built
// from it would list `size`, `divided`… as root props and omit `open`.
const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog/Root",
  id: "organisms-overlay-dialog-root",
  component: Dialog,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Dialog.Trigger and Dialog.Content.",
    },
    open: {
      control: "boolean",
      description: "The controlled open state. Omit (along with defaultOpen) to let the dialog manage its own open state.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever it changes — a trigger click, Escape, a press on the scrim, a Dialog.Close, or the built-in close button. The second argument, { reason }, says which: \"trigger\", \"escape\", \"outside\", \"close-button\" or \"close\".",
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

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Content aria-label="Example dialog">Content</Dialog.Content>
    </Dialog>
  ),
};
