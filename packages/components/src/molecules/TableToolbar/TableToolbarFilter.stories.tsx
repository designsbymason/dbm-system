import { FunnelSimpleIcon } from "@dbm-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../../atoms/Checkbox";
import { CheckboxGroup } from "../CheckboxGroup";
import { Toolbar } from "../Toolbar";
import { TableToolbar } from "./TableToolbar";

// Docs-only (guidelines/adr/0013) — `TableToolbar.Filter`'s own props get their own Properties table on TableToolbar.mdx.
const meta: Meta<typeof TableToolbar.Filter> = {
  title: "Molecules/Data Display/TableToolbar/Filter",
  component: TableToolbar.Filter,
  tags: ["!dev"],
  argTypes: {
    label: { control: "text", description: "The filter's name, shown on its button (\"Status\"). Required." },
    children: {
      control: false,
      description:
        "The filter controls in the panel: a CheckboxGroup, a RadioGroup, a Select, a range. They are yours and their state is yours; this part only opens and names the panel.",
    },
    value: {
      control: "text",
      description:
        "What the button shows of the choice (\"All\", \"Open\", \"2 selected\"). Left out, the button shows the filter's label and the count's badge. Given, the button shows the choice, is named \"Status: All\" (holding its visible text as whole words), and the label is drawn by labelPlacement.",
    },
    labelPlacement: {
      control: "select",
      options: ["inside", "before"],
      description:
        "Where the filter's name is drawn when it is given a value. inside writes it in the button (\"Status: All\"); before draws it as plain text before a button that shows only the choice. With before the part is a box holding the name and the button, so className and style go on that box and everything else on the button.",
      table: { defaultValue: { summary: "inside" } },
    },
    count: {
      control: { type: "number", min: 0 },
      description:
        "How many values of this filter are applied. Above zero the button shows the count, its accessible name says it (\"Status, 2 active\"), and the panel offers onClear. Zero shows nothing.",
      table: { defaultValue: { summary: "0" } },
    },
    max: {
      control: { type: "number", min: 1 },
      description: "The most the badge writes: a count above it reads \"99+\". The button's accessible name still says the real number.",
      table: { defaultValue: { summary: "99" } },
    },
    onClear: { control: false, description: "Shows a Clear button in the panel while count is above zero, calling this when pressed. Left out, there is none." },
    open: { control: false, description: "Whether the panel is open, when controlled. Pair with onOpenChange." },
    defaultOpen: { control: false, description: "Whether the panel starts open, when uncontrolled." },
    onOpenChange: { control: false, description: "Called when the panel opens or closes." },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
      description: "The button's look. Inside a Toolbar it follows the toolbar's variant when left out; on its own it is secondary.",
      table: { defaultValue: { summary: "secondary" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The button's size. Inside a Toolbar it follows the toolbar's size when left out; on its own it is the bar's size."
    },
    icon: { control: false, description: "An icon before the label, a component from @dbm-system/icons (a funnel for \"Filter\")." },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Which edge of the button the panel lines up with.",
      table: { defaultValue: { summary: "start" } },
    },
    labels: { control: false, description: "Replaces the words this part writes, per key: clear, activeCount (takes the plain count), panel (takes the label), named (takes the label and the value: \"Status: All\") and before (takes the label: \"Status:\")." },
    formatNumber: { control: false, description: "Writes the count in a locale's own numerals. Plain String by default; also used by the default activeCount." },
    disabled: { control: "boolean", description: "Disables the button, so the panel can't be opened.", table: { defaultValue: { summary: "false" } } },
    id: { control: false, description: "Standard DOM id, on the button." },
    className: { control: false, description: "Additional CSS classes for customization, on the button." },
    style: { control: false, description: "Inline styles, merged onto the button's own." },
    "data-testid": { control: false, description: "Test identifier for automated testing, on the button." },
  },
  args: { label: "Status", count: 2, align: "start", disabled: false },
};

export default meta;

type Story = StoryObj<typeof TableToolbar.Filter>;

export const Default: Story = {
  render: ({ children: _children, ...args }) => (
    <TableToolbar aria-label="Orders table tools">
      <Toolbar aria-label="Filters" variant="secondary">
        <Toolbar.Item>
          <TableToolbar.Filter {...args} icon={FunnelSimpleIcon} onClear={() => {}}>
            <CheckboxGroup aria-label="Status">
              <Checkbox value="open">Open</Checkbox>
            </CheckboxGroup>
          </TableToolbar.Filter>
        </Toolbar.Item>
      </Toolbar>
    </TableToolbar>
  ),
};
