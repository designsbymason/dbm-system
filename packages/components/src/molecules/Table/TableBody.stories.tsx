import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";

// Docs-only (guidelines/adr/0013) — `Table.Body`'s own props get their own
// Properties table on Table.mdx, separate from the umbrella table. Rendered
// inside a real `Table` (the sub-part's own styling reads the parent's
// context) with a minimal, valid table structure around it.
const meta: Meta<typeof Table.Body> = {
  title: "Components/Table/Body",
  id: "molecules-data-display-table-body",
  component: Table.Body,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "One or more Table.Rows. Ignored while loading is set. For an empty table, render a single Table.Empty here in place of rows.",
    },
    loading: {
      control: "boolean",
      description:
        "Replaces the body's rows with skeleton placeholder rows — one cell per column — while data is on its way, and marks the body busy (aria-busy) for assistive technology. children are not rendered while this is set. The column count is read from the table's first row, so a Table.Header should be present.",
      table: { defaultValue: { summary: "false" } },
    },
    loadingRows: {
      control: "number",
      description: "How many skeleton rows to show while loading.",
      table: { defaultValue: { summary: "3" } },
    },
    loadingLabel: {
      control: "text",
      description:
        "The text announced to screen readers while loading — rendered visually hidden inside the first skeleton cell. Pass a translated string for a non-English interface.",
      table: { defaultValue: { summary: "'Loading'" } },
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this body group.",
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
    loading: false,
    loadingRows: 3,
    loadingLabel: "Loading",
  },
};

export default meta;

type Story = StoryObj<typeof Table.Body>;

export const Default: Story = {
  render: (args) => (
    <Table aria-label="Invoices">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell align="end">Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body {...args}>
        <Table.Row>
          <Table.Cell>INV-001</Table.Cell>
          <Table.Cell align="end">$250.00</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
