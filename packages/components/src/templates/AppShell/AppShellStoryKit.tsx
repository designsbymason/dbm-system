import { ListIcon, UsersIcon, WalletIcon } from "@dbm-system/icons";
import type { CSSProperties, ReactNode } from "react";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Breadcrumb } from "../../molecules/Breadcrumb";
import { Card } from "../../molecules/Card";
import { Grid } from "../../molecules/Grid";
import { Stat } from "../../molecules/Stat";
import { Table } from "../../molecules/Table";
import { Navbar } from "../../organisms/Navbar";
import { Sidebar } from "../../organisms/Sidebar";
import { DemoSidebar, preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { AppShell } from "./AppShell";
import type { AppShellProps } from "./AppShell.types";

// Storybook-only: the page every AppShell story fills the slots with. Built from the library's own components, no hardcoded values.

const rows = [
  ["INV-1042", "Northwind Traders", "Paid", "$2,400.00"],
  ["INV-1043", "Globex Corporation", "Pending", "$1,180.50"],
  ["INV-1044", "Initech", "Paid", "$960.00"],
  ["INV-1045", "Umbrella Group", "Overdue", "$3,725.25"],
  ["INV-1046", "Stark Industries", "Paid", "$12,000.00"],
  ["INV-1047", "Wayne Enterprises", "Pending", "$4,310.00"],
  ["INV-1048", "Hooli", "Paid", "$780.00"],
  ["INV-1049", "Soylent Corp", "Paid", "$1,950.00"],
  ["INV-1050", "Vandelay Industries", "Overdue", "$615.75"],
  ["INV-1051", "Pied Piper", "Pending", "$5,200.00"],
  ["INV-1052", "Cyberdyne Systems", "Paid", "$8,640.00"],
  ["INV-1053", "Massive Dynamic", "Paid", "$2,075.00"],
];

/** The page a demo shell shows in its main area: a breadcrumb, a heading, three statistics and a table wide enough to scroll on a phone. */
export function DemoPage() {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", padding: "var(--dbm-space-6)" }}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#" onClick={preventNavigation}>
            Home
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Billing</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div style={{ display: "grid", gap: "var(--dbm-space-1)" }}>
        <Heading level={1} size="2xl">
          Billing
        </Heading>
        <Text color="secondary">Invoices and usage for the current period.</Text>
      </div>
      {/* `minChildWidth` fits as many columns as the main area has room for (the sidebar takes some of the window), where `columns` follows the window; `fitValue` keeps a long value inside its stat. */}
      <Grid minChildWidth="16rem" gap={4}>
        <Stat variant="outlined" tone="brand" fitValue>
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active seats</Stat.Label>
          <Stat.Value>248</Stat.Value>
        </Stat>
        <Stat variant="outlined" tone="brand" fitValue>
          <Stat.Icon icon={ListIcon} />
          <Stat.Label>Open invoices</Stat.Label>
          <Stat.Value>14</Stat.Value>
        </Stat>
        <Stat variant="outlined" tone="brand" fitValue>
          <Stat.Icon icon={WalletIcon} />
          <Stat.Label>Balance due</Stat.Label>
          <Stat.Value>$9,851.50</Stat.Value>
        </Stat>
      </Grid>
      <Card variant="outlined">
        <Card.Header>
          <Heading level={2} size="lg">
            Recent invoices
          </Heading>
        </Card.Header>
        <Card.Body>
          <Table aria-label="Recent invoices" tone="brand" style={{ minInlineSize: "40rem" }}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell numeric>Amount</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map(([id, customer, status, amount]) => (
                <Table.Row key={id}>
                  <Table.HeaderCell scope="row">{id}</Table.HeaderCell>
                  <Table.Cell>{customer}</Table.Cell>
                  <Table.Cell>{status}</Table.Cell>
                  <Table.Cell numeric>{amount}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

/** The shell's own style inside the Docs frame: as tall as the frame, or (page scroll) at least that tall with the frame scrolling it. */
function framedStyle(scroll: AppShellProps["scroll"]): CSSProperties {
  return scroll === "page"
    ? ({ minBlockSize: "100%", "--app-shell-viewport-size": frameHeight } as CSSProperties)
    : { blockSize: "100%", minBlockSize: 0 };
}

const frameHeight = "36rem";

/**
 * A whole shell filled in: a sidebar, a `Navbar` with a skip link, the phone menu button and the sidebar toggle, the demo page and a footer.
 * Pass `sidebarSide="end"` and the sidebar and its line move together.
 */
export function DemoShell({
  children,
  framed = false,
  ...props
}: AppShellProps & {
  children?: ReactNode;
  /** Draws the shell in a box of its own, for a Docs page, where a shell as tall as the window would fill the page. */
  framed?: boolean;
}) {
  const side = props.sidebarSide ?? "start";
  const dir = props.dir ?? "ltr";
  const shell = (
    <AppShell {...props} style={framed ? framedStyle(props.scroll) : undefined}>
      <AppShell.Header>
        <Navbar dir={dir}>
          {/* In an app a router handles the link; here the click moves focus to the main area itself and keeps the preview's address unchanged. */}
          <Navbar.SkipLink
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("main")?.focus();
            }}
          />
          <Navbar.Brand href="#" onClick={preventNavigation}>
            dbM Cloud
          </Navbar.Brand>
          <Navbar.Actions>
            <Sidebar.MenuButton />
          </Navbar.Actions>
        </Navbar>
      </AppShell.Header>
      <AppShell.Sidebar>
        <DemoSidebar side={side} dir={dir} toggle />
      </AppShell.Sidebar>
      <AppShell.Main>{children ?? <DemoPage />}</AppShell.Main>
      <AppShell.Footer>
        <div style={{ padding: "var(--dbm-space-3) var(--dbm-space-6)", borderBlockStart: "var(--dbm-border-width-1) solid var(--dbm-border-default)" }}>
          <Text size="sm" color="secondary">
            © dbM Cloud
          </Text>
        </div>
      </AppShell.Footer>
    </AppShell>
  );
  if (!framed) return shell;
  return (
    <div
      style={{
        blockSize: frameHeight,
        overflow: "auto",
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
      }}
    >
      {shell}
    </div>
  );
}
