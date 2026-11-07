import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNavShell } from "./TopNavShell";

// Docs-only (guidelines/adr/0013) — `TopNavShell.SubNav`'s own props get their own Properties table on TopNavShell.mdx.
const meta: Meta<typeof TopNavShell.SubNav> = {
  title: "Templates/Application shells/TopNavShell/SubNav",
  component: TopNavShell.SubNav,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The row's content. With label it is the links (TopNavShell.SubNavLink), which the row puts in a nav of its own; without it, a nav (a Tabs list, or links) you draw yourself, with its own name. It scrolls sideways when it does not fit.",
    },
    label: {
      control: false,
      description:
        "The accessible name of the nav the row draws around its children, which tells it apart from the bar's and the footer's navigation landmarks. Left out, the row draws no nav and you put your own in it.",
    },
    align: {
      control: false,
      description: "Where the links sit in the row when they all fit: center or the start. When they do not fit the row scrolls from its start either way.",
      table: { defaultValue: { summary: "'center'" } },
    },
    bordered: { control: false, description: "Draws a line under the row.", table: { defaultValue: { summary: "true" } } },
    sticky: {
      control: false,
      description:
        "Keeps the row with the bar while the page scrolls. Off, only the bar stays at the top of the window and the row scrolls away with the page.",
      table: { defaultValue: { summary: "true" } },
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

type Story = StoryObj<typeof TopNavShell.SubNav>;

export const Default: Story = {
  render: () => (
    <TopNavShell>
      <TopNavShell.SubNav>Sub-navigation</TopNavShell.SubNav>
      <TopNavShell.Main>Main</TopNavShell.Main>
    </TopNavShell>
  ),
};
