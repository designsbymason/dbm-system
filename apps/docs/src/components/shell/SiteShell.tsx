import { BackToTop, PageShell } from "@dbm-system/components";
import type { ReactNode } from "react";
import type { Placements } from "../header/searchIndex";
import { SiteHeader } from "../header/SiteHeader";
import { SiteFooter } from "./SiteFooter";

export interface SiteShellProps {
  /** The published version, for the header. */
  version: string;
  /** Each component's tier and category, for the header's search. */
  placements: Placements;
  children: ReactNode;
}

/**
 * Every page's frame: the header, the page, the footer and back-to-top, all DBM components (`PageShell`, `Navbar`). The
 * site is the home page and the 404 (ADR-0220); the documentation is Storybook, so there is no docs sidebar or outline.
 * The page's own content arrives as `children`, rendered by Astro.
 */
export function SiteShell({ version, placements, children }: SiteShellProps) {
  return (
    <PageShell>
      <PageShell.SkipLink href="#main" />
      <SiteHeader version={version} placements={placements} />
      <PageShell.Main id="main">{children}</PageShell.Main>
      <PageShell.Footer>
        <SiteFooter />
      </PageShell.Footer>
      <BackToTop />
    </PageShell>
  );
}
