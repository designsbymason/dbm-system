import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./DataTable";
import { employeeColumns, employees } from "./DataTableStoryKit";

// Docs-only (guidelines/adr/0013) — `DataTable.Toolbar`'s own props get their own Properties table on DataTable.mdx. It is a
// TableToolbar, drawn above the table; the props are TableToolbar's. Rendered inside a real DataTable.
const meta: Meta<typeof DataTable.Toolbar> = {
  title: "Organisms/Data Display/DataTable/Toolbar",
  component: DataTable.Toolbar,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "The bar's rows: TableToolbar.Row of the search, filters and summary, then DataTable.Selection." },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"], description: "The size every part that draws text or controls itself uses unless it sets its own.", table: { defaultValue: { summary: "md" } } },
    "aria-label": { control: false, description: "Names the bar for assistive tech. Required unless aria-labelledby points at a visible label." },
    "aria-labelledby": { control: false, description: "The id of an already-visible element that names the bar, in place of aria-label." },
    "aria-describedby": { control: false, description: "The id of a helper text or description for the bar." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the bar's element." },
  },
};

export default meta;

type Story = StoryObj<typeof DataTable.Toolbar>;

export const Default: Story = {
  render: (args) => (
    <DataTable aria-label="Team" columns={employeeColumns} data={employees.slice(0, 3)}>
      <DataTable.Toolbar {...args} aria-label="Team table tools" />
    </DataTable>
  ),
};
