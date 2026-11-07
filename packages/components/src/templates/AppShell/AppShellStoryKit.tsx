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
import type { SidebarProps } from "../../organisms/Sidebar";
import { DemoSidebar, preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { AppShell } from "./AppShell";
import { useAppShell } from "./AppShellContext";
import type { AppShellProps } from "./AppShell.types";

// Storybook-only: the page every AppShell story fills the slots with. Built from the library's own components, no hardcoded values.

/** The language of a demo's words: every right-to-left story uses Persian, so a right-to-left demo is read, and not only mirrored. */
type Language = "en" | "fa";

const rowsEn = [
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

const rowsFa = [
  ["INV-1042", "شرکت نوین‌تجارت", "پرداخت‌شده", "۲٬۴۰۰٫۰۰ دلار"],
  ["INV-1043", "گروه صنعتی آرمان", "در انتظار", "۱٬۱۸۰٫۵۰ دلار"],
  ["INV-1044", "فناوری پارسیان", "پرداخت‌شده", "۹۶۰٫۰۰ دلار"],
  ["INV-1045", "مجتمع البرز", "معوق", "۳٬۷۲۵٫۲۵ دلار"],
  ["INV-1046", "صنایع فولاد سپهر", "پرداخت‌شده", "۱۲٬۰۰۰٫۰۰ دلار"],
  ["INV-1047", "سرمایه‌گذاری دماوند", "در انتظار", "۴٬۳۱۰٫۰۰ دلار"],
  ["INV-1048", "نرم‌افزار آریا", "پرداخت‌شده", "۷۸۰٫۰۰ دلار"],
  ["INV-1049", "شرکت پویش داده", "پرداخت‌شده", "۱٬۹۵۰٫۰۰ دلار"],
  ["INV-1050", "بازرگانی خلیج فارس", "معوق", "۶۱۵٫۷۵ دلار"],
  ["INV-1051", "آزمایشگاه نوآوران", "در انتظار", "۵٬۲۰۰٫۰۰ دلار"],
  ["INV-1052", "سامانه‌های هوشمند تهران", "پرداخت‌شده", "۸٬۶۴۰٫۰۰ دلار"],
  ["INV-1053", "پویایی بزرگ", "پرداخت‌شده", "۲٬۰۷۵٫۰۰ دلار"],
];

/** Every word the demo shells draw, by language. The brand ("dbM Cloud") is a name and stays as it is. */
export const demoCopy = {
  en: {
    home: "Home",
    billing: "Billing",
    intro: "Invoices and usage for the current period.",
    seats: "Active seats",
    seatsValue: "248",
    open: "Open invoices",
    openValue: "14",
    balance: "Balance due",
    balanceValue: "$9,851.50",
    recent: "Recent invoices",
    invoice: "Invoice",
    customer: "Customer",
    status: "Status",
    amount: "Amount",
    rows: rowsEn,
    orderTitle: "Order #1042",
    paid: "Paid",
    orderCustomer: "Northwind Traders",
    orderText: "Two seats of the Team plan, billed monthly, renewing on the 1st.",
    updated: "Last updated by John Doe",
    orderDetails: "Order details",
    banner: "Scheduled maintenance tonight at 22:00 UTC. Saving may be unavailable for a few minutes.",
    footer: "© dbM Cloud",
    cancel: "Cancel",
    save: "Save changes",
    errorTitle: "We couldn't load this page",
    errorText: "Something went wrong on our side. Your changes are safe. Try again in a moment.",
    errorAction: "Try again",
    emptyTitle: "No invoices yet",
    emptyText: "Invoices appear here once a customer is billed. Create the first one to get started.",
    emptyAction: "Create an invoice",
  },
  fa: {
    home: "خانه",
    billing: "صورتحساب",
    intro: "صورتحساب‌ها و میزان مصرف دوره جاری.",
    seats: "صندلی‌های فعال",
    seatsValue: "۲۴۸",
    open: "صورتحساب‌های باز",
    openValue: "۱۴",
    balance: "مانده بدهی",
    balanceValue: "۹٬۸۵۱٫۵۰ دلار",
    recent: "صورتحساب‌های اخیر",
    invoice: "شماره",
    customer: "مشتری",
    status: "وضعیت",
    amount: "مبلغ",
    rows: rowsFa,
    orderTitle: "سفارش ۱۰۴۲",
    paid: "پرداخت‌شده",
    orderCustomer: "شرکت نوین‌تجارت",
    orderText: "دو صندلی از طرح تیم، ماهانه صورتحساب می‌شود و در روز اول ماه تمدید می‌گردد.",
    updated: "آخرین به‌روزرسانی: علی رضایی",
    orderDetails: "جزئیات سفارش",
    banner: "نگهداری برنامه‌ریزی‌شده امشب ساعت ۲۲:۰۰ به وقت جهانی. ذخیره‌سازی ممکن است چند دقیقه در دسترس نباشد.",
    footer: "© dbM Cloud",
    cancel: "انصراف",
    save: "ذخیره تغییرات",
    errorTitle: "بارگذاری این صفحه ممکن نشد",
    errorText: "مشکلی از سمت ما پیش آمد. تغییرات شما محفوظ است. لطفاً کمی بعد دوباره تلاش کنید.",
    errorAction: "تلاش دوباره",
    emptyTitle: "هنوز صورتحسابی نیست",
    emptyText: "با صدور اولین صورتحساب برای یک مشتری، فهرست آن‌ها اینجا نمایش داده می‌شود. برای شروع، اولین صورتحساب را بسازید.",
    emptyAction: "ایجاد صورتحساب",
  },
} as const;

/** The labels the parts supply themselves, in Persian, for a right-to-left demo (English is each part's own default). */
const faLabels = {
  shell: { navigation: "پیمایش اصلی", collapse: "جمع کردن نوار کناری", expand: "باز کردن نوار کناری", menu: "منو", close: "بستن", loading: "در حال بارگذاری", externalLink: "پیوند خارجی" },
  navbar: { menu: "منو", navigation: "پیمایش اصلی", close: "بستن", skipLink: "رفتن به محتوا", externalLink: "پیوند خارجی" },
  sidebarSlot: { resize: "تغییر اندازه نوار کناری" },
  main: { loading: "در حال بارگذاری" },
  aside: { title: "جزئیات", close: "بستن" },
  asideToggle: { open: "نمایش جزئیات" },
} as const;

/** The page a demo shell shows in its main area: a breadcrumb, a heading, three statistics and a table wide enough to scroll on a phone. */
export function DemoPage({ padded = true, language = "en" }: { padded?: boolean; language?: Language }) {
  const copy = demoCopy[language];
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)", padding: padded ? "var(--dbm-space-6)" : undefined }}>
      <Breadcrumb>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#" onClick={preventNavigation}>
            {copy.home}
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Breadcrumb.Page>{copy.billing}</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div style={{ display: "grid", gap: "var(--dbm-space-1)" }}>
        <Heading level={1} size="2xl">
          {copy.billing}
        </Heading>
        <Text color="secondary">{copy.intro}</Text>
      </div>
      {/* `minChildWidth` fits as many columns as the main area has room for (the sidebar takes some of the window), where `columns` follows the window; the minimum is wide enough for the longest value. */}
      <Grid minChildWidth="20rem" gap={4}>
        <Stat variant="outlined" tone="brand">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>{copy.seats}</Stat.Label>
          <Stat.Value>{copy.seatsValue}</Stat.Value>
        </Stat>
        <Stat variant="outlined" tone="brand">
          <Stat.Icon icon={ListIcon} />
          <Stat.Label>{copy.open}</Stat.Label>
          <Stat.Value>{copy.openValue}</Stat.Value>
        </Stat>
        <Stat variant="outlined" tone="brand">
          <Stat.Icon icon={WalletIcon} />
          <Stat.Label>{copy.balance}</Stat.Label>
          <Stat.Value>{copy.balanceValue}</Stat.Value>
        </Stat>
      </Grid>
      <Card variant="outlined">
        <Card.Header>
          <Heading level={2} size="lg">
            {copy.recent}
          </Heading>
        </Card.Header>
        <Card.Body>
          <Table aria-label={copy.recent} tone="brand" striped style={{ minInlineSize: "40rem" }}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{copy.invoice}</Table.HeaderCell>
                <Table.HeaderCell>{copy.customer}</Table.HeaderCell>
                <Table.HeaderCell>{copy.status}</Table.HeaderCell>
                <Table.HeaderCell numeric>{copy.amount}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {copy.rows.map(([id, customer, status, amount]) => (
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
  sidebarVariant,
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
  /** The `Sidebar`'s `variant`, for a look that is not the default. */
  sidebarVariant?: SidebarProps["variant"];
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
  // A right-to-left demo is in Persian (and its parts' own words too), so it is read and not only mirrored.
  const language: Language = props.dir === "rtl" ? "fa" : "en";
  const copy = demoCopy[language];
  const fa = language === "fa";
  const shell = (
    <AppShell {...props} labels={fa ? { ...faLabels.shell, ...props.labels } : props.labels} style={framed ? framedStyle(props.scroll) : undefined}>
      {banner && (
        <AppShell.Banner sticky={banner === "sticky"}>
          <Alert banner tone="info">
            <Alert.Description>{copy.banner}</Alert.Description>
          </Alert>
        </AppShell.Banner>
      )}
      <AppShell.Header>
        <Navbar labels={fa ? faLabels.navbar : undefined}>
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
            {aside && <AppShell.AsideToggle labels={fa ? faLabels.asideToggle : undefined} />}
            <Sidebar.MenuButton />
          </Navbar.Actions>
        </Navbar>
      </AppShell.Header>
      <AppShell.Sidebar resizable={resizable} labels={fa ? faLabels.sidebarSlot : undefined}>
        {/* The phone drawer is wider than the column on the page (`panelWidth`); it is capped at the window less a sliver of the page. */}
        <DemoSidebar side={side} toggle panelWidth="20rem" variant={sidebarVariant} language={language} />
      </AppShell.Sidebar>
      <AppShell.Main busy={busy} labels={fa ? faLabels.main : undefined}>
        {state !== undefined ? (
          <AppShell.State
            kind={state}
            title={state === "error" ? copy.errorTitle : copy.emptyTitle}
            description={state === "error" ? copy.errorText : copy.emptyText}
            actions={state === "error" ? <Button>{copy.errorAction}</Button> : <Button>{copy.emptyAction}</Button>}
          />
        ) : (
          (children ??
            (contentWrapper ? (
            <AppShell.Content size="xl">
              <DemoPage padded={false} language={language} />
            </AppShell.Content>
          ) : (
            <DemoPage language={language} />
          )))
        )}
      </AppShell.Main>
      {aside && (
        <AppShell.Aside aria-label={copy.orderDetails} labels={fa ? faLabels.aside : undefined}>
          <DemoAside language={language} />
        </AppShell.Aside>
      )}
      <AppShell.Footer sticky={stickyFooter}>
        {stickyFooter ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--dbm-space-3)", padding: "var(--dbm-space-3) var(--dbm-space-6)" }}>
            <Button variant="secondary">{copy.cancel}</Button>
            <Button>{copy.save}</Button>
          </div>
        ) : (
          <div style={{ padding: "var(--dbm-space-3) var(--dbm-space-6)" }}>
            <Text size="sm" color="secondary">
              {copy.footer}
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
export function DemoAside({ language = "en" }: { language?: Language }) {
  const copy = demoCopy[language];
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", padding: "var(--dbm-space-6)" }}>
      <Heading level={2} size="lg">
        {copy.orderTitle}
      </Heading>
      <div>
        <Badge tone="success">{copy.paid}</Badge>
      </div>
      <Text color="secondary">{copy.orderCustomer}</Text>
      <Text>{copy.orderText}</Text>
      <Text size="sm" color="secondary">
        {copy.updated}
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

/** A page that scrolls under a sticky header, with an `Affix` (the system's own sticky element, on the `sticky` step) at the top of the main area. `parked` offsets it below the banner and header so it stays in view; without it, it sticks at the window's top edge, under them. */
export function DemoLayersShell({ framed = false, parked = false }: { framed?: boolean; parked?: boolean }) {
  return (
    <DemoShell scroll="page" banner="sticky" headerSpan="full" framed={framed}>
      <div data-testid="layer-content">
        <Affix offset={0} style={parked ? { insetBlockStart: "calc(var(--app-shell-banner-stick, 0px) + var(--app-shell-header-height, 0px))" } : undefined}>
          <div data-testid="affix-bar" style={{ padding: "var(--dbm-space-3) var(--dbm-space-6)", background: "var(--dbm-bg-brand-subtle)" }}>
            <Text weight="medium">{parked ? "A sticky bar (Affix) parked below the header" : "A sticky bar from the page itself (Affix)"}</Text>
          </div>
        </Affix>
        <DemoPage />
      </div>
    </DemoShell>
  );
}
