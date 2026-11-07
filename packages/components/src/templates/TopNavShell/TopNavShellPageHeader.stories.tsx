import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.PageHeader`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.PageHeader> = {
  title: "Templates/Application shells/TopNavShell/PageHeader",
  component: TopNavShell.PageHeader,
  tags: ["!dev"],
  argTypes: {
    title: { control: false, description: "The page's title, drawn as its heading." },
    titleLevel: { control: false, description: "The heading level of the title.", table: { defaultValue: { summary: "1" } } },
    description: { control: false, description: "A line under the title that says what the page is." },
    breadcrumbs: { control: false, description: "A trail above the title: a Breadcrumb." },
    actions: { control: false, description: "The page's actions, at the end of the title's row, and under it on a phone: buttons." },
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

type Story = StoryObj<typeof TopNavShell.PageHeader>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.Main>
        <TopNavShell.Content>
          <TopNavShell.PageHeader title="Projects" description="Everything your team is working on." />
        </TopNavShell.Content>
      </TopNavShell.Main>
    </TopNavShell>
  ),
};
