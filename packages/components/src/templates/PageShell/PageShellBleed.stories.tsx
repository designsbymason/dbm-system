import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./PageShell";

// Docs-only (guidelines/adr/0013) — `PageShell.Bleed`'s own props get their own Properties table on PageShell.mdx.
const meta: Meta<typeof PageShell.Bleed> = {
  title: "Templates/Application shells/PageShell/Bleed",
  component: PageShell.Bleed,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The band's content, kept to the page's width and padding." },
    tone: {
      control: false,
      description: "The band's fill: default (none, the page's surface) or canvas, the page's alternate surface. text.tertiary does not pass AA on canvas.",
      table: { defaultValue: { summary: "\"default\"" } },
    },
    width: { control: false, description: "The width the content is kept to, by what the page is: reading, dashboard or full. An explicit size replaces it." },
    size: {
      control: false,
      description: "The widest the content gets, on the same steps as Container, centred: the same as PageShell.Content, so the band lines up with the page.",
      table: { defaultValue: { summary: "\"xl\"" } },
    },
    paddingInline: {
      control: false,
      description: "Padding at the start and end of the content, on the spacing scale: one step, or a map keyed by breakpoint.",
      table: { defaultValue: { summary: "4" } },
    },
    paddingBlock: {
      control: false,
      description: "Padding above and below, on the spacing scale.",
      table: { defaultValue: { summary: "8" } },
    },
    "aria-label": { control: false, description: "A section is a region landmark only when it is named: name a band that matters to navigation." },
    "aria-labelledby": { control: false, description: "The id of a visible element that names the band, in place of aria-label." },
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

type Story = StoryObj<typeof PageShell.Bleed>;

export const Default: Story = {
  render: () => (
    <PageShell>
      <PageShell.Main>
        <PageShell.Bleed tone="canvas">Band</PageShell.Bleed>
      </PageShell.Main>
    </PageShell>
  ),
};
