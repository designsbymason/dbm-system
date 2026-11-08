import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.Footer`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.Footer> = {
  title: "Templates/Application shells/PageShell/Footer",
  component: PageShell.Footer,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The footer's content: the contentinfo landmark. On a page too short to fill the window it sits at the bottom of the window." },
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

type Story = StoryObj<typeof PageShell.Footer>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.Footer>Footer</PageShell.Footer>
      <PageShell.Main>Main</PageShell.Main>
    </PageShell>
  ),
};
