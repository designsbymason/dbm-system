import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

// Docs-only (guidelines/adr/0013) — `Card.Footer`'s own props get their own
// Properties table on Card.mdx, separate from the umbrella table. Rendered
// inside a real `Card` so the sub-part is shown in its real context.
const meta: Meta<typeof Card.Footer> = {
  title: "Components/Card/Footer",
  id: "molecules-data-display-card-footer",
  component: Card.Footer,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The footer's content — typically actions (buttons) or supporting meta.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "between"],
      description:
        "How the footer's content is laid out along the row: packed at the start, the center, or the end, or spread with the space between.",
      table: { defaultValue: { summary: "'end'" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this footer.",
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
    align: "end",
  },
};

export default meta;

type Story = StoryObj<typeof Card.Footer>;

export const Default: Story = {
  render: (args) => (
    <Card>
      <Card.Body>Body text above the footer.</Card.Body>
      <Card.Footer {...args}>
        <button type="button">Cancel</button>
        <button type="button">Save</button>
      </Card.Footer>
    </Card>
  ),
};
