import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../../atoms/Checkbox";
import { CheckboxGroup } from "../CheckboxGroup";
import { TableToolbar } from "./TableToolbar";

// Docs-only (guidelines/adr/0013) — `TableToolbar.Filters`' own props get their own Properties table on TableToolbar.mdx.
const meta: Meta<typeof TableToolbar.Filters> = {
  title: "Molecules/Data Display/TableToolbar/Filters",
  component: TableToolbar.Filters,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description:
        "The filters: TableToolbar.Filters, direct children (a filter wrapped in your own component is drawn inline and is not in the sheet). Each is drawn inline inside a Toolbar.Item, and in the sheet as a section headed by its label holding its children.",
    },
    collapseBelow: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "never"],
      description:
        "The width of the bar, below which the filters are one button and a sheet: sm (40rem) to xl (80rem), or never to keep them inline. The bar becomes a size container while it holds this part, so it is the bar's width that decides, not the window's.",
      table: { defaultValue: { summary: "md" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "The direction of the inline filters' toolbar, whose arrow keys follow it. Left out, the nearest DirectionProvider's, else left to right (it is not read from the page).",
      table: { defaultValue: { summary: "ltr" } },
    },
    onClearAll: {
      control: false,
      description: "Clears every filter. The sheet shows a Clear all button that calls it while any filter's count is above zero; left out, there is none.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the inline toolbar's buttons and the sheet's button.",
      table: { defaultValue: { summary: "the bar's size (md)" } },
    },
    labels: {
      control: false,
      description:
        "Replaces the words this part writes, per key: group, button, activeCount (takes the plain count), title, description, clearAll and done.",
    },
    formatNumber: { control: false, description: "Writes the count in a locale's own numerals. Plain String by default; also used by the default activeCount." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: { collapseBelow: "md" },
};

export default meta;

type Story = StoryObj<typeof TableToolbar.Filters>;

export const Default: Story = {
  render: ({ children: _children, ...args }) => (
    <TableToolbar aria-label="Orders table tools">
      <TableToolbar.Filters {...args}>
        <TableToolbar.Filter label="Status" count={1}>
          <CheckboxGroup aria-label="Status">
            <Checkbox value="open">Open</Checkbox>
          </CheckboxGroup>
        </TableToolbar.Filter>
      </TableToolbar.Filters>
    </TableToolbar>
  ),
};
