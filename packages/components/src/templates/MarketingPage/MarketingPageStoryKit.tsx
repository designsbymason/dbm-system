import { ChartBarIcon, LightningIcon, PlugsIcon, ShieldCheckIcon, UsersIcon } from "@dbm-system/icons";
import type { RefObject } from "react";
import type { IconProps } from "../../atoms/Icon";
import { BackToTop } from "../../atoms/BackToTop";
import { Button } from "../../atoms/Button";
import { Container } from "../../atoms/Container";
import { Divider } from "../../atoms/Divider";
import { Heading } from "../../atoms/Heading";
import { Icon } from "../../atoms/Icon";
import { Link } from "../../atoms/Link";
import { Stack } from "../../atoms/Stack";
import { Text } from "../../atoms/Text";
import { Card } from "../../molecules/Card";
import { Grid } from "../../molecules/Grid";
import { Stat } from "../../molecules/Stat";
import { Navbar } from "../../organisms/Navbar";
import { NavigationMenu } from "../../organisms/NavigationMenu";
import { preventNavigation } from "../../organisms/Sidebar/SidebarStoryKit";
import { PageShell } from "../PageShell";
import { PageFrame } from "../_shared/PageFrame";
import { skipToMain } from "../_shared/skipToMain";
import styles from "./MarketingPage.module.css";

// The page's words, in one place. A marketing page is static, so there is no router and no state: the demo's controls are how many feature cards it has
// and whether it has a proof strip.
interface MarketingFeature {
  id: string;
  icon: IconProps["icon"];
  title: string;
  text: string;
}

interface MarketingColumn {
  name: string;
  links: string[];
}

export const marketingCopy = {
  brand: "dbM",
  mainNavigation: "Main",
  product: "Product",
  productLinks: [
    { icon: ChartBarIcon, label: "Analytics", description: "Dashboards and reports for every team" },
    { icon: LightningIcon, label: "Automation", description: "Workflows that run themselves" },
    { icon: PlugsIcon, label: "Integrations", description: "Connect the tools you already use" },
  ],
  productGroup: "Platform",
  featured: { title: "What's new", text: "Everything we shipped this quarter." },
  pricing: "Pricing",
  customers: "Customers",
  signIn: "Sign in",
  getStarted: "Get started",
  title: "Run your whole team from one place",
  lead: "DBM brings planning, reporting and automation together, so everyone works from the same facts and nothing waits on a handoff.",
  talkToSales: "Talk to sales",
  featuresTitle: "Everything a team needs",
  featuresLead: "Three parts that work alone and better together.",
  features: [
    { id: "plan", icon: UsersIcon, title: "Plan together", text: "Share one plan across teams, with owners and dates in plain sight." },
    { id: "report", icon: ChartBarIcon, title: "Report in minutes", text: "Turn the plan into a report without copying a number by hand." },
    { id: "automate", icon: LightningIcon, title: "Automate the rest", text: "Let routine work run on its own and keep people on what matters." },
  ] as MarketingFeature[],
  proofName: "dbM in numbers",
  proof: [
    { label: "Teams", value: "12K+" },
    { label: "Countries", value: "90" },
    { label: "Uptime", value: "99.9%" },
    { label: "Tasks a day", value: "4.2M" },
  ],
  ctaTitle: "Ready to see it work?",
  ctaText: "Start free, invite your team and have a first plan running today.",
  secure: { icon: ShieldCheckIcon, text: "No card needed. Your data stays yours." },
  footerColumns: [
    { name: "Product", links: ["Analytics", "Automation", "Integrations", "Pricing"] },
    { name: "Company", links: ["About", "Customers", "Careers", "Contact"] },
    { name: "Resources", links: ["Guides", "Help centre", "Status", "Changelog"] },
    { name: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
  ] as MarketingColumn[],
  footer: "© dbM",
};

export interface MarketingPageProps {
  /** Draws the page in a box of its own, for a Docs page, where a page as tall as the window would fill it. */
  framed?: boolean;
  /** How many of the demo's three feature cards the page has. */
  features?: number;
  /** Whether the page has the strip of figures under the features. */
  proof?: boolean;
}

/** The tint behind the call to action's band: a token, so a theme or a brand changes it. */
const bandBackground = "var(--dbm-bg-brand-subtle)";

/**
 * A marketing page: a header with a mega menu, a hero, the features, a strip of figures, a call to action and a footer of link columns. All of it is
 * existing components in a `PageShell`; nothing here is drawn by hand. The sections show the three widths of `PageShell.Content` (a reading width, the
 * dashboard width and `full`) and a `bleed` band that is as wide as the window with its content kept to the page.
 */
export function MarketingPage({ framed = false, features = 3, proof = true }: MarketingPageProps) {
  const copy = marketingCopy;
  const shown = copy.features.slice(0, Math.max(1, Math.min(features, copy.features.length)));
  const page = (frameRef: RefObject<HTMLDivElement | null> | undefined) => (
    <PageShell>
      <PageShell.SkipLink onClick={skipToMain} />
      {/* The header's links hold a mega menu: in the bar it opens a panel, and in the phone menu it is the stacked form, where a chosen link closes the menu. */}
      <Navbar sticky collapseBelow="md" scrollContainerRef={frameRef}>
        <Navbar.Brand href="#" onClick={preventNavigation}>
          {copy.brand}
        </Navbar.Brand>
        <Navbar.Links aria-label={copy.mainNavigation}>
          <NavigationMenu>
            <NavigationMenu.List>
              <NavigationMenu.Item value="product">
                <NavigationMenu.Trigger>{copy.product}</NavigationMenu.Trigger>
                <NavigationMenu.Content layout="columns">
                  <NavigationMenu.Group label={copy.productGroup}>
                    {copy.productLinks.map((link) => (
                      <NavigationMenu.Link key={link.label} href="#" icon={link.icon} description={link.description} onClick={preventNavigation}>
                        {link.label}
                      </NavigationMenu.Link>
                    ))}
                  </NavigationMenu.Group>
                  <NavigationMenu.Feature title={copy.featured.title} href="#" onClick={preventNavigation}>
                    {copy.featured.text}
                  </NavigationMenu.Feature>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link href="#" onClick={preventNavigation}>
                  {copy.pricing}
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link href="#" onClick={preventNavigation}>
                  {copy.customers}
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu>
        </Navbar.Links>
        <Navbar.Actions>
          <Navbar.Action hideBelow="md">
            <Button variant="tertiary" size="sm" asChild>
              <a href="/signin" onClick={preventNavigation}>
                {copy.signIn}
              </a>
            </Button>
          </Navbar.Action>
          <Navbar.Action hideBelow="md">
            <Button size="sm" asChild>
              <a href="/signup" onClick={preventNavigation}>
                {copy.getStarted}
              </a>
            </Button>
          </Navbar.Action>
        </Navbar.Actions>
        <Navbar.PanelActions>
          <Button fullWidth variant="secondary" asChild>
            <a href="/signin" onClick={preventNavigation}>
              {copy.signIn}
            </a>
          </Button>
          <Button fullWidth asChild>
            <a href="/signup" onClick={preventNavigation}>
              {copy.getStarted}
            </a>
          </Button>
        </Navbar.PanelActions>
      </Navbar>
      <PageShell.Main>
        {/* A reading width: the hero is a headline, a line and two buttons, and reads best narrow and centred. */}
        <PageShell.Content width="reading" paddingBlock={16} style={{ display: "grid", gap: "var(--dbm-space-6)", justifyItems: "center", textAlign: "center" }}>
          <Heading level={1} size="3xl">
            {copy.title}
          </Heading>
          <Text size="lg" color="secondary">
            {copy.lead}
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-3)", justifyContent: "center" }}>
            <Button size="lg" asChild>
              <a href="/signup" onClick={preventNavigation}>
                {copy.getStarted}
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="/contact" onClick={preventNavigation}>
                {copy.talkToSales}
              </a>
            </Button>
          </div>
        </PageShell.Content>
        {/* The dashboard width: a row of cards wants more room than a paragraph. */}
        <PageShell.Content as="section" aria-labelledby="features-heading" width="dashboard" paddingBlock={12} style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
          <div style={{ display: "grid", gap: "var(--dbm-space-2)" }}>
            <Heading level={2} size="2xl" id="features-heading">
              {copy.featuresTitle}
            </Heading>
            <Text color="secondary">{copy.featuresLead}</Text>
          </div>
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {shown.map((feature) => (
              <Card key={feature.id}>
                <Card.Header>
                  {/* The header spreads its children along the row, so the icon and the title are one group at its start. */}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--dbm-space-3)" }}>
                    <Icon icon={feature.icon} size="xl" tone="brand" />
                    <Heading level={3} size="lg">
                      {feature.title}
                    </Heading>
                  </div>
                </Card.Header>
                <Card.Body>{feature.text}</Card.Body>
              </Card>
            ))}
          </Grid>
        </PageShell.Content>
        {proof && (
          // `full`: no limit on the width, so the figures use the whole window.
          <PageShell.Content as="section" aria-label={copy.proofName} width="full" paddingBlock={10}>
            {/* The section is `full`; the figures are a group centred in it (a `Container`, with no padding of its own since the section pads), each stat's own text left-aligned. */}
            <Container size="lg" paddingInline={0}>
              <Stack direction="row" align="start" wrap justify={{ base: "center", lg: "between" }} gap={{ base: 6, md: 10, lg: 20 }}>
                {copy.proof.map((figure) => (
                  <Stat key={figure.label} size="sm" className={styles.figure} style={{ padding: 0 }}>
                    <Stat.Label>{figure.label}</Stat.Label>
                    <Stat.Value>{figure.value}</Stat.Value>
                  </Stat>
                ))}
              </Stack>
            </Container>
          </PageShell.Content>
        )}
        {/* A band as wide as the window, tinted by a token, with its content kept to the page's width: `style` lands on the band, so the content's own layout is a
            grid inside it. */}
        <PageShell.Content as="section" aria-labelledby="cta-heading" bleed width="reading" paddingBlock={12} style={{ background: bandBackground }}>
          <div style={{ display: "grid", gap: "var(--dbm-space-4)", justifyItems: "center", textAlign: "center" }}>
            <Heading level={2} size="2xl" id="cta-heading">
              {copy.ctaTitle}
            </Heading>
            <Text>{copy.ctaText}</Text>
            <Button size="lg" asChild>
              <a href="/signup" onClick={preventNavigation}>
                {copy.getStarted}
              </a>
            </Button>
            <Text size="sm" color="secondary" style={{ display: "inline-flex", alignItems: "center", gap: "var(--dbm-space-2)" }}>
              <Icon icon={copy.secure.icon} size="sm" />
              {copy.secure.text}
            </Text>
          </div>
        </PageShell.Content>
      </PageShell.Main>
      <PageShell.Footer>
        <PageShell.Content width="dashboard" paddingBlock={10} style={{ display: "grid", gap: "var(--dbm-space-8)" }}>
          <Grid columns={{ base: 2, md: 4 }} gap={8}>
            {copy.footerColumns.map((column) => (
              <nav key={column.name} aria-label={column.name} style={{ display: "grid", gap: "var(--dbm-space-2)", alignContent: "start" }}>
                <Text weight="semibold">{column.name}</Text>
                {column.links.map((label) => (
                  <Link key={label} href="#" size="sm" onClick={preventNavigation}>
                    {label}
                  </Link>
                ))}
              </nav>
            ))}
          </Grid>
          <Divider />
          <Text size="sm" color="secondary">
            {copy.footer}
          </Text>
        </PageShell.Content>
      </PageShell.Footer>
      {/* Fixed to the window's corner once the page has scrolled; in a Docs page's frame it follows the frame's own scrolling. */}
      <BackToTop scrollContainerRef={frameRef} />
    </PageShell>
  );
  return <PageFrame framed={framed}>{page}</PageFrame>;
}
