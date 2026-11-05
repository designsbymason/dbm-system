import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Content`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Content> = {
  title: "Templates/Application shells/AppShell/Content",
  component: AppShell.Content,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The page's content." },
    size: {
      control: false,
      description: "The widest the content gets, on the same steps as Container, centred in the main area. full is no limit.",
      table: { defaultValue: { summary: "'full'" } },
    },
    paddingInline: {
      control: false,
      description: "Padding at the start and end, on the spacing scale: one step, or a map keyed by breakpoint.",
      table: { defaultValue: { summary: "{ base: 4, md: 6, lg: 8 }" } },
    },
    paddingBlock: {
      control: false,
      description: "Padding above and below, on the spacing scale.",
      table: { defaultValue: { summary: "6" } },
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

type Story = StoryObj<typeof AppShell.Content>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Main>
        <AppShell.Content>Content</AppShell.Content>
      </AppShell.Main>
    </AppShell>
  ),
};
