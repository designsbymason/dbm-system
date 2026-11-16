import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import type { CSSProperties, Ref } from "react";
import { Badge } from "../../atoms/Badge";
import type { BadgeTone } from "../../atoms/Badge";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Card } from "../Card";
import { Table } from "./Table";
import { tablePlaygroundSnippet, tableSnippets } from "./Table.snippets";
import type { TableProps, TableSize, TableTone, TableVariant } from "./Table.types";

// `Table`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `Accordion`'s own
// approach. `Table.Header`/`Body`/`Footer`/`Row`/`HeaderCell`/`Cell`/`Caption`
// each get their own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where their argTypes are auto-resolved from real
// docgen.
interface PlaygroundArgs {
  variant: TableVariant;
  tone: TableTone;
  size: TableSize;
  striped: boolean;
  hoverable: boolean;
  stickyHeader: boolean;
  stickyFirstColumn: boolean | number;
  stickyLastColumn: boolean | number;
  maxHeight: string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  containerClassName: string;
  containerRef: Ref<HTMLDivElement>;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

interface Invoice {
  id: string;
  customer: string;
  status: "Paid" | "Pending" | "Overdue" | "Draft";
  amount: number;
}

const invoices: Invoice[] = [
  { id: "INV-001", customer: "Acme Corp", status: "Paid", amount: 250 },
  { id: "INV-002", customer: "Globex", status: "Pending", amount: 150 },
  { id: "INV-003", customer: "Initech", status: "Overdue", amount: 350 },
  { id: "INV-004", customer: "Umbrella Ltd", status: "Paid", amount: 450 },
  { id: "INV-005", customer: "Hooli", status: "Draft", amount: 550 },
  { id: "INV-006", customer: "Stark Industries", status: "Paid", amount: 120 },
  { id: "INV-007", customer: "Wayne Enterprises", status: "Pending", amount: 980 },
  { id: "INV-008", customer: "Wonka Industries", status: "Overdue", amount: 75 },
  { id: "INV-009", customer: "Cyberdyne", status: "Paid", amount: 640 },
  { id: "INV-010", customer: "Soylent Corp", status: "Draft", amount: 310 },
  { id: "INV-011", customer: "Vandelay Imports", status: "Paid", amount: 205 },
  { id: "INV-012", customer: "Massive Dynamic", status: "Pending", amount: 890 },
];

const statusTone: Record<Invoice["status"], BadgeTone> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
  Draft: "neutral",
};

const allTones: TableTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

interface DemoTableProps extends Partial<Omit<TableProps, "children">> {
  rows?: number;
  withFooter?: boolean;
  caption?: string;
}

// No caption by default — the demos below show the table itself. A table
// still needs an accessible name, so without a `caption` it's named via
// `aria-label` instead; only the dedicated `WithCaption` story renders a
// visible `Table.Caption`.
const DemoTable = ({
  rows = 5,
  withFooter = true,
  caption,
  "aria-label": ariaLabel = "Recent invoices",
  ...tableProps
}: DemoTableProps) => {
  const shown = invoices.slice(0, rows);
  const total = shown.reduce((sum, invoice) => sum + invoice.amount, 0);
  return (
    <Table {...tableProps} aria-label={caption ? undefined : ariaLabel}>
      {caption && <Table.Caption>{caption}</Table.Caption>}
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Invoice</Table.HeaderCell>
          <Table.HeaderCell>Customer</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell numeric>Amount</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {shown.map((invoice) => (
          <Table.Row key={invoice.id}>
            <Table.HeaderCell scope="row">{invoice.id}</Table.HeaderCell>
            <Table.Cell>{invoice.customer}</Table.Cell>
            <Table.Cell>
              <Badge tone={statusTone[invoice.status]} size="sm">
                {invoice.status}
              </Badge>
            </Table.Cell>
            <Table.Cell numeric>{formatCurrency(invoice.amount)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      {withFooter && (
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell scope="row" colSpan={3}>
              Total
            </Table.HeaderCell>
            <Table.Cell numeric>{formatCurrency(total)}</Table.Cell>
          </Table.Row>
        </Table.Footer>
      )}
    </Table>
  );
};

const demoContainerStyle = {
  maxWidth: "44rem",
  marginInline: "auto",
} as const;

// Every fixed-render story below ignores the Playground's own `args`, so each
// one suppresses every root-prop control it doesn't consume (a story-level
// `argTypes` entry merges over the meta-level one per key) — otherwise the
// Controls panel would show live-looking toggles that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  striped: { control: false },
  hoverable: { control: false },
  stickyHeader: { control: false },
  stickyFirstColumn: { control: false },
  stickyLastColumn: { control: false },
  maxHeight: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  "aria-describedby": { control: false },
  containerClassName: { control: false },
  containerRef: { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Table",
  id: "molecules-data-display-table",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description:
        "The table's own visual treatment — a self-contained bordered table, or a borderless treatment for embedding inside an already-bordered container (e.g. a Card).",
      table: { defaultValue: { summary: "'bordered'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "The table's colour treatment. neutral (the default) is uncoloured; every other tone gives the header and caption a solid fill in that colour with matching on-colour text, and tints the striped and hoverable row backgrounds to match. brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Cell padding and typography for every Table.Cell and Table.HeaderCell inside the table.",
      table: { defaultValue: { summary: "'md'" } },
    },
    striped: {
      control: "boolean",
      description: "Alternates the background of every other Table.Body row, to help the eye track a row across a wide table.",
      table: { defaultValue: { summary: "false" } },
    },
    hoverable: {
      control: "boolean",
      description:
        "Highlights a Table.Body row while the pointer is over it. Purely a reading aid — the table itself stays non-interactive.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyHeader: {
      control: "boolean",
      description:
        "Pins the Table.Header row to the top of the table's own scroll area while the body scrolls beneath it. Only has an effect when the table's height is constrained — set maxHeight.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyFirstColumn: {
      control: "boolean",
      options: [false, true, 2, 3, 4],
      description:
        "Pins the first column to the start edge of the table's own scroll area while the rest scrolls sideways beneath it, so a row's label stays in view in a wide table. A number pins that many columns (up to 4), each against the one before it: their widths are measured from the header row. Only has a visible effect when the table is wider than its space; needs no maxHeight. A cell that spans several columns isn't pinned and moves the cells after it out of their columns. The Playground's switch is true (one column); pass a number in code.",
      table: { defaultValue: { summary: "false" } },
    },
    stickyLastColumn: {
      control: "boolean",
      options: [false, true, 2, 3, 4],
      description:
        "Pins the last column to the end edge of the table's own scroll area while the rest scrolls sideways beneath it — the mirror of stickyFirstColumn, for a trailing column (an actions column, a running total) that should stay in view. A number pins that many columns (up to 4), as stickyFirstColumn does. Can be combined with stickyFirstColumn; needs no maxHeight.",
      table: { defaultValue: { summary: "false" } },
    },
    maxHeight: {
      control: "text",
      description:
        "Caps the height of the table's own scroll container (any valid CSS max-height value, e.g. 24rem), so a long body scrolls inside it instead of growing the page. Required for stickyHeader to have any effect.",
      // Cosmetic only — never becomes a real arg (see `PlaygroundControls.tsx`).
      // The Playground's own `render` maps an empty value to `undefined`,
      // matching this prop's real "no cap" default.
      placeholder: "none — e.g. 16rem",
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the table, for when there's no visible Table.Caption. Also names the table's own scroll region when it overflows.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "The id of an element that names this table (e.g. a nearby heading), for when there's no visible Table.Caption. Also names the table's own scroll region when it overflows.",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this table (e.g. a paragraph of context above it).",
    },
    containerClassName: {
      control: false,
      description:
        "Additional CSS classes for the table's own scroll container — the <div> wrapping the <table>. className targets the <table> element itself; use this for anything that needs to affect the scrolling frame instead.",
    },
    containerRef: {
      control: false,
      description:
        "A ref to the table's own scroll container (the <div> that containerClassName and maxHeight target). ref reaches the <table>; use this to read or drive the scroll position, as a windowed list of rows does.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the <table> element. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this table.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for the <table> element itself.",
    },
    style: {
      control: false,
      description: "Inline styles for the <table> element itself, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute on the <table>; has no visual or behavioral effect.",
    },
  },
  args: {
    variant: "bordered",
    tone: "neutral",
    size: "md",
    striped: false,
    hoverable: false,
    stickyHeader: false,
    stickyFirstColumn: false,
    stickyLastColumn: false,
    maxHeight: "",
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <DemoTable
        rows={6}
        variant={args.variant}
        tone={args.tone}
        size={args.size}
        striped={args.striped}
        hoverable={args.hoverable}
        stickyHeader={args.stickyHeader}
        stickyFirstColumn={args.stickyFirstColumn}
        stickyLastColumn={args.stickyLastColumn}
        maxHeight={args.maxHeight || undefined}
      />
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. Set `stickyHeader` together with a `maxHeight` (e.g. `12rem`) to see the header pin. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from
  // their defaults, on a small real table — instead of the story's own source,
  // which is helper components a reader can't paste.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => tablePlaygroundSnippet(context.args),
      },
    },
  },
};

export const WithCaption: Story = {
  name: "With a caption",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.withCaption } } },
  render: () => (
    // The one story with a visible caption — shown in every tone, since a
    // non-neutral tone's caption takes that tone's fill along with the header.
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {allTones.map((tone) => (
        <div key={tone}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            tone=&quot;{tone}&quot;
          </Text>
          <DemoTable tone={tone} caption="Recent invoices" rows={2} withFooter={false} />
        </div>
      ))}
    </div>
  ),
};

export const Striped: Story = {
  name: "Striped rows",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.striped } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable striped />
    </div>
  ),
};

export const Hoverable: Story = {
  name: "Hoverable rows",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.hoverable } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable hoverable />
    </div>
  ),
};

export const StripedAndHoverable: Story = {
  name: "Striped and hoverable together",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stripedAndHoverable } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable striped hoverable />
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.tones } } },
  render: () => (
    // Striped and hoverable so each tone's stripe and hover tint are visible
    // too, not just its header.
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {allTones.map((tone) => (
        <div key={tone}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            tone=&quot;{tone}&quot;
          </Text>
          <DemoTable tone={tone} striped hoverable rows={3} withFooter={false} aria-label={`Invoices (${tone})`} />
        </div>
      ))}
    </div>
  ),
};

export const StickyHeader: Story = {
  name: "Sticky header (scroll the body)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stickyHeader } } },
  render: () => (
    <div style={demoContainerStyle}>
      <DemoTable stickyHeader maxHeight="18rem" rows={12} striped />
    </div>
  ),
};

export const Ghost: Story = {
  name: "Ghost variant (borderless, for embedding in a Card)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.ghost } } },
  render: () => (
    // `ghost` exists for exactly this: a table inside a container that already
    // draws the boundary. Here that container is a real `Card`, with its own
    // title, so its border reads as a separate container the ghost table sits
    // inside, not as the table's own (removed) border redrawn in the same place.
    <div style={demoContainerStyle}>
      <Card>
        <Card.Header>
          <Heading level={3} size="md">
            Billing
          </Heading>
        </Card.Header>
        <DemoTable variant="ghost" rows={4} />
      </Card>
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.sizes } } },
  render: () => (
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            size=&quot;{size}&quot;
          </Text>
          <DemoTable size={size} rows={2} withFooter={false} aria-label={`Invoices (${size})`} />
        </div>
      ))}
    </div>
  ),
};

export const Alignment: Story = {
  name: "Cell alignment (start, center, end)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.alignment } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Table aria-label="Quarterly revenue">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Region</Table.HeaderCell>
            <Table.HeaderCell align="center">Deals</Table.HeaderCell>
            <Table.HeaderCell align="end">Revenue</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope="row">North America</Table.HeaderCell>
            <Table.Cell align="center">128</Table.Cell>
            <Table.Cell align="end">$1,240,000.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">Europe</Table.HeaderCell>
            <Table.Cell align="center">94</Table.Cell>
            <Table.Cell align="end">$860,500.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">Asia Pacific</Table.HeaderCell>
            <Table.Cell align="center">61</Table.Cell>
            <Table.Cell align="end">$492,250.00</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  ),
};

export const GroupedColumns: Story = {
  name: "Grouped columns (colSpan)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.groupedColumns } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Table aria-label="Signups by plan">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell rowSpan={2}>Month</Table.HeaderCell>
            <Table.HeaderCell scope="colgroup" colSpan={2} align="center">
              Free
            </Table.HeaderCell>
            <Table.HeaderCell scope="colgroup" colSpan={2} align="center">
              Pro
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell align="end">New</Table.HeaderCell>
            <Table.HeaderCell align="end">Churned</Table.HeaderCell>
            <Table.HeaderCell align="end">New</Table.HeaderCell>
            <Table.HeaderCell align="end">Churned</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope="row">January</Table.HeaderCell>
            <Table.Cell align="end">1,204</Table.Cell>
            <Table.Cell align="end">210</Table.Cell>
            <Table.Cell align="end">96</Table.Cell>
            <Table.Cell align="end">8</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">February</Table.HeaderCell>
            <Table.Cell align="end">1,388</Table.Cell>
            <Table.Cell align="end">199</Table.Cell>
            <Table.Cell align="end">121</Table.Cell>
            <Table.Cell align="end">11</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  ),
};

// A wide table — seven columns — for the sticky-first-column demo. Sits in a
// deliberately narrow frame so the table overflows and scrolls sideways.
const wideRows = [
  { id: "INV-001", customer: "Acme Corp", email: "billing@acme.example", plan: "Enterprise annual", renewal: "Jan 15, 2027", status: "Paid", amount: 2500 },
  { id: "INV-002", customer: "Globex", email: "accounts@globex.example", plan: "Team monthly", renewal: "Oct 2, 2026", status: "Pending", amount: 150 },
  { id: "INV-003", customer: "Initech", email: "ap@initech.example", plan: "Business annual", renewal: "Mar 30, 2027", status: "Overdue", amount: 1200 },
  { id: "INV-004", customer: "Umbrella Ltd", email: "finance@umbrella.example", plan: "Team monthly", renewal: "Nov 11, 2026", status: "Paid", amount: 450 },
  { id: "INV-005", customer: "Hooli", email: "ar@hooli.example", plan: "Enterprise annual", renewal: "Jun 1, 2027", status: "Draft", amount: 3100 },
] as const;

const WideTable = (props: Partial<Omit<TableProps, "children">>) => (
  <Table aria-label="Wide invoices" {...props}>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Invoice</Table.HeaderCell>
        <Table.HeaderCell>Customer</Table.HeaderCell>
        <Table.HeaderCell>Email</Table.HeaderCell>
        <Table.HeaderCell>Plan</Table.HeaderCell>
        <Table.HeaderCell>Renewal</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell numeric>Amount</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {wideRows.map((row) => (
        <Table.Row key={row.id}>
          <Table.HeaderCell scope="row">{row.id}</Table.HeaderCell>
          <Table.Cell>{row.customer}</Table.Cell>
          <Table.Cell>{row.email}</Table.Cell>
          <Table.Cell>{row.plan}</Table.Cell>
          <Table.Cell>{row.renewal}</Table.Cell>
          <Table.Cell>{row.status}</Table.Cell>
          <Table.Cell numeric>{formatCurrency(row.amount)}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
    <Table.Footer>
      <Table.Row>
        <Table.HeaderCell scope="row">Total</Table.HeaderCell>
        <Table.Cell colSpan={5} />
        <Table.Cell numeric>{formatCurrency(wideRows.reduce((sum, row) => sum + row.amount, 0))}</Table.Cell>
      </Table.Row>
    </Table.Footer>
  </Table>
);

export const StickyFirstColumn: Story = {
  name: "Sticky first column (scroll sideways)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stickyFirstColumn } } },
  render: () => (
    // Striped and hoverable so the pinned cells visibly keep matching their
    // row's tint; a brand tone shows the pinned header cell keeping its fill.
    <div style={{ maxWidth: "34rem", marginInline: "auto" }}>
      <WideTable stickyFirstColumn striped hoverable tone="brand" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("table");
    const container = table?.parentElement;
    const firstCell = table?.querySelector("tbody th");
    if (!table || !container || !firstCell) throw new Error("Table not rendered");
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    const before = firstCell.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollLeft = 200;
    // Scrolling moves the rest of the table under the pinned column; the pinned
    // cell itself must not move relative to the frame.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const after = firstCell.getBoundingClientRect().left - container.getBoundingClientRect().left;
    await expect(container.scrollLeft).toBeGreaterThan(0);
    await expect(Math.abs(after - before)).toBeLessThan(2);
  },
};

export const StickyLastColumn: Story = {
  name: "Sticky last column (scroll sideways)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stickyLastColumn } } },
  render: () => (
    // The last column — here the amounts and the total — stays in view at the
    // end edge. Striped and hoverable so the pinned cells visibly keep matching
    // their row's tint; a success tone shows the pinned header cell's fill.
    <div style={{ maxWidth: "34rem", marginInline: "auto" }}>
      <WideTable stickyLastColumn striped hoverable tone="success" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("table");
    const container = table?.parentElement;
    const lastCell = table?.querySelector("tbody tr td:last-child");
    if (!table || !container || !lastCell) throw new Error("Table not rendered");
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    const gapToEndEdge = () => container.getBoundingClientRect().right - lastCell.getBoundingClientRect().right;
    // Unscrolled, the last column's natural position is far off the end edge; if
    // it's pinned it already sits against that edge (the frame's own 1px border).
    const before = gapToEndEdge();
    await expect(before).toBeLessThan(4);
    container.scrollLeft = 150;
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(container.scrollLeft).toBeGreaterThan(0);
    await expect(Math.abs(gapToEndEdge() - before)).toBeLessThan(2);
  },
};

export const StickyFirstAndLastColumns: Story = {
  name: "Sticky first and last columns together",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stickyFirstAndLastColumns } } },
  render: () => (
    // Both edges pinned, plus the header: scroll in either direction and the
    // row label, the trailing figure, and the header row all stay in view.
    <div style={{ maxWidth: "34rem", marginInline: "auto" }}>
      <WideTable stickyFirstColumn stickyLastColumn stickyHeader maxHeight="13rem" striped />
    </div>
  ),
};

export const StickySeveralColumns: Story = {
  name: "Several sticky columns at each edge",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stickySeveralColumns } } },
  render: () => (
    // A number pins that many columns, each against the one pinned before it.
    <div style={{ maxWidth: "34rem", marginInline: "auto" }}>
      <WideTable stickyFirstColumn={2} stickyLastColumn={2} stickyHeader maxHeight="13rem" striped />
    </div>
  ),
};

export const StickyHeaderAndColumn: Story = {
  name: "Sticky header and first column together",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.stickyHeaderAndColumn } } },
  render: () => (
    // Both pinned: scroll in either direction and the header row and the first
    // column stay in view, with the corner cell above both.
    <div style={{ maxWidth: "34rem", marginInline: "auto" }}>
      <WideTable stickyHeader stickyFirstColumn maxHeight="13rem" tone="info" striped />
    </div>
  ),
};

export const Numeric: Story = {
  name: "Numeric columns (tabular figures)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.numeric } } },
  render: () => (
    // The same figures twice: right-aligned alone, then with `numeric`. Shown in
    // the system UI font on purpose — its digits are proportional by default (a
    // "1" is narrower than an "8"), and `numeric`'s tabular figures fix that.
    // Nunito's own digits are already equal-width, so in Nunito the two would
    // look identical and demonstrate nothing; the system font is what a page
    // falls back to when Nunito isn't loaded.
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <Text size="sm" color="secondary">
        Shown in the system UI font, whose digits are proportional by default. Nunito&apos;s digits are already
        equal-width, so there the two tables would look the same.
      </Text>
      {(["align", "numeric"] as const).map((mode) => (
        <div key={mode}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            {mode === "align" ? 'align="end" only' : "numeric"}
          </Text>
          <Table aria-label={`Figures (${mode})`} style={{ fontFamily: "system-ui, sans-serif" }}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Region</Table.HeaderCell>
                {mode === "align" ? (
                  <Table.HeaderCell align="end">Revenue</Table.HeaderCell>
                ) : (
                  <Table.HeaderCell numeric>Revenue</Table.HeaderCell>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {[
                ["North America", "$1,111,111.11"],
                ["Europe", "$888,888.88"],
                ["Asia Pacific", "$1,010,101.01"],
                ["Latin America", "$8,181,818.18"],
              ].map(([region, amount]) =>
                mode === "align" ? (
                  <Table.Row key={region}>
                    <Table.Cell>{region}</Table.Cell>
                    <Table.Cell align="end">{amount}</Table.Cell>
                  </Table.Row>
                ) : (
                  <Table.Row key={region}>
                    <Table.Cell>{region}</Table.Cell>
                    <Table.Cell numeric>{amount}</Table.Cell>
                  </Table.Row>
                ),
              )}
            </Table.Body>
          </Table>
        </div>
      ))}
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading state (skeleton rows)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.loading } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Table aria-label="Recent invoices">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell numeric>Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body loading loadingRows={4} />
      </Table>
    </div>
  ),
};

export const Empty: Story = {
  name: "Empty state",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.empty } } },
  render: () => (
    <div style={demoContainerStyle}>
      <Table aria-label="Recent invoices">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell numeric>Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Empty>No invoices yet — create one to get started.</Table.Empty>
        </Table.Body>
      </Table>
    </div>
  ),
};

export const NarrowScroll: Story = {
  name: "Narrow container (scrolls sideways, keyboard-reachable)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableSnippets.narrowScroll } } },
  render: () => (
    // A deliberately narrow frame — the table is wider than it, so its own
    // scroll container overflows. Tab onto it and use the arrow keys.
    <div style={{ maxWidth: "22rem", marginInline: "auto" }}>
      <Table aria-label="Wide table example">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Plan</Table.HeaderCell>
            <Table.HeaderCell>Renewal date</Table.HeaderCell>
            <Table.HeaderCell align="end">Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope="row">INV-001</Table.HeaderCell>
            <Table.Cell>Acme Corp</Table.Cell>
            <Table.Cell>billing@acme.example</Table.Cell>
            <Table.Cell>Enterprise annual</Table.Cell>
            <Table.Cell>January 15, 2027</Table.Cell>
            <Table.Cell align="end">$2,500.00</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope="row">INV-002</Table.HeaderCell>
            <Table.Cell>Globex</Table.Cell>
            <Table.Cell>accounts@globex.example</Table.Cell>
            <Table.Cell>Team monthly</Table.Cell>
            <Table.Cell>October 2, 2026</Table.Cell>
            <Table.Cell align="end">$150.00</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The container only becomes a focusable, named region once it actually
    // overflows — found asynchronously via ResizeObserver, hence `findBy`.
    const region = await canvas.findByRole("region", { name: "Wide table example" });
    await userEvent.tab();
    await expect(region).toHaveFocus();
  },
};
