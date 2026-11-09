import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.AsideToggle`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.AsideToggle> = {
  title: "Templates/Shells/AppShell/AsideToggle",
  component: AppShell.AsideToggle,
  tags: ["!dev"],
  argTypes: {
    icon: { control: false, description: "The icon, a component reference. The default is the sidebar icon (SidebarSimpleIcon).", table: { defaultValue: { summary: "sidebar icon" } } },
    variant: {
      control: false,
      description: "The button's look: any IconButton variant, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: "'ghost'" } },
    },
    tone: {
      control: false,
      description: "The button's colour family: brand or neutral, so it can match the icon buttons beside it.",
      table: { defaultValue: { summary: "'brand'" } },
    },
    size: { control: false, description: "The button's size, on the same scale as IconButton.", table: { defaultValue: { summary: "'md'" } } },
    "aria-label": { control: false, description: "The button's accessible name. Defaults to labels.open (Show details)." },
    labels: {
      control: false,
      description: "Text the button supplies itself, namely its accessible name. Merged over the English defaults.",
      table: { defaultValue: { summary: "English" } },
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

type Story = StoryObj<typeof AppShell.AsideToggle>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.AsideToggle />
      <AppShell.Main>Main</AppShell.Main>
      <AppShell.Aside aria-label="Details">Aside</AppShell.Aside>
    </AppShell>
  ),
};
