import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Footer`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Footer> = {
  title: "Templates/Application shells/AppShell/Footer",
  component: AppShell.Footer,
  tags: ["!dev"],
  argTypes: {
    sticky: {
      control: false,
      description:
        "Keeps the footer at the bottom of the window while the page scrolls (scroll page), for a bar of actions that must stay in reach. It clears a home indicator. Nothing changes with scroll content, where the footer is already outside the scrolling.",
      table: { defaultValue: { summary: "false" } },
    },
    children: { control: false, description: "The page's footer: the contentinfo landmark, below the main area and outside its scrolling." },
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

type Story = StoryObj<typeof AppShell.Footer>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Footer>Footer</AppShell.Footer>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  ),
};
