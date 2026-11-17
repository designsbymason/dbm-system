import { Badge, Button, IconButton, Navbar, NavigationMenu } from "@dbm-system/components";
import { FlaskIcon, GithubLogoIcon } from "@dbm-system/icons";
import { allComponents, docsGroups, foundationsLinks, storybookHref } from "../../data/site";
import { Wordmark } from "../Wordmark";
import { ModeToggle } from "./ModeToggle";
import type { Placements } from "./searchIndex";
import { SiteSearch } from "./SiteSearch";
import styles from "./SiteHeader.module.css";

const githubHref = "https://github.com/designsbymason/dbm-system";

export interface SiteHeaderProps {
  /** The published version, read from the components package at build. */
  version: string;
  /** Each component's tier and category, for search. */
  placements: Placements;
}

const githubLabel = "DBM System on GitHub";

/** GitHub as a tertiary icon button with an accessible name and a tooltip (the link carries the name too, for lint). */
function GithubLink() {
  return (
    <IconButton asChild icon={GithubLogoIcon} aria-label={githubLabel} tooltip="GitHub" variant="tertiary" size="md">
      <a href={githubHref} aria-label={githubLabel} />
    </IconButton>
  );
}

/** The same two links in the menu panel, ghost buttons that share the width, with their names showing: a touch screen has no tooltip to read an icon from. */
function PanelToolLinks() {
  return (
    <>
      <Button asChild variant="ghost" size="sm" leadingIcon={FlaskIcon} className={styles.panelButton}>
        <a href={storybookHref}>Storybook</a>
      </Button>
      <Button asChild variant="ghost" size="sm" leadingIcon={GithubLogoIcon} className={styles.panelButton}>
        <a href={githubHref}>GitHub</a>
      </Button>
    </>
  );
}

/**
 * The home page's header (guidelines/docs-site/02-structure.md §1, ADR-0220), a frosted bar that sticks. From `lg` it is three
 * columns: the wordmark and the version at the start, the Docs and Foundations menus and the Components link centred, and the
 * icon buttons (search, mode, GitHub) at the end. Below `lg` it is three columns too, the menu button, the wordmark
 * (centred), and search with the mode toggle; the menus become expandable groups in the menu panel, and Storybook and GitHub
 * move to its foot as labelled buttons. The columns below `lg` are `Navbar.Row`'s own, so the wordmark is centred however
 * wide the two sides are.
 */
export function SiteHeader({ version, placements }: SiteHeaderProps) {
  return (
    <Navbar sticky variant="frosted" collapseBelow="lg">
      <Navbar.Row columns="balanced" columnsBelow="lg" className={styles.row}>
        <Navbar.MenuButton column="start" variant="tertiary" />
        <Navbar.Brand href="/" column="center" aria-label={`DBM System v${version}, home`} className={styles.brand}>
          <Wordmark className={styles.logo} />
          <Badge tone="brand" variant="subtle" className={styles.version}>{`v${version}`}</Badge>
        </Navbar.Brand>
        <Navbar.Links aria-label="Main" className={styles.links}>
          <NavigationMenu viewport={false} panelAlign="center">
            <NavigationMenu.List>
              <NavigationMenu.Item value="docs">
                <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
                <NavigationMenu.Content layout="columns" className={`${styles.menuPanel} ${styles.docsPanel}`}>
                  {docsGroups.map((group) => (
                    <NavigationMenu.Group key={group.label} label={group.label} className={styles.group}>
                      {group.links.map((link) => (
                        <NavigationMenu.Link key={link.href} href={link.href}>
                          {link.label}
                        </NavigationMenu.Link>
                      ))}
                    </NavigationMenu.Group>
                  ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item value="foundations">
                <NavigationMenu.Trigger>Foundations</NavigationMenu.Trigger>
                <NavigationMenu.Content className={styles.menuPanel}>
                  <NavigationMenu.Group label="Design tokens" className={styles.group}>
                    {foundationsLinks.map((link) => (
                      <NavigationMenu.Link key={link.href} href={link.href}>
                        {link.label}
                      </NavigationMenu.Link>
                    ))}
                  </NavigationMenu.Group>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link href={allComponents.href}>Components</NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu>
        </Navbar.Links>
        <Navbar.Actions column="end" className={styles.actions}>
          <Navbar.Action>
            <SiteSearch placements={placements} />
          </Navbar.Action>
          <Navbar.Action>
            <ModeToggle />
          </Navbar.Action>
          <Navbar.Action hideBelow="lg">
            <GithubLink />
          </Navbar.Action>
        </Navbar.Actions>
        <Navbar.PanelActions>
          <div className={styles.panelActions}>
            <PanelToolLinks />
          </div>
        </Navbar.PanelActions>
      </Navbar.Row>
    </Navbar>
  );
}
