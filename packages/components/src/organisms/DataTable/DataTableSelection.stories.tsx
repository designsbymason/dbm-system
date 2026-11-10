import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./DataTable";
import { employeeColumns, employees } from "./DataTableStoryKit";

// Docs-only (guidelines/adr/0013) — `DataTable.Selection`'s own props get their own Properties table on DataTable.mdx. It is a
// TableToolbar.Selection read from the table's own selection, so `count`, `totalCount` and `onClear` are not props.
const meta: Meta<typeof DataTable.Selection> = {
  title: "Organisms/Data Display/DataTable/Selection",
  component: DataTable.Selection,
  tags: ["!dev"],
  argTypes: {
    children: { control: false, description: "Your bulk actions, usually a Toolbar of buttons." },
    onSelectAll: {
      control: false,
      description:
        "Called to choose every row, for a table whose data holds only one page (a manual one). A client table chooses every selectable row itself when this is left out.",
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"], description: "The size of the row's text and controls. The default follows the bar it sits in.", table: { defaultValue: { summary: "md" } } },
    announce: { control: "boolean", type: { name: "boolean" }, description: "Announces the selection count to a screen reader as it changes.", table: { defaultValue: { summary: "true" } } },
    labels: { control: false, description: "Text the row writes, replacing the English defaults one by one." },
    formatNumber: { control: false, description: "Writes the counts the row displays.", table: { defaultValue: { summary: "String" } } },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
};

export default meta;

type Story = StoryObj<typeof DataTable.Selection>;

export const Default: Story = {
  render: (args) => (
    <DataTable aria-label="Team" columns={employeeColumns} data={employees.slice(0, 3)} selectionMode="multiple" defaultSelection={["e1"]}>
      <DataTable.Toolbar aria-label="Team table tools">
        <DataTable.Selection {...args} />
      </DataTable.Toolbar>
    </DataTable>
  ),
};
