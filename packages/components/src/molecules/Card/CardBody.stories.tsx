import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

// Docs-only (guidelines/adr/0013) — `Card.Body`'s own props get their own
// Properties table on Card.mdx, separate from the umbrella table. Rendered
// inside a real `Card` so the sub-part is shown in its real context.
const meta: Meta<typeof Card.Body> = {
  title: "Components/Card/Body",
  id: "molecules-data-display-card-body",
  component: Card.Body,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The card's main content. It grows to fill any spare height, so in a row of equal-height cards the footers still line up along the bottom.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this body.",
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

type Story = StoryObj<typeof Card.Body>;

export const Default: Story = {
  render: (args) => (
    <Card>
      <Card.Header>
        <strong>Team plan</strong>
      </Card.Header>
      <Card.Body {...args}>Up to 10 members and unlimited projects.</Card.Body>
    </Card>
  ),
};
