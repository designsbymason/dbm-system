import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";

// Docs-only — see ContextMenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof ContextMenu.Sub> = {
  title: "Organisms/Overlay/ContextMenu/Sub",
  component: ContextMenu.Sub,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "ContextMenu.SubTrigger and ContextMenu.SubContent.",
    },
    open: {
      control: "boolean",
      description:
        "The controlled open state of the submenu. Omit it to let the submenu manage its own: it opens on a pointer resting on its trigger or on the key that points toward it, and closes when focus or the pointer leaves. There is no defaultOpen: a submenu closes as soon as focus is anywhere but in it or on its trigger.",
    },
    onOpenChange: {
      control: false,
      description: "Called with the new open state whenever the submenu opens or closes.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof ContextMenu.Sub>;

export const Default: Story = {
  render: (args) => (
    <ContextMenu>
      <ContextMenu.Trigger>Right-click me</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Sub {...args}>
          <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item>Email</ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
