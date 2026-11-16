import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumb } from "./Breadcrumb";

// Docs-only (guidelines/adr/0013) — `Breadcrumb.Item`'s own props get their own
// Properties table on Breadcrumb.mdx. Rendered inside a real `Breadcrumb`, whose
// context the item reads.
const meta: Meta<typeof Breadcrumb.Item> = {
  title: "Components/Breadcrumb/Item",
  id: "molecules-navigation-breadcrumb-item",
  component: Breadcrumb.Item,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "A Breadcrumb.Link for a page above the current one, or Breadcrumb.Page for the current one. The separator after it is drawn for you.",
    },
    id: { control: false, description: "Standard DOM id, on the li." },
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

type Story = StoryObj<typeof Breadcrumb.Item>;

export const Default: Story = {
  render: (args) => (
    <Breadcrumb>
      <Breadcrumb.Item {...args}>
        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Products</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb>
  ),
};
