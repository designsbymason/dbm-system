import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.PageHeader`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.PageHeader> = {
  title: "Templates/Application shells/PageShell/PageHeader",
  component: PageShell.PageHeader,
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

type Story = StoryObj<typeof PageShell.PageHeader>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.Main>
        <PageShell.Content>
          <PageShell.PageHeader title="Projects" description="Everything your team is working on." />
        </PageShell.Content>
      </PageShell.Main>
    </PageShell>
  ),
};
