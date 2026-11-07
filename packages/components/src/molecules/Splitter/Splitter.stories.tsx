import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CaretLeftIcon, CaretRightIcon } from "@dbm-system/icons";
import { Button } from "../../atoms/Button";
import { IconButton } from "../../atoms/IconButton";
import { Splitter } from "./Splitter";
import { splitterPlaygroundSnippet, splitterSnippets } from "./Splitter.snippets";

const frame = (height = "20rem"): CSSProperties => ({
  height,
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-md)",
  overflow: "hidden",
});

const content: CSSProperties = {
  boxSizing: "border-box",
  height: "100%",
  padding: "var(--dbm-space-4)",
  color: "var(--dbm-text-primary)",
  fontSize: "var(--dbm-font-size-sm)",
};

/** A placeholder pane's contents: a label, tinted so neighbouring panes read as separate. */
const Demo = ({ label, tint = false }: { label: ReactNode; tint?: boolean }) => (
  <div style={{ ...content, background: tint ? "var(--dbm-bg-neutral-subtle)" : "var(--dbm-bg-surface)" }}>{label}</div>
);

const meta: Meta<typeof Splitter> = {
  title: "Molecules/Layout/Splitter",
  component: Splitter,
  parameters: { layout: "padded" },
  // Keys follow the component's own `SplitterProps` declaration order (07 §4 item 3).
  argTypes: {
    children: { control: false, description: "The panes — Splitter.Pane elements, as direct children. A handle is added between each pair." },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Horizontal puts the panes side by side; vertical stacks them (the splitter then needs a height of its own to share out). Takes a breakpoint map.",
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    layout: { control: false, description: "The size of every pane as a percentage, in order, summing to 100 — for a layout you hold yourself. Pair it with onLayoutChange." },
    defaultLayout: {
      control: false,
      description: "The starting sizes when the splitter holds its own layout. Left out, each pane takes its own defaultSize and the panes without one share the rest.",
    },
    onLayoutChange: { description: "Called with the new layout (percentages, summing to 100) on every change, including each step of a drag." },
    onLayoutCommit: { description: "Called with the layout once a drag or a key press has finished — the moment to save it." },
    variant: {
      control: "select",
      options: ["line", "grip"],
      description: "How the handles look: a thin line, or a line with a grip you can see at rest.",
      table: { defaultValue: { summary: '"line"' } },
    },
    keyboardStep: {
      control: "number",
      description: "How far an arrow key moves a handle, as a percentage. Page Up and Page Down move it twice as far.",
      table: { defaultValue: { summary: "5" } },
    },
    disabled: {
      description: "Stops the handles resizing and collapsing anything. They stay in the tab order, marked disabled.",
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "The text direction, left out, the nearest DirectionProvider's, else left-to-right; not read from the page. In rtl the first pane is on the right and the arrow keys follow.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: { control: false, description: "Text the splitter supplies itself — the handle's name, its value text and the word for collapsed. Any you leave out keep their English default." },
    formatNumber: { control: false, description: "Writes the percentages a handle announces, in a locale's own digits. Defaults to plain digits." },
    id: { control: false, description: "Standard DOM id." },
    className: { control: false, description: "Additional CSS classes for the container." },
    style: { control: false, description: "Inline styles for the container." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  // Every controllable prop gets an explicit value, matching its real default (07 §5).
  args: {
    orientation: "horizontal",
    variant: "line",
    keyboardStep: 5,
    disabled: false,
    dir: "ltr",
  },
  render: (args) => (
    <div style={frame()}>
      <Splitter {...args}>
        <Splitter.Pane label="Sidebar" defaultSize={25} minSize="10rem" collapsible>
          <Demo label="Sidebar" tint />
        </Splitter.Pane>
        <Splitter.Pane label="Content">
          <Demo label="Content" />
        </Splitter.Pane>
        <Splitter.Pane label="Details" defaultSize={25}>
          <Demo label="Details" tint />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Splitter>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => splitterPlaygroundSnippet(context.args),
      },
    },
  },
};

const noControls = {
  orientation: { control: false },
  variant: { control: false },
  keyboardStep: { control: false },
  disabled: { control: false },
  dir: { control: false },
} as const;

export const Orientation: Story = {
  parameters: { docs: { source: { code: splitterSnippets.orientation } } },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {(["horizontal", "vertical"] as const).map((orientation) => (
        <div key={orientation} style={frame("12rem")}>
          <Splitter {...args} orientation={orientation}>
            <Splitter.Pane>
              <Demo label={`${orientation}: one`} tint />
            </Splitter.Pane>
            <Splitter.Pane>
              <Demo label={`${orientation}: two`} />
            </Splitter.Pane>
          </Splitter>
        </div>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  parameters: { docs: { source: { code: splitterSnippets.variants } } },
  argTypes: { variant: { control: false } },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      {(["line", "grip"] as const).map((variant) => (
        <div key={variant} style={frame("10rem")}>
          <Splitter {...args} variant={variant}>
            <Splitter.Pane>
              <Demo label={`variant="${variant}"`} tint />
            </Splitter.Pane>
            <Splitter.Pane>
              <Demo label="Two" />
            </Splitter.Pane>
          </Splitter>
        </div>
      ))}
    </div>
  ),
};

export const ThreePanes: Story = {
  name: "Three panes",
  parameters: { docs: { source: { code: splitterSnippets.threePanes } } },
  render: (args) => (
    <div style={frame()}>
      <Splitter {...args} defaultLayout={[20, 55, 25]}>
        <Splitter.Pane>
          <Demo label="Navigation" tint />
        </Splitter.Pane>
        <Splitter.Pane>
          <Demo label="Content" />
        </Splitter.Pane>
        <Splitter.Pane>
          <Demo label="Details" tint />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const Limits: Story = {
  name: "Size limits",
  parameters: { docs: { source: { code: splitterSnippets.limits } } },
  render: (args) => (
    <div style={frame()}>
      <Splitter {...args} defaultLayout={[30, 70]}>
        <Splitter.Pane minSize="15rem" maxSize="50%">
          <Demo label="Sidebar: at least 15rem, at most half" tint />
        </Splitter.Pane>
        <Splitter.Pane minSize={30}>
          <Demo label="Content: at least 30%" />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const Fixed: Story = {
  name: "Fixed width",
  parameters: { docs: { source: { code: splitterSnippets.fixed } } },
  render: (args) => (
    <div style={{ ...frame(), width: "100%", maxWidth: "60rem", resize: "horizontal", overflow: "auto", minWidth: "20rem" }}>
      <Splitter {...args} defaultLayout={[30, 70]}>
        <Splitter.Pane fixed minSize="10rem" label="Sidebar">
          <Demo label="Fixed: keeps its width as the box is resized — drag the corner to try" tint />
        </Splitter.Pane>
        <Splitter.Pane label="Content">
          <Demo label="Content: takes the difference" />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const Locked: Story = {
  name: "Locked panes",
  parameters: { docs: { source: { code: splitterSnippets.locked } } },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={frame("22rem")}>
      <Splitter {...args} orientation="vertical" defaultLayout={[15, 55, 30]}>
        <Splitter.Pane resizable={false}>
          <Demo label="Header: locked — the divider beside it is a plain line" tint />
        </Splitter.Pane>
        <Splitter.Pane label="Main">
          <Demo label="Main" />
        </Splitter.Pane>
        <Splitter.Pane label="Terminal">
          <Demo label="Terminal: the handle between it and Main still works" tint />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const PanesComingAndGoing: Story = {
  name: "Panes coming and going",
  parameters: { docs: { source: { code: splitterSnippets.dynamic } } },
  render: function PanesComingAndGoingStory(args) {
    const [showDetails, setShowDetails] = useState(true);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "start" }}>
        <Button size="sm" variant="secondary" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? "Hide details" : "Show details"}
        </Button>
        <div style={{ ...frame(), width: "100%" }}>
          <Splitter {...args}>
            <Splitter.Pane key="nav" id="nav" label="Navigation" defaultSize={25}>
              <Demo label="Navigation" tint />
            </Splitter.Pane>
            <Splitter.Pane key="content" id="content" label="Content">
              <Demo label="Content" />
            </Splitter.Pane>
            {showDetails && (
              <Splitter.Pane key="details" id="details" defaultSize={25}>
                <Demo label="Details — hide it and the others keep their sizes" tint />
              </Splitter.Pane>
            )}
          </Splitter>
        </div>
      </div>
    );
  },
};

export const Collapsible: Story = {
  parameters: { docs: { source: { code: splitterSnippets.collapsible } } },
  render: (args) => (
    <div style={frame()}>
      <Splitter {...args} defaultLayout={[25, 75]}>
        <Splitter.Pane collapsible collapsedSize="48px" minSize="180px" label="Sidebar">
          {({ collapsed, toggle }) => (
            <div
              style={{
                ...content,
                background: "var(--dbm-bg-neutral-subtle)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: collapsed ? "center" : "space-between",
                gap: "var(--dbm-space-2)",
                padding: collapsed ? "var(--dbm-space-2)" : "var(--dbm-space-4)",
              }}
            >
              {!collapsed && <span>Sidebar — drag it shut, press Enter on the handle, or use the button</span>}
              {/* One button, in the same place whether the pane is open or not, so it keeps keyboard focus when it is pressed. */}
              <IconButton
                icon={collapsed ? CaretRightIcon : CaretLeftIcon}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                size="sm"
                variant="ghost"
                onClick={toggle}
              />
            </div>
          )}
        </Splitter.Pane>
        <Splitter.Pane>
          <Demo label="Content" />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const ControlledCollapsed: Story = {
  name: "Collapsed from outside",
  parameters: { docs: { source: { code: splitterSnippets.controlledCollapsed } } },
  render: function ControlledCollapsedStory(args) {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "start" }}>
        <Button size="sm" variant="secondary" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Show sidebar" : "Hide sidebar"}
        </Button>
        <div style={{ ...frame(), width: "100%" }}>
          <Splitter {...args} defaultLayout={[25, 75]}>
            <Splitter.Pane collapsible minSize="180px" collapsed={collapsed} onCollapsedChange={setCollapsed}>
              <Demo label="Sidebar" tint />
            </Splitter.Pane>
            <Splitter.Pane>
              <Demo label="Content" />
            </Splitter.Pane>
          </Splitter>
        </div>
      </div>
    );
  },
};

export const ControlledLayout: Story = {
  name: "Layout held by you",
  parameters: { docs: { source: { code: splitterSnippets.controlledLayout } } },
  render: function ControlledLayoutStory(args) {
    const [layout, setLayout] = useState([30, 70]);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)", justifyItems: "start" }}>
        <div style={{ ...frame("12rem"), width: "100%" }}>
          <Splitter {...args} layout={layout} onLayoutChange={setLayout}>
            <Splitter.Pane>
              <Demo label="One" tint />
            </Splitter.Pane>
            <Splitter.Pane>
              <Demo label="Two" />
            </Splitter.Pane>
          </Splitter>
        </div>
        <span data-testid="readout" style={{ fontSize: "var(--dbm-font-size-sm)", color: "var(--dbm-text-secondary)" }}>
          Layout: {layout.map((size) => size.toFixed(1)).join(" / ")}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setLayout([30, 70])}>
          Reset
        </Button>
      </div>
    );
  },
};

export const Saving: Story = {
  name: "Saving the layout",
  parameters: { docs: { source: { code: splitterSnippets.saving } } },
  render: function SavingStory(args) {
    const [saved, setSaved] = useState<number[] | null>(null);
    return (
      <div style={{ display: "grid", gap: "var(--dbm-space-3)" }}>
        <div style={frame("12rem")}>
          <Splitter {...args} defaultLayout={[30, 70]} onLayoutCommit={setSaved}>
            <Splitter.Pane>
              <Demo label="One" tint />
            </Splitter.Pane>
            <Splitter.Pane>
              <Demo label="Two" />
            </Splitter.Pane>
          </Splitter>
        </div>
        <span style={{ fontSize: "var(--dbm-font-size-sm)", color: "var(--dbm-text-secondary)" }}>
          {saved ? `Saved: ${saved.map((size) => size.toFixed(1)).join(" / ")}` : "Nothing saved yet — drag a handle and let go."}
        </span>
      </div>
    );
  },
};

export const Nested: Story = {
  parameters: { docs: { source: { code: splitterSnippets.nested } } },
  render: (args) => (
    <div style={frame("24rem")}>
      <Splitter {...args} defaultLayout={[30, 70]}>
        <Splitter.Pane>
          <Demo label="Sidebar" tint />
        </Splitter.Pane>
        <Splitter.Pane>
          <Splitter orientation="vertical" defaultLayout={[65, 35]}>
            <Splitter.Pane>
              <Demo label="Editor" />
            </Splitter.Pane>
            <Splitter.Pane>
              <Demo label="Terminal" tint />
            </Splitter.Pane>
          </Splitter>
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const Responsive: Story = {
  name: "Stacked on a phone",
  parameters: { docs: { source: { code: splitterSnippets.responsive } } },
  argTypes: { orientation: { control: false } },
  render: (args) => (
    <div style={frame("24rem")}>
      <Splitter {...args} orientation={{ base: "vertical", md: "horizontal" }}>
        <Splitter.Pane>
          <Demo label="One" tint />
        </Splitter.Pane>
        <Splitter.Pane>
          <Demo label="Two" />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

export const States: Story = {
  parameters: { docs: { source: { code: splitterSnippets.states } } },
  argTypes: { disabled: { control: false } },
  render: (args) => (
    <div style={frame("10rem")}>
      <Splitter {...args} disabled>
        <Splitter.Pane>
          <Demo label="Disabled: the handle can't be moved" tint />
        </Splitter.Pane>
        <Splitter.Pane>
          <Demo label="Two" />
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
};

// --- Hidden tests (real browser; kept out of the sidebar and the Docs page) -------------------------------

const hiddenArgTypes = { ...noControls } as const;

/** A frame whose size the test knows, so a measured width is a percentage of something. */
const MeasuredFrame = ({ children, width = "40rem", height = "12rem", testId = "frame" }: { children: ReactNode; width?: string; height?: string; testId?: string }) => (
  <div data-testid={testId} style={{ width, height }}>
    {children}
  </div>
);

const pane = (testId: string, label: string, props: Partial<React.ComponentProps<typeof Splitter.Pane>> = {}) => (
  <Splitter.Pane data-testid={testId} {...props}>
    <Demo label={label} />
  </Splitter.Pane>
);

const widthOf = (element: HTMLElement) => element.getBoundingClientRect().width;
const heightOf = (element: HTMLElement) => element.getBoundingClientRect().height;

export const DragInteraction: Story = {
  name: "Dragging a handle moves the boundary by the distance, in both directions of the layout — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <MeasuredFrame testId="row">
        <Splitter defaultLayout={[50, 50]}>
          {pane("row-a", "A")}
          {pane("row-b", "B")}
        </Splitter>
      </MeasuredFrame>
      <MeasuredFrame testId="column" width="20rem" height="16rem">
        <Splitter orientation="vertical" defaultLayout={[50, 50]}>
          {pane("column-a", "A")}
          {pane("column-b", "B")}
        </Splitter>
      </MeasuredFrame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rowHandle = within(canvas.getByTestId("row")).getByRole("separator");
    const before = widthOf(canvas.getByTestId("row-a"));
    const start = rowHandle.getBoundingClientRect();
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: rowHandle, coords: { clientX: start.left, clientY: start.top + 20 } },
      { coords: { clientX: start.left + 80, clientY: start.top + 20 } },
      { keys: "[/MouseLeft]" },
    ]);
    await waitFor(() => expect(widthOf(canvas.getByTestId("row-a"))).toBeCloseTo(before + 80, 0));
    // The panes still fill the frame, to the handle's own width.
    await expect(widthOf(canvas.getByTestId("row-a")) + widthOf(canvas.getByTestId("row-b")) + widthOf(rowHandle)).toBeCloseTo(widthOf(canvas.getByTestId("row")), 0);

    const columnHandle = within(canvas.getByTestId("column")).getByRole("separator");
    const columnBefore = heightOf(canvas.getByTestId("column-a"));
    const columnStart = columnHandle.getBoundingClientRect();
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: columnHandle, coords: { clientX: columnStart.left + 20, clientY: columnStart.top } },
      { coords: { clientX: columnStart.left + 20, clientY: columnStart.top - 30 } },
      { keys: "[/MouseLeft]" },
    ]);
    await waitFor(() => expect(heightOf(canvas.getByTestId("column-a"))).toBeCloseTo(columnBefore - 30, 0));
  },
};

export const KeyboardInteraction: Story = {
  name: "The arrow keys move a handle by the step, and Home and End go to the limits — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem">
      <Splitter defaultLayout={[50, 50]}>
        {pane("a", "A", { minSize: 20, maxSize: 70 })}
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole("separator");
    const share = () => widthOf(canvas.getByTestId("a")) + widthOf(canvas.getByTestId("b"));
    handle.focus();
    const start = widthOf(canvas.getByTestId("a"));
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(start + share() * 0.05, 0));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(share() * 0.2, 0));
    await expect(handle).toHaveAttribute("aria-valuenow", "20");
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(share() * 0.7, 0));
    await expect(handle).toHaveAttribute("aria-valuenow", "70");
  },
};

export const HitAreaInteraction: Story = {
  name: "The handle can be grabbed 11px either side of its line (WCAG 2.5.8: 24px) — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <MeasuredFrame testId="row">
        <Splitter variant="grip">
          {pane("row-a", "A")}
          {pane("row-b", "B")}
        </Splitter>
      </MeasuredFrame>
      <MeasuredFrame testId="column" width="20rem">
        <Splitter orientation="vertical">
          {pane("column-a", "A")}
          {pane("column-b", "B")}
        </Splitter>
      </MeasuredFrame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = within(canvas.getByTestId("row")).getByRole("separator");
    const rowBox = row.getBoundingClientRect();
    const middle = rowBox.top + rowBox.height / 2;
    const centre = rowBox.left + rowBox.width / 2;
    for (const offset of [-11, 0, 11]) {
      await expect(document.elementFromPoint(centre + offset, middle)).toBe(row);
    }
    await expect(document.elementFromPoint(centre + 13, middle)).not.toBe(row);

    const column = within(canvas.getByTestId("column")).getByRole("separator");
    const columnBox = column.getBoundingClientRect();
    const columnMiddle = columnBox.left + columnBox.width / 2;
    const line = columnBox.top + columnBox.height / 2;
    for (const offset of [-11, 0, 11]) {
      await expect(document.elementFromPoint(columnMiddle, line + offset)).toBe(column);
    }
  },
};

export const CollapsedHiddenInteraction: Story = {
  name: "A pane collapsed to nothing is out of the tab order and the accessibility tree; a strip stays — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <MeasuredFrame testId="none">
        <Splitter defaultLayout={[30, 70]}>
          <Splitter.Pane data-testid="none-a" collapsible minSize={15}>
            <button type="button">Inside the sidebar</button>
          </Splitter.Pane>
          {pane("none-b", "B")}
        </Splitter>
      </MeasuredFrame>
      <MeasuredFrame testId="strip">
        <Splitter defaultLayout={[30, 70]}>
          <Splitter.Pane data-testid="strip-a" collapsible collapsedSize="48px" minSize={15}>
            <button type="button">Rail button</button>
          </Splitter.Pane>
          {pane("strip-b", "B")}
        </Splitter>
      </MeasuredFrame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const none = within(canvas.getByTestId("none"));
    none.getByRole("separator").focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("none-a"))).toBeLessThan(1));
    // Hidden: the button inside is not reachable by name, and Tab goes past it.
    // Hidden once the pane has finished closing, so wait for that rather than reading it on the way.
    await waitFor(() => expect(none.queryByRole("button", { name: "Inside the sidebar" })).toBeNull());
    await userEvent.tab();
    await expect(document.activeElement?.textContent ?? "").not.toBe("Inside the sidebar");

    const strip = within(canvas.getByTestId("strip"));
    strip.getByRole("separator").focus();
    await userEvent.keyboard("{Enter}");
    // The strip is 48px wide, still drawn, and its button still there for the keyboard.
    await waitFor(() => expect(widthOf(canvas.getByTestId("strip-a"))).toBeCloseTo(48, 0));
    await expect(strip.getByRole("button", { name: "Rail button" })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("strip-a"))).toBeGreaterThan(100));
  },
};

export const PixelLimitInteraction: Story = {
  name: "A pixel limit holds, and is re-read as a percentage when the container is resized — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem">
      <Splitter defaultLayout={[40, 60]}>
        {pane("a", "A", { minSize: "200px" })}
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole("separator");
    handle.focus();
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(200, 0));
    // Shrink the container: 200px is a larger share of it, and still the minimum.
    canvas.getByTestId("frame").style.width = "20rem";
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeGreaterThanOrEqual(199));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(200, 0));
  },
};

export const ContainerResizeInteraction: Story = {
  name: "A layout keeps its proportions when the container is resized — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem">
      <Splitter defaultLayout={[25, 75]}>
        {pane("a", "A")}
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const share = () => widthOf(canvas.getByTestId("a")) + widthOf(canvas.getByTestId("b"));
    await expect(widthOf(canvas.getByTestId("a")) / share()).toBeCloseTo(0.25, 2);
    canvas.getByTestId("frame").style.width = "24rem";
    await waitFor(() => expect(widthOf(canvas.getByTestId("a")) / share()).toBeCloseTo(0.25, 2));
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left: the first pane is on the right, and the arrow keys follow — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem">
      <Splitter dir="rtl" defaultLayout={[30, 70]}>
        {pane("a", "A")}
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("a").getBoundingClientRect().left).toBeGreaterThan(canvas.getByTestId("b").getBoundingClientRect().left);
    const handle = canvas.getByRole("separator");
    handle.focus();
    const before = widthOf(canvas.getByTestId("a"));
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeGreaterThan(before));
    // The panes ease to their new size; wait for that to finish before measuring the drag against it.
    let settled = -1;
    await waitFor(() => {
      const current = widthOf(canvas.getByTestId("a"));
      const done = Math.abs(current - settled) < 0.01;
      settled = current;
      return expect(done).toBe(true);
    });
    // And a drag towards the left makes the first pane wider.
    const start = handle.getBoundingClientRect();
    const wider = widthOf(canvas.getByTestId("a"));
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: handle, coords: { clientX: start.left, clientY: start.top + 20 } },
      { coords: { clientX: start.left - 40, clientY: start.top + 20 } },
      { keys: "[/MouseLeft]" },
    ]);
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(wider + 40, 0));
  },
};

export const FocusAndForcedColoursInteraction: Story = {
  name: "Keyboard focus thickens the line in the focus colour, and forced colours keeps it drawn — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame>
      <Splitter>
        {pane("a", "A")}
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator");
    const line = () => getComputedStyle(handle, "::before");
    const colour = (value: string) => {
      const element = document.createElement("span");
      element.style.color = value;
      document.body.appendChild(element);
      const resolved = getComputedStyle(element).color;
      element.remove();
      return resolved;
    };
    const restWidth = parseFloat(line().width);
    const restColour = line().backgroundColor;
    // Tab is the keyboard: the handle takes focus the way :focus-visible wants.
    await userEvent.tab();
    await expect(handle).toHaveFocus();
    await expect(handle.matches(":focus-visible")).toBe(true);
    await waitFor(() => expect(parseFloat(line().width)).toBeGreaterThan(restWidth));
    await expect(line().backgroundColor).not.toBe(restColour);

    const { send } = await import("../CodeBlock/browserProtocol");
    const emulate = (value: "active" | "none") => send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value }] });
    await emulate("active");
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      // Resolved once, outside the polling: measuring adds and removes an element, and a waitFor callback that
      // changes the document triggers itself again.
      const highlight = colour("Highlight");
      const canvasText = colour("CanvasText");
      // The focused line is Highlight; the same line unfocused is CanvasText — both system colours, so both drawn.
      await waitFor(() => expect(line().backgroundColor).toBe(highlight));
      handle.blur();
      await waitFor(() => expect(line().backgroundColor).toBe(canvasText));
    } finally {
      await emulate("none");
    }
  },
};

export const NestedInteraction: Story = {
  name: "Each handle of a nested splitter moves its own panes only — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem" height="20rem">
      <Splitter defaultLayout={[30, 70]} data-testid="outer">
        {pane("side", "Side")}
        <Splitter.Pane>
          <Splitter orientation="vertical" defaultLayout={[50, 50]}>
            {pane("top", "Top")}
            {pane("bottom", "Bottom")}
          </Splitter>
        </Splitter.Pane>
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [outerHandle, innerHandle] = canvas.getAllByRole("separator") as [HTMLElement, HTMLElement];
    await expect(outerHandle).toHaveAttribute("aria-orientation", "vertical");
    await expect(innerHandle).toHaveAttribute("aria-orientation", "horizontal");
    const sideBefore = widthOf(canvas.getByTestId("side"));
    const topBefore = heightOf(canvas.getByTestId("top"));
    innerHandle.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(heightOf(canvas.getByTestId("top"))).toBeGreaterThan(topBefore));
    await expect(widthOf(canvas.getByTestId("side"))).toBeCloseTo(sideBefore, 0);
  },
};

export const PhoneInteraction: Story = {
  name: "On a phone a responsive orientation stacks the panes, and the handle follows — interaction test",
  tags: ["!dev"],
  globals: { viewport: { value: "mobile1", isRotated: false } },
  argTypes: hiddenArgTypes,
  render: () => (
    <div style={{ height: "20rem" }}>
      <Splitter orientation={{ base: "vertical", md: "horizontal" }}>
        {pane("a", "A")}
        {pane("b", "B")}
      </Splitter>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal"));
    await expect(canvas.getByTestId("b").getBoundingClientRect().top).toBeGreaterThan(canvas.getByTestId("a").getBoundingClientRect().bottom - 1);
  },
};

export const RemLimitInteraction: Story = {
  name: "A rem limit is the same on the page as in rem — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem">
      <Splitter defaultLayout={[40, 60]}>
        {pane("a", "A", { minSize: "15rem", maxSize: "20rem" })}
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const handle = canvas.getByRole("separator");
    handle.focus();
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(15 * rem, 0));
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(20 * rem, 0));
  },
};

export const FixedInteraction: Story = {
  name: "A fixed pane keeps its width when the container is resized, and a flexible one keeps its share — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="50rem" height="10rem">
      <Splitter defaultLayout={[30, 70]}>
        {pane("fixed", "Fixed", { fixed: true })}
        {pane("flex", "Flex")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = widthOf(canvas.getByTestId("fixed"));
    // The panes ease to their new sizes, so wait for the width to arrive rather than reading it on the way.
    canvas.getByTestId("frame").style.width = "30rem";
    await waitFor(() => expect(widthOf(canvas.getByTestId("fixed"))).toBeCloseTo(before, 0));
    await expect(widthOf(canvas.getByTestId("flex"))).toBeLessThan(before * 3);
    canvas.getByTestId("frame").style.width = "70rem";
    await waitFor(() => expect(widthOf(canvas.getByTestId("fixed"))).toBeCloseTo(before, 0));
    await expect(widthOf(canvas.getByTestId("flex"))).toBeGreaterThan(before * 3);
  },
};

export const LockedInteraction: Story = {
  name: "A locked pane doesn't move, its dividers are neither tab stops nor targets, and the others still resize — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="30rem" height="24rem">
      <Splitter orientation="vertical" defaultLayout={[20, 60, 20]}>
        {pane("header", "Header", { resizable: false })}
        {pane("main", "Main", { label: "Main" })}
        {pane("footer", "Footer")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [lockedDivider, live] = canvas.getAllByRole("separator") as [HTMLElement, HTMLElement];
    await expect(lockedDivider).not.toHaveAttribute("tabindex");
    // A plain divider is not a target: the point beside it is the pane, not the divider.
    const box = lockedDivider.getBoundingClientRect();
    await expect(document.elementFromPoint(box.left + box.width / 2, box.top + 5)).not.toBe(lockedDivider);
    // Tab reaches the working handle and nothing else on the way.
    await userEvent.tab();
    await expect(document.activeElement).toBe(live);
    const header = heightOf(canvas.getByTestId("header"));
    const main = heightOf(canvas.getByTestId("main"));
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(heightOf(canvas.getByTestId("main"))).toBeGreaterThan(main));
    await expect(heightOf(canvas.getByTestId("header"))).toBeCloseTo(header, 0);
    await expect(live).toHaveAccessibleName("Resize Main");
  },
};

export const PanesComingAndGoingInteraction: Story = {
  name: "Removing a pane lets the others keep their proportions, and adding one makes room — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: function Harness() {
    const [showMiddle, setShowMiddle] = useState(true);
    return (
      <div>
        <button type="button" onClick={() => setShowMiddle(!showMiddle)}>
          Toggle
        </button>
        <MeasuredFrame width="40rem">
          <Splitter defaultLayout={showMiddle ? [20, 30, 50] : undefined}>
            <Splitter.Pane key="a" id="a" data-testid="a" defaultSize={20}>A</Splitter.Pane>
            {showMiddle && <Splitter.Pane key="b" id="b" data-testid="b" defaultSize={30}>B</Splitter.Pane>}
            <Splitter.Pane key="c" id="c" data-testid="c" defaultSize={50}>C</Splitter.Pane>
          </Splitter>
        </MeasuredFrame>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ratio = () => widthOf(canvas.getByTestId("a")) / widthOf(canvas.getByTestId("c"));
    await expect(ratio()).toBeCloseTo(20 / 50, 1);
    await userEvent.click(canvas.getByRole("button", { name: "Toggle" }));
    await waitFor(() => expect(canvas.queryByTestId("b")).toBeNull());
    await expect(canvas.getAllByRole("separator")).toHaveLength(1);
    await waitFor(() => expect(ratio()).toBeCloseTo(20 / 50, 1));
    const share = widthOf(canvas.getByTestId("a")) + widthOf(canvas.getByTestId("c"));
    await expect(share).toBeCloseTo(widthOf(canvas.getByTestId("frame")) - widthOf(canvas.getByRole("separator")), 0);
  },
};

export const NamedHandlesInteraction: Story = {
  name: "Each handle is named after the pane before it, computed in the browser — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame>
      <Splitter>
        {pane("a", "A", { label: "Sidebar" })}
        {pane("b", "B", { label: "Content" })}
        {pane("c", "C")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("separator", { name: "Resize Sidebar" })).toBeInTheDocument();
    await expect(canvas.getByRole("separator", { name: "Resize Content" })).toBeInTheDocument();
  },
};

export const ResetInteraction: Story = {
  name: "A double click or Enter on a handle sets the two panes beside it back, leaving the others — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="48rem">
      <Splitter defaultLayout={[20, 30, 50]}>
        {pane("a", "A")}
        {pane("b", "B")}
        {pane("c", "C")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second] = canvas.getAllByRole("separator") as [HTMLElement, HTMLElement];
    const share = () => widthOf(canvas.getByTestId("a")) + widthOf(canvas.getByTestId("b")) + widthOf(canvas.getByTestId("c"));
    const fraction = (id: string) => widthOf(canvas.getByTestId(id)) / share();
    const settled = async (id: string, want: number) => waitFor(() => expect(fraction(id)).toBeCloseTo(want, 2));
    // Drag the first handle, then double click it.
    const start = first.getBoundingClientRect();
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: first, coords: { clientX: start.left, clientY: start.top + 20 } },
      { coords: { clientX: start.left + 100, clientY: start.top + 20 } },
      { keys: "[/MouseLeft]" },
    ]);
    await waitFor(() => expect(fraction("a")).toBeGreaterThan(0.25));
    const cBefore = fraction("c");
    await userEvent.dblClick(first);
    await settled("a", 0.2);
    await settled("b", 0.3);
    // The pane that isn't beside that handle stayed where it was.
    await expect(fraction("c")).toBeCloseTo(cBefore, 2);
    // Enter does the same for the second handle.
    second.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await waitFor(() => expect(fraction("c")).toBeLessThan(0.5));
    await userEvent.keyboard("{Enter}");
    await settled("c", 0.5);
    await settled("a", 0.2);
  },
};

export const ScrollablePaneInteraction: Story = {
  name: "A pane whose content overflows is a tab stop (named when it has a label), and one that fits isn't — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <div style={{ width: "40rem", height: "10rem" }}>
      <Splitter defaultLayout={[40, 30, 30]}>
        <Splitter.Pane data-testid="long" label="Long pane">
          <div style={{ height: "40rem" }}>A pane with far more than fits</div>
        </Splitter.Pane>
        <Splitter.Pane data-testid="unnamed">
          <div style={{ height: "40rem" }}>Also long, with no label</div>
        </Splitter.Pane>
        <Splitter.Pane data-testid="short" label="Short pane">
          <div>Fits</div>
        </Splitter.Pane>
      </Splitter>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId("long")).toHaveAttribute("tabindex", "0"));
    await expect(canvas.getByTestId("long")).toHaveAttribute("role", "region");
    await expect(canvas.getByRole("region", { name: "Long pane" })).toBe(canvas.getByTestId("long"));
    // Unnamed: still reachable, but not announced as a region with no name.
    await expect(canvas.getByTestId("unnamed")).toHaveAttribute("tabindex", "0");
    await expect(canvas.getByTestId("unnamed")).not.toHaveAttribute("role");
    // Content that fits needs no tab stop.
    await expect(canvas.getByTestId("short")).not.toHaveAttribute("tabindex");
    await expect(canvas.queryByRole("region", { name: "Short pane" })).toBeNull();
  },
};

export const CollapsedStripNotScrollableInteraction: Story = {
  name: "A pane collapsed to a strip, its content clipped, is not a tab stop — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <div style={{ width: "40rem", height: "10rem" }}>
      <Splitter defaultLayout={[30, 70]}>
        <Splitter.Pane data-testid="a" collapsible collapsedSize="48px" minSize={15}>
          <div style={{ width: "20rem", whiteSpace: "nowrap" }}>A label wider than the strip it collapses to</div>
        </Splitter.Pane>
        {pane("b", "B")}
      </Splitter>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("separator").focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(48, 0));
    await expect(canvas.getByTestId("a")).not.toHaveAttribute("tabindex");
  },
};

export const FocusLeavesWithPaneInteraction: Story = {
  name: "When the pane that holds focus collapses to nothing, focus moves to its handle — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: function Harness() {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <MeasuredFrame>
        <Splitter defaultLayout={[30, 70]}>
          <Splitter.Pane collapsible minSize={15} collapsed={collapsed} onCollapsedChange={setCollapsed}>
            <button type="button" onKeyDown={(event) => event.key === "Escape" && setCollapsed(true)}>
              Press Escape to close this panel
            </button>
          </Splitter.Pane>
          {pane("b", "B")}
        </Splitter>
      </MeasuredFrame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inside = canvas.getByRole("button", { name: "Press Escape to close this panel" });
    inside.focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveFocus());
    // And the keyboard still works from there: Enter opens the panel again.
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Press Escape to close this panel" })).toBeVisible());
  },
};

export const HidesAtTheEndInteraction: Story = {
  name: "A pane collapsing to nothing keeps its content visible while it closes, and hides it once it has — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame>
      <Splitter defaultLayout={[40, 60]}>
        <Splitter.Pane data-testid="a" collapsible minSize={15}>
          <div data-testid="content">Content</div>
        </Splitter.Pane>
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("separator").focus();
    const start = widthOf(canvas.getByTestId("a"));
    await userEvent.keyboard("{Enter}");
    // Part way through the easing, the pane is narrower but its content is still drawn.
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeLessThan(start * 0.9));
    await expect(widthOf(canvas.getByTestId("a"))).toBeGreaterThan(1);
    await expect(getComputedStyle(canvas.getByTestId("content")).visibility).toBe("visible");
    // Once it has arrived, it is hidden from everyone.
    await waitFor(() => expect(getComputedStyle(canvas.getByTestId("content")).visibility).toBe("hidden"), { timeout: 3000 });
    // And opening it again shows the content at once.
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(getComputedStyle(canvas.getByTestId("content")).visibility).toBe("visible"));
  },
};

export const RailToggleInteraction: Story = {
  name: "A button on the rail opens the pane and closes it again, and keeps keyboard focus — interaction test",
  tags: ["!dev"],
  argTypes: hiddenArgTypes,
  render: () => (
    <MeasuredFrame width="40rem">
      <Splitter defaultLayout={[30, 70]}>
        <Splitter.Pane data-testid="a" collapsible collapsedSize="48px" minSize="10rem">
          {({ collapsed, toggle }) => (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--dbm-space-2)", padding: "var(--dbm-space-2)" }}>
              {!collapsed && <span>Sidebar</span>}
              <IconButton
                icon={collapsed ? CaretRightIcon : CaretLeftIcon}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                size="sm"
                variant="ghost"
                onClick={toggle}
              />
            </div>
          )}
        </Splitter.Pane>
        {pane("b", "B")}
      </Splitter>
    </MeasuredFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = widthOf(canvas.getByTestId("a"));
    await userEvent.click(canvas.getByRole("button", { name: "Collapse sidebar" }));
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(48, 0));
    // The button is on the rail, still reachable, and still the element that has focus.
    const expand = canvas.getByRole("button", { name: "Expand sidebar" });
    await expect(expand).toBeVisible();
    await expect(expand).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(widthOf(canvas.getByTestId("a"))).toBeCloseTo(open, 0));
    await expect(canvas.getByRole("button", { name: "Collapse sidebar" })).toHaveFocus();
  },
};
