import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.Empty`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part reads the parent's column count and size)
// with a header row so its column-spanning behaviour is visible.
const meta: Meta<typeof Table.Empty> = {
  title: "Components/Table/Empty",
  id: "molecules-data-display-table-empty",
  component: Table.Empty,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The message shown when the table has no rows — text, or anything that explains the empty state and, ideally, what to do about it.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this message.",
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
    children: "No invoices yet",
  },
};

export default meta;

type Story = StoryObj<typeof Table.Empty>;

export const Default: Story = {
  render: (args) => (
    <Table aria-label="Invoices">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell>Customer</Table.HeaderCell>
          <Table.HeaderCell numeric>Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Empty {...args} />
      </Table.Body>
    </Table>
  ),
};
