import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableToolbar } from "./TableToolbar";

// Docs-only (guidelines/adr/0013) — `TableToolbar.ActiveFilters`' own props get their own Properties table on TableToolbar.mdx.
const meta: Meta<typeof TableToolbar.ActiveFilters> = {
  title: "Components/TableToolbar/ActiveFilters",
  id: "molecules-data-display-tabletoolbar-activefilters",
  component: TableToolbar.ActiveFilters,
  tags: ["!dev"],
  argTypes: {
    items: {
      control: false,
      description:
        "The filters applied right now, as { id, label, group? }. Empty (or left out), nothing is drawn, but the live region that announces changes stays in the page, so going from some to none is still announced.",
    },
    onRemove: { control: false, description: "Called with the chip's id when its remove button is pressed." },
    onClearAll: { control: false, description: "Shows a Clear all button while more than one filter is applied, calling this when pressed." },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The chips' size, on the shared scale. Defaults to the bar's size."
    },
    tone: {
      control: "select",
      options: ["brand", "neutral", "info", "success", "warning", "danger"],
      description: "The chips' colour.",
      table: { defaultValue: { summary: "neutral" } },
    },
    announce: {
      control: "boolean",
      description: "Announces a change in how many filters are applied to screen readers, never the first appearance.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: {
      control: false,
      description:
        "Replaces the words this part writes, per key: list, clearAll, remove (takes the chip's text) and applied (takes the plain count: \"2 filters applied\", \"No filters applied\").",
    },
    formatNumber: { control: false, description: "Writes the counts in the default announcements in a locale's own numerals. Plain String by default." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the part's element." },
  },
  args: { tone: "neutral", announce: true },
};

export default meta;

type Story = StoryObj<typeof TableToolbar.ActiveFilters>;

export const Default: Story = {
  render: (args) => (
    <TableToolbar aria-label="Orders table tools">
      <TableToolbar.Row>
        <TableToolbar.ActiveFilters
          {...args}
          items={[
            { id: "status:open", group: "Status", label: "Open" },
            { id: "owner:jane", group: "Owner", label: "Jane" },
          ]}
          onRemove={() => {}}
          onClearAll={() => {}}
        />
      </TableToolbar.Row>
    </TableToolbar>
  ),
};
