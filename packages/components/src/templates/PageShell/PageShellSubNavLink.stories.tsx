import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.SubNavLink`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.SubNavLink> = {
  title: "Templates/Application shells/PageShell/SubNavLink",
  component: PageShell.SubNavLink,
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

type Story = StoryObj<typeof PageShell.SubNavLink>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.SubNav label="Sections">
        <PageShell.SubNavLink href="#" current>
          Overview
        </PageShell.SubNavLink>
        <PageShell.SubNavLink href="#">Activity</PageShell.SubNavLink>
      </PageShell.SubNav>
      <PageShell.Main>Main</PageShell.Main>
    </PageShell>
  ),
};
