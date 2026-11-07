import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Main`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Main> = {
  title: "Templates/Application shells/AppShell/Main",
  component: AppShell.Main,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The page's content. The one main landmark, and the target of the skip link." },
    id: {
      control: false,
      description: "The id the skip link points at: Navbar.SkipLink links to #main unless you give it another href.",
      table: { defaultValue: { summary: "'main'" } },
    },
    busy: {
      control: false,
      description:
        "Marks the main area as loading: a thin indeterminate bar along its top edge (below the sticky header), `aria-busy`, and a polite announcement of `labels.loading`. Going back to false announces nothing more. Left out, none of it is drawn or announced.",
    },
    labels: {
      control: false,
      description: "Text the part draws or announces, overridable for translation. Keys: `loading`.",
      table: { defaultValue: { summary: "{ loading: 'Loading' }" } },
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

type Story = StoryObj<typeof AppShell.Main>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  ),
};
