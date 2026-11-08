// Demo code shared by PageShell's stories, its hidden real-browser checks and its tests: a "Projects" workspace drawn in the shell, with a
// `Navbar` (and a second row of links under it), a page of cards and a footer of links. Docs-only (a stories-support module, not shipped, ADR-0013's way of sharing
// code between two stories files); the "Show code" snippets are written by hand in `PageShell.snippets.ts`.
import { BellIcon, TrayIcon, WarningCircleIcon } from "@dbm-system/icons";
import { useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Affix } from "../../atoms/Affix";
import { Avatar } from "../../atoms/Avatar";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { IconButton } from "../../atoms/IconButton";
import { Link } from "../../atoms/Link";
import { Text } from "../../atoms/Text";
import { Alert } from "../../molecules/Alert";
import { Card } from "../../molecules/Card";
import { EmptyState } from "../../molecules/EmptyState";
import { Grid } from "../../molecules/Grid";
import { PageHeader } from "../../molecules/PageHeader";
import { Navbar } from "../../organisms/Navbar";
import { useDemoCurrent } from "../../organisms/Navbar/NavbarStoryKit";
import { preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { PageShell } from "./PageShell";
import type { PageShellContentWidth, PageShellProps } from "./PageShell.types";

/** The language of a demo's words: a right-to-left demo is in Persian, so a right-to-left check measures real text and not mirrored English. */
export type Language = "en" | "fa";

/** Every word the demo draws, by language. The brand ("dbM") is a name and stays as it is. */
export const demoCopy = {
  en: {
    brand: "dbM",
    navigation: "Main",
    projects: "Projects",
    reports: "Reports",
    team: "Team",
    settings: "Settings",
    sectionsName: "Project sections",
    overview: "Overview",
    activity: "Activity",
    members: "Members",
    projectSettings: "Project settings",
    notifications: "Notifications",
    account: "John Doe",
    banner: "Scheduled maintenance tonight at 22:00 UTC. Saving may be unavailable for a few minutes.",
    title: "Projects",
    intro: "Everything your team is working on, in one place.",
    card: (n: number) => `Project ${n}`,
    cardText: "Updated by the team a few days ago.",
    open: "Open",
    newProject: "New project",
    asideTitle: "On this page",
    asideCaption: "Sections",
    asideLinks: ["Overview", "Recent activity", "Members", "Billing", "Danger zone"],
    footerNavigation: "Footer",
    footerLinks: ["Help", "Privacy", "Terms"],
    footer: "© dbM",
    emptyTitle: "No projects yet",
    emptyText: "Projects appear here once your team creates one. Create the first to get started.",
    emptyAction: "Create a project",
    errorTitle: "We couldn't load your projects",
    errorText: "Something went wrong on our side. Nothing was changed. Try again in a moment.",
    errorAction: "Try again",
  },
  fa: {
    brand: "dbM",
    navigation: "پیمایش اصلی",
    projects: "پروژه‌ها",
    reports: "گزارش‌ها",
    team: "تیم",
    settings: "تنظیمات",
    sectionsName: "بخش‌های پروژه",
    overview: "نمای کلی",
    activity: "فعالیت",
    members: "اعضا",
    projectSettings: "تنظیمات پروژه",
    notifications: "اعلان‌ها",
    account: "علی رضایی",
    banner: "نگهداری برنامه‌ریزی‌شده امشب ساعت ۲۲:۰۰ به وقت جهانی. ذخیره‌سازی ممکن است چند دقیقه در دسترس نباشد.",
    title: "پروژه‌ها",
    intro: "هر آنچه تیم شما روی آن کار می‌کند، در یک جا.",
    card: (n: number) => `پروژه ${new Intl.NumberFormat("fa").format(n)}`,
    cardText: "چند روز پیش به‌روزرسانی شد.",
    open: "باز کردن",
    newProject: "پروژه جدید",
    asideTitle: "در این صفحه",
    asideCaption: "بخش‌ها",
    asideLinks: ["نمای کلی", "فعالیت اخیر", "اعضا", "صورت‌حساب", "منطقه خطر"],
    footerNavigation: "پاورقی",
    footerLinks: ["راهنما", "حریم خصوصی", "شرایط"],
    footer: "© dbM",
    emptyTitle: "هنوز پروژه‌ای نیست",
    emptyText: "با ساختن اولین پروژه توسط تیم شما، فهرست آن‌ها اینجا نمایش داده می‌شود.",
    emptyAction: "ایجاد پروژه",
    errorTitle: "بارگذاری پروژه‌ها ممکن نشد",
    errorText: "مشکلی از سمت ما پیش آمد. چیزی تغییر نکرده است. لطفاً کمی بعد دوباره تلاش کنید.",
    errorAction: "تلاش دوباره",
  },
} as const;

/** The words the `Navbar` supplies itself, in Persian, for a right-to-left demo (English is its own default). */
const navbarLabelsFa = { menu: "منو", navigation: "پیمایش اصلی", close: "بستن", skipLink: "رفتن به محتوا", externalLink: "پیوند خارجی" } as const;
/** The skip link's and the main area's own words, in Persian. */
const skipLinkLabelsFa = { skipToContent: "رفتن به محتوا" } as const;
const mainLabelsFa = { loading: "در حال بارگذاری" } as const;

const frameHeight = "36rem";

/**
 * A header of the demo's own, to show that the shell does not need a `Navbar`: a `<header>` made sticky by `Affix`, with a shadow from the stuck state.
 * The top inset is the shell's published `--page-shell-safe-top`.
 */
function DemoCustomHeader({ language, scrollContainerRef }: { language: Language; scrollContainerRef?: React.RefObject<HTMLElement | null> }) {
  const copy = demoCopy[language];
  const [stuck, setStuck] = useState(false);
  return (
    <Affix asChild scrollContainerRef={scrollContainerRef} onStickyChange={setStuck}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--dbm-space-6)",
          paddingBlock: "var(--dbm-space-3)",
          paddingBlockStart: "calc(var(--dbm-space-3) + var(--page-shell-safe-top))",
          paddingInline: "var(--dbm-space-4)",
          background: "var(--dbm-bg-surface)",
          borderBlockEnd: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
          boxShadow: stuck ? "var(--dbm-shadow-light-md)" : undefined,
        }}
      >
        <Text weight="bold">{copy.brand}</Text>
        <nav aria-label={copy.navigation} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
          <Link href="#" onClick={preventNavigation}>
            {copy.projects}
          </Link>
          <Link href="#" onClick={preventNavigation}>
            {copy.reports}
          </Link>
        </nav>
      </header>
    </Affix>
  );
}

/** What a demo's aside holds: "On this page", a table of contents of links. */
function DemoAsideContent({ language }: { language: Language }) {
  const copy = demoCopy[language];
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-3)", padding: "var(--dbm-space-4)", border: "var(--dbm-border-width-1) solid var(--dbm-border-default)", borderRadius: "var(--dbm-radius-lg)" }}>
      <Text size="sm" color="secondary" aria-hidden="true">
        {copy.asideCaption}
      </Text>
      <nav aria-label={copy.asideTitle} style={{ display: "grid", gap: "var(--dbm-space-2)" }}>
        {copy.asideLinks.map((label) => (
          <Link key={label} href="#" onClick={preventNavigation}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** The page a demo shell shows in its main area: a heading, and `rows` cards in a grid (24 is longer than a window, 3 is shorter). */
export function DemoPage({ language = "en", rows = 24, state, extraActions }: { language?: Language; rows?: number; state?: "empty" | "error"; extraActions?: ReactNode }) {
  const copy = demoCopy[language];
  if (state !== undefined) {
    return (
      <EmptyState size="lg" tone={state === "error" ? "danger" : "neutral"} announce={state === "error"}>
        <EmptyState.Icon icon={state === "error" ? WarningCircleIcon : TrayIcon} />
        <EmptyState.Title level={1}>{state === "error" ? copy.errorTitle : copy.emptyTitle}</EmptyState.Title>
        <EmptyState.Description>{state === "error" ? copy.errorText : copy.emptyText}</EmptyState.Description>
        <EmptyState.Actions>
          <Button>{state === "error" ? copy.errorAction : copy.emptyAction}</Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  }
  return (
    <div style={{ display: "grid", gap: "var(--dbm-space-6)" }}>
      <PageHeader>
        <PageHeader.Title>{copy.title}</PageHeader.Title>
        <PageHeader.Description>{copy.intro}</PageHeader.Description>
        <PageHeader.Actions>
          {extraActions}
          <Button onClick={preventClick}>{copy.newProject}</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Grid minChildWidth="16rem" gap={4}>
        {Array.from({ length: rows }, (_, index) => (
          <Card key={index} variant="outlined">
            <Card.Header>
              <Heading level={2} size="md">
                {copy.card(index + 1)}
              </Heading>
            </Card.Header>
            <Card.Body>
              <Text color="secondary">{copy.cardText}</Text>
            </Card.Body>
            <Card.Footer>
              <Button variant="secondary" size="sm" onClick={preventClick}>
                {copy.open}
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </Grid>
    </div>
  );
}

const preventClick = (event: MouseEvent) => event.preventDefault();

export interface DemoPageShellProps extends PageShellProps {
  /** Draws the shell in a box of its own, for a Docs page, where a shell as tall as the window would fill the page. */
  framed?: boolean;
  /** Adds a second row of the project's sections under the bar: a `Navbar.Row` that scrolls away, with a scrolling set of links. */
  subNav?: boolean;
  /** Whether the `Navbar` sticks (a demo control: the shell does not wrap the header, so this is the bar's own `sticky`). */
  sticky?: boolean;
  /** Whether the sticky `Navbar` hides on a scroll down. */
  hideOnScroll?: boolean;
  /** Draws a header of the demo's own, a `<header>` made sticky by `Affix`, in place of the `Navbar`. */
  customHeader?: boolean;
  /** The width preset of the page's content. */
  contentWidth?: PageShellContentWidth;
  /** Adds a `PageShell.Aside` of a table of contents beside the page, in a `PageShell.Body`. */
  aside?: boolean;
  /** What the aside becomes below its step: dropped under the page, or a drawer opened from a toggle in the page header. */
  asideCollapse?: "stack" | "drawer";
  /** Whether the aside stays in view under the header. */
  asideSticky?: boolean;
  /** The sticky aside's own offset, a CSS length, in place of the header's measured height. */
  asideStickyOffset?: string;
  /** Which end the aside is at: it is written before or after the main area, and the layout follows. */
  asideSide?: "start" | "end";
  /** The step the aside leaves its column at. */
  asideCollapseBelow?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "never";
  /** Adds a `PageShell.Banner` with a notice. */
  banner?: boolean;
  /** Marks the main area as busy. */
  busy?: boolean;
  /** How many cards the page holds. */
  rows?: number;
  /** Puts a whole-page state in the main area in place of the cards. */
  state?: "empty" | "error";
  /** Called with the id of the bar's link that was chosen (`"projects"`, `"reports"`, `"team"`, `"settings"`), as a router would be told. */
  onNavigate?: (id: "projects" | "reports" | "team" | "settings") => void;
  /** The page's own content, in place of the demo's. */
  children?: ReactNode;
}

/**
 * A whole shell filled in: a skip link and a `Navbar` direct in the shell (the bar's own links go into a menu behind a button on a phone), an optional
 * banner and second row of links, the demo page and a footer of links. A right-to-left shell (`dir="rtl"`) is in Persian, with `lang="fa"`.
 */
export function DemoPageShell({
  framed = false,
  subNav = false,
  sticky = true,
  hideOnScroll = false,
  customHeader = false,
  contentWidth,
  aside = false,
  asideCollapse = "stack",
  asideSticky = false,
  asideStickyOffset,
  asideSide = "end",
  asideCollapseBelow = "lg",
  banner = false,
  busy,
  rows,
  state,
  onNavigate,
  children,
  ...props
}: DemoPageShellProps) {
  const language: Language = props.dir === "rtl" ? "fa" : "en";
  const copy = demoCopy[language];
  const fa = language === "fa";
  const demoLinks = useDemoCurrent("projects");
  const sections = useDemoCurrent("overview");
  // In a framed demo the bar sticks within the frame, which is the box that scrolls, so the bar is told which box it is.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const scrollContainerRef = framed ? frameRef : undefined;
  /** A link of the bar: the current mark follows the choice, and the app is told, as a router would be. */
  const link = (id: "projects" | "reports" | "team" | "settings") => {
    const own = demoLinks.link(id);
    return {
      ...own,
      onClick: (event: MouseEvent) => {
        own.onClick(event);
        onNavigate?.(id);
      },
    };
  };
  const asideElement = (
    <PageShell.Aside
      aria-label={copy.asideTitle}
      sticky={asideSticky}
      stickyOffset={asideStickyOffset}
      collapse={asideCollapse}
      collapseBelow={asideCollapseBelow}
      drawerContainer={framed ? frame : undefined}
      labels={fa ? { title: copy.asideTitle, close: "بستن" } : undefined}
    >
      <DemoAsideContent language={language} />
    </PageShell.Aside>
  );
  const asideToggle = <PageShell.AsideToggle variant="secondary" tone="neutral" labels={fa ? { open: "نمایش جزئیات" } : undefined} />;
  const shell = (
    <PageShell {...props} lang={props.lang ?? (fa ? "fa" : undefined)} style={framed ? { minBlockSize: "100%", ...props.style } : props.style}>
      {/* In an app a router handles the link; here the click moves focus to the main area itself and keeps the preview's address unchanged. */}
      <PageShell.SkipLink
        labels={fa ? skipLinkLabelsFa : undefined}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      />
      {banner && (
        <PageShell.Banner>
          <Alert banner tone="info">
            <Alert.Description>{copy.banner}</Alert.Description>
          </Alert>
        </PageShell.Banner>
      )}
      {customHeader ? (
        <DemoCustomHeader language={language} scrollContainerRef={scrollContainerRef} />
      ) : (
        <Navbar
          contained
          sticky={sticky}
          hideOnScroll={sticky && hideOnScroll}
          scrollContainerRef={scrollContainerRef}
          labels={fa ? navbarLabelsFa : undefined}
          // A sticky bar keeps clear of a notch with the inset the shell publishes.
          style={{ paddingBlockStart: "var(--page-shell-safe-top)" }}
        >
          {/* Below the step the row is three columns: the menu button at the start, the brand in the centre, the actions at the end. */}
          <Navbar.Row columns="balanced">
            <Navbar.Brand href="#" onClick={preventNavigation}>
              {copy.brand}
            </Navbar.Brand>
            <Navbar.Links aria-label={copy.navigation}>
              <Navbar.Link {...link("projects")}>{copy.projects}</Navbar.Link>
              <Navbar.Link {...link("reports")}>{copy.reports}</Navbar.Link>
              <Navbar.Link {...link("team")}>{copy.team}</Navbar.Link>
              <Navbar.Link {...link("settings")}>{copy.settings}</Navbar.Link>
            </Navbar.Links>
            <Navbar.Actions>
              <IconButton icon={BellIcon} variant="tertiary" tone="neutral" size="sm" aria-label={copy.notifications} />
              <Avatar name={copy.account} size="sm" />
            </Navbar.Actions>
            <Navbar.MenuButton variant="tertiary" tone="neutral" size="sm" />
          </Navbar.Row>
          {subNav && (
            // A row at the end that scrolls away under the bar, with links that stay in the bar at every width and scroll sideways.
            <Navbar.Row size="sm" variant="filled" sticky={false}>
              <Navbar.Links aria-label={copy.sectionsName} scroll rounded currentVariant="subtle">
                <Navbar.Link {...sections.link("overview")}>{copy.overview}</Navbar.Link>
                <Navbar.Link {...sections.link("activity")}>{copy.activity}</Navbar.Link>
                <Navbar.Link {...sections.link("members")}>{copy.members}</Navbar.Link>
                <Navbar.Link {...sections.link("settings")}>{copy.projectSettings}</Navbar.Link>
              </Navbar.Links>
            </Navbar.Row>
          )}
        </Navbar>
      )}
      {aside ? (
        // A page with an aside: the width is the body's, around the main area and the aside, which is a landmark of its own beside `<main>`.
        <PageShell.Body width={contentWidth}>
          {asideSide === "start" && asideElement}
          <PageShell.Main busy={busy} labels={fa ? mainLabelsFa : undefined}>
            {children ?? <DemoPage language={language} rows={rows} state={state} extraActions={asideCollapse === "drawer" ? asideToggle : undefined} />}
          </PageShell.Main>
          {asideSide !== "start" && asideElement}
        </PageShell.Body>
      ) : (
        <PageShell.Main busy={busy} labels={fa ? mainLabelsFa : undefined}>
          <PageShell.Content width={contentWidth}>{children ?? <DemoPage language={language} rows={rows} state={state} />}</PageShell.Content>
        </PageShell.Main>
      )}
      <PageShell.Footer>
        <PageShell.Content paddingBlock={4} style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", justifyContent: "space-between" }}>
          <Text size="sm" color="secondary">
            {copy.footer}
          </Text>
          <nav aria-label={copy.footerNavigation} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
            {copy.footerLinks.map((label) => (
              <Link key={label} href="#" size="sm" onClick={preventNavigation}>
                {label}
              </Link>
            ))}
          </nav>
        </PageShell.Content>
      </PageShell.Footer>
    </PageShell>
  );
  if (!framed) return shell;
  return (
    <div
      ref={(element) => {
        frameRef.current = element;
        setFrame(element);
      }}
      style={{
        blockSize: frameHeight,
        overflow: "auto",
        // The drawer opens inside the frame, so the frame is its containing block.
        ...(aside && asideCollapse === "drawer" ? { position: "relative", transform: "translateZ(0)" } : undefined),
        border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
        borderRadius: "var(--dbm-radius-lg)",
      }}
    >
      {shell}
    </div>
  );
}
