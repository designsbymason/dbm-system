import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.Body`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.Body> = {
  title: "Templates/Application shells/PageShell/Body",
  component: PageShell.Body,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "PageShell.Main and PageShell.Aside, in the order they read: the layout follows it, so an aside written first is at the start." },
    width: {
      control: false,
      description: "The width the page is kept to, by what it is: reading, dashboard or full. An explicit size replaces it.",
    },
    size: {
      control: false,
      description: "The widest the body gets, on the same steps as Container, centred. full is no limit.",
      table: { defaultValue: { summary: "\"xl\"" } },
    },
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

type Story = StoryObj<typeof PageShell.Body>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.Body>
        <PageShell.Main>Main</PageShell.Main>
        <PageShell.Aside aria-label="Related">Aside</PageShell.Aside>
      </PageShell.Body>
    </PageShell>
  ),
};
