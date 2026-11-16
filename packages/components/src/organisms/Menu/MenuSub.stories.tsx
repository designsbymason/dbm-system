import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menu } from "./Menu";

// Docs-only — see MenuRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menu.Sub> = {
  title: "Components/Menu/Sub",
  id: "organisms-navigation-menu-sub",
  component: Menu.Sub,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Menu.SubTrigger and Menu.SubContent.",
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

type Story = StoryObj<typeof Menu.Sub>;

export const Default: Story = {
  render: (args) => (
    <Menu defaultOpen modal={false}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Content>
        <Menu.Sub {...args}>
          <Menu.SubTrigger>Share</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item>Email</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
      </Menu.Content>
    </Menu>
  ),
};
