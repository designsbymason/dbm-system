// The site's map in one place (guidelines/docs-site/02-structure.md §1 and §2, ADR-0213): the header's large menus,
// the footer, the docs sidebar and the link check all read it. `built` says whether the page exists yet; a link to a
// page that isn't built is allowed by the link check only while it is listed here as planned.
import manifest from "@dbm-system/components/manifest.json" with { type: "json" };

export interface SiteLink {
  label: string;
  href: string;
  /** One line under the link in a large menu. */
  description?: string;
  /** Whether the page exists. Planned pages may be linked; the link check fails on any other missing page. */
  built: boolean;
}

export interface SiteGroup {
  label: string;
  links: SiteLink[];
}

export const docsGroups: SiteGroup[] = [
  {
    label: "Get started",
    links: [
      { label: "Docs home", href: "/docs", description: "Where everything is", built: false },
      { label: "Introduction", href: "/docs/introduction", description: "What DBM is and what is in the box", built: false },
      { label: "Installation", href: "/docs/installation", description: "Packages, stylesheet, theme and fonts", built: false },
      { label: "Quick start", href: "/docs/quick-start", description: "An empty app to a themed page", built: false },
      { label: "Frameworks", href: "/docs/frameworks", description: "Next.js, Vite, Astro and server rendering", built: false },
    ],
  },
  {
    label: "Guides",
    links: [
      { label: "Theming", href: "/docs/guides/theming", description: "Brands, modes and your own tokens", built: false },
      { label: "Accessibility", href: "/docs/guides/accessibility", description: "What every component does for you", built: false },
      { label: "Responsive and right-to-left", href: "/docs/guides/responsive-and-rtl", description: "Breakpoints and both directions", built: false },
      { label: "Composition patterns", href: "/docs/guides/composition-patterns", description: "Putting components together", built: false },
      { label: "Hooks and utilities", href: "/docs/guides/hooks-and-utilities", description: "The functions that ship with it", built: false },
      { label: "Icons", href: "/docs/guides/icons", description: "Phosphor, sized and coloured", built: false },
    ],
  },
  {
    label: "Foundations",
    links: [{ label: "Foundations", href: "/docs/foundations", description: "Tokens, the three layers and naming", built: false }],
  },
  {
    label: "Resources",
    links: [
      { label: "Changelog", href: "/changelog", description: "Every release", built: false },
      { label: "Roadmap", href: "/roadmap", description: "Built, next and not planned", built: false },
      { label: "FAQ", href: "/faq", description: "Short answers", built: false },
      { label: "Accessibility statement", href: "/accessibility-statement", description: "The target and the known exceptions", built: false },
    ],
  },
];

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** The functional categories, the navigation axis (ADR-0006), from the manifest; Shells are under Templates. */
export const componentCategories: SiteLink[] = [...new Set(manifest.components.map((component) => component.category))]
  .filter((category) => category !== "Shells")
  .sort()
  .map((category) => ({
    label: category,
    href: `/components#${slug(category)}`,
    description: `${manifest.components.filter((component) => component.category === category).length} components`,
    built: false,
  }));

export const primaryLinks: SiteLink[] = [
  { label: "Templates", href: "/templates", built: false },
  { label: "AI agents", href: "/agents", built: false },
];

export const storybookHref = "/storybook/";

export const footerColumns: SiteGroup[] = [
  { label: "Docs", links: [...docsGroups[0].links.slice(1), ...docsGroups[2].links] },
  { label: "Components", links: [{ label: "All components", href: "/components", built: false }, ...componentCategories] },
  { label: "Resources", links: [...docsGroups[3].links, { label: "AI agents", href: "/agents", built: false }] },
  {
    label: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/designsbymason/dbm-system", built: true },
      { label: "npm", href: "https://www.npmjs.com/package/@dbm-system/components", built: true },
      { label: "Issues", href: "https://github.com/designsbymason/dbm-system/issues", built: true },
      { label: "Security", href: "https://github.com/designsbymason/dbm-system/security/policy", built: true },
      { label: "Licence (MIT)", href: "https://github.com/designsbymason/dbm-system/blob/main/LICENSE", built: true },
    ],
  },
];

/** Every page the site links to before it exists. The link check reads this list. */
export const plannedPaths: string[] = [
  ...new Set(
    [...docsGroups.flatMap((group) => group.links), ...componentCategories, ...primaryLinks, ...footerColumns.flatMap((column) => column.links)]
      .filter((link) => !link.built && link.href.startsWith("/"))
      .map((link) => link.href.split("#")[0]),
  ),
  "/components",
];
