import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.Caption`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part's own styling reads the parent's
// context) with a minimal, valid table structure around it.
const meta: Meta<typeof Table.Caption> = {
  title: "Components/Table/Caption",
  id: "molecules-data-display-table-caption",
  component: Table.Caption,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description:
        "The table's visible title/description. Names the table for assistive technology automatically, and also names the table's own scroll region when it overflows.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. When omitted, a stable id is generated automatically so the table's own scroll region can name itself after this caption. Rarely needed directly — pass one only when another element needs a predictable id to point at.",
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
    children: "Recent invoices",
  },
};

export default meta;

type Story = StoryObj<typeof Table.Caption>;

export const Default: Story = {
  render: (args) => (
    <Table aria-label="Invoices">
      <Table.Caption {...args} />
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
    </Table>
  ),
};
