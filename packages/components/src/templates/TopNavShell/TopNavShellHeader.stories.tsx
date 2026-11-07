import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.Header`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.Header> = {
  title: "Templates/Application shells/TopNavShell/Header",
  component: TopNavShell.Header,
  tags: ["!dev"],
  argTypes: {
    as: {
      control: false,
      description:
        "The element the slot is. A Navbar draws its own <header>, so leave this a div around one; use header for a header built without one, so the page still has its banner landmark.",
      table: { defaultValue: { summary: "\"div\"" } },
    },
    children: { control: false, description: "The header's content: a Navbar, then an optional TopNavShell.SubNav. The slot sticks while the page scrolls (unless the shell's stickyHeader is off)." },
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

type Story = StoryObj<typeof TopNavShell.Header>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.Header>Header</TopNavShell.Header>
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
