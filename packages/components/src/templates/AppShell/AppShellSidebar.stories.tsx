import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Sidebar`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Sidebar> = {
  title: "Templates/Application shells/AppShell/Sidebar",
  component: AppShell.Sidebar,
  tags: ["!dev"],
  argTypes: {
    resizable: {
      control: false,
      description:
        "Puts a handle on the column's inner edge that the reader drags, or moves with the arrow keys (Shift for bigger steps, Home and End for the least and the most, a double press to reset), to set the sidebar's width. The width is the shell's, so leave width off the Sidebar inside. There is no handle while the sidebar is a rail or in its phone panel.",
      table: { defaultValue: { summary: "false" } },
    },
    minWidth: {
      control: false,
      description: "The least width a resize reaches: a number of pixels or a CSS length in rem or px.",
      table: { defaultValue: { summary: "'12rem'" } },
    },
    maxWidth: {
      control: false,
      description: "The most width a resize reaches: a number of pixels or a CSS length in rem or px.",
      table: { defaultValue: { summary: "'28rem'" } },
    },
    labels: { control: false, description: "Text the resize handle supplies itself, namely its accessible name. Merged over the English defaults." },
    children: { control: false, description: "The `Sidebar`. The column is as wide as the sidebar and is absent from the page while the sidebar is in its phone panel." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppShell.Sidebar>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Sidebar>Sidebar</AppShell.Sidebar>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  ),
};
