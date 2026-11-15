import { Badge, IconButton, Navbar, NavigationMenu, Sidebar } from "@dbm-system/components";
import { FlaskIcon, GithubLogoIcon } from "@dbm-system/icons";
import { componentCategories, docsGroups, primaryLinks, storybookHref } from "../../data/site";
import { LogoMark } from "../LogoMark";
import { ModeMenu } from "./ModeMenu";
import styles from "./SiteHeader.module.css";

export interface SiteHeaderProps {
  /** The top-level section the page belongs to (`/docs`, `/components`, …), marked as current. */
  section?: string;
  /** The published version, read from the components package at build. */
  version: string;
  /**
   * An Article or Reference page has a docs sidebar: below `lg` the header's links move into the sidebar's panel and
   * the header shows its menu button, so a phone has one menu button and one drawer (the Documentation Page recipe).
   */
  withSidebar?: boolean;
}

/**
 * The site header (guidelines/docs-site/02-structure.md §1, ADR-0213): Docs and Components open large menus, then
 * Templates, AI agents and Storybook; the version, GitHub and the mode menu at the end. Search joins it in M1.
 */
export function SiteHeader({ section, version, withSidebar = false }: SiteHeaderProps) {
  return (
    <Navbar sticky collapseBelow={withSidebar ? "never" : "lg"} className={styles.header}>
      {withSidebar && <Sidebar.MenuButton variant="ghost" size="sm" className={styles.menuButton} aria-label="Site and section menu" />}
      <Navbar.Brand href="/" aria-label="DBM System, home">
        <LogoMark className={styles.logo} title="dbM" />
      </Navbar.Brand>
      <Navbar.Links aria-label="Main" hideBelow={withSidebar ? "lg" : undefined}>
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
            <NavigationMenu.Item value="components">
              <NavigationMenu.Trigger>Components</NavigationMenu.Trigger>
              <NavigationMenu.Content layout="columns">
                <NavigationMenu.Group label="By category" columns={2}>
                  {componentCategories.map((link) => (
                    <NavigationMenu.Link key={link.href} href={link.href} description={link.description}>
                      {link.label}
                    </NavigationMenu.Link>
                  ))}
                </NavigationMenu.Group>
                <NavigationMenu.Group label="Reference">
                  <NavigationMenu.Link href="/components" description="Every component, with filters">
                    All components
                  </NavigationMenu.Link>
                  <NavigationMenu.Link href="/components#hooks-and-functions" description="The hooks and functions that ship with it">
                    Hooks and functions
                  </NavigationMenu.Link>
                </NavigationMenu.Group>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            {primaryLinks.map((link) => (
              <NavigationMenu.Item key={link.href}>
                <NavigationMenu.Link href={link.href} current={section === link.href || undefined}>
                  {link.label}
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            ))}
            {/* Storybook is a different tool, the workshop: set apart, with its own mark. */}
            <NavigationMenu.Item className={styles.workshop}>
              <NavigationMenu.Link href={storybookHref} icon={FlaskIcon}>
                Storybook
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </Navbar.Links>
      <Navbar.Actions>
        <Navbar.Action hideBelow="md">
          <a className={styles.version} href="https://github.com/designsbymason/dbm-system/releases">
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
