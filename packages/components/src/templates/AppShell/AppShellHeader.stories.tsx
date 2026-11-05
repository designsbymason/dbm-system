import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Header`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Header> = {
  title: "Templates/Application shells/AppShell/Header",
  component: AppShell.Header,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The Navbar, which is the page's banner landmark and holds the skip link and the menu button." },
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

type Story = StoryObj<typeof AppShell.Header>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Header>Header</AppShell.Header>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  ),
};
