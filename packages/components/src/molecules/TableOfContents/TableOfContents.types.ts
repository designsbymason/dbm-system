import type { Icon as PhosphorIcon } from "@dbm-system/icons";
import type { Responsive, SpaceValue } from "@dbm-system/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, RefObject } from "react";

/**
 * The size of the outline's text and spacing, on the standard 5-step scale
 * (`05-component-api-conventions.md` §2) — the same steps as `Breadcrumb`.
 */
export type TableOfContentsSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The colour of the current entry and of the marker beside it, on the tone scale
 * (`05-component-api-conventions.md` §2) — the two that make sense for a marker.
 *
 * - `"brand"` (the default) — the active brand theme's accent (`text.brand`, `border.brand`).
 * - `"neutral"` — primary text (`text.primary`) and a strong neutral marker (`border.neutral-strong`), for an outline
 *   that should stay quiet, or that sits on `bg.canvas`, where brand text falls under the 4.5:1 floor.
 */
export type TableOfContentsTone = "brand" | "neutral";

/** One entry of an outline you write yourself. */
export interface TableOfContentsItem {
  /** The id of the element this entry points at. The link goes to `#id`. */
  id: string;
  /** The entry's text. */
  label: ReactNode;
  /**
   * How deeply nested the entry is, from 1 (the top level) to 4. Each level is indented one step.
   * @default 1
   */
  level?: 1 | 2 | 3 | 4;
  /** An icon shown before the text — a component reference from `@dbm-system/icons`, not a string name. Decorative. */
  icon?: PhosphorIcon;
  /** Content shown at the end of the entry, such as a `Badge` ("New"). It is part of the link, so it is read with the label. */
  trailing?: ReactNode;
  /**
   * Dims the entry and blocks it, as `aria-disabled`; it stays in the page and focusable, per WAI-ARIA guidance.
   * @default false
   */
  disabled?: boolean;
  /**
   * Test identifier, set on the entry's link — the element a test clicks and reads `aria-current` from. Rendered as
   * the DOM `data-testid` attribute; it has no visual or behavioural effect.
   */
  "data-testid"?: string;
}

/**
 * Whether the outline folds into a single "On this page" button that opens the list, to save room on a small screen.
 *
 * - `"never"` (the default) — the list is always open.
 * - `"auto"` — the list is always open from the `sm` breakpoint up, and behind the button below it.
 * - `"always"` — behind the button at every width.
 *
 * A list that has keyboard focus inside it stays open while it does, so a screen that shrinks never drops focus.
 */
export type TableOfContentsCollapse = "never" | "auto" | "always";

/**
 * How a folded outline (see {@link TableOfContentsCollapse}) is drawn.
 *
 * - `"inline"` (the default) — an "On this page" button that opens the list in place, pushing what follows down.
 * - `"dropdown"` — a select-like button that always shows the entry being read, and opens the list as an overlay
 *   floating over the page. Built as a disclosure of real links, not a form control. Pair it with `sticky="folded"`
 *   for a bar that stays in view on a phone.
 */
export type TableOfContentsFoldedStyle = "inline" | "dropdown";

/**
 * How the outline is laid out.
 *
 * - `"list"` (the default) — a vertical list of links, as a column beside the page.
 * - `"row"` — one line of pills, drawn by `NavigationMenu`, one for each top-level entry. An entry with deeper entries after it is a
 *   split pill: its link and a caret that opens a panel holding them. The row scrolls sideways when it is too long (the ends fade
 *   out), keeps the pill that holds the current entry in view and, with `sticky`, sticks under the page's header. It has no title,
 *   does not fold, and ignores `tone` and `collapse`.
 */
export type TableOfContentsLayout = "list" | "row";

/**
 * The text `TableOfContents` supplies itself, translatable through the `labels` prop (`ADR-0021`).
 */
export interface TableOfContentsLabels {
  /** The visible heading above the list, which also names the `<nav>` while it is shown. @default 'On this page' */
  title: string;
  /** The `<nav>`'s accessible name when the heading is hidden (`showTitle={false}`). @default 'Table of contents' */
  navigation: string;
  /**
   * The accessible name of the button that opens or closes a group of entries (`collapsibleGroups`), given the group's
   * heading as text (`"section"` when the entry's label isn't plain text). The button also says whether it is open.
   * @default (label) => `Subsections of ${label}`
   */
  groupToggle: (label: string) => string;
  /**
   * The accessible name of the dropdown's button (`foldedStyle="dropdown"`), given the outline's title and the entry
   * being read as plain text (with its number, when `numbered`), so what the button shows is always inside its name.
   * Used when the entry's label is plain text; otherwise the name is the title followed by what is drawn.
   * @default (title, current) => `${title}: ${current}`
   */
  dropdownTrigger: (title: string, current: string) => string;
}

export interface TableOfContentsProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children" | "className" | "style" | "id"> {
  /**
   * The entries, written out. Leave it out to read them from the page instead (see `contentRef` and `selector`).
   * An empty list renders nothing.
   */
  items?: TableOfContentsItem[];
  /**
   * With no `items`, the element whose headings make the outline. Left out, the whole document is searched. The
   * headings are read in the browser after the first render — and again when the container's content changes — so a
   * server-rendered page has no outline until it loads, and an element with no `id` is skipped (with a warning in
   * development), since there is nothing to link to.
   */
  contentRef?: RefObject<HTMLElement | null>;
  /**
   * With no `items`, which elements are entries: a CSS selector. An `h1`–`h6` is indented by how far its level is
   * below the highest one found (`h2` and `h3` give two levels); any other element is a top-level entry, or takes a
   * level from its `data-toc-level` attribute.
   * @default 'h2, h3'
   */
  selector?: string;
  /**
   * The id of the entry marked as current — controlled. Pair it with `onActiveIdChange`. While it is set, scrolling
   * no longer changes the marked entry on its own.
   */
  activeId?: string;
  /**
   * The id of the entry marked as current at first — uncontrolled. Afterwards the outline follows the scroll position:
   * the last heading that has reached the top of the scrolling area, or, before any has, the first one showing in it.
   */
  defaultActiveId?: string;
  /** Called when the current entry changes, by scrolling or by a click, with its id (or `undefined` when none). */
  onActiveIdChange?: (id: string | undefined) => void;
  /**
   * The scrolling element the headings live in. Left out, the page itself. It sets what is measured and what a click
   * scrolls, the same name and shape as on `Affix` and `BackToTop`.
   */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /**
   * How far from the top of the scrolling area, in pixels, a heading counts as reached and a click leaves it — the
   * height of a sticky header sitting over the content.
   * @default 0
   */
  scrollOffset?: number;
  /**
   * Whether a click scrolls smoothly. It never does while the person prefers reduced motion.
   * @default true
   */
  smoothScroll?: boolean;
  /**
   * The shallowest level drawn, 1 to 4: entries above it are left out, and the rest are indented from it. Level here
   * means an `items` entry's `level`, or, for headings read from the page, how far below the highest one found.
   * @default 1
   */
  minLevel?: 1 | 2 | 3 | 4;
  /**
   * The deepest level drawn, 1 to 4: entries below it are left out.
   * @default 4
   */
  maxLevel?: 1 | 2 | 3 | 4;
  /**
   * Keeps the outline in view while the page scrolls. `true` is always sticky, as a box built on `Affix`; `"folded"`
   * is sticky only while the outline is folded (see `collapse`) — a bar across the top on a phone, a plain sidebar
   * above it, drawn on the page's surface with a rule below so content passes cleanly beneath. With `layout="row"`
   * either value sticks the row, drawn the same way. It sticks to the page,
   * or to `scrollContainerRef`, and its parent must be as tall as the content it follows. While it is sticky and
   * folded, the headings are kept clear of it automatically (`scrollOffset` need only cover what is *above* it).
   * Distinct from `scrollOffset`, which is about where the *headings* land.
   * @default false
   */
  sticky?: boolean | "folded";
  /**
   * How far from the top a sticky outline sticks — for a page whose own header is also sticky: a step of the spacing
   * token scale, or, for `sticky="folded"` and `layout="row"`, any CSS length (`"var(--page-shell-header-height, 0px)"`).
   * `sticky={true}` takes a step only. Has no effect without `sticky`.
   */
  stickyOffset?: SpaceValue | string;
  /**
   * Whether, when the page loads with `#id` in its address and `id` is one of the entries, the outline scrolls that
   * section to `scrollOffset` and marks it. The browser's own jump ignores a sticky header, and cannot reach a
   * heading that is read from the page after the first render.
   * @default true
   */
  scrollToHash?: boolean;
  /**
   * The outline's layout, a vertical list or a row of pills — see {@link TableOfContentsLayout}. A width map
   * (`{ base: "row", lg: "list" }`, mobile-first like every responsive prop) draws one outline that changes by screen width: a
   * row on a phone and a list from `lg`, with one set of entries, one name and nothing to hide. It is resolved in the browser, so a server render is
   * the narrowest layout.
   * @default 'list'
   */
  layout?: Responsive<TableOfContentsLayout>;
  /**
   * Folds the outline behind an "On this page" button — see {@link TableOfContentsCollapse}. Has no effect with `layout="row"`.
   * @default 'never'
   */
  collapse?: TableOfContentsCollapse;
  /**
   * How the outline looks while it is folded: `"inline"` or `"dropdown"` — see {@link TableOfContentsFoldedStyle}.
   * Has no effect unless `collapse` is `"auto"` or `"always"`.
   * @default 'inline'
   */
  foldedStyle?: TableOfContentsFoldedStyle;
  /** Whether the list is open while folded, controlled. Pair it with `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the list is open at first while folded, uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the button opens or closes the list, or choosing an entry closes it. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The size of the text and spacing.
   * @default 'md'
   */
  size?: TableOfContentsSize;
  /**
   * The colour of the current entry and its marker — see {@link TableOfContentsTone}.
   * @default 'brand'
   */
  tone?: TableOfContentsTone;
  /**
   * Draws a subtle background behind the current entry, in the tone's own tint: `bg.brand-subtle` for `"brand"`,
   * `bg.neutral-subtle` for `"neutral"`. The marker bar stays, so the current entry is never told apart by the
   * background alone. Set it to `false` for a plain marker.
   * @default true
   */
  highlightActive?: boolean;
  /**
   * Numbers the entries as an outline, "1", "1.1", "1.2", "2" …, by the levels that are drawn. The number is part of
   * the link's text, so it is read with the label. The page's own headings are not numbered by this.
   * @default false
   */
  numbered?: boolean;
  /**
   * How a number in the outline is written — `numbered`'s digits, in a locale's own numerals for example. Never read
   * from the browser's locale.
   * @default String
   */
  formatNumber?: (n: number) => string;
  /**
   * A single marker bar that slides to the current entry instead of the bar appearing beside it. It doesn't slide for
   * a person who prefers reduced motion, and is drawn as a border, so it survives forced colours.
   * @default false
   */
  movingMarker?: boolean;
  /**
   * Lets an entry that has deeper entries after it fold them away: a small button after the entry opens and closes
   * its group. A group that holds the current entry shows the marker bar on its heading while it is closed, and one that
   * holds keyboard focus stays open.
   * @default false
   */
  collapsibleGroups?: boolean;
  /**
   * With `collapsibleGroups`, whether every group starts open. `false` starts them closed except the one that holds
   * the current entry, which opens as the page is read (until a group has been opened or closed by hand).
   * @default true
   */
  groupsDefaultOpen?: boolean;
  /**
   * Whether the heading above the list is shown. Hidden, the list keeps `labels.navigation` as its name.
   * @default true
   */
  showTitle?: boolean;
  /**
   * Translatable text — see {@link TableOfContentsLabels}. Each part is replaceable on its own.
   * @default { title: 'On this page', navigation: 'Table of contents', groupToggle: (label) => `Subsections of ${label}`, dropdownTrigger: (title, current) => `${title}: ${current}` }
   */
  labels?: Partial<TableOfContentsLabels>;
  /** The `<nav>`'s accessible name, replacing the one from `labels` — for a page that has more than one outline. */
  "aria-label"?: string;
  /** The id of an element that names the `<nav>`, replacing the one from `labels`. */
  "aria-labelledby"?: string;
  /** Standard DOM id, set on the `<nav>`. */
  id?: string;
  /** Additional CSS classes for customization. */
  className?: string;
  /** Inline styles, merged onto the component's own internal styles. */
  style?: CSSProperties;
  /** Test id, passed through to the `<nav>`. */
  "data-testid"?: string;
}
