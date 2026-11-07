// The code shown under each story's "Show code" button on AppShell's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's demo helpers instead of
// the shell filled with your own navigation and page. Each snippet here is the smallest real usage of what its story shows, using only
// exports of the package; `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { AppShellDirection, AppShellHeaderSpan, AppShellScroll, AppShellSidebarSide } from "./AppShell.types";

const sidebar = (attributes = "") => `  <AppShell.Sidebar>
    <Sidebar${attributes ? ` ${attributes}` : ""}>
      <Sidebar.Header>dbM Cloud</Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Nav>
          <Sidebar.Item href="/" current>Home</Sidebar.Item>
          <Sidebar.Item href="/billing">Billing</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar.Content>
    </Sidebar>
  </AppShell.Sidebar>`;

const header = `  <AppShell.Header>
    <Navbar>
      <Navbar.SkipLink />
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
      <Navbar.Actions>
        <Sidebar.MenuButton />
      </Navbar.Actions>
    </Navbar>
  </AppShell.Header>`;

const main = `  <AppShell.Main>
    <h1>Billing</h1>
  </AppShell.Main>`;

const shell = (attributes: string, parts: string[]) =>
  `<AppShell${attributes ? ` ${attributes}` : ""}>\n${parts.join("\n")}\n</AppShell>`;

export const appShellSnippets = {
  rail: `{/* defaultCollapsed starts the sidebar as a rail of icons; the collapse button (Sidebar.Toggle) or the controlled
    collapsed prop changes it, and the main area takes the room */}
${shell("defaultCollapsed", [header, sidebar(), main])}`,

  endSidebar: `{/* sidebarSide moves the column to the end edge; set the sidebar's own side to match, so its line and its phone panel
    are on the same edge */}
${shell('sidebarSide="end"', [header, sidebar('side="end"'), main])}`,

  pageScroll: `{/* scroll="page": the page scrolls as a whole, and the shell keeps the header and the sidebar in view */}
${shell('scroll="page"', [header, sidebar(), main])}`,

  aside: `{/* AppShell.Aside is a complementary column at the end edge. Below asideCollapseBelow ("lg" = 1024px) it leaves the page and its
    children open in a Drawer from AppShell.AsideToggle, which sits outside it (here in the Navbar). */}
<AppShell>
  <AppShell.Header>
    <Navbar>
      <Navbar.SkipLink />
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
      <Navbar.Actions>
        <AppShell.AsideToggle />
        <Sidebar.MenuButton />
      </Navbar.Actions>
    </Navbar>
  </AppShell.Header>
  <AppShell.Main>
    <h1>Orders</h1>
  </AppShell.Main>
  <AppShell.Aside aria-label="Order details" width="24rem">
    <h2>Order #1042</h2>
  </AppShell.Aside>
</AppShell>`,

  asideHidden: `{/* asideCollapseTo="hidden": below the collapse width the aside is not drawn at all, and there is no toggle. For content a phone can do
    without, such as a table of contents. */}
<AppShell asideCollapseTo="hidden" asideCollapseBelow="xl">
  <AppShell.Main>
    <h1>Documentation</h1>
  </AppShell.Main>
  <AppShell.Aside aria-label="On this page">
    <nav aria-label="On this page">…</nav>
  </AppShell.Aside>
</AppShell>`,

  headerSpan: `{/* headerSpan="full": the header runs across the top, over the sidebar, which starts below it. The default, "content", stops
    at the sidebar. */}
${shell('headerSpan="full"', [header, sidebar(), main])}`,

  plainHeader: `{/* A header that is not a Navbar: AppShell.SkipLink is the skip link, and as="header" makes the header the page's banner landmark. */}
<AppShell>
  <AppShell.SkipLink />
  <AppShell.Header as="header">
    <p>dbM Cloud</p>
  </AppShell.Header>
  <AppShell.Main>
    <h1>Billing</h1>
  </AppShell.Main>
</AppShell>`,

  pageChange: `{/* pageKey changes when the reader goes to another page: the shell moves focus to the main area, scrolls it back to the top and
    announces pageTitle. Not on the first render. pathname comes from your router. */}
<AppShell pageKey={pathname} pageTitle={title}>
  <AppShell.Header>
    <Navbar>
      <Navbar.SkipLink />
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
    </Navbar>
  </AppShell.Header>
  <AppShell.Main>
    <h1>{title}</h1>
  </AppShell.Main>
</AppShell>`,

  stickyBar: `{/* With scroll="page" the shell sets --app-shell-header-height on itself (useAppShell().headerHeight is the same number), so a
    bar in the main area can stick just below the header. */}
<AppShell scroll="page">
  <AppShell.Header>…</AppShell.Header>
  <AppShell.Main>
    <div style={{ position: "sticky", top: "var(--app-shell-header-height, 0px)" }}>Filters</div>
    <p>Page content.</p>
  </AppShell.Main>
</AppShell>`,

  autoRail: `{/* railBelow: below 1280px ("xl") the shell collapses the sidebar to a rail, and above it expands it again. The reader's own toggle
    holds until the window crosses the step. Below collapseBelow the sidebar is a drawer, as ever. */}
${shell('railBelow="xl"', [header, sidebar(), main])}`,

  banner: `{/* AppShell.Banner is a strip above the header: an announcement, a maintenance notice, a trial reminder. */}
<AppShell>
  <AppShell.Banner>
    <Alert tone="info">
      <Alert.Description>Scheduled maintenance tonight at 22:00 UTC.</Alert.Description>
    </Alert>
  </AppShell.Banner>
  <AppShell.Header>
    <Navbar>
      <Navbar.SkipLink />
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
    </Navbar>
  </AppShell.Header>
  <AppShell.Main>
    <h1>Billing</h1>
  </AppShell.Main>
</AppShell>`,

  stickyBanner: `{/* With scroll="page" a sticky banner stays at the top of the window and the header sticks below it. Without sticky it scrolls away
    and the header sticks at the top. */}
<AppShell scroll="page">
  <AppShell.Banner sticky>
    <Alert tone="warning">
      <Alert.Description>Your trial ends in 3 days.</Alert.Description>
    </Alert>
  </AppShell.Banner>
  <AppShell.Header>
    <Navbar>
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
    </Navbar>
  </AppShell.Header>
  <AppShell.Main>
    <h1>Billing</h1>
  </AppShell.Main>
</AppShell>`,

  content: `{/* AppShell.Content centres the page, keeps it to a width (the Container steps) and pads it on the spacing scale. The main area adds none. */}
<AppShell>
  <AppShell.Main>
    <AppShell.Content size="xl" paddingBlock={8}>
      <h1>Billing</h1>
    </AppShell.Content>
  </AppShell.Main>
</AppShell>`,

  stickyFooter: `{/* A sticky footer stays at the bottom of the window while the page scrolls: a bar of actions that must stay in reach. With
    scroll="content" the footer is already outside the scrolling. */}
<AppShell scroll="page">
  <AppShell.Main>
    <h1>Edit profile</h1>
  </AppShell.Main>
  <AppShell.Footer sticky>
    <Button variant="secondary">Cancel</Button>
    <Button>Save changes</Button>
  </AppShell.Footer>
</AppShell>`,

  busy: `{/* busy marks the main area as loading: a thin bar along its top edge, aria-busy, and a polite "Loading" announcement. Change
    the words through labels. The page stays where it is; keep showing what you have. */}
<AppShell>
  <AppShell.Main busy={isFetching} labels={{ loading: "Loading invoices" }}>
    <Text>Invoices</Text>
  </AppShell.Main>
</AppShell>`,

  emptyState: `{/* AppShell.State fills the main area with one centred message when there is no page to show. Give it a title, an optional
    description and the next step. */}
<AppShell>
  <AppShell.Main>
    <AppShell.State
      title="No invoices yet"
      description="Invoices appear here once a customer is billed."
      actions={<Button>Create an invoice</Button>}
    />
  </AppShell.Main>
</AppShell>`,

  errorState: `{/* kind="error" uses the danger tone and announces the message at once. The title is the page's heading (level 1 unless you set level). */}
<AppShell>
  <AppShell.Main>
    <AppShell.State
      kind="error"
      title="We couldn't load this page"
      description="Something went wrong on our side. Try again in a moment."
      actions={<Button onClick={retry}>Try again</Button>}
    />
  </AppShell.Main>
</AppShell>`,

  layers: `{/* The shell keeps its own bars in order: the page's sticky elements (Affix and the like) sit below the sidebar, the aside and
    the footer, which sit below the header, which sits below the banner. A page's own sticky bar slides under the header. */}
<AppShell scroll="page">
  <AppShell.Header>
    <Navbar />
  </AppShell.Header>
  <AppShell.Main>
    <Affix offset={0}>
      <Text>A bar from the page itself</Text>
    </Affix>
    <Text>The rest of a long page…</Text>
  </AppShell.Main>
</AppShell>`,

  resizable: `{/* resizable puts a handle on the column's inner edge: drag it, or use the arrow keys (Shift for bigger steps, Home and End for the
    least and the most, a double press to reset). Leave width off the Sidebar inside: the shell sets the width. */}
<AppShell>
  <AppShell.Sidebar resizable minWidth="14rem" maxWidth="26rem">
    <Sidebar>
      <Sidebar.Content>
        <Sidebar.Nav aria-label="Main">
          <Sidebar.Item href="/" current>Home</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Toggle />
      </Sidebar.Footer>
    </Sidebar>
  </AppShell.Sidebar>
  <AppShell.Main>
    <h1>Billing</h1>
  </AppShell.Main>
</AppShell>`,

  remembered: `{/* persistKey remembers the reader's collapsed state and the sidebar's width in localStorage and restores them after the page loads.
    Only what you leave uncontrolled is stored; pass collapsed or sidebarWidth to keep it somewhere else yourself. */}
<AppShell persistKey="my-app">
  <AppShell.Sidebar resizable>
    <Sidebar>
      <Sidebar.Content>
        <Sidebar.Nav aria-label="Main">
          <Sidebar.Item href="/" current>Home</Sidebar.Item>
        </Sidebar.Nav>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Toggle />
      </Sidebar.Footer>
    </Sidebar>
  </AppShell.Sidebar>
  <AppShell.Main>
    <h1>Billing</h1>
  </AppShell.Main>
</AppShell>`,

  rightToLeft: `{/* dir sets the reading direction of the shell; pass it to the Sidebar too, which has its own dir prop */}
${shell('dir="rtl"', [header, sidebar('dir="rtl"'), main])}`,
} as const;

export interface AppShellPlaygroundSnippetArgs {
  scroll?: AppShellScroll;
  headerSpan?: AppShellHeaderSpan;
  asideCollapseBelow?: string;
  asideCollapseTo?: "drawer" | "hidden";
  railBelow?: string;
  scrolledEdge?: boolean;
  /** Storybook only — whether the demo has an aside. */
  showAside?: boolean;
  sidebarSide?: AppShellSidebarSide;
  dir?: AppShellDirection;
  collapseBelow?: string;
  defaultCollapsed?: boolean;
}

/** The Playground's "Show code": the shell with the props that differ from their defaults, and a sidebar, header and main area. */
export function appShellPlaygroundSnippet(args: AppShellPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.scroll && args.scroll !== "content") attributes.push(`scroll="${args.scroll}"`);
  if (args.headerSpan && args.headerSpan !== "content") attributes.push(`headerSpan="${args.headerSpan}"`);
  if (args.sidebarSide && args.sidebarSide !== "start") attributes.push(`sidebarSide="${args.sidebarSide}"`);
  if (args.railBelow && args.railBelow !== "never") attributes.push(`railBelow="${args.railBelow}"`);
  if (args.scrolledEdge === false) attributes.push("scrolledEdge={false}");
  if (args.showAside) {
    if (args.asideCollapseBelow && args.asideCollapseBelow !== "lg") attributes.push(`asideCollapseBelow="${args.asideCollapseBelow}"`);
    if (args.asideCollapseTo && args.asideCollapseTo !== "drawer") attributes.push(`asideCollapseTo="${args.asideCollapseTo}"`);
  }
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.defaultCollapsed) attributes.push("defaultCollapsed");
  const sidebarAttributes = [
    args.sidebarSide === "end" ? 'side="end"' : "",
    args.dir === "rtl" ? 'dir="rtl"' : "",
  ].filter(Boolean);
  const aside = args.showAside
    ? `  <AppShell.Aside aria-label="Order details">
    <h2>Order #1042</h2>
  </AppShell.Aside>`
    : undefined;
  return shell(attributes.join(" "), [header, sidebar(sidebarAttributes.join(" ")), main, ...(aside ? [aside] : [])]);
}
