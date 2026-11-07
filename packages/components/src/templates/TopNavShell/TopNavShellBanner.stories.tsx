import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.Banner`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.Banner> = {
  title: "Templates/Application shells/TopNavShell/Banner",
  component: TopNavShell.Banner,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The notice: an Alert with banner, or any content. It scrolls away with the page; it does not stick." },
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

type Story = StoryObj<typeof TopNavShell.Banner>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.Banner>Notice</TopNavShell.Banner>
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
