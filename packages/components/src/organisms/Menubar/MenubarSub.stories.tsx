import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Sub> = {
  title: "Organisms/Navigation/Menubar/Sub",
  component: Menubar.Sub,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "Menubar.SubTrigger and Menubar.SubContent.",
    },
    open: {
      control: "boolean",
      description:
        "The controlled open state of the submenu. Omit it to let the submenu manage its own: it opens on a pointer resting on its trigger or on the key that points toward it, and closes when focus or the pointer leaves. There is no defaultOpen: a submenu closes as soon as focus is anywhere but in it or on its trigger.",
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever the submenu opens or closes.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Sub>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Sub {...args}>
            <Menubar.SubTrigger>Share</Menubar.SubTrigger>
            <Menubar.SubContent>
              <Menubar.Item>Email</Menubar.Item>
            </Menubar.SubContent>
          </Menubar.Sub>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
