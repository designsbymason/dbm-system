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
