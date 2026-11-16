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
  /** Where the link goes until the page is built (a guide's Storybook page, say); without one an unbuilt link isn't shown. */
  fallback?: string;
}

/** Where a link should go today: the page itself once built, its fallback until then, or nowhere. */
export function hrefOf(link: SiteLink): string | undefined {
  return link.built ? link.href : link.fallback;
}

export interface SiteGroup {
  label: string;
  links: SiteLink[];
}

export const docsGroups: SiteGroup[] = [
  {
    label: "Get started",
    links: [
      { label: "Docs home", href: "/docs", description: "Where everything is", built: true },
      { label: "Introduction", href: "/docs/introduction", description: "What DBM is and what is in the box", built: true },
      { label: "Installation", href: "/docs/installation", description: "Packages, stylesheet, theme and fonts", built: true },
      { label: "Quick start", href: "/docs/quick-start", description: "An empty app to a themed page", built: true },
      { label: "Frameworks", href: "/docs/frameworks", description: "Next.js, Vite, Astro and server rendering", built: true },
    ],
  },
  {
    label: "Guides",
    links: [
      { label: "Theming", href: "/docs/guides/theming", description: "Brands, modes and your own tokens", built: false, fallback: "/storybook/?path=/docs/guides-theming--docs" },
      { label: "Accessibility", href: "/docs/guides/accessibility", description: "What every component does for you", built: false, fallback: "/storybook/?path=/docs/guides-accessibility--docs" },
      { label: "Responsive and right-to-left", href: "/docs/guides/responsive-and-rtl", description: "Breakpoints and both directions", built: false, fallback: "/storybook/?path=/docs/guides-responsive-and-right-to-left--docs" },
      { label: "Composition patterns", href: "/docs/guides/composition-patterns", description: "Putting components together", built: false, fallback: "/storybook/?path=/docs/guides-composition-patterns--docs" },
      { label: "Hooks and utilities", href: "/docs/guides/hooks-and-utilities", description: "The functions that ship with it", built: false, fallback: "/storybook/?path=/docs/guides-hooks-and-utilities--docs" },
      { label: "Icons", href: "/docs/guides/icons", description: "Phosphor, sized and coloured", built: false, fallback: "/storybook/?path=/docs/guides-icons--docs" },
    ],
  },
  {
    label: "Foundations",
    links: [{ label: "Foundations", href: "/docs/foundations", description: "Tokens, the three layers and naming", built: true }],
  },
  {
    label: "Resources",
    links: [
      { label: "Changelog", href: "/changelog", description: "Every release", built: false, fallback: "https://github.com/designsbymason/dbm-system/releases" },
      { label: "Roadmap", href: "/roadmap", description: "Built, next and not planned", built: true },
      { label: "FAQ", href: "/faq", description: "Short answers", built: true },
      { label: "Accessibility statement", href: "/accessibility-statement", description: "The target and the known exceptions", built: true },
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
    // Until the component pages exist (M2), Storybook is where the components are.
    fallback: "/storybook/",
  }));

export const primaryLinks: SiteLink[] = [
  { label: "Templates", href: "/templates", built: false, fallback: "/storybook/" },
  { label: "AI agents", href: "/agents", built: true },
];

export const storybookHref = "/storybook/";

export const footerColumns: SiteGroup[] = [
  { label: "Docs", links: [...docsGroups[0].links.slice(1), ...docsGroups[2].links] },
  { label: "Components", links: [{ label: "All components", href: "/components", built: false, fallback: "/storybook/" }, ...componentCategories] },
  { label: "Resources", links: [...docsGroups[3].links, { label: "AI agents", href: "/agents", built: true }] },
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

/** The docs group a page belongs to, for its breadcrumbs. */
export function groupOf(href: string): SiteGroup | undefined {
  return docsGroups.find((group) => group.links.some((link) => link.href === href));
}
