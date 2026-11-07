import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.SkipLink`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.SkipLink> = {
  title: "Templates/Application shells/AppShell/SkipLink",
  component: AppShell.SkipLink,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The link's text. Left out it is labels.skipToContent (Skip to content)." },
    href: {
      control: false,
      description: "Where the link goes: the id of the element to skip to, which is AppShell.Main's by default.",
      table: { defaultValue: { summary: "'#main'" } },
    },
    labels: {
      control: false,
      description: "Text the link supplies itself, namely its words when it has no children. Merged over the English defaults.",
      table: { defaultValue: { summary: "{ skipToContent: 'Skip to content' }" } },
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

type Story = StoryObj<typeof AppShell.SkipLink>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.SkipLink />
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  ),
};
