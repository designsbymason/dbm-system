import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.Row`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part's own styling reads the parent's
// context) with a minimal, valid table structure around it.
const meta: Meta<typeof Table.Row> = {
  title: "Components/Table/Row",
  id: "molecules-data-display-table-row",
  component: Table.Row,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "One or more Table.Cells and/or Table.HeaderCells.",
    },
    selected: {
      control: false,
      description:
        "Draws the row as chosen, with the brand's subtle fill (over a stripe or a hover). Purely visual: it sets data-selected and no ARIA state, since aria-selected isn't allowed on a plain table row, so whatever makes the row choosable (a checkbox in a cell) must carry the state itself.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this row.",
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

type Story = StoryObj<typeof Table.Row>;

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
        <Table.Row {...args}>
          <Table.Cell>INV-001</Table.Cell>
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
