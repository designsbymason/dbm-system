import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.HeaderCell`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part's own styling reads the parent's
// context) with a minimal, valid table structure around it.
const meta: Meta<typeof Table.HeaderCell> = {
  title: "Components/Table/HeaderCell",
  id: "molecules-data-display-table-headercell",
  component: Table.HeaderCell,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The header cell's own content — a column or row label.",
    },
    scope: {
      control: "select",
      options: ["col", "row", "colgroup", "rowgroup"],
      description:
        "Which cells this header labels, for assistive technology: col for a column header (the default, and correct inside Table.Header), row for a row header (the first cell of a body row that labels the rest of that row). Also accepts colgroup/rowgroup for headers spanning a group of columns/rows.",
      table: { defaultValue: { summary: "'col'" } },
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Horizontal alignment of the cell's content, in logical terms — start follows reading direction, end is its opposite, so alignment mirrors correctly under RTL.",
      table: { defaultValue: { summary: "'start'" } },
    },
    numeric: {
      control: "boolean",
      description:
        "Marks this header as labelling a numeric column: end-aligns it (so it sits over right-aligned figures) and sets tabular figures. Pair it with numeric on the column's Table.Cells.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this header cell.",
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
    children: "Invoice",
    scope: "col",
    align: "start",
    numeric: false,
  },
};

export default meta;

type Story = StoryObj<typeof Table.HeaderCell>;

export const Default: Story = {
  render: (args) => (
    <Table aria-label="Invoices">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell {...args} />
          <Table.HeaderCell align="end">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>INV-001</Table.Cell>
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
