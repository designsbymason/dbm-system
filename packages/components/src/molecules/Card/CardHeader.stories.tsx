import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

// Docs-only (guidelines/adr/0013) — `Card.Header`'s own props get their own
// Properties table on Card.mdx, separate from the umbrella table. Rendered
// inside a real `Card` so the sub-part is shown in its real context.
const meta: Meta<typeof Card.Header> = {
  title: "Components/Card/Header",
  id: "molecules-data-display-card-header",
  component: Card.Header,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The header's content — typically a title (and perhaps a description) on the start side, and an action such as a Badge or IconButton on the end. Laid out as a row with the space between, so a lone title just starts at the start edge.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this header.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
  },
};

export default meta;

type Story = StoryObj<typeof Card.Header>;

export const Default: Story = {
  render: (args) => (
    <Card>
      <Card.Header {...args}>
        <strong>Team plan</strong>
        <span>Active</span>
      </Card.Header>
      <Card.Body>Body text beneath the header.</Card.Body>
    </Card>
  ),
};
