import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

// Docs-only — see PopoverTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013). This one resolves the *root* component's
// own argTypes for the main Properties table: the Playground's meta also
// carries `Popover.Content`'s props (one render drives both), so a table
// built from it listed `side`, `align`… as root props and omitted `open`.
const meta: Meta<typeof Popover> = {
  title: "Components/Popover/Root",
  id: "molecules-overlay-popover-root",
  component: Popover,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Popover.Trigger and Popover.Content.",
    },
    open: {
      control: "boolean",
      description:
        "The controlled open state. Omit (along with defaultOpen) to manage open state uncontrolled internally.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever it changes — a trigger click, an outside click/Escape dismissing it, or a controlled open update confirming the value took effect.",
    },
    modal: {
      control: "boolean",
      description:
        "Traps focus inside the content and blocks interaction with the rest of the page while open. Doesn't block dismissal — outside click/Escape still close it either way, unlike Dialog's own modal (Popover has no Overlay/scrim to swallow that click).",
      table: { defaultValue: { summary: "false" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content aria-label="Example popover">Content</Popover.Content>
    </Popover>
  ),
};
