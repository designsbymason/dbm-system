import type { Meta, StoryObj } from "@storybook/react-vite";
import { Menubar } from "./Menubar";

// Docs-only — see MenubarRoot.stories.tsx's own comment for the full rationale (guidelines/adr/0013).
const meta: Meta<typeof Menubar.Menu> = {
  title: "Organisms/Navigation/Menubar/Menu",
  component: Menubar.Menu,
  tags: ["!dev"],
  argTypes: {
    value: {
      control: "text",
      description:
        "The name of this menu. It is what the bar's value holds while this menu is open, so it is unique within the bar.",
    },
    children: {
      control: false,
      description: "One Menubar.Trigger and one Menubar.Content.",
    },
  },
  args: {
    value: "file",
  },
};

export default meta;

type Story = StoryObj<typeof Menubar.Menu>;

export const Default: Story = {
  render: (args) => (
    <Menubar aria-label="Application menu">
      <Menubar.Menu {...args}>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>New</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
