import { BackToTop, Breadcrumb, PageShell, Sidebar, TableOfContents } from "@dbm-system/components";
import type { ReactNode } from "react";
import { docsGroups, hrefOf, primaryLinks, storybookHref } from "../../data/site";
import { SiteHeader } from "../header/SiteHeader";
import { SiteFooter } from "./SiteFooter";
import styles from "./SiteShell.module.css";

export interface OutlineItem {
  id: string;
  label: string;
  level: 1 | 2;
}

export interface Crumb {
  label: string;
  /** Omitted for the current page, the last crumb. */
  href?: string;
}

export interface SiteShellProps {
  /**
   * The page type (02-structure.md §3): `marketing` is full-width sections (the home page, Docs home); `article` adds
   * the docs sidebar, breadcrumbs and an outline, the Documentation Page recipe on `PageShell`. Reference pages
   * (component pages, M2) are an article with a component header and example frames.
   */
  kind: "marketing" | "article";
  /** The published version, for the header. */
  version: string;
  /** The top-level section (`/docs`, `/components`, …), marked as current in the header. */
  section?: string;
  /** The page's own path, so the sidebar marks it as current. */
  path?: string;
  /** The article's outline: its `h2` and `h3` headings, with their ids. */
  outline?: OutlineItem[];
  breadcrumbs?: Crumb[];
  children: ReactNode;
}

/**
 * Every page's frame: the header, the page, the footer and back-to-top, all DBM components (`PageShell`, `Navbar`,
 * `Sidebar`, `TableOfContents`, `Breadcrumb`). The page's own content arrives as `children`, rendered by Astro.
 */
export function SiteShell({ kind, version, section, path, outline = [], breadcrumbs, children }: SiteShellProps) {
  if (kind === "marketing") {
    return (
      <PageShell>
        <PageShell.SkipLink href="#main" />
        <SiteHeader version={version} section={section} />
        <PageShell.Main id="main">{children}</PageShell.Main>
        <PageShell.Footer>
          <SiteFooter />
        </PageShell.Footer>
        <BackToTop />
      </PageShell>
    );
  }

  return (
    <Sidebar.Provider collapseBelow="lg">
      <PageShell>
        <PageShell.SkipLink href="#main" />
        <SiteHeader version={version} section={section} withSidebar />
        {/* How far through the page the reader is: a hairline under the header, drawn by a CSS scroll timeline (ADR-0212). */}
        <div className={styles.progress} aria-hidden="true" />
        <PageShell.Body width="full" paddingInline={0} paddingBlock={0}>
          <Sidebar sticky stickyOffset="var(--page-shell-header-height, 0px)" width="16rem" panelWidth="20rem" currentPath={path} className={styles.sidebar}>
            <Sidebar.Content>
              <Sidebar.Nav aria-label="Docs">
                {docsGroups.map((group) => (
                  <Sidebar.Section key={group.label} label={group.label}>
                    {group.links.map((link) => {
                      const href = hrefOf(link);
                      return (
                        href && (
                          <Sidebar.Item key={link.href} href={href} current={path === link.href || undefined}>
                            {link.label}
                          </Sidebar.Item>
                        )
                      );
                    })}
                  </Sidebar.Section>
                ))}
                {/* On a phone and a tablet the header's links live here, so there is one drawer. */}
                <Sidebar.Section label="dbm-system.com" className={styles.siteSection}>
                  <Sidebar.Item href={storybookHref}>Components</Sidebar.Item>
                  {primaryLinks.map((link) => (
                    <Sidebar.Item key={link.href} href={hrefOf(link)}>
                      {link.label}
                    </Sidebar.Item>
                  ))}
                  <Sidebar.Item href={storybookHref}>Storybook</Sidebar.Item>
                </Sidebar.Section>
              </Sidebar.Nav>
            </Sidebar.Content>
          </Sidebar>
          <PageShell.Main id="main">
            {outline.length > 0 && (
              <TableOfContents
                layout="row"
                sticky
                stickyOffset="var(--page-shell-header-height, 0px)"
                className={styles.outlineRow}
                items={outline}
                aria-label="On this page, as pills"
              />
            )}
            <div className={styles.article}>
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb size="sm">
                  {breadcrumbs.map((crumb) => (
                    <Breadcrumb.Item key={crumb.label}>
                      {crumb.href ? <Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link> : <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>}
                    </Breadcrumb.Item>
                  ))}
                </Breadcrumb>
              )}
              {children}
            </div>
          </PageShell.Main>
          {outline.length > 0 && (
            <PageShell.Aside aria-label="On this page" className={styles.outline} sticky width="14rem">
              <TableOfContents items={outline} aria-label="On this page" />
            </PageShell.Aside>
          )}
        </PageShell.Body>
        <PageShell.Footer>
          <SiteFooter />
        </PageShell.Footer>
        <BackToTop />
      </PageShell>
    </Sidebar.Provider>
  );
}
