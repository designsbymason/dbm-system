// The code shown under each story's "Show code" button on the Marketing Page's Docs page.
//
// Hand-written rather than generated from the rendered story: a generated snippet would show the demo's helpers and copy instead of the page an app
// writes. Each snippet is the smallest real usage of what its story shows, using only exports of the package. See
// `07-storybook-and-documentation-standards.md` §4.2.

const header = `    <Navbar sticky collapseBelow="md">
      <Navbar.Brand href="/">dbM</Navbar.Brand>
      <Navbar.Links aria-label="Main">
        <NavigationMenu>
          <NavigationMenu.List>
            <NavigationMenu.Item value="product">
              <NavigationMenu.Trigger>Product</NavigationMenu.Trigger>
              <NavigationMenu.Content layout="columns">
                <NavigationMenu.Group label="Platform">
                  <NavigationMenu.Link href="/analytics" icon={ChartBarIcon} description="Dashboards and reports for every team">Analytics</NavigationMenu.Link>
                  <NavigationMenu.Link href="/automation" icon={LightningIcon} description="Workflows that run themselves">Automation</NavigationMenu.Link>
                </NavigationMenu.Group>
                <NavigationMenu.Feature title="What's new" href="/changelog">Everything we shipped this quarter.</NavigationMenu.Feature>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </Navbar.Links>
      <Navbar.Actions>
        <Navbar.Action hideBelow="md">
          <Button variant="tertiary" size="sm" asChild><a href="/signin">Sign in</a></Button>
        </Navbar.Action>
        <Navbar.Action hideBelow="md">
          <Button size="sm" asChild><a href="/signup">Get started</a></Button>
        </Navbar.Action>
      </Navbar.Actions>
      <Navbar.PanelActions>
        <Button fullWidth variant="secondary" asChild><a href="/signin">Sign in</a></Button>
        <Button fullWidth asChild><a href="/signup">Get started</a></Button>
      </Navbar.PanelActions>
    </Navbar>`;

const hero = `      <PageShell.Content width="reading" paddingBlock={16} style={{ display: "grid", gap: "var(--dbm-space-6)", justifyItems: "center", textAlign: "center" }}>
        <Heading level={1} size="3xl">Run your whole team from one place</Heading>
        <Text size="lg" color="secondary">Planning, reporting and automation together.</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
          <Button size="lg" asChild><a href="/signup">Get started</a></Button>
          <Button size="lg" variant="secondary" asChild><a href="/contact">Talk to sales</a></Button>
        </div>
      </PageShell.Content>`;

const features = (cards: number) => `      <PageShell.Content as="section" aria-labelledby="features-heading" width="dashboard" paddingBlock={12} style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
        <Heading level={2} size="2xl" id="features-heading">Everything a team needs</Heading>
        <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
${[
  `          <Card>
            <Card.Header>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dbm-space-3)" }}>
                <Icon icon={UsersIcon} size="xl" tone="brand" />
                <Heading level={3} size="lg">Plan together</Heading>
              </div>
            </Card.Header>
            <Card.Body>Share one plan across teams.</Card.Body>
          </Card>`,
  `          <Card>
            <Card.Header>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dbm-space-3)" }}>
                <Icon icon={ChartBarIcon} size="xl" tone="brand" />
                <Heading level={3} size="lg">Report in minutes</Heading>
              </div>
            </Card.Header>
            <Card.Body>Turn the plan into a report.</Card.Body>
          </Card>`,
  `          <Card>
            <Card.Header>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dbm-space-3)" }}>
                <Icon icon={LightningIcon} size="xl" tone="brand" />
                <Heading level={3} size="lg">Automate the rest</Heading>
              </div>
            </Card.Header>
            <Card.Body>Let routine work run on its own.</Card.Body>
          </Card>`,
]
  .slice(0, cards)
  .join("\n")}
        </Grid>
      </PageShell.Content>`;

const proof = `      {/* styles.figure is the stylesheet rule under "Code examples": the figures share the row below lg and keep one width from lg */}
      <PageShell.Content as="section" aria-label="dbM in numbers" width="full" paddingBlock={10}>
        <Container size="lg" paddingInline={0}>
          <Stack direction="row" align="start" wrap justify={{ base: "center", lg: "between" }} gap={{ base: 6, md: 10, lg: 20 }}>
            <Stat size="sm" className={styles.figure} style={{ padding: 0 }}><Stat.Label>Teams</Stat.Label><Stat.Value>12K+</Stat.Value></Stat>
            <Stat size="sm" className={styles.figure} style={{ padding: 0 }}><Stat.Label>Countries</Stat.Label><Stat.Value>90</Stat.Value></Stat>
            <Stat size="sm" className={styles.figure} style={{ padding: 0 }}><Stat.Label>Uptime</Stat.Label><Stat.Value>99.9%</Stat.Value></Stat>
            <Stat size="sm" className={styles.figure} style={{ padding: 0 }}><Stat.Label>Tasks a day</Stat.Label><Stat.Value>4.2M</Stat.Value></Stat>
          </Stack>
        </Container>
      </PageShell.Content>`;

const band = `      {/* bleed: as wide as the window, with its content kept to the page's width; a token in style tints it. style is the band's, so lay the content out in a div inside */}
      <PageShell.Content as="section" aria-labelledby="cta-heading" bleed width="reading" paddingBlock={12} style={{ background: "var(--dbm-bg-brand-subtle)" }}>
        <div style={{ display: "grid", gap: "var(--dbm-space-4)", justifyItems: "center", textAlign: "center" }}>
          <Heading level={2} size="2xl" id="cta-heading">Ready to see it work?</Heading>
          <Button size="lg" asChild><a href="/signup">Get started</a></Button>
        </div>
      </PageShell.Content>`;

const footer = `    <PageShell.Footer>
      <PageShell.Content width="dashboard" paddingBlock={10} style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
        <Grid columns={{ base: 2, md: 4 }} gap={8}>
          <nav aria-label="Product" style={{ display: "grid", gap: "var(--dbm-space-2)", alignContent: "start" }}>
            <Text weight="semibold">Product</Text>
            <Link href="/analytics" size="sm">Analytics</Link>
            <Link href="/pricing" size="sm">Pricing</Link>
          </nav>
          <nav aria-label="Company" style={{ display: "grid", gap: "var(--dbm-space-2)", alignContent: "start" }}>
            <Text weight="semibold">Company</Text>
            <Link href="/about" size="sm">About</Link>
            <Link href="/careers" size="sm">Careers</Link>
          </nav>
          <nav aria-label="Resources" style={{ display: "grid", gap: "var(--dbm-space-2)", alignContent: "start" }}>
            <Text weight="semibold">Resources</Text>
            <Link href="/guides" size="sm">Guides</Link>
            <Link href="/status" size="sm">Status</Link>
          </nav>
          <nav aria-label="Legal" style={{ display: "grid", gap: "var(--dbm-space-2)", alignContent: "start" }}>
            <Text weight="semibold">Legal</Text>
            <Link href="/privacy" size="sm">Privacy</Link>
            <Link href="/terms" size="sm">Terms</Link>
          </nav>
        </Grid>
        <Divider />
        <Text size="sm" color="secondary">© dbM</Text>
      </PageShell.Content>
    </PageShell.Footer>`;

const page = (sections: string[]) => `<PageShell>
  <PageShell.SkipLink />
${header}
  <PageShell.Main>
${sections.join("\n")}
  </PageShell.Main>
${footer}
  <BackToTop />
</PageShell>`;

/** The Playground's live controls, as far as the snippet cares. */
export interface MarketingPagePlaygroundSnippetArgs {
  /** How many of the three feature cards the page has. */
  features?: number;
  /** Whether the strip of figures is there. */
  proof?: boolean;
}

/** The page's snippet, built from the demo's current controls: only the feature cards and the strip that are on screen. */
export function marketingPagePlaygroundSnippet({ features: cards = 3, proof: withProof = true }: MarketingPagePlaygroundSnippetArgs): string {
  const count = Math.max(1, Math.min(Math.round(cards), 3));
  return page([hero, features(count), ...(withProof ? [proof] : []), band]);
}

export const marketingPageSnippets = {
  default: marketingPagePlaygroundSnippet({ features: 3, proof: true }),
  shortPage: marketingPagePlaygroundSnippet({ features: 1, proof: false }),
};
