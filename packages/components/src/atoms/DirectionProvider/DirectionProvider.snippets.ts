// The code shown under each story's "Show code" button on DirectionProvider's Docs page. Each snippet is the smallest real usage of what its
// story shows: only exports of the package, no demo scaffolding. `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const directionProviderSnippets = {
  wholeApp: `{/* One provider near the root: every direction-aware component inside reads it, so none needs its own dir. */}
<DirectionProvider dir="rtl">
  <Navbar>
    <Navbar.Brand href="/">dbM</Navbar.Brand>
  </Navbar>
</DirectionProvider>`,

  ownWins: `{/* A dir on the component itself wins over the provider, for one island that reads the other way. */}
<DirectionProvider dir="rtl">
  <Navbar>
    <Navbar.Brand href="/">dbM</Navbar.Brand>
  </Navbar>
  <section aria-label="English island">
    <Navbar dir="ltr">
      <Navbar.Brand href="/">dbM</Navbar.Brand>
    </Navbar>
  </section>
</DirectionProvider>`,

  shell: `{/* AppShell given a dir provides it to the Sidebar and Navbar inside, so they need none of their own. */}
<AppShell dir="rtl">
  <AppShell.Header>
    <Navbar>
      <Navbar.Brand href="/">dbM</Navbar.Brand>
    </Navbar>
  </AppShell.Header>
  <AppShell.Main>…</AppShell.Main>
</AppShell>`,

  languages: `{/* One provider per reading direction. lang names the language, so the browser picks the right fonts and shaping for its script;
    dir on the box lays out the plain text around the components. */}
<DirectionProvider dir="rtl">
  <div lang="ar" dir="rtl">
    <Tabs defaultValue="overview">
      <Tabs.List aria-label="العربية">
        <Tabs.Trigger value="overview">نظرة عامة</Tabs.Trigger>
        <Tabs.Trigger value="billing">الفوترة</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <Breadcrumb aria-label="العربية">
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/">الرئيسية</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Breadcrumb.Page>الإعدادات</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb>
        <Slider aria-label="مستوى الصوت" defaultValue={30} showValue />
      </Tabs.Content>
      <Tabs.Content value="billing">الفوترة</Tabs.Content>
    </Tabs>
  </div>
</DirectionProvider>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DirectionProviderPlaygroundSnippetArgs {
  dir?: "ltr" | "rtl";
}

/** The Playground's snippet, built from its current controls. */
export function directionProviderPlaygroundSnippet(args: DirectionProviderPlaygroundSnippetArgs): string {
  return `<DirectionProvider dir="${args.dir ?? "ltr"}">\n  <Navbar>\n    <Navbar.Brand href="/">dbM</Navbar.Brand>\n  </Navbar>\n</DirectionProvider>`;
}
