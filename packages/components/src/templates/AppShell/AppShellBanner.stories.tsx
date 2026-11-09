import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Banner`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Banner> = {
  title: "Templates/Shells/AppShell/Banner",
  component: AppShell.Banner,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The banner's content: an announcement, a maintenance notice, a trial reminder. Usually an Alert with banner, which draws edge to edge." },
    sticky: {
      control: false,
      description:
        "Keeps the banner at the top of the window while the page scrolls (scroll page); the header sticks below it. Off, the banner scrolls away and the header sticks at the top. Nothing changes with scroll content, where the banner is always in view above the header.",
      table: { defaultValue: { summary: "false" } },
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

type Story = StoryObj<typeof AppShell.Banner>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Banner>Banner</AppShell.Banner>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  ),
};
