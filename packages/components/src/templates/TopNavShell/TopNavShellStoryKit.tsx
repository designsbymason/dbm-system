// Demo code shared by TopNavShell's stories, its hidden real-browser checks and its tests: a "Projects" workspace drawn in the shell, with a
// `Navbar`, a sub-navigation, a page of cards and a footer of links. Docs-only (a stories-support module, not shipped, ADR-0013's way of sharing
// code between two stories files); the "Show code" snippets are written by hand in `TopNavShell.snippets.ts`.
import { BellIcon, TrayIcon, WarningCircleIcon } from "@dbm-system/icons";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
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
import { Navbar } from "../../organisms/Navbar";
import { useDemoCurrent } from "../../organisms/Navbar/NavbarStoryKit";
import { preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { TopNavShell } from "./TopNavShell";
import type { TopNavShellProps } from "./TopNavShell.types";

/** The language of a demo's words: a right-to-left demo is in Persian, so a right-to-left check measures real text and not mirrored English. */
export type Language = "en" | "fa";

/** Every word the demo draws, by language. The brand ("dbM Cloud") is a name and stays as it is. */
export const demoCopy = {
  en: {
    brand: "dbM Cloud",
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
    footerNavigation: "Footer",
    footerLinks: ["Help", "Privacy", "Terms"],
    footer: "© dbM Cloud",
    emptyTitle: "No projects yet",
    emptyText: "Projects appear here once your team creates one. Create the first to get started.",
    emptyAction: "Create a project",
    errorTitle: "We couldn't load your projects",
    errorText: "Something went wrong on our side. Nothing was changed. Try again in a moment.",
    errorAction: "Try again",
  },
  fa: {
    brand: "dbM Cloud",
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
    footerNavigation: "پاورقی",
    footerLinks: ["راهنما", "حریم خصوصی", "شرایط"],
    footer: "© dbM Cloud",
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

const sectionNav: CSSProperties = {
  display: "flex",
  gap: "var(--dbm-space-6)",
  paddingInline: "var(--dbm-space-4)",
  inlineSize: "max-content",
};

/** The sub-navigation's row: the project's sections as links, the current one marked. A demo's own, since there is no link-tabs component. */
function DemoSections({ language }: { language: Language }) {
  const copy = demoCopy[language];
  const demo = useDemoCurrent("overview");
  const sections = [
    ["overview", copy.overview],
    ["activity", copy.activity],
    ["members", copy.members],
    ["settings", copy.projectSettings],
  ] as const;
  return (
    <nav aria-label={copy.sectionsName} style={sectionNav}>
      {sections.map(([id, label]) => {
        const current = demo.isCurrent(id);
        return (
          <Link
            key={id}
            {...demo.anchor(id)}
            aria-current={current ? "page" : undefined}
            style={{
              paddingBlock: "var(--dbm-space-3)",
              borderBlockEnd: `var(--dbm-border-width-2) solid ${current ? "var(--dbm-border-focus)" : "transparent"}`,
              fontWeight: current ? "var(--dbm-font-weight-semibold)" : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The page a demo shell shows in its main area: a heading, and `rows` cards in a grid (24 is longer than a window, 3 is shorter). */
export function DemoPage({ language = "en", rows = 24, state }: { language?: Language; rows?: number; state?: "empty" | "error" }) {
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
      <div style={{ display: "grid", gap: "var(--dbm-space-1)" }}>
        <Heading level={1} size="2xl">
          {copy.title}
        </Heading>
        <Text color="secondary">{copy.intro}</Text>
      </div>
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

export interface DemoTopNavShellProps extends TopNavShellProps {
  /** Draws the shell in a box of its own, for a Docs page, where a shell as tall as the window would fill the page. */
  framed?: boolean;
  /** Adds a `TopNavShell.SubNav` of the project's sections under the bar. */
  subNav?: boolean;
  /** Adds a `TopNavShell.Banner` with a notice. */
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
 * A whole shell filled in: a skip link and a `Navbar` (the bar's own links go into a menu behind a button on a phone), an optional banner and
 * sub-navigation, the demo page and a footer of links. A right-to-left shell (`dir="rtl"`) is in Persian, with `lang="fa"`.
 */
export function DemoTopNavShell({ framed = false, subNav = false, banner = false, busy, rows, state, onNavigate, children, ...props }: DemoTopNavShellProps) {
  const language: Language = props.dir === "rtl" ? "fa" : "en";
  const copy = demoCopy[language];
  const fa = language === "fa";
  const demoLinks = useDemoCurrent("projects");
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
  const shell = (
    <TopNavShell {...props} lang={props.lang ?? (fa ? "fa" : undefined)} style={framed ? { minBlockSize: "100%", ...props.style } : props.style}>
      {/* In an app a router handles the link; here the click moves focus to the main area itself and keeps the preview's address unchanged. */}
      <TopNavShell.SkipLink
        labels={fa ? skipLinkLabelsFa : undefined}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      />
      {banner && (
        <TopNavShell.Banner>
          <Alert banner tone="info">
            <Alert.Description>{copy.banner}</Alert.Description>
          </Alert>
        </TopNavShell.Banner>
      )}
      <TopNavShell.Header>
        <Navbar contained labels={fa ? navbarLabelsFa : undefined}>
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
            <IconButton icon={BellIcon} variant="ghost" size="sm" aria-label={copy.notifications} />
            <Avatar name={copy.account} size="sm" />
          </Navbar.Actions>
        </Navbar>
        {subNav && (
          <TopNavShell.SubNav>
            <DemoSections language={language} />
          </TopNavShell.SubNav>
        )}
      </TopNavShell.Header>
      <TopNavShell.Main busy={busy} labels={fa ? mainLabelsFa : undefined}>
        <TopNavShell.Content>{children ?? <DemoPage language={language} rows={rows} state={state} />}</TopNavShell.Content>
      </TopNavShell.Main>
      <TopNavShell.Footer>
        <TopNavShell.Content paddingBlock={4} style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", justifyContent: "space-between" }}>
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
        </TopNavShell.Content>
      </TopNavShell.Footer>
    </TopNavShell>
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
