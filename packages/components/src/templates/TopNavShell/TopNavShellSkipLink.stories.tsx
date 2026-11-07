import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.SkipLink`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.SkipLink> = {
  title: "Templates/Application shells/TopNavShell/SkipLink",
  component: TopNavShell.SkipLink,
  tags: ["!dev"],
  argTypes: {
    href: {
      control: false,
      description:
        "The link's destination: the main area's id.",
      table: { defaultValue: { summary: "\"#main\"" } },
    },
    children: { control: false, description: "The link's text. Left out, labels.skipToContent (\"Skip to content\")." },
    labels: { control: false, description: "The words the link supplies itself, merged over the English default." },
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

type Story = StoryObj<typeof TopNavShell.SkipLink>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.SkipLink />
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
