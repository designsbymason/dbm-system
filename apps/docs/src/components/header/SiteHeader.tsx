import { Badge, Button, Divider, IconButton, Navbar, NavigationMenu } from "@dbm-system/components";
import { FlaskIcon, GithubLogoIcon } from "@dbm-system/icons";
import { allComponents, changelog, docsGroups, foundationsLinks, storybookHref } from "../../data/site";
import { Wordmark } from "../Wordmark";
import { ModeToggle } from "./ModeToggle";
import { SiteSearch } from "./SiteSearch";
import styles from "./SiteHeader.module.css";

const githubHref = "https://github.com/designsbymason/dbm-system";

export interface SiteHeaderProps {
  /** The published version, read from the components package at build. */
  version: string;
}

/** Storybook and GitHub as brand-toned icon buttons, each with an accessible name and a tooltip (the link carries the name too, for lint). */
function ToolLinks() {
  return (
    <>
      <IconButton asChild icon={FlaskIcon} aria-label="Storybook, the documentation" tooltip="Storybook" variant="ghost" size="sm">
        <a href={storybookHref} aria-label="Storybook, the documentation" />
      </IconButton>
      <IconButton asChild icon={GithubLogoIcon} aria-label="DBM System on GitHub" tooltip="GitHub" variant="ghost" size="sm">
        <a href={githubHref} aria-label="DBM System on GitHub" />
      </IconButton>
    </>
  );
}

/** The same two links in the menu panel, with their names showing: a touch screen has no tooltip to read an icon from. */
function PanelToolLinks() {
  return (
    <>
      <Button asChild variant="ghost" size="sm" leadingIcon={FlaskIcon}>
        <a href={storybookHref}>Storybook</a>
      </Button>
      <Button asChild variant="ghost" size="sm" leadingIcon={GithubLogoIcon}>
        <a href={githubHref}>GitHub</a>
      </Button>
    </>
  );
}

/**
 * The home page's header (guidelines/docs-site/02-structure.md §1, ADR-0220): the wordmark and the version, then Docs and
 * Foundations menus of Storybook pages and a Components link; search, the mode control, and Storybook and GitHub after a
 * divider. Below `lg` the bar keeps the wordmark, the version, search and the menu button; the menus become expandable
 * groups in the menu panel and the mode toggle, Storybook and GitHub move to the panel's foot as labelled buttons.
 */
export function SiteHeader({ version }: SiteHeaderProps) {
  return (
    <Navbar sticky collapseBelow="lg" className={styles.header}>
      <Navbar.Brand href="/" aria-label="DBM System, home">
        <Wordmark className={styles.logo} />
      </Navbar.Brand>
      <a className={styles.version} href={changelog.href}>
        <Badge tone="brand" variant="subtle">{`v${version}`}</Badge>
        <span className="visually-hidden">, changelog</span>
      </a>
      <Navbar.Links aria-label="Main">
        <NavigationMenu>
          <NavigationMenu.List>
            <NavigationMenu.Item value="docs">
              <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
              <NavigationMenu.Content layout="columns">
                {docsGroups.map((group) => (
                  <NavigationMenu.Group key={group.label} label={group.label}>
                    {group.links.map((link) => (
                      <NavigationMenu.Link key={link.href} href={link.href} description={link.description}>
                        {link.label}
                      </NavigationMenu.Link>
                    ))}
                  </NavigationMenu.Group>
                ))}
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item value="foundations">
              <NavigationMenu.Trigger>Foundations</NavigationMenu.Trigger>
              <NavigationMenu.Content layout="columns">
                <NavigationMenu.Group label="Design tokens" columns={2}>
                  {foundationsLinks.map((link) => (
                    <NavigationMenu.Link key={link.href} href={link.href} description={link.description}>
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
      <Navbar.Actions>
        <Navbar.Action>
          <SiteSearch />
        </Navbar.Action>
        <Navbar.Action hideBelow="lg">
          <ModeToggle />
        </Navbar.Action>
        <Navbar.Action hideBelow="lg">
          <Divider orientation="vertical" className={styles.divider} />
        </Navbar.Action>
        <Navbar.Action hideBelow="lg">
          <ToolLinks />
        </Navbar.Action>
      </Navbar.Actions>
      <Navbar.PanelActions>
        <div className={styles.panelActions}>
          <ModeToggle labelled />
          <PanelToolLinks />
        </div>
      </Navbar.PanelActions>
    </Navbar>
  );
}
