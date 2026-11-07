import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.SkipLink`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.SkipLink> = {
  title: "Templates/Application shells/PageShell/SkipLink",
  component: PageShell.SkipLink,
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

type Story = StoryObj<typeof PageShell.SkipLink>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.SkipLink />
      <PageShell.Main>Main</PageShell.Main>
    </PageShell>
  ),
};
