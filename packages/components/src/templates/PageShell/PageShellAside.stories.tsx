import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.Aside`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.Aside> = {
  title: "Templates/Shells/PageShell/Aside",
  component: PageShell.Aside,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The aside's content: a table of contents, filters, related links, a details panel. The same children are drawn beside the page and, below collapseBelow with collapse=\"drawer\", in the drawer." },
    width: { control: false, description: "The width of the column and of the drawer: a number of pixels or any CSS length. Left out it is the app-shell.aside-width token." },
    sticky: {
      control: false,
      description: "Keeps the aside in view, under the header, while the page scrolls, and lets it scroll inside itself when it is taller than the window (a tab stop while it does). Only beside the page.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: false,
      description: "How far from the top of the window a sticky aside sticks, a CSS length. The default is the height of the header as the shell measures it, so the aside sticks under it.",
      table: { defaultValue: { summary: "header height" } },
    },
    collapse: {
      control: false,
      description: "What the aside becomes below collapseBelow: dropped under the page (stack), or a drawer opened from PageShell.AsideToggle.",
      table: { defaultValue: { summary: "\"stack\"" } },
    },
    collapseBelow: {
      control: false,
      description: "The width below which the aside leaves its column, a breakpoint step; \"never\" keeps it beside the page at every width.",
      table: { defaultValue: { summary: "\"lg\"" } },
    },
    labels: { control: false, description: "Text the aside's drawer supplies itself: its title and its close button's name. Merged over the English defaults." },
    drawerContainer: { control: false, description: "An element to draw the drawer inside instead of the document body, so it stays within a frame. Mainly for demos and tests." },
    "aria-label": { control: false, description: "The aside is a complementary landmark, so name it. It is also the drawer's title when given." },
    "aria-labelledby": { control: false, description: "The id of a visible element that names the aside, in place of aria-label." },
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

type Story = StoryObj<typeof PageShell.Aside>;

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
