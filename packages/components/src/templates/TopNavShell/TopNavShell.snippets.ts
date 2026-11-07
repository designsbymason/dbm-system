// The code shown under each story's "Show code" button on TopNavShell's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's demo helpers instead of the shell filled
// with your own navigation and page. Each snippet here is the smallest real usage of what its story shows, using only exports of the package;
// `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

// What the snippets' shell says, in English and in Persian (a right-to-left snippet is in Persian, as the check that measures it is).
const words = {
  en: { title: "Projects", projects: "Projects", reports: "Reports" },
  fa: { title: "پروژه‌ها", projects: "پروژه‌ها", reports: "گزارش‌ها" },
};

const header = (extra = "", language: "en" | "fa" = "en") => `  <TopNavShell.Header>
    {/* The shell keeps the header in view: leave the Navbar without its own sticky */}
    <Navbar>
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
      <Navbar.Links aria-label="Main">
        <Navbar.Link href="/projects" current>${words[language].projects}</Navbar.Link>
        <Navbar.Link href="/reports">${words[language].reports}</Navbar.Link>
      </Navbar.Links>
    </Navbar>${extra}
  </TopNavShell.Header>`;

const subNav = `
    <TopNavShell.SubNav>
      <nav aria-label="Project sections">
        {/* your links, or a row of buttons: it scrolls sideways when it does not fit */}
      </nav>
    </TopNavShell.SubNav>`;

const main = (inner = "", language: "en" | "fa" = "en") => `  <TopNavShell.Main>
    <TopNavShell.Content>
      <h1>${words[language].title}</h1>${inner}
    </TopNavShell.Content>
  </TopNavShell.Main>`;

const footer = `  <TopNavShell.Footer>© dbM Cloud</TopNavShell.Footer>`;

const shell = (attributes: string, parts: string[]) => `<TopNavShell${attributes ? ` ${attributes}` : ""}>\n${parts.join("\n")}\n</TopNavShell>`;

const skipLink = `  <TopNavShell.SkipLink />`;

export const topNavShellSnippets = {
  default: shell("", [skipLink, header(), main(), footer]),

  subNav: `{/* TopNavShell.SubNav is a second row of navigation inside the header, so it sticks with the bar. Put a nav of your own in it, with its
    own name; it scrolls sideways when it does not fit, so a phone keeps every item. */}
${shell("", [skipLink, header(subNav), main(), footer])}`,

  banner: `{/* TopNavShell.Banner is a notice above the header. It scrolls away with the page and does not stick. */}
${shell("", [
  skipLink,
  `  <TopNavShell.Banner>
    <Alert banner tone="info">
      <Alert.Description>Scheduled maintenance tonight at 22:00 UTC.</Alert.Description>
    </Alert>
  </TopNavShell.Banner>`,
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
  `  <TopNavShell.Main busy>
    <TopNavShell.Content>
      <h1>Projects</h1>
    </TopNavShell.Content>
  </TopNavShell.Main>`,
  footer,
])}`,

  emptyPage: `{/* A page with nothing to show: an EmptyState in the content, with the next step. EmptyState.Title is the page's h1 here.
    TrayIcon comes from @dbm-system/icons */}
${shell("", [
  skipLink,
  header(),
  `  <TopNavShell.Main>
    <TopNavShell.Content>
      <EmptyState size="lg">
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title level={1}>No projects yet</EmptyState.Title>
        <EmptyState.Description>Projects appear here once your team creates one.</EmptyState.Description>
        <EmptyState.Actions>
          <Button>Create a project</Button>
        </EmptyState.Actions>
      </EmptyState>
    </TopNavShell.Content>
  </TopNavShell.Main>`,
  footer,
])}`,

  errorPage: `{/* A page that failed to load: tone="danger" and announce, so the message is read out once when it appears.
    WarningCircleIcon comes from @dbm-system/icons */}
${shell("", [
  skipLink,
  header(),
  `  <TopNavShell.Main>
    <TopNavShell.Content>
      <EmptyState size="lg" tone="danger" announce>
        <EmptyState.Icon icon={WarningCircleIcon} />
        <EmptyState.Title level={1}>We couldn't load your projects</EmptyState.Title>
        <EmptyState.Description>Something went wrong on our side. Try again in a moment.</EmptyState.Description>
        <EmptyState.Actions>
          <Button>Try again</Button>
        </EmptyState.Actions>
      </EmptyState>
    </TopNavShell.Content>
  </TopNavShell.Main>`,
  footer,
])}`,

  staticHeader: `{/* stickyHeader={false}: the header scrolls away with the page. The shadow under it (scrolledEdge) needs a header that sticks, so it
    is not drawn. */}
${shell("stickyHeader={false}", [skipLink, header(), main(), footer])}`,

  pageChange: `{/* const { pathname } = useLocation(); // your router's: the key changes when the reader goes to another page */}
{/* On a change, focus moves to Main, so the keyboard starts at the new page's top, and the title is announced politely. Nothing happens on the
    first render, or while pageKey is left out. */}
${shell('pageKey={pathname} pageTitle="Reports"', [skipLink, header(), main(), footer])}`,

  contentWidth: `{/* size: "sm" | "md" | "lg" | "xl" (default) | "2xl" | "3xl" | "full": the widest the content gets, centred. paddingInline and
    paddingBlock are on the spacing scale. */}
${shell("", [
  skipLink,
  header(),
  `  <TopNavShell.Main>
    <TopNavShell.Content size="md">
      <h1>Projects</h1>
    </TopNavShell.Content>
  </TopNavShell.Main>`,
  footer,
])}`,

  rightToLeft: `{/* dir sets the shell's reading direction and provides it to the Navbar inside, so it needs none of its own. lang names the language
    (fonts, shaping, how a screen reader speaks it), so set it with dir. */}
${shell('dir="rtl" lang="fa"', [
  `  <TopNavShell.SkipLink labels={{ skipToContent: "رفتن به محتوا" }} />`,
  header("", "fa"),
  main("", "fa"),
  footer,
])}`,
};

export interface TopNavShellPlaygroundSnippetArgs {
  stickyHeader?: boolean;
  scrolledEdge?: boolean;
  dir?: "ltr" | "rtl";
  subNav?: boolean;
  banner?: boolean;
}

/** The Playground's snippet, built from the live controls: only the props that differ from their defaults, around a small real shell. */
export function topNavShellPlaygroundSnippet(args: TopNavShellPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.stickyHeader === false) attributes.push("stickyHeader={false}");
  if (args.scrolledEdge === false) attributes.push("scrolledEdge={false}");
  if (args.dir === "rtl") attributes.push('dir="rtl"', 'lang="fa"');
  const language = args.dir === "rtl" ? "fa" : "en";
  const banner = args.banner
    ? `  <TopNavShell.Banner>
    <Alert banner tone="info">
      <Alert.Description>${language === "fa" ? "نگهداری برنامه‌ریزی‌شده امشب" : "Scheduled maintenance tonight at 22:00 UTC."}</Alert.Description>
    </Alert>
  </TopNavShell.Banner>`
    : undefined;
  return shell(attributes.join(" "), [skipLink, ...(banner ? [banner] : []), header(args.subNav ? subNav : "", language), main("", language), footer]);
}
