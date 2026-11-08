import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./PageHeader";

// Docs-only (guidelines/adr/0013) — `PageHeader.Actions`'s own props get their own Properties table on PageHeader.mdx.
const meta: Meta<typeof PageHeader.Actions> = {
  title: "Molecules/Layout/PageHeader/Actions",
  component: PageHeader.Actions,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The actions: buttons." },
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

type Story = StoryObj<typeof PageHeader.Actions>;

export const Default: Story = {
  render: () => <PageHeader><PageHeader.Actions>Act</PageHeader.Actions></PageHeader>,
};
