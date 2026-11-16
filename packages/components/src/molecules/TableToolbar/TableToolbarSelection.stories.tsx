import { TrashIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toolbar } from "../Toolbar";
import { TableToolbar } from "./TableToolbar";

// Docs-only (guidelines/adr/0013) — `TableToolbar.Selection`'s own props get their own Properties table on TableToolbar.mdx.
const meta: Meta<typeof TableToolbar.Selection> = {
  title: "Components/TableToolbar/Selection",
  id: "molecules-data-display-tabletoolbar-selection",
  component: TableToolbar.Selection,
  tags: ["!dev"],
  argTypes: {
    count: {
      control: { type: "number", min: 0 },
      description:
        "How many rows are selected. At 0 (or less) the row is hidden, but its live region stays in the page, so emptying the selection is still announced. Required.",
    },
    totalCount: {
      control: { type: "number", min: 0 },
      description: "How many rows there are in all. With onSelectAll, a Select all button shows while fewer than this are selected.",
    },
    onClear: { control: false, description: "Shows a Clear selection button, calling this when pressed. Left out, there is none." },
    onSelectAll: { control: false, description: "Shows a Select all N button while count is below totalCount, calling this when pressed." },
    children: { control: false, description: "The bulk actions: a Toolbar of Toolbar.Buttons is the usual choice, so they are one tab stop." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The text and button size, on the shared scale. Defaults to the bar's size."
    },
    announce: {
      control: "boolean",
      description: "Announces a change in the selection to screen readers, never the first appearance.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: {
      control: false,
      description:
        "Replaces the words this part writes, per key: group, selected (takes the plain count), cleared, clear and selectAll (takes the plain total).",
    },
    formatNumber: { control: false, description: "Writes the counts in a locale's own numerals. Plain String by default; also used by the default labels." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the row's element." },
  },
  args: { count: 3, totalCount: 12, announce: true },
};

export default meta;

type Story = StoryObj<typeof TableToolbar.Selection>;

export const Default: Story = {
  render: ({ children: _children, ...args }) => (
    <TableToolbar aria-label="Orders table tools">
      <TableToolbar.Selection {...args} onClear={() => {}} onSelectAll={() => {}}>
        <Toolbar aria-label="Bulk actions" variant="secondary">
          <Toolbar.Button leadingIcon={TrashIcon}>Delete</Toolbar.Button>
        </Toolbar>
      </TableToolbar.Selection>
    </TableToolbar>
  ),
};
