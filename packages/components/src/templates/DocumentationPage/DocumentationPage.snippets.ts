// The code shown under each story's "Show code" button on the Documentation Page's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the demo's helpers and copy instead of the page an app
// writes. Each snippet is the smallest real usage of what its story shows, using only exports of the package. See
// `07-storybook-and-documentation-standards.md` §4.2.

const header = `    <Navbar sticky collapseBelow="never">
      <Navbar.Row columns="balanced">
        <Sidebar.MenuButton variant="tertiary" tone="brand" size="sm" />
        <Navbar.Brand href="/" column="center" className={styles.headerStart}>Acme Docs</Navbar.Brand>
        <Navbar.Links aria-label="Main" align="center" hideBelow="lg">
          <Navbar.Link href="/docs">Docs</Navbar.Link>
          <Navbar.Link href="/components" current>Components</Navbar.Link>
          <Navbar.Link href="/foundations">Foundations</Navbar.Link>
        </Navbar.Links>
        <Navbar.Actions column="end" className={styles.headerEnd}>
          <IconButton icon={MagnifyingGlassIcon} aria-label="Search" variant="tertiary" tone="brand" size="sm" />
        </Navbar.Actions>
      </Navbar.Row>
    </Navbar>`;

const sidebar = `      <Sidebar className={styles.sidebar} sticky stickyOffset="var(--page-shell-header-height, 0px)" width="16rem">
        <Sidebar.Content>
          <Sidebar.Nav aria-label="Documentation">
            <Sidebar.Section label="Components">
              <Sidebar.Item href="/components/badge">Badge</Sidebar.Item>
              <Sidebar.Item href="/components/button" current>Button</Sidebar.Item>
            </Sidebar.Section>
          </Sidebar.Nav>
        </Sidebar.Content>
      </Sidebar>`;

const row = `        <TableOfContents
          layout="row"
          sticky
          stickyOffset="var(--page-shell-header-height, 0px)"
          className={styles.outlineRow}
          aria-label="Page sections"
          items={[
            { id: "overview", label: "Overview" },
            { id: "usage", label: "Usage" },
            { id: "properties", label: "Properties" },
            { id: "sizes", label: "Sizes", level: 2 },
          ]}
        />`;

const page = (body: string) => `      <PageShell.Main>
${row}
        <Container size="md" paddingInline={6}>
${body}
        </Container>
      </PageShell.Main>`;

const head = `          <PageHeader>
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

const shell = (body: string[]) => `<Sidebar.Provider collapseBelow="lg">
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
  default: `{/* The header spans the window: the brand at its start, the links exactly in the middle (the brand and the actions are as wide as each other above lg,
    styles.headerStart and styles.headerEnd) and the actions at its end, flush with the edge. On a phone the menu button is at the start, the brand in the middle and the search at the end. Below lg the links are hidden from the bar (hideBelow) and the bar never collapses (collapseBelow="never"), so
    it draws no menu button of its own: the sidebar's panel is the one drawer. The sidebar holds only the current header link's section (the components); in the panel
    a part of your own that reads useSidebar().inPanel (see the code example below) draws the header's links, and the current one is a Sidebar.Group holding that section, so the drawer is an expandable menu. The sidebar is a Sidebar at the start of PageShell.Body, the page is PageShell.Main, and the outline is a
    sticky PageShell.Aside at the end from lg; below lg it is a sticky row of pills at the top of PageShell.Main (TableOfContents with layout="row", its sections inside a pill opening in a panel), and your styles.outlineRow and styles.outline hide the one that is not for the width. A Sidebar.Provider wraps the shell so the header's Sidebar.MenuButton can open the sidebar's panel (AppShell does that
    for you). The sidebar sticks under the header at the height the shell measured (--page-shell-header-height); styles.sidebar and styles.outline are your
    own classes that leave the navigation out of print (@media print { display: none }); give the sidebar's navigation a name of its own, since the header's
    links are already a navigation named "Main". The body stacks as a whole below the aside's step (lg), so the sidebar leaves for its panel at the same
    step (collapseBelow="lg" on the provider): the aside then drops under the page and the page takes the width. */}
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
