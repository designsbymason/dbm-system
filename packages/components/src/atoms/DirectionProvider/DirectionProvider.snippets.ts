// The code shown under each story's "Show code" button on DirectionProvider's Docs page. Each snippet is the smallest real usage of what its
// story shows: only exports of the package, no demo scaffolding. `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const directionProviderSnippets = {
  wholeApp: `{/* One provider near the root: every direction-aware component inside reads it, so none needs its own dir. */}
<DirectionProvider dir="rtl">
  <Navbar>
    <Navbar.Brand href="/">أكمي</Navbar.Brand>
  </Navbar>
</DirectionProvider>`,

  ownWins: `{/* A dir on the component itself wins over the provider, for one island that reads the other way. */}
<DirectionProvider dir="rtl">
  <Navbar>
    <Navbar.Brand href="/">أكمي</Navbar.Brand>
  </Navbar>
  <section aria-label="English island">
    <Navbar dir="ltr">
      <Navbar.Brand href="/">Acme</Navbar.Brand>
    </Navbar>
  </section>
</DirectionProvider>`,

  shell: `{/* AppShell given a dir provides it to the Sidebar and Navbar inside, so they need none of their own. */}
<AppShell dir="rtl">
  <AppShell.Header>
    <Navbar>
      <Navbar.Brand href="/">أكمي</Navbar.Brand>
    </Navbar>
  </AppShell.Header>
  <AppShell.Main>…</AppShell.Main>
</AppShell>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DirectionProviderPlaygroundSnippetArgs {
  dir?: "ltr" | "rtl";
}

/** The Playground's snippet, built from its current controls. */
export function directionProviderPlaygroundSnippet(args: DirectionProviderPlaygroundSnippetArgs): string {
  return `<DirectionProvider dir="${args.dir ?? "ltr"}">\n  <Navbar>\n    <Navbar.Brand href="/">Acme</Navbar.Brand>\n  </Navbar>\n</DirectionProvider>`;
}
