import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell } from "./AppShell";

// Docs-only (guidelines/adr/0013) — `AppShell.Aside`'s own props get their own Properties table on AppShell.mdx.
const meta: Meta<typeof AppShell.Aside> = {
  title: "Templates/Application shells/AppShell/Aside",
  component: AppShell.Aside,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The aside's content: a detail pane, an inspector, an activity feed, a table of contents. The same children are drawn on the page and, below asideCollapseBelow with asideCollapseTo drawer, in the drawer.",
    },
    width: {
      control: false,
      description:
        "The width of the column and of the drawer: a number of pixels or any CSS length. Left out it is the app-shell.aside-width token. The drawer is never wider than the window less the sliver of the page it keeps showing.",
      table: { defaultValue: { summary: "token" } },
    },
    "aria-label": {
      control: false,
      description:
        "The aside is a complementary landmark, so name it when the page has another one (Details, On this page). It is also the drawer's title when labels.title is not given.",
    },
    "aria-labelledby": { control: false, description: "The id of a visible element that names the aside, in place of aria-label." },
    labels: {
      control: false,
      description: "Text the aside's drawer supplies itself, such as its title and its close button's name. Merged over the English defaults.",
      table: { defaultValue: { summary: "English" } },
    },
    drawerContainer: {
      control: false,
      description: "An element to draw the drawer inside instead of the document body, so it stays within a frame. Mainly for demos and tests.",
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

type Story = StoryObj<typeof AppShell.Aside>;

export const Default: Story = {
  render: () => (
    <AppShell>
      <AppShell.Main>Main</AppShell.Main>
      <AppShell.Aside aria-label="Details">Aside</AppShell.Aside>
    </AppShell>
  ),
};
