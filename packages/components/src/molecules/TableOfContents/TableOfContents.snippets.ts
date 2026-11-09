// The code shown under each story's "Show code" button on TableOfContents' Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers (`DemoPage`, the scroll box), which can't be pasted anywhere. Each snippet is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { TableOfContentsSize, TableOfContentsTone } from "./TableOfContents.types";

const defaultItems = `[
    { id: "overview", label: "Overview" },
    { id: "installation", label: "Installation" },
    { id: "usage", label: "Usage" },
    { id: "accessibility", label: "Accessibility" },
  ]`;

const nestedItems = `[
    { id: "installation", label: "Installation" },
    { id: "requirements", label: "Requirements", level: 2 },
    { id: "setup", label: "Setup", level: 2 },
    { id: "options", label: "Options", level: 3 },
    { id: "usage", label: "Usage" },
  ]`;

/** An outline, one attribute to a line. */
const toc = (attributes: string[] = [], items = defaultItems) =>
  `<TableOfContents
${attributes.map((attribute) => `  ${attribute}
`).join("")}  items={${items}}
/>`;

export const tableOfContentsSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — text and spacing */}
${toc(['size="sm"'])}`,

  tones: `{/* tone: "brand" (default) | "neutral". Neutral keeps the current entry in primary text, and is the one to
    use on bg.canvas, where brand text falls under the contrast floor. */}
${toc(['tone="neutral"'])}`,

  highlighted: `{/* The current entry has a subtle background in the tone's own tint (brand-subtle for
    "brand", neutral-subtle for "neutral"), on by default. The marker bar is there either way. */}
${toc(['tone="neutral"'])}`,

  notHighlighted: `{/* highlightActive={false} leaves just the marker bar beside the current entry */}
${toc(["highlightActive={false}"])}`,

  numbered: `{/* numbered writes the entries as an outline — 1, 1.1, 1.2, 2 — by the levels drawn */}
${toc(["numbered"], nestedItems)}`,

  movingMarker: `{/* movingMarker: one bar that slides to the current entry (not for a person who prefers
    reduced motion) */}
${toc(["movingMarker"])}`,

  groups: `{/* collapsibleGroups: an entry with deeper entries after it gets a button that folds them away */}
${toc(["collapsibleGroups"], nestedItems)}`,

  groupsClosed: `{/* groupsDefaultOpen={false}: every group starts closed except the one holding the current
    entry, which opens as the page is read */}
${toc(["collapsibleGroups", "groupsDefaultOpen={false}"], nestedItems)}`,

  dropdown: `{/* The phone setup: below the sm breakpoint the outline folds into a select-like button that always
    shows the entry being read, opens the list as an overlay, and sticks to the top while folded. Above it,
    it is the plain outline. The headings are kept clear of the bar for you. The bar's parent must be as
    tall as the content it follows. */}
{/* const boxRef = useRef<HTMLDivElement>(null);  (only if the page isn't what scrolls) */}
${toc(['collapse="auto"', 'foldedStyle="dropdown"', 'sticky="folded"', "scrollContainerRef={boxRef}"])}`,

  row: `{/* layout="row": a line of pills, one for each top-level entry. An entry with entries inside it has a button beside its
    split pill that opens them in a panel. It sticks under a header (any CSS length for stickyOffset) and scrolls sideways when it is too long, the ends that have
    more fading out. A width map, layout={{ base: "row", lg: "list" }}, makes it a row on a phone and the list from lg. */}
${toc(['layout="row"', "sticky", 'stickyOffset="var(--page-shell-header-height, 0px)"'], nestedItems)}`,

  levels: `{/* minLevel and maxLevel (1 to 4) draw only some levels; the rest are indented from minLevel.
    They apply to items and to headings read from the page alike. */}
${toc(["maxLevel={1}"], nestedItems)}

${toc(["minLevel={2}"], nestedItems)}`,

  entryExtras: `{/* Each entry can take an icon (from @dbm-system/icons), trailing content such as a Badge,
    and disabled — which dims it and blocks it, but leaves it focusable. */}
<TableOfContents
  items={[
    { id: "guide", label: "Guide", icon: BookOpenIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon, trailing: <Badge size="xs" tone="info">New</Badge> },
    { id: "settings", label: "Settings", icon: GearIcon, disabled: true },
  ]}
/>`,

  folded: `{/* collapse: "never" (default) | "auto" (folded below the sm breakpoint) | "always".
    The list sits behind an "On this page" button; choosing an entry closes it again. */}
${toc(['collapse="auto"'])}

{/* open / defaultOpen / onOpenChange control the folded list */}
${toc(['collapse="always"', "defaultOpen"])}`,

  sticky: `{/* sticky keeps the outline in view as the page scrolls. Here it sticks within a scrolling box of your
    own; leave scrollContainerRef out and it sticks to the page (stickyOffset, on the spacing scale,
    leaves room for a sticky header of your own). */}
{/* const boxRef = useRef<HTMLDivElement>(null); */}
${toc(["sticky", "scrollContainerRef={boxRef}"])}`,

  longOutline: `{/* An outline taller than its box scrolls inside that box, and the current entry is kept in view
    in it — the page is never scrolled to do it. */}
{/* const articleRef = useRef<HTMLDivElement>(null); */}
<div style={{ maxHeight: "9rem", overflow: "auto" }}>
${toc(["scrollContainerRef={articleRef}", "showTitle={false}"])}
</div>`,

  nested: `{/* level: 1 (default) to 4 — each level is indented one step */}
${toc([], nestedItems)}`,

  readFromPage: `{/* With no items, the h2 and h3 headings are read from the page, in the browser. Each needs an id.
    Point contentRef at an element to read only its headings. */}
{/* const articleRef = useRef<HTMLElement>(null); */}
<TableOfContents contentRef={articleRef} />

{/* selector chooses which elements are entries (default "h2, h3") */}
<TableOfContents contentRef={articleRef} selector="h2, h3, h4" />`,

  scrollContainer: `{/* The headings live in a scrolling box of your own: tell the outline which one, so it measures and
    scrolls that box instead of the page. */}
{/* const boxRef = useRef<HTMLDivElement>(null); */}
${toc(["scrollContainerRef={boxRef}"])}`,

  stickyOffset: `{/* scrollOffset (px) is the height of a sticky header over the content: a heading counts as
    reached, and a click leaves it, just below that header. Here the headings are in a scrolling box
    of your own, which has the sticky header inside it. */}
{/* const boxRef = useRef<HTMLDivElement>(null); */}
${toc(["scrollContainerRef={boxRef}", "scrollOffset={40}"])}`,

  withoutTitle: `{/* The heading is hidden; the list keeps a name for screen readers (labels.navigation) */}
${toc(["showTitle={false}"])}`,

  controlled: `{/* const [active, setActive] = useState("usage"); */}
{/* While activeId is set, scrolling no longer changes the marked entry on its own. */}
${toc(["activeId={active}", "onActiveIdChange={setActive}"])}`,

  translated: `{/* labels holds every piece of text the component writes itself */}
${toc([`labels={{ title: "Sur cette page", navigation: "Table des matières" }}`])}`,

  rightToLeft: `{/* dir="rtl" mirrors the outline: the marker moves to the right edge and levels indent from it */}
${toc(['dir="rtl"'])}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TableOfContentsPlaygroundSnippetArgs {
  size?: TableOfContentsSize;
  tone?: TableOfContentsTone;
  highlightActive?: boolean;
  numbered?: boolean;
  movingMarker?: boolean;
  collapsibleGroups?: boolean;
  groupsDefaultOpen?: boolean;
  collapse?: "never" | "auto" | "always";
  foldedStyle?: "inline" | "dropdown";
  minLevel?: number;
  maxLevel?: number;
  showTitle?: boolean;
  smoothScroll?: boolean;
  scrollOffset?: number;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around
 * a small real outline.
 */
export function tableOfContentsPlaygroundSnippet(args: TableOfContentsPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  if (args.numbered) attributes.push("numbered");
  if (args.movingMarker) attributes.push("movingMarker");
  if (args.collapsibleGroups) {
    attributes.push("collapsibleGroups");
    if (args.groupsDefaultOpen === false) attributes.push("groupsDefaultOpen={false}");
  }
  if (args.collapse && args.collapse !== "never") {
    attributes.push(`collapse="${args.collapse}"`);
    if (args.foldedStyle === "dropdown") attributes.push('foldedStyle="dropdown"');
  }
  if (typeof args.minLevel === "number" && args.minLevel !== 1) attributes.push(`minLevel={${args.minLevel}}`);
  if (typeof args.maxLevel === "number" && args.maxLevel !== 4) attributes.push(`maxLevel={${args.maxLevel}}`);
  if (args.highlightActive === false) attributes.push("highlightActive={false}");
  if (args.showTitle === false) attributes.push("showTitle={false}");
  if (args.smoothScroll === false) attributes.push("smoothScroll={false}");
  if (typeof args.scrollOffset === "number" && args.scrollOffset > 0) attributes.push(`scrollOffset={${args.scrollOffset}}`);
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  return toc(attributes);
}
