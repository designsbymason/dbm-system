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

  rightToLeft: `{/* dir sets the reading direction of the shell; pass it to the Sidebar too, which has its own dir prop */}
${shell('dir="rtl"', [header, sidebar('dir="rtl"'), main])}`,
} as const;

export interface AppShellPlaygroundSnippetArgs {
  scroll?: AppShellScroll;
  headerSpan?: AppShellHeaderSpan;
  asideCollapseBelow?: string;
  asideCollapseTo?: "drawer" | "hidden";
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
