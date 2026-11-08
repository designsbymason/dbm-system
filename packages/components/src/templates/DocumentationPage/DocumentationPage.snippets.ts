// The code shown under each story's "Show code" button on the Documentation Page's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the demo's helpers and copy instead of the page an app
// writes. Each snippet is the smallest real usage of what its story shows, using only exports of the package. See
// `07-storybook-and-documentation-standards.md` §4.2.

const header = `    <Navbar sticky contained>
      <Navbar.Row columns="balanced">
        <Navbar.Brand href="/">Acme Docs</Navbar.Brand>
        <Navbar.Links aria-label="Main">
          <Navbar.Link href="/components" current>Components</Navbar.Link>
          <Navbar.Link href="/guides">Guides</Navbar.Link>
        </Navbar.Links>
        <Sidebar.MenuButton />
      </Navbar.Row>
    </Navbar>`;

const sidebar = `      <Sidebar className={styles.sidebar} sticky stickyOffset="var(--page-shell-header-height, 0px)" width="16rem">
        <Sidebar.Content>
          <Sidebar.Nav aria-label="Documentation">
            <Sidebar.Section label="Getting started">
              <Sidebar.Item href="/introduction">Introduction</Sidebar.Item>
              <Sidebar.Item href="/installation">Installation</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Section label="Components">
              <Sidebar.Item href="/components/badge">Badge</Sidebar.Item>
              <Sidebar.Item href="/components/button" current>Button</Sidebar.Item>
            </Sidebar.Section>
          </Sidebar.Nav>
        </Sidebar.Content>
      </Sidebar>`;

const page = (body: string) => `      <PageShell.Main>
        <Container size="md" paddingInline={6}>
${body}
        </Container>
      </PageShell.Main>`;

const head = `          <Breadcrumb>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="/components">Components</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.Page>Button</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb>
          <PageHeader>
            <PageHeader.Title>Button</PageHeader.Title>
            <PageHeader.Description>A control that starts an action.</PageHeader.Description>
          </PageHeader>`;

const sections = `          <section id="overview" aria-labelledby="overview-heading">
            <Heading level={2} size="lg" id="overview-heading">Overview</Heading>
            <Text>A button says what will happen when it is pressed.</Text>
            <Alert tone="info">
              <Alert.Description>Use one primary button per view.</Alert.Description>
            </Alert>
          </section>
          <section id="usage" aria-labelledby="usage-heading">
            <Heading level={2} size="lg" id="usage-heading">Usage</Heading>
            <CodeBlock language="tsx" code={'<Button onClick={save}>Save changes</Button>'} />
          </section>
          <section id="properties" aria-labelledby="properties-heading">
            <Heading level={2} size="lg" id="properties-heading">Properties</Heading>
            <Table aria-label="Button properties">
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Prop</Table.HeaderCell>
                  <Table.HeaderCell>What it does</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.HeaderCell scope="row">variant</Table.HeaderCell>
                  <Table.Cell>The look.</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </section>`;

const contents = `      <PageShell.Aside aria-label="On this page" className={styles.outline} sticky width="14rem">
        <TableOfContents
          scrollOffset={80}
          items={[
            { id: "overview", label: "Overview" },
            { id: "usage", label: "Usage" },
            { id: "properties", label: "Properties" },
          ]}
        />
      </PageShell.Aside>`;

const footer = `    <PageShell.Footer>© Acme Docs</PageShell.Footer>`;

const shell = (body: string[]) => `<Sidebar.Provider collapseBelow="lg" labels={{ menu: "Documentation menu" }}>
  <PageShell>
    <PageShell.SkipLink />
${header}
    <PageShell.Body width="full" paddingInline={0} paddingBlock={0}>
${body.join("\n")}
    </PageShell.Body>
${footer}
  </PageShell>
</Sidebar.Provider>`;

export const documentationPageSnippets = {
  default: `{/* The site's navigation is a Sidebar at the start of PageShell.Body, the page is PageShell.Main, and the outline is a sticky PageShell.Aside at the end.
    A Sidebar.Provider wraps the shell so the header's Sidebar.MenuButton can open the sidebar's panel on a phone (AppShell does that for you). The sidebar
    sticks under the header at the height the shell measured (--page-shell-header-height); styles.sidebar and styles.outline are your own classes that
    leave the navigation out of print (@media print { display: none }); give it a name of its own, since the header's links are
    already a navigation named "Main". The body stacks as a whole below the aside's step (lg), so the sidebar leaves for its panel at the same step
    (collapseBelow="lg" on the provider): the aside then drops under the page and the page takes the width. The header's own menu button is named
    "Menu", so the sidebar's has its own name (labels.menu) and the two are told apart. */}
${shell([sidebar, page(`${head}\n${sections}`), contents])}`,

  shortPage: `{/* A short page: the footer still sits at the bottom of the window, and the outline has only what the page has. */}
${shell([
  sidebar,
  page(`${head}
          <section id="overview" aria-labelledby="overview-heading">
            <Heading level={2} size="lg" id="overview-heading">Overview</Heading>
            <Text>A button says what will happen when it is pressed.</Text>
          </section>`),
  `      <PageShell.Aside aria-label="On this page" className={styles.outline} sticky width="14rem">
        <TableOfContents scrollOffset={80} items={[{ id: "overview", label: "Overview" }]} />
      </PageShell.Aside>`,
])}`,

  withoutContents: `{/* No outline: a page of a few paragraphs needs none, so there is no aside and the page takes the room. */}
${shell([sidebar, page(`${head}\n${sections}`)])}`,
};
