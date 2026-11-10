import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./DataTable";
import { employeeColumns, employees } from "./DataTableStoryKit";

// Docs-only (guidelines/adr/0013) — `DataTable.ColumnMenu`'s own props get their own Properties table on DataTable.mdx. It is a
// `Button` that opens a `Menu`; rendered inside a real DataTable, since it reads the table's columns.
const meta: Meta<typeof DataTable.ColumnMenu> = {
  title: "Organisms/Data Display/DataTable/ColumnMenu",
  component: DataTable.ColumnMenu,
  tags: ["!dev"],
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "tertiary", "ghost", "destructive"], description: "The button's treatment, on Button's scale.", table: { defaultValue: { summary: "secondary" } } },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"], description: "The button's size, on the shared scale. Say the same size as the toolbar's other controls.", table: { defaultValue: { summary: "md" } } },
    icon: { control: false, description: "The icon before the button's text, as a component reference. Pass null for none.", table: { defaultValue: { summary: "ColumnsIcon" } } },
    align: { control: "select", options: ["start", "center", "end"], description: "Where the menu lines up with the button.", table: { defaultValue: { summary: "end" } } },
    dir: { control: "select", options: ["ltr", "rtl"], description: "The direction of the menu, which doesn't read the page's. Left out, the nearest DirectionProvider's, else left-to-right.", table: { defaultValue: { summary: "ltr" } } },
    labels: { control: false, description: "Text written for the menu, replacing the English defaults one by one." },
    id: { control: false, description: "Standard DOM id, applied to the button." },
    className: { control: false, description: "Additional CSS classes for the button." },
    style: { control: false, description: "Inline styles for the button." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the button." },
  },
};

export default meta;

type Story = StoryObj<typeof DataTable.ColumnMenu>;

export const Default: Story = {
  render: (args) => (
    <DataTable aria-label="Team" columns={employeeColumns} data={employees.slice(0, 3)}>
      <DataTable.ColumnMenu {...args} />
    </DataTable>
  ),
};
