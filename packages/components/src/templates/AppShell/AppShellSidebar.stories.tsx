import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Sidebar`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Sidebar> = {
  title: "Templates/Application shells/AppShell/Sidebar",
  component: AppShell.Sidebar,
  tags: ["!dev"],
  argTypes: {
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
