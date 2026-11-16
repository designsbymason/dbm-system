import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb";

// Docs-only (guidelines/adr/0013) — `Breadcrumb.Page`'s own props get their own
// Properties table on Breadcrumb.mdx.
const meta: Meta<typeof Breadcrumb.Page> = {
  title: "Components/Breadcrumb/Page",
  id: "molecules-navigation-breadcrumb-page",
  component: Breadcrumb.Page,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The current page's name." },
    icon: {
      control: false,
      description:
        "An icon shown before the text — a component reference from @dbm-system/icons, not a string name. Decorative.",
    },
    id: { control: false, description: "Standard DOM id, on the span." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb.Page>;

export const Default: Story = {
  render: (args) => (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Breadcrumb.Page {...args}>Products</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb>
  ),
};
