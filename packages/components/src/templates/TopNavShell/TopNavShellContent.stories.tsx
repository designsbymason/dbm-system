import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.Content`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.Content> = {
  title: "Templates/Application shells/TopNavShell/Content",
  component: TopNavShell.Content,
  tags: ["!dev"],
  argTypes: {
    size: {
      control: false,
      description:
        "The widest the content gets, on the same steps as Container, centred. full is no limit.",
      table: { defaultValue: { summary: "\"xl\"" } },
    },
    children: { control: false, description: "The page's content." },
    paddingInline: {
      control: false,
      description: "Padding at the start and end, on the spacing scale: one step, or a map keyed by breakpoint.",
      table: { defaultValue: { summary: "4" } },
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

type Story = StoryObj<typeof TopNavShell.Content>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.Content>Content</TopNavShell.Content>
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
