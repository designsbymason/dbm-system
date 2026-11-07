import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.Main`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.Main> = {
  title: "Templates/Application shells/PageShell/Main",
  component: PageShell.Main,
  tags: ["!dev"],
  argTypes: {
    busy: {
      control: false,
      description:
        "Marks the main area as loading: aria-busy, a thin bar along its top edge and a polite announcement, without hiding what is already there.",
    },
    children: { control: false, description: "The page. Usually one PageShell.Content." },
    labels: { control: false, description: "The words the main area supplies itself, merged over the English default (\"Loading\")." },
    id: {
      control: false,
      description: "The element's id, the skip link's target.",
      table: { defaultValue: { summary: "'main'" } },
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing. Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof PageShell.Main>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.Main>Main</PageShell.Main>
    </PageShell>
  ),
};
