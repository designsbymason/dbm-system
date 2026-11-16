import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

// Docs-only (guidelines/adr/0013): the root component's own argTypes for the main Properties table, since the
// Playground's meta also carries `AlertDialog.Content`'s props.
const meta: Meta<typeof AlertDialog> = {
  title: "Components/AlertDialog/Root",
  id: "organisms-overlay-alertdialog-root",
  component: AlertDialog,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "AlertDialog.Trigger and AlertDialog.Content.",
    },
    open: {
      control: "boolean",
      description: "The controlled open state. Omit (along with defaultOpen) to let the alert manage its own open state.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever it changes. The second argument, { reason, value }, says what caused it: \"trigger\", \"escape\", \"action\" or \"cancel\", and the value of the Action or Cancel pressed, when it has one.",
    },
    onOpenChangeComplete: {
      control: false,
      description:
        "Called with true once it has finished opening (its entrance has finished) and with false once it has finished closing and is out of the page. onOpenChange says a change started; this says it is over, the place to reset a form or release something heavy.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof AlertDialog>;

export const Default: Story = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialog.Trigger>Open</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Sure?</AlertDialog.Title>
          <AlertDialog.Description>Really.</AlertDialog.Description>
        </AlertDialog.Header>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
