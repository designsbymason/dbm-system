// The site's map in one place (guidelines/docs-site/02-structure.md §1, ADR-0220): the header's menus and the footer
// read it. The documentation is Storybook, so every docs link goes into it, in the same tab; the ids are the Docs
// pages' ids in Storybook's index (packages/components/src/guides/ and src/foundations/), and the link check fails on
// any of them that the built Storybook does not have.

export interface SiteLink {
  label: string;
  href: string;
  /** One line under the link in a large menu. */
  description?: string;
}

export interface SiteGroup {
  label: string;
  links: SiteLink[];
}

/** Where Storybook is on this origin. */
export const storybookHref = "/storybook/";

/** The Storybook address of a Docs page, from its id (`guides-theming` for `guides-theming--docs`). */
const page = (id: string) => `${storybookHref}?path=/docs/${id}--docs`;

/** The same, for a page outside this file (the home page's component table links each name to its Docs page). */
export const docsPage = page;

export const docsGroups: SiteGroup[] = [
  {
    label: "Getting started",
    links: [
      { label: "Introduction", href: page("getting-started-introduction"), description: "What DBM is and what is in the box" },
      { label: "Installation", href: page("getting-started-installation"), description: "Packages, stylesheet, theme and fonts" },
      { label: "Quick start", href: page("getting-started-quick-start"), description: "An empty app to a themed page" },
      { label: "Frameworks", href: page("getting-started-frameworks"), description: "Next.js, Vite, Astro and server rendering" },
      { label: "AI agents", href: page("getting-started-ai-agents"), description: "The files an agent reads" },
    ],
  },
  {
    label: "Guides",
    links: [
      { label: "Theming", href: page("guides-theming"), description: "Brands, modes and your own tokens" },
      { label: "Accessibility", href: page("guides-accessibility"), description: "What every component does for you" },
      { label: "Responsive and right-to-left", href: page("guides-responsive-and-right-to-left"), description: "Breakpoints and both directions" },
      { label: "Composition patterns", href: page("guides-composition-patterns"), description: "Putting components together" },
      { label: "Hooks and utilities", href: page("guides-hooks-and-utilities"), description: "The functions that ship with it" },
      { label: "Icons", href: page("guides-icons"), description: "Phosphor, sized and coloured" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Changelog", href: page("resources-changelog"), description: "Every release" },
      { label: "Roadmap", href: page("resources-roadmap"), description: "Built, next and not planned" },
      { label: "FAQ", href: page("resources-faq"), description: "Short answers" },
    ],
  },
];

export const foundationsLinks: SiteLink[] = [
  { label: "Overview", href: page("foundations-overview"), description: "The three layers and the naming" },
  { label: "Color", href: page("foundations-color"), description: "The scales, the semantic colours and every contrast pair" },
  { label: "Typography", href: page("foundations-typography"), description: "Nunito, Lora and the fluid scale" },
  { label: "Spacing", href: page("foundations-spacing"), description: "The 4 px scale" },
  { label: "Radius", href: page("foundations-radius"), description: "From none to full" },
  { label: "Shadows", href: page("foundations-shadows"), description: "Elevation in light and dark" },
  { label: "Motion", href: page("foundations-motion"), description: "Durations, easings and reduced motion" },
  { label: "Icon sizes", href: page("foundations-iconsizes"), description: "Sizes beside text" },
  { label: "Miscellaneous", href: page("foundations-miscellaneous"), description: "Border widths, opacity and stacking" },
  { label: "Breakpoints", href: page("foundations-breakpoints"), description: "From sm to 3xl" },
];

/** The header's Components link and the home page's way in: Storybook's Index page, at the top of Components. */
export const allComponents: SiteLink = { label: "Components", href: page("components-index") };
const link = (group: SiteGroup, label: string): SiteLink => {
  const found = group.links.find((candidate) => candidate.label === label);
  if (!found) throw new Error(`site.ts: no "${label}" link in ${group.label}`);
  return found;
};
const [gettingStarted, guides, resources] = docsGroups as [SiteGroup, SiteGroup, SiteGroup];
export const changelog: SiteLink = link(resources, "Changelog");
export const accessibility: SiteLink = link(guides, "Accessibility");
export const quickStart: SiteLink = link(gettingStarted, "Quick start");
/** The first page in Guides, where the home page's "Guides" button goes. */
export const theming: SiteLink = link(guides, "Theming");
export const introduction: SiteLink = link(gettingStarted, "Introduction");
export const installation: SiteLink = link(gettingStarted, "Installation");
export const aiAgents: SiteLink = link(gettingStarted, "AI agents");

/** This website's own accessibility statement; the components' guarantees and known exceptions are in the Accessibility guide (`accessibility`). */
export const accessibilityStatement: SiteLink = { label: "Accessibility", href: "/accessibility" };

/** The footer's links: the site's accessibility statement and its two legal pages. */
export const footerLinks: SiteLink[] = [
  accessibilityStatement,
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
];
