import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input } from "../../atoms/Input";
import { send } from "../CodeBlock/browserProtocol";
import { FormField } from "../FormField";
import { FieldGroup } from "./FieldGroup";
import { fieldGroupPlaygroundSnippet, fieldGroupSnippets } from "./FieldGroup.snippets";

const meta: Meta<typeof FieldGroup> = {
  title: "Components/FieldGroup",
  id: "molecules-inputs-fieldgroup",
  component: FieldGroup,
  parameters: { layout: "padded" },
  // Keys follow the component's own `FieldGroupProps` declaration order (07 §4 item 3).
  argTypes: {
    legend: {
      control: "text",
      description:
        "The group's visible name, rendered as the legend of a native fieldset — the accessible name of the group.",
    },
    children: {
      control: false,
      description: "The fields in the group — usually FormFields.",
    },
    description: {
      control: "text",
      description: "Supplementary text under the legend, described to assistive tech through the group's aria-describedby.",
    },
    error: {
      control: "text",
      description: "An error about the group as a whole, shown below the fields. Its presence marks the group invalid.",
    },
    required: {
      description: "Marks the legend with a required-indicator asterisk — visual only, since a group role supports no aria-required.",
      table: { defaultValue: { summary: "false" } },
    },
    hideLegend: {
      description: "Keeps the legend for assistive tech and removes it from the page.",
      table: { defaultValue: { summary: "false" } },
    },
    variant: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description: "How the group draws itself: no box, a border, or a tinted fill.",
      table: { defaultValue: { summary: '"ghost"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The default size of every FormField inside — its label, and the control it hands its size to — which a field can override. Also the legend's size unless legendSize is set.",
      table: { defaultValue: { summary: '"md"' } },
    },
    // The three props below have no value of their own by default, so their live controls are on the Playground
    // story alone (with an "off"/"default" choice that isn't a real value); everywhere else they are not controls.
    legendSize: {
      control: false,
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size of the legend alone, so a large section title can sit over ordinary-sized fields. Defaults to the group's size.",
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description:
        "Stack the fields, or put them side by side and wrap the next onto its own line when a field would be too narrow. Takes a breakpoint map. Ignored when columns is set.",
      table: { defaultValue: { summary: '"vertical"' } },
    },
    columns: {
      control: false,
      description:
        "A number of equal columns, or a breakpoint map, for fields of different widths: wrap each in FieldGroup.Item and give it a span. Takes precedence over orientation.",
    },
    gap: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description: "The space between rows of fields, as a step on the spacing scale — a single value or a breakpoint map. Also the column gap unless columnGap is set.",
      table: { defaultValue: { summary: "4" } },
    },
    columnGap: {
      control: false,
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description: "The space between side-by-side fields, when it should differ from gap. Defaults to gap.",
    },
    disabled: {
      description: "Disables the whole group: native controls through the fieldset, every FormField inside, and nested groups.",
      table: { defaultValue: { summary: "false" } },
    },
    form: { control: false, description: "Associates the group with a <form> by that form's id, for a group rendered outside the form's own element." },
    name: { control: false, description: "The native fieldset name: a name for the group in the form's elements collection. Nothing is submitted under it." },
    id: { control: false, description: "Overrides the auto-generated base id used for the description's and error's own ids." },
    className: { control: false, description: "Additional CSS classes for the fieldset." },
    style: { control: false, description: "Inline styles for the fieldset." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
    "aria-describedby": {
      control: false,
      description: "Extra ids of elements that also describe the group, joined to the description's and error's own.",
    },
  },
  // Every controllable prop gets an explicit value, matching its real default (07 §5).
  args: {
    legend: "Shipping address",
    description: "",
    error: "",
    required: false,
    hideLegend: false,
    variant: "ghost",
    size: "md",
    orientation: "vertical",
    gap: 4,
    disabled: false,
  },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args}>
        <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        <FormField label="City">{(field) => <Input {...field} />}</FormField>
        <FormField label="Postcode">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export default meta;

/** The Playground's "default"/"off" choices aren't real values; turn them back into "leave the prop out". */
const fromPlayground = (args: Record<string, unknown>) => {
  const { legendSize, columns, columnGap, ...rest } = args as {
    legendSize?: string;
    columns?: string | number;
    columnGap?: string | number;
  };
  return {
    ...rest,
    legendSize: legendSize === "default" || legendSize === undefined ? undefined : legendSize,
    columns: columns === "off" || columns === undefined ? undefined : Number(columns),
    columnGap: columnGap === "default" || columnGap === undefined ? undefined : Number(columnGap),
  };
};

type Story = StoryObj<typeof FieldGroup>;

const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-8)", maxWidth: "40rem" } as const;
const two = (
  <>
    <FormField label="Email">{(field) => <Input {...field} type="email" />}</FormField>
    <FormField label="Phone">{(field) => <Input {...field} type="tel" />}</FormField>
  </>
);

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  args: { legendSize: "default", columns: "off", columnGap: "default" } as unknown as Story["args"],
  argTypes: {
    legendSize: { control: "select", options: ["default", "xs", "sm", "md", "lg", "xl"] },
    columns: { control: "select", options: ["off", 2, 3, 4] },
    columnGap: { control: "select", options: ["default", 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32] },
  },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...(fromPlayground(args as unknown as Record<string, unknown>) as typeof args)}>
        <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        <FormField label="City">{(field) => <Input {...field} />}</FormField>
        <FormField label="Postcode">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) =>
          fieldGroupPlaygroundSnippet(fromPlayground(context.args as Record<string, unknown>)),
      },
    },
  },
};

export const Variants: Story = {
  parameters: { docs: { source: { code: fieldGroupSnippets.variants } } },
  argTypes: { variant: { control: false }, legend: { control: false } },
  render: (args) => (
    <div style={column}>
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <FieldGroup key={variant} {...args} legend={`Shipping address (${variant})`} variant={variant}>
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup>
      ))}
    </div>
  ),
};

export const Horizontal: Story = {
  name: "Side by side",
  parameters: { docs: { source: { code: fieldGroupSnippets.horizontal } } },
  argTypes: { orientation: { control: false }, legend: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "48rem" }}>
      <FieldGroup {...args} legend="Date of birth" orientation="horizontal">
        <FormField label="Day">{(field) => <Input {...field} inputMode="numeric" />}</FormField>
        <FormField label="Month">{(field) => <Input {...field} inputMode="numeric" />}</FormField>
        <FormField label="Year">{(field) => <Input {...field} inputMode="numeric" />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: fieldGroupSnippets.states } } },
  argTypes: { legend: { control: false }, description: { control: false }, error: { control: false }, disabled: { control: false } },
  render: (args) => (
    <div style={column}>
      <FieldGroup
        {...args}
        legend="Contact"
        description="We only use this to confirm your order."
        error="Give us an email address or a phone number."
      >
        {two}
      </FieldGroup>
      <FieldGroup {...args} legend="Contact (disabled)" description="We only use this to confirm your order." disabled>
        {two}
      </FieldGroup>
    </div>
  ),
};

export const HiddenLegend: Story = {
  name: "Legend hidden from view",
  parameters: { docs: { source: { code: fieldGroupSnippets.hiddenLegend } } },
  argTypes: { hideLegend: { control: false }, legend: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args} legend="Search filters" hideLegend orientation="horizontal">
        <FormField label="Keyword">{(field) => <Input {...field} />}</FormField>
        <FormField label="Location">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export const Nested: Story = {
  parameters: { docs: { source: { code: fieldGroupSnippets.nested } } },
  argTypes: { legend: { control: false }, variant: { control: false }, children: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args} legend="Billing details" variant="outlined">
        <FieldGroup legend="Address">
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup>
        <FieldGroup legend="Contact">
          <FormField label="Email">{(field) => <Input {...field} type="email" />}</FormField>
        </FieldGroup>
      </FieldGroup>
    </div>
  ),
};

export const SizeCascade: Story = {
  name: "Size reaches the fields",
  parameters: { docs: { source: { code: fieldGroupSnippets.size } } },
  argTypes: { legend: { control: false }, size: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup {...args} legend="Large group" size="lg">
        <FormField label="Inherits lg">{(field) => <Input {...field} />}</FormField>
        <FormField label="Own size: sm" size="sm">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
};

export const Columns: Story = {
  name: "Columns and spans",
  parameters: { docs: { source: { code: fieldGroupSnippets.columns } } },
  argTypes: { legend: { control: false }, orientation: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "48rem" }}>
      <FieldGroup {...args} legend="Delivery address" columns={{ base: 1, md: 3 }}>
        <FieldGroup.Item span={{ base: 1, md: 3 }}>
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
        <FieldGroup.Item span={{ base: 1, md: 2 }}>
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
        <FieldGroup.Item>
          <FormField label="Postcode">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
      </FieldGroup>
    </div>
  ),
};

export const LegendSizeAndRequired: Story = {
  name: "Legend size and required",
  parameters: { docs: { source: { code: fieldGroupSnippets.legend } } },
  argTypes: { legend: { control: false }, required: { control: false }, size: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <FieldGroup
        {...args}
        legend="Account details"
        legendSize="xl"
        size="sm"
        required
        description="All of these are needed to create your account."
      >
        {two}
      </FieldGroup>
    </div>
  ),
};

export const Gaps: Story = {
  name: "Row and column gaps",
  parameters: { docs: { source: { code: fieldGroupSnippets.gaps } } },
  argTypes: { legend: { control: false }, gap: { control: false }, orientation: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: "48rem" }}>
      <FieldGroup {...args} legend="Tight rows, wide columns" orientation="horizontal" gap={{ base: 2, md: 3 }} columnGap={{ base: 4, md: 10 }}>
        <FormField label="First name">{(field) => <Input {...field} />}</FormField>
        <FormField label="Middle name">{(field) => <Input {...field} />}</FormField>
        <FormField label="Last name">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
};

// --- Hidden tests (real browser; kept out of the sidebar and the Docs page) -------------------------------

const noControls = {
  legend: { control: false },
  description: { control: false },
  error: { control: false },
  hideLegend: { control: false },
  required: { control: false },
  variant: { control: false },
  size: { control: false },
  orientation: { control: false },
  gap: { control: false },
  disabled: { control: false },
  legendSize: { control: false },
  columns: { control: false },
  columnGap: { control: false },
} as const;

export const LegendLayoutInteraction: Story = {
  name: "Legend sits inside the box, above the description and fields — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={column}>
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <FieldGroup key={variant} legend={`Group ${variant}`} description="A description" variant={variant} data-testid={variant}>
          {two}
        </FieldGroup>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const variant of ["ghost", "outlined", "filled"]) {
      const group = within(canvasElement).getByTestId(variant);
      const box = group.getBoundingClientRect();
      const style = getComputedStyle(group);
      const legend = group.querySelector("legend")!.getBoundingClientRect();
      const description = group.querySelector("p")!.getBoundingClientRect();
      const firstField = group.querySelector("input")!.getBoundingClientRect();
      // Inside the border and padding, not straddling the top edge.
      await expect(legend.top).toBeGreaterThanOrEqual(box.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop) - 0.5);
      await expect(legend.width).toBeGreaterThan(box.width / 2);
      await expect(description.top).toBeGreaterThanOrEqual(legend.bottom - 0.5);
      await expect(firstField.top).toBeGreaterThan(description.bottom);
      // The fields take the group's whole width (the body once collapsed to zero beside the floated legend).
      await expect(firstField.width).toBeGreaterThan((box.width - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd)) * 0.9);
    }
  },
};

export const HorizontalWrapInteraction: Story = {
  name: "Horizontal fields sit in a row, then wrap when the group gets narrow — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="frame" style={{ width: "48rem" }}>
      <FieldGroup legend="Date of birth" orientation="horizontal">
        <FormField label="Day">{(field) => <Input {...field} />}</FormField>
        <FormField label="Month">{(field) => <Input {...field} />}</FormField>
        <FormField label="Year">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    const tops = () => [...frame.querySelectorAll("input")].map((input) => Math.round(input.getBoundingClientRect().top));
    await waitFor(() => expect(new Set(tops()).size).toBe(1));
    frame.style.width = "20rem";
    await waitFor(() => expect(new Set(tops()).size).toBe(3));
    const fieldBoxes = [...frame.querySelectorAll("fieldset > div > div")];
    // Wrapped fields fill the narrow group rather than keeping their share of a row.
    await expect(fieldBoxes).toHaveLength(3);
    await expect(Math.round(fieldBoxes[0]!.getBoundingClientRect().width)).toBe(Math.round(frame.getBoundingClientRect().width));
  },
};

export const DisabledInteraction: Story = {
  name: "A disabled group stops typing in every field, and Tab skips them — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <FieldGroup legend="Contact" disabled>
      {two}
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const email = within(canvasElement).getByRole("textbox", { name: "Email" });
    await userEvent.click(email);
    await userEvent.keyboard("hello");
    await expect(email).toHaveValue("");
    await expect(email).toBeDisabled();
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement) && document.activeElement !== document.body).toBe(false);
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left: the legend and the error accent start on the right — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div dir="rtl" data-testid="rtl" style={{ maxWidth: "30rem" }}>
      <FieldGroup legend="Contact" error="Required" variant="ghost">
        {two}
      </FieldGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId("rtl");
    const group = root.querySelector("fieldset")!;
    const legend = group.querySelector("legend")!.getBoundingClientRect();
    const box = group.getBoundingClientRect();
    // Accent border and the legend's text both sit at the right-hand edge.
    const accent = getComputedStyle(group, "::before");
    await expect(accent.borderRightWidth).not.toBe("0px");
    await expect(accent.borderLeftWidth).toBe("0px");
    await expect(box.right - legend.right).toBeLessThan(box.width / 2);
  },
};

export const ForcedColorsInteraction: Story = {
  name: "Forced colours: the filled box keeps an edge — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <FieldGroup legend="Contact" variant="filled" data-testid="filled">
      {two}
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const emulate = (value: "active" | "none") =>
      send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    const group = within(canvasElement).getByTestId("filled");
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      await expect(getComputedStyle(group).borderTopStyle).toBe("solid");
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.appendChild(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      await expect(getComputedStyle(group).borderTopColor).toBe(canvasText);
    } finally {
      await emulate("none");
    }
  },
};

export const ColumnsInteraction: Story = {
  name: "Columns: spans give the cells their widths, and the gaps are the ones asked for — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div data-testid="frame" style={{ width: "48rem" }}>
      <FieldGroup legend="Delivery address" columns={3} gap={3} columnGap={10}>
        <FieldGroup.Item span={3} data-testid="street">
          <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
        <FieldGroup.Item span={2} data-testid="city">
          <FormField label="City">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
        <FieldGroup.Item data-testid="postcode">
          <FormField label="Postcode">{(field) => <Input {...field} />}</FormField>
        </FieldGroup.Item>
      </FieldGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rect = (id: string) => within(canvasElement).getByTestId(id).getBoundingClientRect();
    const street = rect("street");
    const city = rect("city");
    const postcode = rect("postcode");
    // Street takes a whole row; city and postcode share the next, two to one.
    await expect(postcode.top).toBeCloseTo(city.top, 0);
    await expect(city.top).toBeGreaterThan(street.bottom);
    await expect(Math.round(street.width)).toBeGreaterThan(Math.round(city.width + postcode.width));
    const column = (street.width - 2 * 40) / 3;
    await expect(city.width).toBeCloseTo(column * 2 + 40, 0);
    await expect(postcode.width).toBeCloseTo(column, 0);
    // The gaps: 10 steps (40px) between columns, 3 steps (12px) between rows.
    await expect(postcode.left - city.right).toBeCloseTo(40, 0);
    await expect(city.top - street.bottom).toBeCloseTo(12, 0);
  },
};

export const ColumnsOnAPhoneInteraction: Story = {
  name: "Columns on a phone: a responsive map collapses to one column, and a wide span doesn't keep the grid wide — interaction test",
  tags: ["!dev"],
  globals: { viewport: { value: "mobile1", isRotated: false } },
  argTypes: noControls,
  render: () => (
    <FieldGroup legend="Delivery address" columns={{ base: 1, md: 3 }}>
      <FieldGroup.Item span={{ base: 3, md: 3 }} data-testid="street">
        <FormField label="Street">{(field) => <Input {...field} />}</FormField>
      </FieldGroup.Item>
      <FieldGroup.Item span={2} data-testid="city">
        <FormField label="City">{(field) => <Input {...field} />}</FormField>
      </FieldGroup.Item>
      <FieldGroup.Item data-testid="postcode">
        <FormField label="Postcode">{(field) => <Input {...field} />}</FormField>
      </FieldGroup.Item>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const group = canvasElement.querySelector("fieldset")!.getBoundingClientRect();
    const rect = (id: string) => within(canvasElement).getByTestId(id).getBoundingClientRect();
    for (const id of ["street", "city", "postcode"]) {
      await expect(Math.round(rect(id).width)).toBe(Math.round(rect("street").width));
    }
    await expect(rect("street").width).toBeLessThanOrEqual(group.width);
    await expect(rect("city").top).toBeGreaterThan(rect("street").bottom);
    await expect(rect("postcode").top).toBeGreaterThan(rect("city").bottom);
  },
};

export const ErrorReplacesDescriptionInteraction: Story = {
  name: "An error replaces the description, and the group is described by the error — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <FieldGroup legend="Contact" description="Only for orders" error="Give an email or a phone number">
      {two}
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Only for orders")).toBeNull();
    const group = canvas.getByRole("group", { name: "Contact" });
    await expect(group).toHaveAccessibleDescription("Give an email or a phone number");
  },
};

export const NamesAndTabOrderInteraction: Story = {
  name: "The group's name and description are computed in the browser, and Tab walks the fields in order — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div>
      <button type="button">Before</button>
      <FieldGroup legend="Shipping address" description="Where it goes" required>
        <FormField label="Street">{(field) => <Input {...field} />}</FormField>
        <FormField label="City">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
      <FieldGroup legend="Hidden name" hideLegend>
        <FormField label="Keyword">{(field) => <Input {...field} />}</FormField>
      </FieldGroup>
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The required asterisk is decoration: the name is the legend's text alone.
    const shipping = canvas.getByRole("group", { name: "Shipping address" });
    await expect(shipping).toHaveAccessibleDescription("Where it goes");
    // A hidden legend still names its group.
    await expect(canvas.getByRole("group", { name: "Hidden name" })).toBeInTheDocument();
    const order = ["Before", "Street", "City", "Keyword", "After"];
    const focused = async () => {
      const element = document.activeElement as HTMLElement;
      const labelId = element.getAttribute("aria-labelledby");
      return labelId ? document.getElementById(labelId)?.textContent : element.textContent;
    };
    canvas.getByRole("button", { name: "Before" }).focus();
    for (const expected of order.slice(1)) {
      await userEvent.tab();
      await expect(await focused()).toBe(expected);
    }
  },
};

export const ErrorDoesNotMoveFieldsInteraction: Story = {
  name: "A group that turns invalid keeps its fields where they were, and the accent hangs outside — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ paddingInlineStart: "var(--dbm-space-8)", ...column }}>
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <div key={variant} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
          <FieldGroup legend="Valid" variant={variant} data-testid={`${variant}-valid`}>{two}</FieldGroup>
          <FieldGroup legend="Invalid" variant={variant} error="Required" data-testid={`${variant}-invalid`}>{two}</FieldGroup>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of ["ghost", "outlined", "filled"]) {
      const valid = canvas.getByTestId(`${variant}-valid`);
      const invalid = canvas.getByTestId(`${variant}-invalid`);
      const left = (group: HTMLElement) => group.querySelector("input")!.getBoundingClientRect().left;
      await expect(left(invalid)).toBeCloseTo(left(valid), 0);
      await expect(invalid.getBoundingClientRect().left).toBeCloseTo(valid.getBoundingClientRect().left, 0);
    }
    // The box-less variant's accent is drawn in the gutter, to the start of the group, in the danger colour.
    const invalid = canvas.getByTestId("ghost-invalid");
    const accent = getComputedStyle(invalid, "::before");
    await expect(accent.position).toBe("absolute");
    await expect(parseFloat(accent.borderInlineStartWidth)).toBeGreaterThan(0);
    await expect(parseFloat(accent.insetInlineStart)).toBeLessThan(0);
    await expect(accent.borderInlineStartColor).toBe(getComputedStyle(canvas.getByTestId("outlined-invalid")).borderTopColor);
  },
};
