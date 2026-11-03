# 0170 — The docs website is an Astro app with React islands, deployed with Storybook as one GitHub Pages site on the apex of dbm-system.com, over Next.js, a separate Storybook host or a documentation-framework theme

**Status:** Accepted · **Date:** 2026-11-03

## Context
`01-vision-and-goals.md` Phase 9 lists a documentation website and public Storybook hosting, and `02-tech-stack-and-structure.md` named "Next.js or Astro" and "GitHub Pages or Cloudflare Pages" without choosing. The project owns the domain `dbm-system.com`. The site must render live DBM (React) components, be a premium first impression, stay free and open-source in its tooling, and be hosted without usage-based billing. GitHub Pages serves one site per repository, and pull requests have no preview environment there.

## Decision
- **Framework:** Astro with the React and MDX integrations, exported as a static site. DBM components render as React islands only where a page needs them.
- **One deployment:** a GitHub Actions workflow builds the docs site and Storybook and publishes them as one Pages artifact. The docs site is the root of `dbm-system.com`; Storybook is at `dbm-system.com/storybook/`.
- **Canonical host:** the apex, `https://dbm-system.com`. `www` redirects to it. HTTPS is enforced.
- **Deploy trigger:** every push to `main` while the packages are 0.x. Move to release tags at 1.0.
- **Components in the docs build:** the workspace packages for development and previews, and the published version for release builds, which also tests the package in a fresh app.
- **Versioning:** one site for the latest release until 1.0; from 1.0 each major keeps its docs under a version path (`/v1/`).
- **Search:** Pagefind, an open-source static index built at deploy time. **No analytics** and no third-party scripts.
- **Content licence:** MIT, as the code.

## Alternatives considered
- **Next.js static export.** Already named in the guidelines and all React, so demos are simple. Rejected: it ships more JavaScript for a content site, and static export turns off several Next features anyway.
- **A separate Storybook host or subdomain** (`storybook.dbm-system.com`). Cleaner URLs, but GitHub Pages allows one site per repository, so it needs a second repository or Cloudflare Pages. One origin also lets the docs deep-link into Storybook with plain relative links.
- **Cloudflare Pages.** Allows several projects from one repository and has no billing risk. Not chosen because GitHub Pages is the simplest while the repository is on GitHub; this can change without touching the content.
- **Vercel.** Rejected in the free-and-open-source reasoning behind `02`'s hosting row: a proprietary service with usage limits, and its main benefit, pull-request previews, is limited here.
- **A ready-made documentation theme.** Fastest, but it would look like another system and weaken the token-driven, premium story.
- **Algolia DocSearch, or a hosted or self-hosted analytics service.** Rejected: a third-party service seeing readers, against the project's no-phone-home rule (Storybook telemetry is already off).
- **Versioned from the first release.** Rejected as upkeep for a 0.x API that changes often.

## Consequences
- Both sites are static, so moving the host later is a workflow and DNS change.
- Storybook must work from a subpath. Its static build uses relative asset paths and the Getting started page reads its index with a relative URL, but this has to be verified in the combined artifact.
- The docs build needs the packages built first, and the manifest (Phase 8) before it can generate component pages. The skeleton, the landing page and the pipeline do not depend on either.
- Release-version docs builds need the publish pipeline to exist.
- No analytics means no numbers about readers; any later change needs a new ADR.

## Related
`guidelines/docs-site/` (the plan, structure and landing page brief). `01-vision-and-goals.md` §13 (Phase 9). `02-tech-stack-and-structure.md` (the docs-site and hosting rows). [ADR-0140](./0140-the-design-system-takes-no-animation-library-and-animates-with-css-and-the-motion-tokens-over-keeping-motion-as-an-optional-peer-dependency.md) (the docs site chooses its own animation library).
