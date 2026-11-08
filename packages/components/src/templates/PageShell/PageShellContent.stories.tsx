import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.Content`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.Content> = {
  title: "Templates/Application shells/PageShell/Content",
  component: PageShell.Content,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The page's content." },
    width: {
      control: false,
      description:
        "The width the page is kept to, by what it is: reading for text (a narrow column), dashboard for cards and tables (the wide step), full for a page that fills the window. An explicit size replaces it.",
    },
    size: {
      control: false,
      description:
        "The widest the content gets, on the same steps as Container, centred. full is no limit. Takes the place of width when both are given.",
      table: { defaultValue: { summary: "\"xl\"" } },
    },
    paddingInline: {
      control: false,
      description: "Padding at the start and end, on the spacing scale: one step, or a map keyed by breakpoint.",
      table: { defaultValue: { summary: "4" } },
    },
    paddingBlock: {
      control: false,
      description: "Padding above and below, on the spacing scale. With bleed it is the band's.",
      table: { defaultValue: { summary: "6" } },
    },
    bleed: {
      control: false,
      description:
        "Makes the section a band as wide as PageShell.Main (edge to edge) with its content kept to the page's width. className, style, id, the native props and the ref are then on the band, so a token in style tints it.",
      table: { defaultValue: { summary: "false" } },
    },
    as: {
      control: false,
      description: "The element: a div, or a section for a part of the page that has a name. A section is a region landmark only when it is named.",
      table: { defaultValue: { summary: "\"div\"" } },
    },
    "aria-label": { control: false, description: "Names a section: it is a region landmark only when it has a name." },
    "aria-labelledby": { control: false, description: "The id of a visible element that names a section, in place of aria-label." },
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

type Story = StoryObj<typeof PageShell.Content>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.Content>Content</PageShell.Content>
      <PageShell.Main>Main</PageShell.Main>
    </PageShell>
  ),
};
