import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Header`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Header> = {
  title: "Templates/Shells/AppShell/Header",
  component: AppShell.Header,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "The header's content: usually a Navbar, which draws the page's banner landmark itself and holds the menu button.",
    },
    as: {
      control: false,
      description:
        "The element to render. A plain div by default, since a Navbar draws the page's header banner itself and a second one around it would nest two. Pass \"header\" for a header built without a Navbar.",
      table: { defaultValue: { summary: "'div'" } },
    },
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
