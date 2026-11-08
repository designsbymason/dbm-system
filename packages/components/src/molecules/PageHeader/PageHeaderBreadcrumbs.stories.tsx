import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./PageHeader";

// Docs-only (guidelines/adr/0013) — `PageHeader.Breadcrumbs`'s own props get their own Properties table on PageHeader.mdx.
const meta: Meta<typeof PageHeader.Breadcrumbs> = {
  title: "Molecules/Layout/PageHeader/Breadcrumbs",
  component: PageHeader.Breadcrumbs,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The trail: a Breadcrumb." },
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

type Story = StoryObj<typeof PageHeader.Breadcrumbs>;

export const Default: Story = {
  render: () => <PageHeader><PageHeader.Breadcrumbs>Trail</PageHeader.Breadcrumbs></PageHeader>,
};
