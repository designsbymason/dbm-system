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

export const docsGroups: SiteGroup[] = [
  {
    label: "Getting started",
    links: [
      { label: "Introduction", href: page("getting-started-introduction"), description: "What DBM is and what is in the box" },
      { label: "Installation", href: page("getting-started-installation"), description: "Packages, stylesheet, theme and fonts" },
      { label: "Quick start", href: page("getting-started-quick-start"), description: "An empty app to a themed page" },
      { label: "Frameworks", href: page("getting-started-frameworks"), description: "Next.js, Vite, Astro and server rendering" },
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
      { label: "AI agents", href: page("getting-started-ai-agents"), description: "The files an agent reads" },
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

/** The header's Components link and the home page's way in: Storybook's All components page. */
export const allComponents: SiteLink = { label: "All components", href: page("getting-started-all-components") };
export const changelog: SiteLink = docsGroups[2].links[0];
export const accessibility: SiteLink = docsGroups[1].links[1];
export const quickStart: SiteLink = docsGroups[0].links[2];

export const footerColumns: SiteGroup[] = [
  { label: "Docs", links: [...docsGroups[0].links, docsGroups[1].links[0], docsGroups[1].links[1]] },
  { label: "Components", links: [allComponents, { label: "Foundations", href: foundationsLinks[0].href }, { label: "Hooks and utilities", href: docsGroups[1].links[4].href }] },
  { label: "Resources", links: docsGroups[2].links },
  {
    label: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/designsbymason/dbm-system" },
      { label: "npm", href: "https://www.npmjs.com/package/@dbm-system/components" },
      { label: "Issues", href: "https://github.com/designsbymason/dbm-system/issues" },
      { label: "Security", href: "https://github.com/designsbymason/dbm-system/security/policy" },
      { label: "Licence (MIT)", href: "https://github.com/designsbymason/dbm-system/blob/main/LICENSE" },
    ],
  },
];
