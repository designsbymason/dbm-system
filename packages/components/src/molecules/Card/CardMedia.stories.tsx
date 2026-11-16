import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

// Docs-only (guidelines/adr/0013) — `Card.Media`'s own props get their own
// Properties table on Card.mdx, separate from the umbrella table. Rendered
// inside a real `Card` so the sub-part is shown in its real context.
const meta: Meta<typeof Card.Media> = {
  title: "Components/Card/Media",
  id: "molecules-data-display-card-media",
  component: Card.Media,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The media itself — an image, a video, a chart, any full-bleed content. It runs edge to edge (the card carries no padding of its own) and is clipped to the card's rounded corners.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this media.",
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

type Story = StoryObj<typeof Card.Media>;

export const Default: Story = {
  render: (args) => (
    <Card>
      <Card.Media {...args}>
        <div
          style={{
            background: "linear-gradient(135deg, var(--dbm-bg-brand), var(--dbm-bg-info))",
            blockSize: "8rem",
          }}
        />
      </Card.Media>
      <Card.Body>Body text beneath the media.</Card.Body>
    </Card>
  ),
};
