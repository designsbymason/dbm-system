import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BellIcon, BookOpenIcon, GearIcon } from "@dbm-system/icons";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { send } from "../CodeBlock/browserProtocol";
import { TableOfContents } from "./TableOfContents";
import { tableOfContentsPlaygroundSnippet, tableOfContentsSnippets } from "./TableOfContents.snippets";
import type {
  TableOfContentsCollapse,
  TableOfContentsFoldedStyle,
  TableOfContentsItem,
  TableOfContentsProps,
  TableOfContentsSize,
  TableOfContentsTone,
} from "./TableOfContents.types";

interface PlaygroundArgs {
  size: TableOfContentsSize;
  tone: TableOfContentsTone;
  highlightActive: boolean;
  foldedStyle: TableOfContentsFoldedStyle;
  numbered: boolean;
  movingMarker: boolean;
  collapsibleGroups: boolean;
  groupsDefaultOpen: boolean;
  formatNumber: TableOfContentsProps["formatNumber"];
  collapse: TableOfContentsCollapse;
  minLevel: 1 | 2 | 3 | 4;
  maxLevel: 1 | 2 | 3 | 4;
  showTitle: boolean;
  smoothScroll: boolean;
  scrollOffset: number;
  "aria-label": string;
  dir: "ltr" | "rtl";
  items: TableOfContentsProps["items"];
  contentRef: TableOfContentsProps["contentRef"];
  selector: string;
  sticky: boolean;
  stickyOffset: TableOfContentsProps["stickyOffset"];
  layout: TableOfContentsProps["layout"];
  scrollToHash: boolean;
  open: boolean;
  defaultOpen: boolean;
  onOpenChange: TableOfContentsProps["onOpenChange"];
  activeId: string;
  defaultActiveId: string;
  onActiveIdChange: TableOfContentsProps["onActiveIdChange"];
  scrollContainerRef: TableOfContentsProps["scrollContainerRef"];
  labels: TableOfContentsProps["labels"];
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const sections: Array<{ key: string; label: string; level: 1 | 2 | 3 | 4 }> = [
  { key: "overview", label: "Overview", level: 1 },
  { key: "installation", label: "Installation", level: 1 },
  { key: "requirements", label: "Requirements", level: 2 },
  { key: "setup", label: "Setup", level: 2 },
  { key: "usage", label: "Usage", level: 1 },
  { key: "options", label: "Options", level: 2 },
  { key: "accessibility", label: "Accessibility", level: 1 },
  { key: "related", label: "Related", level: 1 },
];

const filler =
  "A section of an article, long enough to take up some room. The outline beside it marks the section nearest the top of the scrolling box as it moves, and a click on an entry scrolls straight to its section.";

const boxStyle: CSSProperties = {
  blockSize: "18rem",
  flex: "1 1 18rem",
  minInlineSize: 0,
  overflow: "auto",
  border: "var(--dbm-border-width-1) solid var(--dbm-border-default)",
  borderRadius: "var(--dbm-radius-md)",
};

/**
 * An article in a scrolling box with an outline beside it. Ids carry a prefix of their own, since every story on a
 * Docs page shares one document and an id must be unique in it.
 */
function DemoPage({
  mode = "items",
  stickyHeader = false,
  tocProps,
  prefix: forcedPrefix,
  children,
}: {
  mode?: "items" | "scan";
  stickyHeader?: boolean;
  tocProps?: Partial<TableOfContentsProps>;
  prefix?: string;
  children?: ReactNode;
}) {
  const generated = useId().replace(/:/g, "");
  const prefix = forcedPrefix ?? generated;
  const boxRef = useRef<HTMLDivElement>(null);
  const items: TableOfContentsItem[] = sections.map((section) => ({ id: `${prefix}-${section.key}`, label: section.label, level: section.level }));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", alignItems: "flex-start", maxInlineSize: "48rem" }}>
      <div style={{ flex: "0 0 12rem", minInlineSize: 0 }}>
        <TableOfContents
          {...(mode === "items" ? { items } : { contentRef: boxRef })}
          scrollContainerRef={boxRef}
          scrollOffset={stickyHeader ? 40 : 0}
          {...tocProps}
        />
        {children}
      </div>
      {/* A scrolling region is a tab stop and named, so a keyboard user can scroll it. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable. */}
      <div ref={boxRef} tabIndex={0} role="region" aria-label="Article" style={boxStyle} data-testid="article">
        {stickyHeader && (
          <div
            style={{
              position: "sticky",
              insetBlockStart: 0,
              blockSize: "40px",
              background: "var(--dbm-bg-neutral-subtle)",
              padding: "var(--dbm-space-2) var(--dbm-space-4)",
              color: "var(--dbm-text-primary)",
            }}
          >
            Sticky header
          </div>
        )}
        <div style={{ padding: "var(--dbm-space-4)" }}>
          {sections.map((section) => {
            const Tag = section.level === 1 ? "h2" : "h3";
            return (
              <section key={section.key} style={{ marginBlockEnd: "var(--dbm-space-6)" }}>
                <Tag id={`${prefix}-${section.key}`} style={{ margin: 0, color: "var(--dbm-text-primary)", fontFamily: "var(--dbm-font-family-primary)" }}>
                  {section.label}
                </Tag>
                <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
                <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
              </section>
            );
          })}
          {/* Room after the last section, so every section can reach the top of the box. */}
          <div style={{ blockSize: "12rem" }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps an outline whose entries point at ids that aren't on the page (a static demo): a click is cancelled before the
 * outline sees it, so the browser doesn't follow `#id` and move the Storybook page.
 */
function Static({ children }: { children: ReactNode }) {
  return <div onClickCapture={(event) => event.preventDefault()}>{children}</div>;
}

// A fixed-render story ignores its own args, so every control it can't honour is turned off
// (07-storybook-and-documentation-standards.md §5).
const noControls = {
  size: { control: false },
  tone: { control: false },
  highlightActive: { control: false },
  foldedStyle: { control: false },
  numbered: { control: false },
  movingMarker: { control: false },
  collapsibleGroups: { control: false },
  groupsDefaultOpen: { control: false },
  collapse: { control: false },
  minLevel: { control: false },
  maxLevel: { control: false },
  showTitle: { control: false },
  smoothScroll: { control: false },
  scrollOffset: { control: false },
  "aria-label": { control: false },
  dir: { control: false },
} as const;

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Navigation/TableOfContents",
  parameters: { layout: "padded" },
  argTypes: {
    items: {
      control: false,
      description:
        "The entries, written out: each an object with id (the element it points at; the link goes to #id), label (its text), and optionally level (1 to 4, indented one step each, default 1), icon, trailing (content at the end, such as a Badge) and disabled. Leave it out to read them from the page. An empty list renders nothing.",
    },
    contentRef: {
      control: false,
      description:
        "With no items, the element whose headings make the outline; left out, the whole document is searched. Headings are read in the browser, so a server-rendered page has no outline until it loads, and a heading with no id is skipped.",
    },
    selector: {
      control: false,
      description:
        "With no items, which elements are entries, as a CSS selector. An h1 to h6 is indented by how far its level is below the highest found; any other element is top level, or takes its level from data-toc-level.",
      table: { defaultValue: { summary: '"h2, h3"' } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the text and spacing.",
      table: { defaultValue: { summary: '"md"' } },
    },
    tone: {
      control: "select",
      options: ["brand", "neutral"],
      description:
        "The colour of the current entry and its marker: brand (the brand theme's accent) or neutral (primary text and a strong neutral marker). Place a brand outline on a surface, not on the canvas; neutral is safe on either. No effect with the row layout.",
      table: { defaultValue: { summary: '"brand"' } },
    },
    numbered: {
      control: "boolean",
      description:
        'Numbers the entries as an outline ("1", "1.1", "1.2", "2"), by the levels drawn. The number is part of the link\'s text, so it is read with the label. The page\'s own headings are not numbered by this.',
      table: { defaultValue: { summary: "false" } },
    },
    formatNumber: {
      control: false,
      description:
        "How a number in the outline is written, such as in a locale's own numerals. Never read from the browser's locale.",
      table: { defaultValue: { summary: "String" } },
    },
    movingMarker: {
      control: "boolean",
      description:
        "One marker bar that slides to the current entry instead of appearing beside it. It doesn't slide for a person who prefers reduced motion, and survives forced colours.",
      table: { defaultValue: { summary: "false" } },
    },
    collapsibleGroups: {
      control: "boolean",
      description:
        "Lets an entry that has deeper entries after it fold them away, with a small button after the entry. A closed group that holds the current entry carries the marker bar on its heading; one holding keyboard focus stays open.",
      table: { defaultValue: { summary: "false" } },
    },
    groupsDefaultOpen: {
      control: "boolean",
      if: { arg: "collapsibleGroups" },
      description:
        "With collapsibleGroups, whether every group starts open. False starts them closed except the one holding the current entry, which opens as the page is read, until a group has been opened or closed by hand.",
      table: { defaultValue: { summary: "true" } },
    },
    minLevel: {
      control: "select",
      options: [1, 2, 3, 4],
      description:
        "The shallowest level drawn: entries above it are left out and the rest are indented from it. Level is an items entry's level, or how far below the highest one a heading read from the page is.",
      table: { defaultValue: { summary: "1" } },
    },
    maxLevel: {
      control: "select",
      options: [1, 2, 3, 4],
      description: "The deepest level drawn: entries below it are left out.",
      table: { defaultValue: { summary: "4" } },
    },
    sticky: {
      control: false,
      description:
        'Keeps the outline in view while the page scrolls (with layout row, true and "folded" both stick the row): true is always sticky (a box built on Affix), "folded" only while the outline is folded (a bar across the top on a phone, drawn on the page\'s surface). It sticks to the page, or to scrollContainerRef, and its parent must be as tall as the content. While sticky and folded, headings are kept clear of it automatically.',
      table: { defaultValue: { summary: "false" } },
    },
    stickyOffset: {
      control: false,
      description:
        "How far from the top a sticky outline sticks: a step of the spacing scale, or, for sticky=\"folded\" and the row layout, any CSS length (such as the sticky header's measured height). sticky={true} takes a step only. No effect without sticky.",
    },
    layout: {
      control: false,
      options: ["list", "row"],
      description:
        'The outline\'s layout: list (the default, a vertical list) or row (one line of pills drawn by NavigationMenu, a panel for the entries inside a pill, sticky under a header with sticky, the ends fading out when it is longer than the room). A width map such as { base: row, lg: list } changes it by screen width. A row has no title and does not fold.',
      table: { defaultValue: { summary: '"list"' } },
    },
    scrollToHash: {
      control: false,
      description:
        "When the page loads with #id in its address and id is an entry, scrolls that section to scrollOffset and marks it: the browser's own jump ignores a sticky header and can't reach a heading read from the page after the first render.",
      table: { defaultValue: { summary: "true" } },
    },
    collapse: {
      control: "select",
      options: ["never", "auto", "always"],
      description:
        'Folds the outline behind an "On this page" button: never (the default), auto (below the sm breakpoint) or always. A list with keyboard focus inside it stays open while it does. No effect with the row layout.',
      table: { defaultValue: { summary: '"never"' } },
    },
    foldedStyle: {
      control: "select",
      options: ["inline", "dropdown"],
      if: { arg: "collapse", neq: "never" },
      description:
        'How a folded outline looks: inline (an "On this page" button opening the list in place) or dropdown (a select-like button that always shows the entry being read and opens the list as an overlay). Pair dropdown with sticky="folded" for a bar that stays in view on a phone. No effect with the row layout.',
      table: { defaultValue: { summary: '"inline"' } },
    },
    open: {
      control: false,
      description: "Whether the list is open while folded, controlled; pair it with onOpenChange.",
    },
    defaultOpen: {
      control: false,
      description: "Whether the list is open at first while folded, uncontrolled.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called when the button opens or closes the list, or choosing an entry closes it.",
    },
    highlightActive: {
      control: "boolean",
      description:
        "Draws a subtle background behind the current entry, in the tone's own tint (bg.brand-subtle for brand, bg.neutral-subtle for neutral). The marker bar stays, so the background is never the only cue.",
      table: { defaultValue: { summary: "true" } },
    },
    showTitle: {
      control: "boolean",
      description: "Shows the heading above the list. Hidden, the list keeps its name for screen readers. The row layout has no heading.",
      table: { defaultValue: { summary: "true" } },
    },
    activeId: {
      control: false,
      description:
        "The id of the entry marked as current, controlled; pair it with onActiveIdChange. While it is set, scrolling no longer changes the marked entry on its own.",
    },
    defaultActiveId: {
      control: false,
      description:
        "The id of the entry marked as current at first, uncontrolled. Afterwards the outline follows the scroll position.",
    },
    onActiveIdChange: {
      control: false,
      description: "Called with the id (or undefined) when the current entry changes, by scrolling or by a click.",
    },
    scrollContainerRef: {
      control: false,
      description:
        "A ref to the scrolling element the headings live in; left out, the page itself. It sets what is measured and what a click scrolls.",
    },
    scrollOffset: {
      control: "number",
      description:
        "How far from the top of the scrolling area, in pixels, a heading counts as reached and a click leaves it: the height of a sticky header over the content.",
      table: { defaultValue: { summary: "0" } },
    },
    smoothScroll: {
      control: "boolean",
      description: "Scrolls smoothly on a click. It never does while the person prefers reduced motion.",
      table: { defaultValue: { summary: "true" } },
    },
    labels: {
      control: false,
      description:
        'The text the component supplies itself, each part replaceable on its own: title (the visible heading, "On this page"), navigation (the nav\'s accessible name while the heading is hidden, "Table of contents"), groupToggle (a function of a group\'s heading naming its open/close button, "Subsections of Setup") and dropdownTrigger (a function of the title and the entry being read naming the dropdown\'s button, "On this page: Setup").',
    },
    "aria-label": {
      control: "text",
      description:
        "The nav's accessible name, replacing the one from labels. Give each outline a distinct name when a page holds more than one.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the nav, replacing the heading and labels.navigation.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, a native attribute passed to the nav: the marker and indentation follow it.",
    },
    id: { control: false, description: "Standard DOM id, on the nav." },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    size: "md",
    tone: "brand",
    highlightActive: true,
    foldedStyle: "inline",
    numbered: false,
    movingMarker: false,
    collapsibleGroups: false,
    groupsDefaultOpen: true,
    collapse: "never",
    minLevel: 1,
    maxLevel: 4,
    showTitle: true,
    smoothScroll: true,
    scrollOffset: 0,
    "aria-label": "",
    dir: "ltr",
  },
  render: (args) => (
    <DemoPage
      tocProps={{
        size: args.size,
        tone: args.tone,
        highlightActive: args.highlightActive,
        numbered: args.numbered,
        movingMarker: args.movingMarker,
        collapsibleGroups: args.collapsibleGroups,
        groupsDefaultOpen: args.groupsDefaultOpen,
        collapse: args.collapse,
        foldedStyle: args.foldedStyle,
        minLevel: args.minLevel,
        maxLevel: args.maxLevel,
        showTitle: args.showTitle,
        smoothScroll: args.smoothScroll,
        scrollOffset: args.scrollOffset,
        "aria-label": args["aria-label"] || undefined,
        dir: args.dir,
      }}
    />
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => tableOfContentsPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.sizes } } },
  render: () => (
    <Static>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <TableOfContents
          key={size}
          size={size}
          aria-label={`Outline (${size})`}
          showTitle={false}
          defaultActiveId={`${size}-b`}
          items={[
            { id: `${size}-a`, label: `size="${size}"` },
            { id: `${size}-b`, label: "Current entry" },
            { id: `${size}-c`, label: "Nested entry", level: 2 },
          ]}
        />
      ))}
    </div>
    </Static>
  ),
};

export const Tones: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.tones } } },
  render: () => (
    <Static>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <TableOfContents
          key={tone}
          tone={tone}
          aria-label={`Outline (${tone})`}
          defaultActiveId={`${tone}-b`}
          items={[
            { id: `${tone}-a`, label: `tone="${tone}"` },
            { id: `${tone}-b`, label: "Current entry" },
            { id: `${tone}-c`, label: "Another entry" },
          ]}
        />
      ))}
    </div>
    </Static>
  ),
};

export const Highlighted: Story = {
  name: "Highlighted current entry (the default)",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.highlighted } } },
  render: () => (
    <Static>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)" }}>
        {(["brand", "neutral"] as const).map((tone) => (
          <TableOfContents
            key={tone}
            tone={tone}
            aria-label={`Outline (${tone}, highlighted)`}
            defaultActiveId={`hl-${tone}-b`}
            items={[
              { id: `hl-${tone}-a`, label: `tone="${tone}"` },
              { id: `hl-${tone}-b`, label: "Current entry" },
              { id: `hl-${tone}-c`, label: "Another entry" },
            ]}
          />
        ))}
      </div>
    </Static>
  ),
};

export const NotHighlighted: Story = {
  name: "Without the highlight",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.notHighlighted } } },
  render: () => (
    <Static>
      <TableOfContents
        highlightActive={false}
        defaultActiveId="plainmark-b"
        items={[
          { id: "plainmark-a", label: "Another entry" },
          { id: "plainmark-b", label: "Current entry" },
        ]}
      />
    </Static>
  ),
};

export const Nested: Story = {
  name: "Nested levels",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.nested } } },
  render: () => (
    <Static>
    <TableOfContents
      defaultActiveId="nested-setup"
      items={[
        { id: "nested-installation", label: "Installation" },
        { id: "nested-requirements", label: "Requirements", level: 2 },
        { id: "nested-setup", label: "Setup", level: 2 },
        { id: "nested-options", label: "Options", level: 3 },
        { id: "nested-usage", label: "Usage" },
      ]}
    />
    </Static>
  ),
};

export const ReadFromPage: Story = {
  name: "Read from the page",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.readFromPage } } },
  render: () => <DemoPage mode="scan" />,
};

export const InAScrollingBox: Story = {
  name: "In a scrolling box",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.scrollContainer } } },
  render: () => <DemoPage />,
};

export const StickyHeader: Story = {
  name: "Under a sticky header",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.stickyOffset } } },
  render: () => <DemoPage stickyHeader />,
};

export const WithoutTitle: Story = {
  name: "Without the title",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.withoutTitle } } },
  render: () => (
    <Static>
    <TableOfContents
      showTitle={false}
      defaultActiveId="plain-b"
      items={[
        { id: "plain-a", label: "First" },
        { id: "plain-b", label: "Second" },
      ]}
    />
    </Static>
  ),
};

export const Controlled: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.controlled } } },
  render: function Render() {
    const [active, setActive] = useState<string | undefined>("controlled-usage");
    const ids = ["controlled-overview", "controlled-usage", "controlled-accessibility"];
    return (
      <Static>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", alignItems: "flex-start" }}>
        <TableOfContents
          activeId={active}
          onActiveIdChange={setActive}
          items={[
            { id: ids[0] as string, label: "Overview" },
            { id: ids[1] as string, label: "Usage" },
            { id: ids[2] as string, label: "Accessibility" },
          ]}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)", alignItems: "flex-start" }}>
          {ids.map((id) => (
            <Button key={id} size="xs" variant="secondary" onClick={() => setActive(id)}>
              {`Mark ${id.replace("controlled-", "")}`}
            </Button>
          ))}
        </div>
      </div>
      </Static>
    );
  },
};

export const Translated: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.translated } } },
  render: () => (
    <Static>
    <TableOfContents
      labels={{ title: "Sur cette page", navigation: "Table des matières" }}
      defaultActiveId="fr-b"
      items={[
        { id: "fr-a", label: "Présentation" },
        { id: "fr-b", label: "Utilisation" },
      ]}
    />
    </Static>
  ),
};

export const RightToLeft: Story = {
  name: "Right-to-left",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.rightToLeft } } },
  render: () => (
    // Fills the demo box, so the outline sits against its right edge.
    <Static>
      <TableOfContents
        dir="rtl"
        defaultActiveId="rtl-b"
        items={[
          { id: "rtl-a", label: "نظرة عامة" },
          { id: "rtl-b", label: "الاستخدام" },
          { id: "rtl-c", label: "الخيارات", level: 2 },
        ]}
      />
    </Static>
  ),
};

const leveledItems: TableOfContentsItem[] = [
  { id: "lv-installation", label: "Installation" },
  { id: "lv-requirements", label: "Requirements", level: 2 },
  { id: "lv-setup", label: "Setup", level: 2 },
  { id: "lv-options", label: "Options", level: 3 },
  { id: "lv-usage", label: "Usage" },
];

export const Numbered: Story = {
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.numbered } } },
  render: () => (
    <Static>
      <TableOfContents numbered defaultActiveId="lv-setup" items={leveledItems} />
    </Static>
  ),
};

export const MovingMarker: Story = {
  name: "Moving marker",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.movingMarker } } },
  render: () => <DemoPage tocProps={{ movingMarker: true }} />,
};

export const CollapsibleGroups: Story = {
  name: "Collapsible groups",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.groups } } },
  render: () => <DemoPage tocProps={{ collapsibleGroups: true }} />,
};

export const GroupsStartClosed: Story = {
  name: "Groups that start closed",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.groupsClosed } } },
  render: () => <DemoPage tocProps={{ collapsibleGroups: true, groupsDefaultOpen: false }} />,
};

export const Levels: Story = {
  name: "Choosing the levels",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.levels } } },
  render: () => (
    <Static>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)" }}>
        <TableOfContents aria-label="Top level only" maxLevel={1} defaultActiveId="lv-usage" items={leveledItems} labels={{ title: "maxLevel 1" }} />
        <TableOfContents aria-label="From level two" minLevel={2} defaultActiveId="lv-setup" items={leveledItems} labels={{ title: "minLevel 2" }} />
      </div>
    </Static>
  ),
};

export const EntryExtras: Story = {
  name: "Icons, badges and disabled entries",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.entryExtras } } },
  render: () => (
    <Static>
      <TableOfContents
        defaultActiveId="ex-guide"
        items={[
          { id: "ex-guide", label: "Guide", icon: BookOpenIcon },
          { id: "ex-notifications", label: "Notifications", icon: BellIcon, trailing: <Badge size="xs" tone="info">New</Badge> },
          { id: "ex-settings", label: "Settings", icon: GearIcon, disabled: true },
        ]}
      />
    </Static>
  ),
};

export const Folded: Story = {
  name: "Folded behind a button",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.folded } } },
  render: () => (
    <Static>
      <div style={{ maxInlineSize: "18rem" }}>
        <TableOfContents collapse="always" defaultActiveId="lv-setup" items={leveledItems} />
      </div>
    </Static>
  ),
};

const articleSections = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `${prefix}-s${index + 1}`, label: `Section ${index + 1}` }));

/** An article of `count` sections, each with a heading `prefix-sN`, in a box that scrolls. */
function ScrollingArticle({ prefix, count, boxRef, children }: { prefix: string; count: number; boxRef: React.RefObject<HTMLDivElement | null>; children?: ReactNode }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable.
    <div ref={boxRef} tabIndex={0} role="region" aria-label="Article" style={boxStyle} data-testid="article">
      <div style={{ display: "flex", gap: "var(--dbm-space-6)", padding: "var(--dbm-space-4)", alignItems: "flex-start" }}>
        {children}
        <div style={{ flex: "1 1 0", minInlineSize: 0 }}>
          {articleSections(prefix, count).map((section) => (
            <section key={section.id} style={{ marginBlockEnd: "var(--dbm-space-6)" }}>
              <h2 id={section.id} style={{ margin: 0, color: "var(--dbm-text-primary)", fontFamily: "var(--dbm-font-family-primary)" }}>
                {section.label}
              </h2>
              <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
            </section>
          ))}
          <div style={{ blockSize: "12rem" }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function StickyDemo({ prefix = "sticky" }: { prefix?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  return (
    <ScrollingArticle prefix={prefix} count={10} boxRef={boxRef}>
      {/* As tall as the article, so the sticky outline has room to travel. */}
      <div style={{ flex: "0 0 10rem", alignSelf: "stretch" }}>
        <TableOfContents sticky scrollContainerRef={boxRef} data-testid="sticky-toc" items={articleSections(prefix, 10)} />
      </div>
    </ScrollingArticle>
  );
}

/** A phone-like column: the outline first, as a bar, then the article, all in one box that scrolls. */
function DropdownDemo({ prefix = "dd", ...tocProps }: Partial<TableOfContentsProps> & { prefix?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable.
    <div ref={boxRef} tabIndex={0} role="region" aria-label="Article" style={{ ...boxStyle, flex: "none", maxInlineSize: "24rem" }} data-testid="article">
      <div style={{ padding: "var(--dbm-space-4)" }}>
        <TableOfContents
          collapse="always"
          foldedStyle="dropdown"
          sticky="folded"
          scrollContainerRef={boxRef}
          data-testid="dropdown-toc"
          items={articleSections(prefix, 10)}
          {...tocProps}
        />
        {articleSections(prefix, 10).map((section) => (
          <section key={section.id} style={{ marginBlockEnd: "var(--dbm-space-6)" }}>
            <h2 id={section.id} style={{ margin: 0, color: "var(--dbm-text-primary)", fontFamily: "var(--dbm-font-family-primary)" }}>
              {section.label}
            </h2>
            <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
          </section>
        ))}
        <div style={{ blockSize: "12rem" }} aria-hidden="true" />
      </div>
    </div>
  );
}

export const Dropdown: Story = {
  name: "Folded as a dropdown, sticky",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.dropdown } } },
  render: () => <DropdownDemo />,
};

/** A row of pills at the top of a box that scrolls: it sticks, the pill of the section being read is marked, and a pill with sections inside it opens them in a panel. The row is longer than the box, so its end fades out. */
function RowDemo({ prefix = "row", ...tocProps }: Partial<TableOfContentsProps> & { prefix?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const items: TableOfContentsItem[] = sections.map((section) => ({ id: `${prefix}-${section.key}`, label: section.label, level: section.level }));
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable.
    <div ref={boxRef} tabIndex={0} role="region" aria-label="Article" style={{ ...boxStyle, flex: "none", maxInlineSize: "24rem" }} data-testid="article">
      <div style={{ padding: "0 var(--dbm-space-4) var(--dbm-space-4)" }}>
        <TableOfContents layout="row" sticky scrollContainerRef={boxRef} data-testid="row-toc" aria-label="On this page" items={items} {...tocProps} />
        {sections.map((section) => {
          const Tag = section.level === 1 ? "h2" : "h3";
          return (
            <section key={section.key} style={{ marginBlockEnd: "var(--dbm-space-6)" }}>
              <Tag id={`${prefix}-${section.key}`} style={{ margin: 0, color: "var(--dbm-text-primary)", fontFamily: "var(--dbm-font-family-primary)" }}>
                {section.label}
              </Tag>
              <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
              <p style={{ color: "var(--dbm-text-secondary)", fontFamily: "var(--dbm-font-family-primary)" }}>{filler}</p>
            </section>
          );
        })}
        <div style={{ blockSize: "12rem" }} aria-hidden="true" />
      </div>
    </div>
  );
}

export const Row: Story = {
  name: "As a row of pills, sticky",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.row } } },
  render: () => <RowDemo />,
};

export const RowInteraction: Story = {
  name: "The row sticks, marks the pill being read, opens a pill's sections and chooses one — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <RowDemo prefix="rw" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("article");
    const row = canvas.getByTestId("row-toc");
    const heading = (key: string) => canvasElement.querySelector<HTMLElement>(`#rw-${key}`) as HTMLElement;
    const topInBox = (element: HTMLElement) => element.getBoundingClientRect().top - box.getBoundingClientRect().top;

    // Only the top-level entries are pills; the ones inside are behind a caret.
    await expect(within(row).getAllByRole("link").map((link) => link.textContent)).toEqual(["Overview", "Installation", "Usage", "Accessibility", "Related"]);
    await expect(within(row).getAllByRole("button")).toHaveLength(2);
    // A pill and its caret are one pill: one list item, and the caret ends inside it.
    const installation = within(row).getByRole("link", { name: "Installation" });
    const caret = within(row).getByRole("button", { name: "Subsections of Installation" });
    await expect(installation.closest("li")).toBe(caret.closest("li"));
    await expect(caret.getBoundingClientRect().right).toBeLessThanOrEqual((installation.closest("li") as HTMLElement).getBoundingClientRect().right + 1);

    // The row is longer than the room: its end fades out and its start does not, until it is scrolled to the end, where it is the other way round. The fades never take a click.
    const list = row.querySelector("ul") as HTMLElement;
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    const fade = (end: "::before" | "::after") => getComputedStyle(row, end).opacity;
    await waitFor(() => expect(fade("::after")).toBe("1"));
    await expect(fade("::before")).toBe("0");
    await expect(getComputedStyle(row, "::after").pointerEvents).toBe("none");
    list.scrollTo({ left: list.scrollWidth, behavior: "instant" });
    await waitFor(() => expect(fade("::before")).toBe("1"));
    await expect(fade("::after")).toBe("0");
    list.scrollTo({ left: 0, behavior: "instant" });
    await waitFor(() => expect(fade("::before")).toBe("0"));

    // It sticks while the content scrolls, and the pill that holds the section being read is marked (a section inside Installation marks Installation).
    box.scrollTo({ top: box.scrollTop + topInBox(heading("setup")) - row.getBoundingClientRect().height, behavior: "instant" });
    await waitFor(() => expect(row.querySelector("[data-toc-marked] a")).toHaveTextContent("Installation"));
    await expect(Math.abs(row.getBoundingClientRect().top - box.getBoundingClientRect().top)).toBeLessThan(box.clientTop + 20);

    // A pill's caret opens the sections inside it, with the current one marked as a location; choosing one closes the panel and leaves the section under the row.
    await userEvent.click(caret);
    const requirements = await within(document.body).findByRole("link", { name: "Requirements" });
    const setup = within(document.body).getByRole("link", { name: "Setup" });
    await expect(caret).toHaveAttribute("aria-expanded", "true");
    await expect(setup).toHaveAttribute("aria-current", "location");
    // Every entry is seen and under the pointer, not cut by the row's own scrolling.
    for (const link of [requirements, setup]) {
      await expect(link.getBoundingClientRect().width).toBeGreaterThan(60);
      // (The panel slides in, so it is under the pointer once it has finished.)
      await waitFor(() => {
        const rect = link.getBoundingClientRect();
        expect(link.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))).toBe(true);
      });
    }
    await userEvent.click(requirements);
    await waitFor(() => expect(caret).toHaveAttribute("aria-expanded", "false"));
    await waitFor(() => expect(topInBox(heading("requirements"))).toBeGreaterThanOrEqual(row.getBoundingClientRect().height - 2), { timeout: 3000 });
  },
};

export const Sticky: Story = {
  name: "Sticky",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.sticky } } },
  render: () => <StickyDemo />,
};

/** A long outline in a box of its own, beside an article it follows. */
function LongOutlineDemo({ prefix = "long" }: { prefix?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-6)", alignItems: "flex-start", maxInlineSize: "48rem" }}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable. */}
      <div tabIndex={0} role="region" aria-label="Outline box" style={{ ...boxStyle, flex: "0 0 12rem", blockSize: "9rem" }} data-testid="outline-box">
        <TableOfContents scrollContainerRef={boxRef} showTitle={false} aria-label="Sections" items={articleSections(prefix, 16)} />
      </div>
      <ScrollingArticle prefix={prefix} count={16} boxRef={boxRef} />
    </div>
  );
}

export const LongOutline: Story = {
  name: "A long outline in a box of its own",
  argTypes: noControls,
  parameters: { docs: { source: { code: tableOfContentsSnippets.longOutline } } },
  render: () => <LongOutlineDemo />,
};

// --- Hidden real-browser checks. `!dev` is written out on each story: the indexer reads `tags` only from a literal. ---

const currentEntry = (nav: HTMLElement) => nav.querySelector('[aria-current="location"]')?.textContent ?? null;

export const ScrollspyInteraction: Story = {
  name: "Follows the scroll and a click — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DemoPage prefix="spy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "On this page" });
    const box = canvas.getByTestId("article");
    const heading = (key: string) => canvasElement.querySelector<HTMLElement>(`#spy-${key}`) as HTMLElement;
    const topOf = (element: HTMLElement) => element.getBoundingClientRect().top - box.getBoundingClientRect().top;

    // On load, the first section is showing (a little below the top edge), so it is the one marked.
    await waitFor(() => expect(currentEntry(nav)).toBe("Overview"));

    // Scrolling the box moves the marked entry to the last heading that has reached its top.
    box.scrollTo({ top: box.scrollTop + topOf(heading("usage")), behavior: "instant" });
    await waitFor(() => expect(currentEntry(nav)).toBe("Usage"));
    box.scrollTo({ top: box.scrollTop + topOf(heading("setup")), behavior: "instant" });
    await waitFor(() => expect(currentEntry(nav)).toBe("Setup"));

    // A click scrolls to the section, leaves it at the top and marks it, with the address naming it.
    await userEvent.click(canvas.getByRole("link", { name: "Accessibility" }));
    await waitFor(() => expect(Math.abs(topOf(heading("accessibility")))).toBeLessThan(2), { timeout: 3000 });
    await waitFor(() => expect(currentEntry(nav)).toBe("Accessibility"));
    await expect(window.location.hash).toBe("#spy-accessibility");

    // The very end: the last section is the one being read even if it can't reach the top.
    box.scrollTo({ top: box.scrollHeight, behavior: "instant" });
    await waitFor(() => expect(currentEntry(nav)).toBe("Related"));
  },
};

export const KeyboardFollowInteraction: Story = {
  name: "A key press moves focus to the section — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DemoPage prefix="key" tocProps={{ smoothScroll: false }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Usage" });
    link.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvasElement.querySelector("#key-usage")).toHaveFocus());
    await expect(link).toHaveAttribute("aria-current", "location");
  },
};

export const SizeAndTargetInteraction: Story = {
  name: "Targets and a steady layout — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} data-size={size}>
          <TableOfContents size={size} aria-label={size} items={[{ id: `${size}-x`, label: "First entry" }, { id: `${size}-y`, label: "A second, longer entry for its width" }]} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      const nav = within(canvasElement).getByRole("navigation", { name: size });
      for (const link of within(nav).getAllByRole("link")) {
        const rect = link.getBoundingClientRect();
        await expect(rect.height, `a ${size} entry is at least 24px tall`).toBeGreaterThanOrEqual(24);
      }
    }
  },
};

export const ActiveDoesNotReflowInteraction: Story = {
  name: "The current entry does not move anything — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  // The same outline twice, in a narrow box so entries wrap, with a different entry current in each.
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)" }}>
      {["a", "b"].map((current) => (
        <div key={current} style={{ inlineSize: "9rem" }}>
          <TableOfContents
            aria-label={`current ${current}`}
            activeId={`reflow-${current}`}
            onActiveIdChange={() => {}}
            items={[
              { id: "reflow-a", label: "A fairly long entry that wraps" },
              { id: "reflow-b", label: "Another long entry that wraps too" },
            ]}
          />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const sizes = (name: string) =>
      within(within(canvasElement).getByRole("navigation", { name })).getAllByRole("link").map((link) => {
        const { width, height } = link.getBoundingClientRect();
        return [width, height];
      });
    await expect(sizes("current b")).toEqual(sizes("current a"));
  },
};

export const HighlightInteraction: Story = {
  name: "The highlight fills only the current entry, in its tone — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)" }}>
      {(["brand", "neutral"] as const).map((tone) => (
        <TableOfContents
          key={tone}
          tone={tone}
          highlightActive
          aria-label={tone}
          activeId={`hi-${tone}-b`}
          onActiveIdChange={() => {}}
          items={[{ id: `hi-${tone}-a`, label: "Other" }, { id: `hi-${tone}-b`, label: "Current" }]}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fill = (tone: string, name: string) =>
      getComputedStyle(within(within(canvasElement).getByRole("navigation", { name: tone })).getByRole("link", { name })).backgroundColor;
    const probe = document.createElement("span");
    canvasElement.appendChild(probe);
    const token = (name: string) => {
      probe.style.backgroundColor = `var(--dbm-bg-${name})`;
      return getComputedStyle(probe).backgroundColor;
    };
    await expect(fill("brand", "Current")).toBe(token("brand-subtle"));
    await expect(fill("neutral", "Current")).toBe(token("neutral-subtle"));
    await expect(fill("brand", "Other")).toBe("rgba(0, 0, 0, 0)");
    await expect(fill("neutral", "Other")).toBe("rgba(0, 0, 0, 0)");
    probe.remove();
  },
};

export const RightToLeftInteraction: Story = {
  name: "Right-to-left marker on the right — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ maxInlineSize: "16rem" }}>
      <TableOfContents dir="rtl" defaultActiveId="r-a" items={[{ id: "r-a", label: "الأول" }, { id: "r-b", label: "الثاني", level: 2 }]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation");
    const items = nav.querySelectorAll("li");
    const first = items[0] as HTMLElement;
    const second = items[1] as HTMLElement;
    await expect(getComputedStyle(first).borderRightWidth).not.toBe("0px");
    await expect(getComputedStyle(first).borderLeftWidth).toBe("0px");
    // The nested entry's text sits further from the marker, which is on the right.
    const firstText = (first.querySelector("a") as HTMLElement).getBoundingClientRect();
    const secondLink = second.querySelector("a") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(secondLink);
    await expect(range.getBoundingClientRect().right).toBeLessThan(firstText.right);
  },
};

export const StickyInteraction: Story = {
  name: "A sticky outline stays at the top of the box — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <StickyDemo prefix="stk" />,
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId("article");
    const toc = within(canvasElement).getByTestId("sticky-toc");
    box.scrollTo({ top: 600, behavior: "instant" });
    await waitFor(() => expect(Math.abs(toc.getBoundingClientRect().top - box.getBoundingClientRect().top)).toBeLessThan(box.clientTop + 3));
    await expect(box.scrollTop).toBeGreaterThan(500);
  },
};

export const LongOutlineInteraction: Story = {
  name: "The current entry scrolls into view in a long outline — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <LongOutlineDemo prefix="lng" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const article = canvas.getByTestId("article");
    const outline = canvas.getByTestId("outline-box");
    const heading = canvasElement.querySelector<HTMLElement>("#lng-s14") as HTMLElement;
    article.scrollTo({ top: article.scrollTop + heading.getBoundingClientRect().top - article.getBoundingClientRect().top, behavior: "instant" });
    const link = canvas.getByRole("link", { name: "Section 14" });
    await waitFor(() => expect(link).toHaveAttribute("aria-current", "location"));
    await waitFor(() => {
      const box = outline.getBoundingClientRect();
      const rect = link.getBoundingClientRect();
      expect(rect.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(rect.bottom).toBeLessThanOrEqual(box.bottom + 1);
    });
    // The page itself was not scrolled to do it.
    await expect(window.scrollY).toBe(0);
  },
};

export const FoldInteraction: Story = {
  name: "Folds behind a button that opens, and Escape closes — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <Static>
      <TableOfContents collapse="always" defaultActiveId="fold-b" items={[{ id: "fold-a", label: "First" }, { id: "fold-b", label: "Second" }]} />
    </Static>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "On this page" });
    const link = canvas.getByRole("link", { name: "Second", hidden: true });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(link.getClientRects().length).toBe(0);
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(link.getClientRects().length).toBeGreaterThan(0);
    link.focus();
    await userEvent.keyboard("{Escape}");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveFocus();
    await expect(link.getClientRects().length).toBe(0);
  },
};

export const FoldsOnAPhoneInteraction: Story = {
  name: "collapse=auto folds on a phone and not above it — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <Static>
      <TableOfContents collapse="auto" defaultActiveId="ph-b" items={[{ id: "ph-a", label: "First" }, { id: "ph-b", label: "Second" }]} />
    </Static>
  ),
  play: async ({ canvasElement }) => {
    // Fails loudly if the viewport didn't apply.
    await expect(window.innerWidth).toBeLessThan(640);
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "On this page" });
    await expect(button.getClientRects().length).toBeGreaterThan(0);
    await expect(canvas.getByRole("link", { name: "Second", hidden: true }).getClientRects().length).toBe(0);
  },
};

function HoldDemo() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("close-toc", close);
    return () => window.removeEventListener("close-toc", close);
  }, []);
  return (
    <Static>
      <TableOfContents collapse="always" open={open} onOpenChange={setOpen} items={[{ id: "hold-a", label: "First" }, { id: "hold-b", label: "Second" }]} />
    </Static>
  );
}

export const FocusHoldsOpenInteraction: Story = {
  name: "Focus inside a folded list keeps it open — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <HoldDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "First" });
    link.focus();
    // Something other than the person closes the list (a parent's state, a resize): the focused link stays.
    window.dispatchEvent(new Event("close-toc"));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(link.getClientRects().length).toBeGreaterThan(0);
    await expect(link).toHaveFocus();
    // Once focus moves on, the closed list folds away.
    link.blur();
    await waitFor(() => expect(link.getClientRects().length).toBe(0));
  },
};

export const MovingMarkerInteraction: Story = {
  name: "The marker bar slides to the current entry — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DemoPage prefix="mm" tocProps={{ movingMarker: true }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("article");
    const nav = canvas.getByRole("navigation", { name: "On this page" });
    const marker = nav.querySelector('[aria-hidden="true"][data-visible]') as HTMLElement;
    const heading = (key: string) => canvasElement.querySelector<HTMLElement>(`#mm-${key}`) as HTMLElement;
    const toTop = (key: string) => box.scrollTo({ top: box.scrollTop + heading(key).getBoundingClientRect().top - box.getBoundingClientRect().top, behavior: "instant" });
    const rowOf = (name: string) => canvas.getByRole("link", { name }).closest("li") as HTMLElement;
    const covers = (name: string) => {
      const bar = marker.getBoundingClientRect();
      const row = rowOf(name).getBoundingClientRect();
      return Math.abs(bar.top - row.top) < 1.5 && Math.abs(bar.height - row.height) < 1.5;
    };
    toTop("usage");
    await waitFor(() => expect(canvas.getByRole("link", { name: "Usage" })).toHaveAttribute("aria-current", "location"));
    await waitFor(() => expect(marker.dataset.visible).toBe("true"));
    await waitFor(() => expect(covers("Usage")).toBe(true), { timeout: 2000 });
    toTop("accessibility");
    await waitFor(() => expect(canvas.getByRole("link", { name: "Accessibility" })).toHaveAttribute("aria-current", "location"));
    await waitFor(() => expect(covers("Accessibility")).toBe(true), { timeout: 2000 });
    // Only the one bar is drawn: no entry carries its own coloured bar.
    await expect(getComputedStyle(rowOf("Accessibility")).borderInlineStartColor).toBe(getComputedStyle(rowOf("Overview")).borderInlineStartColor);
  },
};

export const GroupsInteraction: Story = {
  name: "A group folds and opens, and the active one follows the page — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DemoPage prefix="grp" tocProps={{ collapsibleGroups: true, groupsDefaultOpen: false }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("article");
    const toggle = (name: string) => canvas.getByRole("button", { name: `Subsections of ${name}` });
    // Nothing is current yet, so every group starts closed and the children are not in the page.
    await expect(canvas.queryByRole("link", { name: "Requirements" })).toBeNull();
    await expect(toggle("Installation")).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle("Installation"));
    await expect(canvas.getByRole("link", { name: "Requirements" })).toBeInTheDocument();
    await expect(toggle("Installation")).toHaveAttribute("aria-expanded", "true");
    // Reading into Usage's own group opens it.
    const options = canvasElement.querySelector<HTMLElement>("#grp-options") as HTMLElement;
    box.scrollTo({ top: box.scrollTop + options.getBoundingClientRect().top - box.getBoundingClientRect().top, behavior: "instant" });
    await waitFor(() => expect(canvas.getByRole("link", { name: "Options" })).toHaveAttribute("aria-current", "location"));
    await expect(toggle("Usage")).toHaveAttribute("aria-expanded", "true");
    // Folding the group that holds the current entry puts the marker on its heading.
    await userEvent.click(toggle("Usage"));
    await expect(canvas.queryByRole("link", { name: "Options" })).toBeNull();
    await expect(canvas.getByRole("link", { name: "Usage" }).closest("li")).toHaveAttribute("data-toc-marked");
  },
};

export const DropdownInteraction: Story = {
  name: "The dropdown follows the page, opens, and chooses — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DropdownDemo prefix="dx" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("article");
    const bar = canvas.getByTestId("dropdown-toc");
    const trigger = within(bar).getByRole("button");
    const heading = (key: string) => canvasElement.querySelector<HTMLElement>(`#dx-s${key}`) as HTMLElement;
    const topInBox = (element: HTMLElement) => element.getBoundingClientRect().top - box.getBoundingClientRect().top;
    const before = trigger.getBoundingClientRect();

    // The bar stays at the top as the content scrolls, and its button names the section being read.
    box.scrollTo({ top: box.scrollTop + topInBox(heading("4")) - bar.getBoundingClientRect().height, behavior: "instant" });
    await waitFor(() => expect(trigger).toHaveAccessibleName("On this page: Section 4"));
    await expect(Math.abs(bar.getBoundingClientRect().top - box.getBoundingClientRect().top)).toBeLessThan(box.clientTop + 20);
    // A new label never resizes or moves the bar.
    await expect(trigger.getBoundingClientRect().width).toBe(before.width);
    await expect(trigger.getBoundingClientRect().height).toBe(before.height);

    // Opening it floats the list over the page, with the current entry marked.
    await userEvent.click(trigger);
    const panel = await within(document.body).findByRole("dialog", { name: "On this page" });
    await expect(within(panel).getAllByRole("link")).toHaveLength(10);
    await expect(within(panel).getByRole("link", { name: "Section 4" })).toHaveAttribute("aria-current", "location");

    // Choosing one closes the panel and leaves the section just under the bar, not behind it.
    await userEvent.click(within(panel).getByRole("link", { name: "Section 8" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveAccessibleName("On this page: Section 8"), { timeout: 3000 });
    await waitFor(() => expect(topInBox(heading("8"))).toBeGreaterThanOrEqual(bar.getBoundingClientRect().height - 2), { timeout: 3000 });
  },
};

export const DropdownKeyboardInteraction: Story = {
  name: "The dropdown with the keyboard: Enter on a link, Escape — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DropdownDemo prefix="dk" smoothScroll={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = within(canvas.getByTestId("dropdown-toc")).getByRole("button");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await within(document.body).findByRole("dialog", { name: "On this page" });
    // Focus went into the list.
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
    // Choosing a link with Enter leaves focus on the section, not the button.
    await userEvent.keyboard("{Enter}");
    const link = await within(document.body).findByRole("link", { name: "Section 3" });
    link.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
    // Long enough for the panel's own focus return to have happened, had it not been told to stand down.
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(canvasElement.querySelector("#dk-s3")).toHaveFocus();
  },
};

export const DropdownOnAPhoneInteraction: Story = {
  name: "collapse=auto with a dropdown on a phone is a sticky bar — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <DropdownDemo prefix="dp" collapse="auto" />,
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(640);
    const bar = within(canvasElement).getByTestId("dropdown-toc");
    await expect(getComputedStyle(bar).position).toBe("sticky");
    await expect(within(bar).getByRole("button").getClientRects().length).toBeGreaterThan(0);
    await expect(within(bar).queryAllByRole("link")).toHaveLength(0);
  },
};

export const DropdownInAScrollingPageInteraction: Story = {
  name: "A choice scrolls all the way, in a page that scrolls too — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  // A Docs page is a scrolling document with the demo somewhere in it: closing the panel hands focus back to its button,
  // and that must not cut the smooth scroll to the section short.
  render: () => (
    <div>
      <div style={{ blockSize: "30rem" }} aria-hidden="true" />
      <DropdownDemo prefix="dpg" />
      <div style={{ blockSize: "60rem" }} aria-hidden="true" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("article");
    const bar = canvas.getByTestId("dropdown-toc");
    box.scrollIntoView({ block: "center" });
    await userEvent.click(within(bar).getByRole("button"));
    const panel = await within(document.body).findByRole("dialog", { name: "On this page" });
    await new Promise((resolve) => setTimeout(resolve, 400));
    await userEvent.click(within(panel).getByRole("link", { name: "Section 7" }));
    const heading = canvasElement.querySelector<HTMLElement>("#dpg-s7") as HTMLElement;
    await waitFor(
      () => expect(heading.getBoundingClientRect().top - box.getBoundingClientRect().top).toBeLessThan(bar.getBoundingClientRect().height + 4),
      { timeout: 4000 },
    );
    await expect(box.scrollTop).toBeGreaterThan(300);
  },
};

// --- Final-review checks: what only a real browser can say. ---

/** The colour a system colour keyword resolves to. */
const systemColour = (keyword: string) => {
  const probe = document.createElement("span");
  probe.style.color = keyword;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

export const ForcedColoursInteraction: Story = {
  name: "Forced colours keep the track, the marker and the current entry apart — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)" }}>
      <TableOfContents aria-label="plain" defaultActiveId="fc-b" items={[{ id: "fc-a", label: "Other" }, { id: "fc-b", label: "Current" }]} />
      <TableOfContents aria-label="moving" movingMarker defaultActiveId="fc2-b" items={[{ id: "fc2-a", label: "Other" }, { id: "fc2-b", label: "Current" }]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rowOf = (outline: string, name: string) => within(canvas.getByRole("navigation", { name: outline })).getByRole("link", { name }).closest("li") as HTMLElement;
    await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "active" }] });
    try {
      await waitFor(() => expect(window.matchMedia("(forced-colors: active)").matches).toBe(true));
      // The track is a system colour, and the current entry's bar a different one — not both the same.
      await expect(getComputedStyle(rowOf("plain", "Other")).borderInlineStartColor).toBe(systemColour("CanvasText"));
      await expect(getComputedStyle(rowOf("plain", "Current")).borderInlineStartColor).toBe(systemColour("Highlight"));
      // With the moving marker, the entries keep the plain track and the marker itself is the highlight.
      await expect(getComputedStyle(rowOf("moving", "Current")).borderInlineStartColor).toBe(systemColour("CanvasText"));
      const marker = canvas.getByRole("navigation", { name: "moving" }).querySelector('[aria-hidden="true"][data-visible]') as HTMLElement;
      await expect(getComputedStyle(marker).borderInlineStartColor).toBe(systemColour("Highlight"));
      await expect(parseFloat(getComputedStyle(marker).borderInlineStartWidth)).toBeGreaterThan(0);
    } finally {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "forced-colors", value: "none" }] });
    }
  },
};

export const TabOrderInteraction: Story = {
  name: "The tab order across the whole outline — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <Static>
      <div>
        <button type="button">before</button>
        <TableOfContents aria-label="groups" collapsibleGroups items={leveledItems} />
        <TableOfContents aria-label="dropdown" collapse="always" foldedStyle="dropdown" items={leveledItems} />
        <TableOfContents aria-label="inline" collapse="always" items={leveledItems} />
        <button type="button">after</button>
      </div>
    </Static>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "before" }).focus();
    const stops: string[] = [];
    for (let step = 0; step < 14; step += 1) {
      await userEvent.tab();
      const active = document.activeElement as HTMLElement;
      stops.push(active.getAttribute("aria-label") ?? active.textContent ?? "");
      if (active.textContent === "after") break;
    }
    await expect(stops).toEqual([
      // The open groups: a link, then its button, in reading order, a nested group's button after its own link.
      "Installation",
      "Subsections of Installation",
      "Requirements",
      "Setup",
      "Subsections of Setup",
      "Options",
      "Usage",
      // A folded outline is one stop, whichever way it is drawn, and its list is not tabbed through.
      "On this page",
      "On this page",
      "after",
    ]);
  },
};

export const FoldButtonTargetsInteraction: Story = {
  name: "The fold, dropdown and group buttons are at least 24px at every size — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <Static>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <div key={size} style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
            <TableOfContents size={size} aria-label={`inline-${size}`} collapse="always" items={leveledItems} />
            <TableOfContents size={size} aria-label={`dropdown-${size}`} collapse="always" foldedStyle="dropdown" items={leveledItems} />
            <TableOfContents size={size} aria-label={`groups-${size}`} collapsibleGroups items={leveledItems} />
          </div>
        ))}
      </div>
    </Static>
  ),
  play: async ({ canvasElement }) => {
    for (const size of ["xs", "sm", "md", "lg", "xl"]) {
      for (const kind of ["inline", "dropdown", "groups"]) {
        const nav = within(canvasElement).getByRole("navigation", { name: `${kind}-${size}`, hidden: true });
        for (const button of within(nav).getAllByRole("button")) {
          const box = button.getBoundingClientRect();
          await expect(box.height, `${kind} button at ${size} is 24px tall`).toBeGreaterThanOrEqual(24);
          await expect(box.width, `${kind} button at ${size} is 24px wide`).toBeGreaterThanOrEqual(24);
        }
      }
    }
  },
};

export const RightToLeftFeaturesInteraction: Story = {
  name: "Right-to-left: the moving marker, the group buttons and the dropdown — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <Static>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxInlineSize: "20rem" }}>
        <TableOfContents dir="rtl" aria-label="marker" movingMarker collapsibleGroups defaultActiveId="rf-b" items={[{ id: "rf-a", label: "أ" }, { id: "rf-b", label: "ب", level: 2 }, { id: "rf-c", label: "ج" }]} />
        <TableOfContents dir="rtl" aria-label="dropdown" collapse="always" foldedStyle="dropdown" defaultActiveId="rf-b" items={[{ id: "rf-a", label: "أ" }, { id: "rf-b", label: "ب" }]} />
      </div>
    </Static>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "marker" });
    const marker = nav.querySelector('[aria-hidden="true"][data-visible]') as HTMLElement;
    await waitFor(() => expect(marker.dataset.visible).toBe("true"));
    const row = within(nav).getByRole("link", { name: "ب" }).closest("li") as HTMLElement;
    // The bar sits on the right edge of the row, where the track is, and the group's button at the left end.
    await expect(Math.abs(marker.getBoundingClientRect().right - row.getBoundingClientRect().right)).toBeLessThan(2.5);
    const toggle = within(nav).getByRole("button", { name: /./ });
    const first = within(nav).getByRole("link", { name: "أ" }).closest("li") as HTMLElement;
    await expect(toggle.getBoundingClientRect().left - first.getBoundingClientRect().left).toBeLessThan(12);
    // The dropdown's button: caret at the left end, text from the right.
    const trigger = within(canvas.getByRole("navigation", { name: "dropdown" })).getByRole("button");
    const caret = trigger.querySelector("svg") as SVGElement;
    await expect(caret.getBoundingClientRect().left).toBeLessThan(trigger.getBoundingClientRect().left + trigger.getBoundingClientRect().width / 2);
  },
};
