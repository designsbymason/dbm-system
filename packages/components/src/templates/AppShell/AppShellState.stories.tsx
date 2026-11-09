import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.State`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.State> = {
  title: "Templates/Shells/AppShell/State",
  component: AppShell.State,
  tags: ["!dev"],
  argTypes: {
    title: { control: false, description: 'A short statement of what happened or what is missing ("We couldn\'t load this page", "No invoices yet"). It is the state\'s heading.' },
    description: { control: false, description: "A sentence of explanation, or what to do next." },
    kind: {
      control: false,
      description: "What the state is: `empty` (nothing to show yet) or `error` (something failed, shown in the danger tone and announced to a screen reader when it appears).",
      table: { defaultValue: { summary: "'empty'" } },
    },
    icon: { control: false, description: "The icon, a component reference. Left out it is a tray for `empty` and a warning for `error`." },
    actions: { control: false, description: 'What the reader can do about it: a `Button` such as "Try again", or several in a row.' },
    level: {
      control: false,
      description: "The title's heading level. A state that replaces the whole page is its heading, so 1; one inside a section sits one level below that section's heading.",
      table: { defaultValue: { summary: "1" } },
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

type Story = StoryObj<typeof AppShell.State>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Main>
        <AppShell.State title="No invoices yet" />
      </AppShell.Main>
    </AppShell>
  ),
};
