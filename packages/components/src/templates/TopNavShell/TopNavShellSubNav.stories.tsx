import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.SubNav`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.SubNav> = {
  title: "Templates/Application shells/TopNavShell/SubNav",
  component: TopNavShell.SubNav,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The row's content: usually a nav (a list of links) with its own name. It scrolls sideways when it does not fit." },
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

type Story = StoryObj<typeof TopNavShell.SubNav>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.SubNav>Sub-navigation</TopNavShell.SubNav>
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
