import { ListIcon, UsersIcon, WalletIcon } from "@dbm-system/icons";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Affix } from "../../atoms/Affix";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Alert } from "../../molecules/Alert";
import { Breadcrumb } from "../../molecules/Breadcrumb";
import { Card } from "../../molecules/Card";
import { Grid } from "../../molecules/Grid";
import { Stat } from "../../molecules/Stat";
import { Table } from "../../molecules/Table";
import { Navbar } from "../../organisms/Navbar";
import { Sidebar } from "../../organisms/Sidebar";
import { DemoSidebar, preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { AppShell } from "./AppShell";
import { useAppShell } from "./AppShellContext";
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
export function DemoPage({ padded = true }: { padded?: boolean }) {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", padding: padded ? "var(--dbm-space-6)" : undefined }}>
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
      {/* `minChildWidth` fits as many columns as the main area has room for (the sidebar takes some of the window), where `columns` follows the window; the minimum is wide enough for the longest value. */}
      <Grid minChildWidth="20rem" gap={4}>
        <Stat variant="outlined" tone="brand">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active seats</Stat.Label>
          <Stat.Value>248</Stat.Value>
        </Stat>
        <Stat variant="outlined" tone="brand">
          <Stat.Icon icon={ListIcon} />
          <Stat.Label>Open invoices</Stat.Label>
          <Stat.Value>14</Stat.Value>
        </Stat>
        <Stat variant="outlined" tone="brand">
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
          <Table aria-label="Recent invoices" tone="brand" striped style={{ minInlineSize: "40rem" }}>
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
  aside = false,
  banner,
  resizable = false,
  contentWrapper = false,
  stickyFooter = false,
  busy,
  state,
  ...props
}: AppShellProps & {
  children?: ReactNode;
  /** Draws the shell in a box of its own, for a Docs page, where a shell as tall as the window would fill the page. */
  framed?: boolean;
  /** Adds an `AppShell.Aside` with a detail pane, and the toggle that opens it as a drawer below its collapse step. */
  aside?: boolean;
  /** Adds an `AppShell.Banner` with a notice: `"sticky"` keeps it in view while the page scrolls. */
  banner?: boolean | "sticky";
  /** Makes the sidebar column resizable. */
  resizable?: boolean;
  /** Puts the page in an `AppShell.Content`, kept to a readable width. */
  contentWrapper?: boolean;
  /** Makes the footer a bar of actions that stays at the bottom of the window while the page scrolls. */
  stickyFooter?: boolean;
  /** Marks the main area as busy: a bar along its top edge, `aria-busy` and a polite announcement. */
  busy?: boolean;
  /** Puts a whole-page state in the main area in place of the page. */
  state?: "empty" | "error";
}) {
  const side = props.sidebarSide ?? "start";
  const shell = (
    <AppShell {...props} style={framed ? framedStyle(props.scroll) : undefined}>
      {banner && (
        <AppShell.Banner sticky={banner === "sticky"}>
          <Alert tone="info">
            <Alert.Description>Scheduled maintenance tonight at 22:00 UTC. Saving may be unavailable for a few minutes.</Alert.Description>
          </Alert>
        </AppShell.Banner>
      )}
      <AppShell.Header>
        <Navbar>
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
            {aside && <AppShell.AsideToggle />}
            <Sidebar.MenuButton />
          </Navbar.Actions>
        </Navbar>
      </AppShell.Header>
      <AppShell.Sidebar resizable={resizable}>
        {/* The phone drawer is wider than the column on the page (`panelWidth`); it is capped at the window less a sliver of the page. */}
        <DemoSidebar side={side} toggle panelWidth="20rem" />
      </AppShell.Sidebar>
      <AppShell.Main busy={busy}>
        {state !== undefined ? (
          <AppShell.State
            kind={state}
            title={state === "error" ? "We couldn't load this page" : "No invoices yet"}
            description={
              state === "error"
                ? "Something went wrong on our side. Your changes are safe. Try again in a moment."
                : "Invoices appear here once a customer is billed. Create the first one to get started."
            }
            actions={state === "error" ? <Button>Try again</Button> : <Button>Create an invoice</Button>}
          />
        ) : (
          (children ??
            (contentWrapper ? (
            <AppShell.Content size="xl">
              <DemoPage padded={false} />
            </AppShell.Content>
          ) : (
            <DemoPage />
          )))
        )}
      </AppShell.Main>
      {aside && (
        <AppShell.Aside aria-label="Order details">
          <DemoAside />
        </AppShell.Aside>
      )}
      <AppShell.Footer sticky={stickyFooter}>
        {stickyFooter ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--dbm-space-3)", padding: "var(--dbm-space-3) var(--dbm-space-6)" }}>
            <Button variant="secondary">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        ) : (
          <div style={{ padding: "var(--dbm-space-3) var(--dbm-space-6)" }}>
            <Text size="sm" color="secondary">
              © dbM Cloud
            </Text>
          </div>
        )}
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

/** What an `AppShell.Aside` holds in the demos: a small detail pane. */
export function DemoAside() {
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", padding: "var(--dbm-space-6)" }}>
      <Heading level={2} size="lg">
        Order #1042
      </Heading>
      <div>
        <Badge tone="success">Paid</Badge>
      </div>
      <Text color="secondary">Northwind Traders</Text>
      <Text>Two seats of the Team plan, billed monthly, renewing on the 1st.</Text>
      <Text size="sm" color="secondary">
        Last updated by John Doe
      </Text>
    </div>
  );
}

/** A shell whose header is not a `Navbar`: a skip link of the shell's own, and a header that is the page's real banner. */
export function DemoPlainHeaderShell({ framed = false }: { framed?: boolean }) {
  const shell = (
    <AppShell style={framed ? framedStyle("content") : undefined}>
      {/* In an app a router handles the link; here the click moves focus to the main area itself and keeps the preview's address unchanged. */}
      <AppShell.SkipLink
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      />
      <AppShell.Header as="header" data-testid="plain-header">
        <div style={{ padding: "var(--dbm-space-4) var(--dbm-space-6)", borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)" }}>
          <Text weight="bold">dbM Cloud</Text>
        </div>
      </AppShell.Header>
      <AppShell.Main>
        <DemoPage />
      </AppShell.Main>
    </AppShell>
  );
  if (!framed) return shell;
  return <div style={framedBox}>{shell}</div>;
}

const framedBox: CSSProperties = {
  blockSize: frameHeight,
  overflow: "auto",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-lg)",
};

const pages = {
  home: { title: "Home", intro: "Welcome back." },
  reports: { title: "Reports", intro: "Every report, newest first." },
  settings: { title: "Settings", intro: "Preferences for your workspace." },
} as const;
type PageId = keyof typeof pages;

/**
 * A shell that changes page when a sidebar item is pressed, the way a router would: the page's key and title go to the shell, which moves focus
 * to the main area, scrolls it back to the top and announces the new title.
 */
export function DemoNavigationShell({ framed = false }: { framed?: boolean }) {
  const [page, setPage] = useState<PageId>("home");
  const item = (id: PageId) => ({
    href: `#${id}`,
    current: page === id,
    onClick: (event: React.MouseEvent) => {
      event.preventDefault();
      setPage(id);
    },
  });
  const shell = (
    <AppShell pageKey={page} pageTitle={pages[page].title} style={framed ? framedStyle("content") : undefined}>
      <AppShell.Header>
        <Navbar>
          <Navbar.Brand href="#" onClick={preventNavigation}>
            dbM Cloud
          </Navbar.Brand>
          <Navbar.Actions>
            <Sidebar.MenuButton />
          </Navbar.Actions>
        </Navbar>
      </AppShell.Header>
      <AppShell.Sidebar>
        <Sidebar>
          <Sidebar.Content>
            <Sidebar.Nav aria-label="Pages">
              <Sidebar.Item {...item("home")}>Home</Sidebar.Item>
              <Sidebar.Item {...item("reports")}>Reports</Sidebar.Item>
              <Sidebar.Item {...item("settings")}>Settings</Sidebar.Item>
            </Sidebar.Nav>
          </Sidebar.Content>
        </Sidebar>
      </AppShell.Sidebar>
      <AppShell.Main>
        <div style={{ display: "grid", gap: "var(--dbm-space-4)", padding: "var(--dbm-space-6)" }}>
          <Heading level={1} size="2xl">
            {pages[page].title}
          </Heading>
          <Text color="secondary">{pages[page].intro}</Text>
          {Array.from({ length: 40 }, (_, index) => (
            <Text key={index}>
              Paragraph {index + 1} of the {pages[page].title.toLowerCase()} page: long enough that the page has to scroll.
            </Text>
          ))}
        </div>
      </AppShell.Main>
    </AppShell>
  );
  if (!framed) return shell;
  return <div style={framedBox}>{shell}</div>;
}

/** A bar inside the main area that sticks below the header, positioned by the header's height from `useAppShell()`. */
function StickyBar() {
  const { headerHeight } = useAppShell();
  return (
    <div
      data-testid="sticky-bar"
      style={{
        position: "sticky",
        insetBlockStart: "var(--app-shell-header-height, 0px)",
        zIndex: "var(--app-shell-layer-content)",
        padding: "var(--dbm-space-3) var(--dbm-space-6)",
        background: "var(--dbm-bg-surface)",
        borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
      }}
    >
      <Text weight="medium">Filters · the header is {Math.round(headerHeight)}px tall</Text>
    </div>
  );
}

/** A page-scrolling shell with a bar in the main area that sticks below the header. */
export function DemoStickyBarShell({ framed = false }: { framed?: boolean }) {
  return (
    <DemoShell scroll="page" framed={framed}>
      <StickyBar />
      <DemoPage />
    </DemoShell>
  );
}

/** A page that scrolls under a sticky header, with an `Affix` (the system's own sticky element, on the `sticky` step) at the top of the main area. */
export function DemoLayersShell({ framed = false }: { framed?: boolean }) {
  return (
    <DemoShell scroll="page" banner="sticky" headerSpan="full" framed={framed}>
      <div data-testid="layer-content">
        <Affix offset={0}>
          <div data-testid="affix-bar" style={{ padding: "var(--dbm-space-3) var(--dbm-space-6)", background: "var(--dbm-bg-brand-subtle)" }}>
            <Text weight="medium">A sticky bar from the page itself (Affix)</Text>
          </div>
        </Affix>
        <DemoPage />
      </div>
    </DemoShell>
  );
}
