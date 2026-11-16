import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button";
import { Toolbar } from "./Toolbar";

// Docs-only (guidelines/adr/0013) — `Toolbar.Item`'s own props get their own Properties table on Toolbar.mdx.
// Rendered inside a real `Toolbar` (Radix's own context-scoped Button throws outside one).
const meta: Meta<typeof Toolbar.Item> = {
  title: "Components/Toolbar/Item",
  id: "molecules-inputs-toolbar-item",
  component: Toolbar.Item,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The one focusable element to put in the toolbar's arrow-key order, as a single element that takes the props it is handed (a Button with asChild, a menu or popover trigger, a native a). Required.",
    },
    disabled: {
      control: "boolean",
      description:
        "Takes this item out of arrow-key movement. The toolbar's disabled does so for every item either way. The element itself still needs its own disabled state.",
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: { disabled: false },
};

export default meta;

type Story = StoryObj<typeof Toolbar.Item>;

export const Default: Story = {
  render: ({ children: _children, ...args }) => (
    <Toolbar aria-label="Document">
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Item {...args}>
        <Button variant="ghost" asChild>
          <a href="/docs">Docs</a>
        </Button>
      </Toolbar.Item>
    </Toolbar>
  ),
};
