import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.Footer`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part's own styling reads the parent's
// context) with a minimal, valid table structure around it.
const meta: Meta<typeof Table.Footer> = {
  title: "Components/Table/Footer",
  id: "molecules-data-display-table-footer",
  component: Table.Footer,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "One or more Table.Rows — typically totals or a summary.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this footer group.",
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

type Story = StoryObj<typeof Table.Footer>;

export const Default: Story = {
  render: (args) => (
    <Table aria-label="Invoices">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell align="end">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>INV-001</Table.Cell>
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer {...args}>
        <Table.Row>
          <Table.HeaderCell scope="row">Total</Table.HeaderCell>
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
  ),
};
