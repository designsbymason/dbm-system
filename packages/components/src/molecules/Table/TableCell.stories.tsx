import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.Cell`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part's own styling reads the parent's
// context) with a minimal, valid table structure around it.
const meta: Meta<typeof Table.Cell> = {
  title: "Components/Table/Cell",
  id: "molecules-data-display-table-cell",
  component: Table.Cell,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The cell's own content — text, a Badge, an Avatar, anything.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Horizontal alignment of the cell's content, in logical terms. Defaults to start, or to end when numeric is set — an explicit align always wins over that.",
      table: { defaultValue: { summary: "'start'" } },
    },
    numeric: {
      control: "boolean",
      description:
        "Marks this cell as holding a number: end-aligns it and sets tabular figures, so every digit takes the same width and a column of figures lines up exactly. In a font whose digits are proportional by default (the system UI font, for instance) right-alignment alone doesn't do that; Nunito's digits are already equal-width, so with it numeric is chiefly the alignment shorthand.",
      table: { defaultValue: { summary: "false" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this cell.",
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
    children: "INV-001",
    align: "start",
    numeric: false,
  },
};

export default meta;

type Story = StoryObj<typeof Table.Cell>;

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
          <Table.Cell {...args} />
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
