// The code shown under each story's "Show code" button on Breadcrumb's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object plus demo-only helpers (`DemoTrail`, `demoContainerStyle`),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of
// what its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { quote, truncateValue } from "../../snippetHelpers";
import type { BreadcrumbCompact, BreadcrumbSize, BreadcrumbTone } from "./Breadcrumb.types";

const link = (label: string, href: string, attributes = "") =>
  `  <Breadcrumb.Item>\n    <Breadcrumb.Link href="${href}"${attributes ? ` ${attributes}` : ""}>${label}</Breadcrumb.Link>\n  </Breadcrumb.Item>`;

const page = (label: string) => `  <Breadcrumb.Item>\n    <Breadcrumb.Page>${label}</Breadcrumb.Page>\n  </Breadcrumb.Item>`;

const defaultItems = [
  link("Home", "/"),
  link("Products", "/products"),
  link("Keyboards", "/products/keyboards"),
  page("Mechanical"),
].join("\n");

const longItems = [
  link("Home", "/"),
  link("Products", "/products"),
  link("Keyboards", "/products/keyboards"),
  link("Mechanical", "/products/keyboards/mechanical"),
  link("Switches", "/products/keyboards/mechanical/switches"),
  page("Linear"),
].join("\n");

const trail = (attributes = "", items = defaultItems) =>
  `<Breadcrumb${attributes ? ` ${attributes}` : ""}>\n${items}\n</Breadcrumb>`;

export const breadcrumbSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — text, icons and gaps */}
${trail('size="sm"')}`,

  tones: `{/* tone: "info" (default, the standard link colour) | "brand" | "neutral". The current page is
    always primary text. Put info and brand links on a surface, not on the canvas. */}
${trail('tone="brand"')}`,

  underline: `{/* underline keeps every link underlined; without it a link is underlined only on hover,
    in the link's own colour either way */}
${trail("underline")}`,

  separators: `{/* separator: "chevron" (default) | "slash" | any string or element you like.
    It is drawn by the component and hidden from screen readers. */}
${trail('separator="slash"')}`,

  icons: `{/* HouseIcon comes from @dbm-system/icons. An icon is decorative, so the
    link keeps its text. */}
${trail(
  "",
  [
    link("Home", "/", "icon={HouseIcon}"),
    link("Products", "/products"),
    link("Keyboards", "/products/keyboards"),
    `  <Breadcrumb.Item>\n    <Breadcrumb.Page icon={KeyboardIcon}>Mechanical</Breadcrumb.Page>\n  </Breadcrumb.Item>`,
  ].join("\n"),
)}`,

  collapsed: `{/* maxItems: with more items than this, the middle collapses into a "…" button that
    shows them all when used. The first item and the last two stay visible. */}
${trail("maxItems={4}", longItems)}`,

  container: `{/* maxItems="container" collapses only as many items as it takes to fit the trail's own
    width, measured in the browser — and measures again when the width changes. */}
${trail('maxItems="container"', longItems)}`,

  compact: `{/* compact: "never" (default) | "auto" | "always". The compact form is one link back to the
    item above the current page. "auto" is for phone-width screens; wider ones get the full trail. */}
${trail('compact="auto"')}`,

  truncate: `{/* truncate keeps the trail on one line and cuts a label that doesn't fit short with an
    ellipsis. A plain-text label also carries its full text as a tooltip. */}
${trail(
  "truncate",
  [
    link("Home", "/"),
    link("Enterprise software licensing and procurement", "/licensing"),
    page("Renewal terms and conditions for the current financial year"),
  ].join("\n"),
)}`,

  collapseWindow: `{/* itemsBeforeCollapse and itemsAfterCollapse choose how many stay visible on each
    side of the "…" button. The last item, the current page, always stays. */}
${trail("maxItems={4} itemsBeforeCollapse={2} itemsAfterCollapse={1}", longItems)}`,

  router: `{/* asChild renders your own single child element with Breadcrumb's look — here a plain
    <a>, standing in for your router's link component (which goes in its place). The icon is
    drawn inside that element, before its own text. HouseIcon comes from @dbm-system/icons. */}
<Breadcrumb>
  <Breadcrumb.Item>
    <Breadcrumb.Link asChild href="/" icon={HouseIcon}>
      <a href="/">Home</a>
    </Breadcrumb.Link>
  </Breadcrumb.Item>
  <Breadcrumb.Item>
    <Breadcrumb.Page>Products</Breadcrumb.Page>
  </Breadcrumb.Item>
</Breadcrumb>`,

  disabledLink: `{/* disabled keeps the link in the page and focusable, but dims it and blocks it */}
<Breadcrumb>
${link("Home", "/")}
${link("Archive", "/archive", "disabled")}
${page("Issue 42")}
</Breadcrumb>`,

  externalLink: `{/* An absolute URL is treated as external: it opens in a new tab, with an icon and a
    hidden "(opens in a new tab)" cue for screen readers. */}
<Breadcrumb>
${link("Docs", "https://example.com/docs")}
${page("Getting started")}
</Breadcrumb>`,

  longLabels: `{/* A trail too wide for its container wraps onto more lines. */}
${trail(
  "",
  [
    link("Home", "/"),
    link("Enterprise software licensing and procurement", "/licensing"),
    link("Volume agreements for education and non-profit organisations", "/licensing/volume"),
    page("Renewal terms and conditions for the current financial year"),
  ].join("\n"),
)}`,

  namedNav: `{/* Name each breadcrumb when a page holds more than one */}
${trail('aria-label="Product path"')}`,

  translated: `{/* labels holds every piece of text the component writes itself */}
${trail(
  `labels={{ navigation: "Fil d'Ariane", expand: (count) => \`Afficher \${count} pages masquées\` }} maxItems={4}`,
  longItems,
)}`,

  rightToLeft: `{/* dir="rtl" mirrors the trail, and the chevron flips to point the reading way */}
${trail('dir="rtl"')}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface BreadcrumbPlaygroundSnippetArgs {
  size?: BreadcrumbSize;
  tone?: BreadcrumbTone;
  underline?: boolean;
  separator?: unknown;
  maxItems?: unknown;
  compact?: BreadcrumbCompact;
  truncate?: boolean;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  "aria-label"?: string;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, on a small real trail (a longer one once `maxItems` is set,
 * so the collapse has something to collapse).
 */
export function breadcrumbPlaygroundSnippet(args: BreadcrumbPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "info") attributes.push(`tone="${args.tone}"`);
  if (args.underline) attributes.push("underline");
  if (typeof args.separator === "string" && args.separator !== "chevron" && args.separator !== "") {
    attributes.push(`separator=${quote(args.separator)}`);
  }
  // The Playground's `maxItems` is a select: "off", a number as text, or "container".
  const maxItems = args.maxItems === "container" ? "container" : truncateValue(args.maxItems);
  if (args.compact && args.compact !== "never") attributes.push(`compact="${args.compact}"`);
  if (args.truncate) attributes.push("truncate");
  if (maxItems !== undefined) {
    attributes.push(maxItems === "container" ? 'maxItems="container"' : `maxItems={${maxItems}}`);
    if (args.itemsBeforeCollapse !== undefined && args.itemsBeforeCollapse !== 1) {
      attributes.push(`itemsBeforeCollapse={${args.itemsBeforeCollapse}}`);
    }
    if (args.itemsAfterCollapse !== undefined && args.itemsAfterCollapse !== 2) {
      attributes.push(`itemsAfterCollapse={${args.itemsAfterCollapse}}`);
    }
  }
  if (args["aria-label"] && args["aria-label"] !== "Breadcrumb") attributes.push(`aria-label=${quote(args["aria-label"])}`);
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  return trail(attributes.join(" "), maxItems === undefined ? defaultItems : longItems);
}
