import { Badge, IconButton, Navbar, NavigationMenu } from "@dbm-system/components";
import { FlaskIcon, GithubLogoIcon } from "@dbm-system/icons";
import { allComponents, changelog, docsGroups, foundationsLinks, storybookHref } from "../../data/site";
import { LogoMark } from "../LogoMark";
import { ModeMenu } from "./ModeMenu";
import { SiteSearch } from "./SiteSearch";
import styles from "./SiteHeader.module.css";

export interface SiteHeaderProps {
  /** The published version, read from the components package at build. */
  version: string;
}

/**
 * The site header (guidelines/docs-site/02-structure.md §1, ADR-0220): Docs and Foundations open menus of Storybook pages,
 * Components links to All components, then Storybook; search, the version, GitHub and the mode menu at the end.
 */
export function SiteHeader({ version }: SiteHeaderProps) {
  return (
    <Navbar sticky collapseBelow="lg" className={styles.header}>
      <Navbar.Brand href="/" aria-label="DBM System, home">
        <LogoMark className={styles.logo} title="dbM" />
      </Navbar.Brand>
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
            {/* Storybook is the workshop as well as the docs: set apart, with its own mark. */}
            <NavigationMenu.Item className={styles.workshop}>
              <NavigationMenu.Link href={storybookHref} icon={FlaskIcon}>
                Storybook
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </Navbar.Links>
      <Navbar.Actions>
        <Navbar.Action>
          <SiteSearch />
        </Navbar.Action>
        <Navbar.Action hideBelow="md">
          <a className={styles.version} href={changelog.href}>
            <Badge tone="neutral" variant="subtle">{`v${version}`}</Badge>
            <span className="visually-hidden">, release notes</span>
          </a>
        </Navbar.Action>
        <Navbar.Action>
          {/* IconButton draws the icon inside the empty link (ADR-0218); the link carries the same name for lint. */}
          <IconButton asChild icon={GithubLogoIcon} aria-label="DBM System on GitHub" tooltip="GitHub" variant="ghost" size="sm">
            <a href="https://github.com/designsbymason/dbm-system" aria-label="DBM System on GitHub" />
          </IconButton>
        </Navbar.Action>
        <Navbar.Action>
          <ModeMenu />
        </Navbar.Action>
      </Navbar.Actions>
    </Navbar>
  );
}
