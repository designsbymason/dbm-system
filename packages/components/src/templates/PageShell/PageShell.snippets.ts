// The code shown under each story's "Show code" button on PageShell's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's demo helpers instead of the shell filled
// with your own navigation and page. Each snippet here is the smallest real usage of what its story shows, using only exports of the package;
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

// What the snippets' shell says, in English and in Persian (a right-to-left snippet is in Persian, as the check that measures it is).
const words = {
  en: { title: "Projects", projects: "Projects", reports: "Reports" },
  fa: { title: "پروژه‌ها", projects: "پروژه‌ها", reports: "گزارش‌ها" },
};

/** The header: a `Navbar` direct in the shell (the shell wraps no header, so the bar sticks itself), with an optional second row of links. */
const header = (extra = "", language: "en" | "fa" = "en", attributes = "sticky") => `  <Navbar${attributes ? ` ${attributes}` : ""}>
    {/* On a phone the row is three columns: the menu button at the start, the brand in the centre, the actions at the end */}
    <Navbar.Row columns="balanced">
      <Navbar.Brand href="/">dbM</Navbar.Brand>
      <Navbar.Links aria-label="Main">
        <Navbar.Link href="/projects" current>${words[language].projects}</Navbar.Link>
        <Navbar.Link href="/reports">${words[language].reports}</Navbar.Link>
      </Navbar.Links>
      <Navbar.MenuButton variant="tertiary" tone="neutral" size="sm" />
    </Navbar.Row>${extra}
  </Navbar>`;

const subNav = `
    <Navbar.Row size="sm" variant="filled" sticky={false}>
      <Navbar.Links aria-label="Project sections" scroll rounded currentVariant="subtle">
        <Navbar.Link href="/projects/overview" current>Overview</Navbar.Link>
        <Navbar.Link href="/projects/activity">Activity</Navbar.Link>
        <Navbar.Link href="/projects/members">Members</Navbar.Link>
      </Navbar.Links>
    </Navbar.Row>`;

const main = (inner = "", language: "en" | "fa" = "en") => `  <PageShell.Main>
    <PageShell.Content>
      <h1>${words[language].title}</h1>${inner}
    </PageShell.Content>
  </PageShell.Main>`;

const footer = `  <PageShell.Footer>© dbM</PageShell.Footer>`;

const shell = (attributes: string, parts: string[]) => `<PageShell${attributes ? ` ${attributes}` : ""}>\n${parts.join("\n")}\n</PageShell>`;

const skipLink = `  <PageShell.SkipLink />`;

export const pageShellSnippets = {
  default: shell("", [skipLink, header(), main(), footer]),

  subNav: `{/* A Navbar.Row at the end with sticky={false} is drawn after the bar's header, so the bar sticks on its own and the row scrolls away under
    it. scroll keeps its links in the bar at every width: it scrolls sideways when they do not fit, fades at the edge that has more and brings the
    current link into view. rounded and currentVariant give that set a look of its own beside the bar's. */}
${shell("", [skipLink, header(subNav), main(), footer])}`,

  autoHide: `{/* The shell wraps no header, so hiding on scroll is the Navbar's own: hideOnScroll slides a sticky bar out of view while the reader scrolls
    down and brings it back on the first scroll up. It stays while focus or an open menu is inside it. */}
${shell("", [skipLink, header(subNav, "en", "sticky hideOnScroll"), main(), footer])}`,

  customHeader: `{/* The shell does not wrap your header, so any header works, and it sticks by its own means: a Navbar with sticky, or a header of your own
    made sticky by Affix, with a shadow once it is stuck. The shell publishes the device's top inset as --page-shell-safe-top, so a sticky header can
    keep clear of a notch. */}
<PageShell>
  <PageShell.SkipLink />
  <Affix asChild onStickyChange={setStuck}>
    <header
      style={{
        background: "var(--dbm-bg-surface)",
        paddingBlockStart: "var(--page-shell-safe-top)",
        boxShadow: stuck ? "var(--dbm-shadow-light-md)" : undefined,
      }}
    >
      <nav aria-label="Main">
        <a href="/projects">Projects</a>
      </nav>
    </header>
  </Affix>
${main()}
${footer}
</PageShell>`,

  documentTitle: `{/* documentTitle keeps the browser tab's title in step with pageTitle, so the router does not have to: true sets it to pageTitle, a
    function builds the whole title. The title the document had comes back when the shell unmounts. */}
<PageShell pageKey={pathname} pageTitle="Projects" documentTitle={(title) => \`\${title} · dbM\`}>
${[skipLink, header(), main(), footer].join("\n")}
</PageShell>`,

  banner: `{/* PageShell.Banner is a notice above the header. It scrolls away with the page and does not stick. */}
${shell("", [
  skipLink,
  `  <PageShell.Banner>
    <Alert banner tone="info">
      <Alert.Description>Scheduled maintenance tonight at 22:00 UTC.</Alert.Description>
    </Alert>
  </PageShell.Banner>`,
  header(),
  main(),
  footer,
])}`,

  shortPage: `{/* On a page too short to fill the window the footer sits at the bottom of the window, not under the content: Main takes the room
    that is left. */}
${shell("", [skipLink, header(), main(), footer])}`,

  busy: `{/* busy sets aria-busy on Main, draws a thin bar along its top edge and announces "Loading" politely. The page stays where it is. */}
${shell("", [
  skipLink,
  header(),
  `  <PageShell.Main busy>
    <PageShell.Content>
      <h1>Projects</h1>
    </PageShell.Content>
  </PageShell.Main>`,
  footer,
])}`,

  emptyPage: `{/* A page with nothing to show: an EmptyState in the content, with the next step. EmptyState.Title is the page's h1 here.
    TrayIcon comes from @dbm-system/icons */}
${shell("", [
  skipLink,
  header(),
  `  <PageShell.Main>
    <PageShell.Content>
      <EmptyState size="lg">
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title level={1}>No projects yet</EmptyState.Title>
        <EmptyState.Description>Projects appear here once your team creates one.</EmptyState.Description>
        <EmptyState.Actions>
          <Button>Create a project</Button>
        </EmptyState.Actions>
      </EmptyState>
    </PageShell.Content>
  </PageShell.Main>`,
  footer,
])}`,

  errorPage: `{/* A page that failed to load: tone="danger" and announce, so the message is read out once when it appears.
    WarningCircleIcon comes from @dbm-system/icons */}
${shell("", [
  skipLink,
  header(),
  `  <PageShell.Main>
    <PageShell.Content>
      <EmptyState size="lg" tone="danger" announce>
        <EmptyState.Icon icon={WarningCircleIcon} />
        <EmptyState.Title level={1}>We couldn't load your projects</EmptyState.Title>
        <EmptyState.Description>Something went wrong on our side. Try again in a moment.</EmptyState.Description>
        <EmptyState.Actions>
          <Button>Try again</Button>
        </EmptyState.Actions>
      </EmptyState>
    </PageShell.Content>
  </PageShell.Main>`,
  footer,
])}`,

  staticHeader: `{/* A Navbar without sticky scrolls away with the page, and so does a header of your own with no Affix. */}
${shell("", [skipLink, header("", "en", ""), main(), footer])}`,

  pageChange: `{/* const { pathname } = useLocation(); // your router's: the key changes when the reader goes to another page */}
{/* On a change, focus moves to Main, so the keyboard starts at the new page's top, and the title is announced politely. Nothing happens on the
    first render, or while pageKey is left out. */}
${shell('pageKey={pathname} pageTitle="Reports"', [skipLink, header(), main(), footer])}`,

  contentWidth: `{/* size: "sm" | "md" | "lg" | "xl" (default) | "2xl" | "3xl" | "full": the widest the content gets, centred. paddingInline and
    paddingBlock are on the spacing scale. */}
${shell("", [
  skipLink,
  header(),
  `  <PageShell.Main>
    <PageShell.Content size="md">
      <h1>Projects</h1>
    </PageShell.Content>
  </PageShell.Main>`,
  footer,
])}`,

  rightToLeft: `{/* dir sets the shell's reading direction and provides it to the Navbar inside, so it needs none of its own. lang names the language
    (fonts, shaping, how a screen reader speaks it), so set it with dir. */}
${shell('dir="rtl" lang="fa"', [
  `  <PageShell.SkipLink labels={{ skipToContent: "رفتن به محتوا" }} />`,
  header("", "fa"),
  main("", "fa"),
  footer,
])}`,
};

export interface PageShellPlaygroundSnippetArgs {
  dir?: "ltr" | "rtl";
  sticky?: boolean;
  hideOnScroll?: boolean;
  customHeader?: boolean;
  subNav?: boolean;
  banner?: boolean;
}

/** The Playground's snippet, built from the live controls: only the props that differ from their defaults, around a small real shell. */
export function pageShellPlaygroundSnippet(args: PageShellPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.dir === "rtl") attributes.push('dir="rtl"', 'lang="fa"');
  const language = args.dir === "rtl" ? "fa" : "en";
  const banner = args.banner
    ? `  <PageShell.Banner>
    <Alert banner tone="info">
      <Alert.Description>${language === "fa" ? "نگهداری برنامه‌ریزی‌شده امشب" : "Scheduled maintenance tonight at 22:00 UTC."}</Alert.Description>
    </Alert>
  </PageShell.Banner>`
    : undefined;
  const navbarAttributes = [args.sticky === false ? "" : "sticky", args.sticky !== false && args.hideOnScroll ? "hideOnScroll" : ""].filter(Boolean).join(" ");
  const top = args.customHeader
    ? `  <Affix asChild>
    <header style={{ background: "var(--dbm-bg-surface)" }}>Your header</header>
  </Affix>`
    : header(args.subNav ? subNav : "", language, navbarAttributes);
  return shell(attributes.join(" "), [skipLink, ...(banner ? [banner] : []), top, main("", language), footer]);
}
