import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableToolbar } from "./TableToolbar";

// Docs-only (guidelines/adr/0013) — `TableToolbar.Summary`'s own props get their own Properties table on TableToolbar.mdx.
const meta: Meta<typeof TableToolbar.Summary> = {
  title: "Components/TableToolbar/Summary",
  id: "molecules-data-display-tabletoolbar-summary",
  component: TableToolbar.Summary,
  tags: ["!dev"],
  argTypes: {
    count: {
      control: { type: "number", min: 0 },
      description:
        "How many results there are. Left out (undefined) it means not known yet: nothing is shown, and the count that arrives is not announced as if someone had changed something. 0 is a count, and says \"No results\".",
    },
    loading: {
      control: "boolean",
      description: "The count is on its way: a placeholder takes its place and a screen reader finds labels.loading there. Nothing is announced while it is on.",
      table: { defaultValue: { summary: "false" } },
    },
    total: { control: { type: "number", min: 0 }, description: "The unfiltered total. Given, and larger than count, the text reads \"12 of 128 results\"." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The text size, on the shared scale. Defaults to the bar's size."
    },
    announce: {
      control: "boolean",
      description: "Announces a change in the count to screen readers, never the first count to appear.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: { control: false, description: "Replaces the words this part writes, per key: results (takes the plain count) and resultsOf (takes the count and the total)." },
    formatNumber: { control: false, description: "Writes the numbers in a locale's own numerals. Plain String by default; also used by the default results." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the part's element." },
  },
  args: { count: 12, total: 128, announce: true },
};

export default meta;

type Story = StoryObj<typeof TableToolbar.Summary>;

export const Default: Story = {
  render: (args) => (
    <TableToolbar aria-label="Orders table tools">
      <TableToolbar.Row>
        <TableToolbar.Summary {...args} />
      </TableToolbar.Row>
    </TableToolbar>
  ),
};
