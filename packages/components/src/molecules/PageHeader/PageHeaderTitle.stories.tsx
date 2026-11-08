import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./PageHeader";

// Docs-only (guidelines/adr/0013) — `PageHeader.Title`'s own props get their own Properties table on PageHeader.mdx.
const meta: Meta<typeof PageHeader.Title> = {
  title: "Molecules/Layout/PageHeader/Title",
  component: PageHeader.Title,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The title." },
    level: {
      control: false,
      description: "The heading level, h1 to h6. A page has one h1; a header inside a panel or a section takes the level that fits its place in the outline.",
      table: { defaultValue: { summary: "1" } },
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

type Story = StoryObj<typeof PageHeader.Title>;

export const Default: Story = {
  render: () => <PageHeader><PageHeader.Title>Projects</PageHeader.Title></PageHeader>,
};
