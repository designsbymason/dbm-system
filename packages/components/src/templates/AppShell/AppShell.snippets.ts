// The code shown under each story's "Show code" button on AppShell's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the story's demo helpers instead of
// the shell filled with your own navigation and page. Each snippet here is the smallest real usage of what its story shows, using only
// exports of the package; `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { AppShellDirection, AppShellScroll, AppShellSidebarSide } from "./AppShell.types";

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

  pageScroll: `{/* scroll="page": the page scrolls as a whole. A part that should stay in view sticks itself,
    here the Navbar */}
<AppShell scroll="page">
  <AppShell.Header>
    <Navbar sticky>
      <Navbar.SkipLink />
      <Navbar.Brand href="/">dbM Cloud</Navbar.Brand>
      <Navbar.Actions>
        <Sidebar.MenuButton />
      </Navbar.Actions>
    </Navbar>
  </AppShell.Header>
${sidebar("sticky")}
${main}
</AppShell>`,

  rightToLeft: `{/* dir sets the reading direction of the shell; pass it to the Sidebar too, which has its own dir prop */}
${shell('dir="rtl"', [header, sidebar('dir="rtl"'), main])}`,
} as const;

export interface AppShellPlaygroundSnippetArgs {
  scroll?: AppShellScroll;
  sidebarSide?: AppShellSidebarSide;
  dir?: AppShellDirection;
  collapseBelow?: string;
  defaultCollapsed?: boolean;
}

/** The Playground's "Show code": the shell with the props that differ from their defaults, and a sidebar, header and main area. */
export function appShellPlaygroundSnippet(args: AppShellPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.scroll && args.scroll !== "content") attributes.push(`scroll="${args.scroll}"`);
  if (args.sidebarSide && args.sidebarSide !== "start") attributes.push(`sidebarSide="${args.sidebarSide}"`);
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  if (args.collapseBelow && args.collapseBelow !== "md") attributes.push(`collapseBelow="${args.collapseBelow}"`);
  if (args.defaultCollapsed) attributes.push("defaultCollapsed");
  const sidebarAttributes = [
    args.sidebarSide === "end" ? 'side="end"' : "",
    args.dir === "rtl" ? 'dir="rtl"' : "",
  ].filter(Boolean);
  return shell(attributes.join(" "), [header, sidebar(sidebarAttributes.join(" ")), main]);
}
