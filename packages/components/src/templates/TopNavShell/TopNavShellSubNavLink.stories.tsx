import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.SubNavLink`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.SubNavLink> = {
  title: "Templates/Application shells/TopNavShell/SubNavLink",
  component: TopNavShell.SubNavLink,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The link's text." },
    current: {
      control: false,
      description: "Marks the link as the page the reader is on: aria-current=\"page\" and the subtle tint. The caller decides, from the router.",
      table: { defaultValue: { summary: "false" } },
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

type Story = StoryObj<typeof TopNavShell.SubNavLink>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.SubNav label="Sections">
        <TopNavShell.SubNavLink href="#" current>
          Overview
        </TopNavShell.SubNavLink>
        <TopNavShell.SubNavLink href="#">Activity</TopNavShell.SubNavLink>
      </TopNavShell.SubNav>
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
