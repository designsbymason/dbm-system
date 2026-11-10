import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "./DataTable";
import { employeeColumns, employees } from "./DataTableStoryKit";

// Docs-only (guidelines/adr/0013) — `DataTable.Pagination`'s own props get their own Properties table on DataTable.mdx. It takes
// `Pagination`'s presentation props; the page, page count and change handler come from the table.
const meta: Meta<typeof DataTable.Pagination> = {
  title: "Organisms/Data Display/DataTable/Pagination",
  component: DataTable.Pagination,
  tags: ["!dev"],
  argTypes: {
    layout: { control: "select", options: ["split", "centered"], description: "How the footer is arranged. split puts the range and the page size at the start and the page controls at the end; centered puts the page size at the start, the page controls in the middle and the range at the end, stacking below collapseBelow.", table: { defaultValue: { summary: "split" } } },
    collapseBelow: { control: "select", options: ["sm", "md", "lg", "xl", "never"], description: "The width of the footer, below which layout=\"centered\" stacks: sm (40rem) to xl (80rem), or never. A container query on the footer's own width. No effect with layout=\"split\".", table: { defaultValue: { summary: "md" } } },
    showSummary: { control: "boolean", description: "Shows \"1–10 of 47\" beside the page numbers.", table: { defaultValue: { summary: "true" } } },
    showPageSize: { control: "boolean", description: "Shows a select for how many rows a page, from the table's pageSizeOptions.", table: { defaultValue: { summary: "true" } } },
    dir: { control: "select", options: ["ltr", "rtl"], description: "The direction of the page size select, which opens a Radix list that doesn't read the page's. Left out, the nearest DirectionProvider's, else left-to-right.", table: { defaultValue: { summary: "ltr" } } },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"], description: "The size of the page controls and the page size select.", table: { defaultValue: { summary: "sm" } } },
    variant: { control: "select", options: ["ghost", "outlined", "filled"], description: "The treatment of the page controls: ghost, outlined or filled.", table: { defaultValue: { summary: "ghost" } } },
    showLabel: { control: "boolean", type: { name: "boolean" }, description: "Shows the words \"Previous\" and \"Next\" on the previous and next buttons, beside their arrows.", table: { defaultValue: { summary: "false" } } },
    rounded: { control: "boolean", type: { name: "boolean" }, description: "Makes every page number and arrow round: a circle, or a pill for a page number too wide to be a square.", table: { defaultValue: { summary: "false" } } },
    align: { control: "select", options: ["start", "center", "end"], description: "Where the page controls sit across their own width: centre, or flush with the start or end edge.", table: { defaultValue: { summary: "center" } } },
    announce: { control: "boolean", type: { name: "boolean" }, description: "Announces the new page to screen readers whenever it changes (\"Page 3 of 20\").", table: { defaultValue: { summary: "true" } } },
    disabled: { control: "boolean", type: { name: "boolean" }, description: "Disables every page control, say while the next page is loading. They stay focusable.", table: { defaultValue: { summary: "false" } } },
    getPageHref: { control: false, description: "Makes each page control a real link: given a page number, returns its URL. The table still holds the page." },
    siblingCount: { control: { type: "number", min: 0 }, description: "Page numbers shown each side of the current one.", table: { defaultValue: { summary: "1" } } },
    boundaryCount: { control: { type: "number", min: 0 }, description: "Page numbers always shown at each end.", table: { defaultValue: { summary: "1" } } },
    compact: { control: "select", options: ["auto", "container", "always", "never"], description: "When the page numbers give way to \"Page 2 of 5\": auto, container, always or never.", table: { defaultValue: { summary: "auto" } } },
    showFirstLast: { control: "boolean", type: { name: "boolean" }, description: "Adds first and last page buttons.", table: { defaultValue: { summary: "false" } } },
    showJump: { control: "boolean", type: { name: "boolean" }, description: "Adds a field to go to a page by number.", table: { defaultValue: { summary: "false" } } },
    "aria-label": { control: false, description: "An accessible name for the page controls' nav landmark. Defaults to \"Pagination\"." },
    "aria-labelledby": { control: false, description: "The id of an element that names the page controls' nav landmark; takes the place of aria-label." },
    labels: { control: false, description: "Text the footer writes itself (the range and the page size select's name), replacing the English defaults one by one." },
    paginationLabels: { control: false, description: "The labels of the Pagination inside, replacing its English defaults one by one." },
    formatNumber: { control: false, description: "Writes the numbers the footer displays.", table: { defaultValue: { summary: "String" } } },
    id: { control: false, description: "Standard DOM id, applied to the footer's box." },
    className: { control: false, description: "Additional CSS classes for the footer's box." },
    style: { control: false, description: "Inline styles for the footer's box." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the footer's box." },
  },
};

export default meta;

type Story = StoryObj<typeof DataTable.Pagination>;

export const Default: Story = {
  render: (args) => (
    <DataTable aria-label="Team" columns={employeeColumns} data={employees} defaultPageSize={5}>
      <DataTable.Pagination {...args} />
    </DataTable>
  ),
};
