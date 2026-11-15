import { Badge, IconButton, Navbar } from "@dbm-system/components";
import { GithubLogoIcon } from "@dbm-system/icons";
import { LogoMark } from "../LogoMark";
import { ModeMenu } from "./ModeMenu";
import styles from "./SiteHeader.module.css";

const sections = [
  { label: "Docs", href: "/docs" },
  { label: "Components", href: "/components" },
  { label: "Templates", href: "/templates" },
  { label: "AI agents", href: "/agents" },
];

interface SiteHeaderProps {
  /** The section the page belongs to, marked as current. */
  current?: string;
  /** The published version, read from the components package at build. */
  version: string;
}

/**
 * The site header (guidelines/docs-site/02-structure.md §1). Search and the large menus join it in M1;
 * this is the bar the sample page needs.
 */
export function SiteHeader({ current, version }: SiteHeaderProps) {
  return (
    <Navbar sticky collapseBelow="md" className={styles.header}>
      <Navbar.SkipLink href="#main">Skip to content</Navbar.SkipLink>
      <Navbar.Brand href="/" aria-label="DBM System, home">
        <LogoMark className={styles.logo} title="dbM" />
      </Navbar.Brand>
      <Navbar.Links aria-label="Main">
        {sections.map((section) => (
          <Navbar.Link key={section.href} href={section.href} current={current === section.href}>
            {section.label}
          </Navbar.Link>
        ))}
        <Navbar.Link href="/storybook/" className={styles.workshop}>
          Storybook
        </Navbar.Link>
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
