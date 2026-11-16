import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useArgs } from "storybook/preview-api";
import { Text } from "../../atoms/Text";
import { Select } from "../Select";
import { Table } from "../Table";
import { Pagination } from "./Pagination";
import { paginationPlaygroundSnippet, paginationSnippets } from "./Pagination.snippets";
import type { PaginationAlign, PaginationCompact, PaginationSize, PaginationVariant } from "./Pagination.types";

// `Pagination`'s own props get hand-written argTypes here (this meta has no `component`, so
// docgen doesn't supply them). The Playground is controlled: `value` is a real control, and
// choosing a page in the canvas writes it back to the control.
interface PlaygroundArgs {
  pageCount: number;
  value: number;
  defaultValue: number;
  siblingCount: number;
  boundaryCount: number;
  showFirstLast: boolean;
  showLabel: boolean;
  size: PaginationSize;
  compact: PaginationCompact;
  variant: PaginationVariant;
  rounded: boolean;
  showJump: boolean;
  announce: boolean;
  align: PaginationAlign;
  disabled: boolean;
  onValueChange: unknown;
  getPageHref: unknown;
  labels: unknown;
  formatNumber: unknown;
  "aria-label": string;
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allSizes: PaginationSize[] = ["xs", "sm", "md", "lg", "xl"];

const labelledColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };
const containerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;

// Every fixed-render story below ignores the Playground's own `args`, so each one suppresses every
// control it doesn't consume (a story-level `argTypes` entry merges over the meta-level one per key).
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  pageCount: { control: false },
  value: { control: false },
  defaultValue: { control: false },
  siblingCount: { control: false },
  boundaryCount: { control: false },
  showFirstLast: { control: false },
  showLabel: { control: false },
  size: { control: false },
  compact: { control: false },
  variant: { control: false },
  rounded: { control: false },
  showJump: { control: false },
  announce: { control: false },
  align: { control: false },
  disabled: { control: false },
  onValueChange: { control: false },
  getPageHref: { control: false },
  labels: { control: false },
  formatNumber: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Components/Pagination",
  id: "molecules-data-display-pagination",
  parameters: { layout: "padded" },
  argTypes: {
    pageCount: {
      control: { type: "number", min: 0, max: 200, step: 1 },
      description:
        "How many pages there are in total. With no pages (0) the component renders nothing, so it can sit above data that hasn't arrived yet. For a list of items, this is Math.ceil(totalItems / pageSize).",
    },
    value: {
      control: { type: "number", min: 1, step: 1 },
      description:
        "The current page, starting at 1 — controlled. Pair with onValueChange to update it, or the component will appear frozen. A value outside 1 to pageCount is clamped to it. (In the Playground, choosing a page in the canvas writes it back here.)",
    },
    defaultValue: {
      control: false,
      description:
        "The starting page for an uncontrolled component, which then tracks the page itself. Ignored once value is also provided.",
      table: { defaultValue: { summary: "1" } },
    },
    onValueChange: {
      control: false,
      description:
        "Called when the user chooses another page, with the new page number and the click event. In link mode, call event.preventDefault() to handle the navigation yourself, for example with a client-side router. Not called for the page that is already current, or for a click that asks the browser to open a link elsewhere (Ctrl, Cmd, Shift, or Alt held, or the middle button).",
    },
    siblingCount: {
      control: { type: "number", min: 0, max: 5, step: 1 },
      description:
        "How many pages to show either side of the current page. The row keeps the same number of slots (2 × boundaryCount + 2 × siblingCount + 3, gaps included) wherever you are, so the controls don't shift sideways as you move through the pages.",
      table: { defaultValue: { summary: "1" } },
    },
    boundaryCount: {
      control: { type: "number", min: 0, max: 5, step: 1 },
      description: "How many pages to always show at each end.",
      table: { defaultValue: { summary: "1" } },
    },
    showFirstLast: {
      control: "boolean",
      description:
        "Adds buttons that jump straight to the first and the last page, either side of the previous and next buttons.",
      table: { defaultValue: { summary: "false" } },
    },
    showLabel: {
      control: "boolean",
      description:
        "Shows the words \"Previous\" and \"Next\" on the previous and next buttons, beside their arrows: the arrow then \"Previous\" on the previous button, and \"Next\" then the arrow on the next button — in reading order, so both mirror under right-to-left text. The first and last buttons stay icon-only. The words are labels.previousText and labels.nextText, so they translate; keep them inside the buttons' accessible names.",
      table: { defaultValue: { summary: "false" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of every control in the row.",
      table: { defaultValue: { summary: "'md'" } },
    },
    compact: {
      control: "radio",
      options: ["auto", "container", "always", "never"],
      description:
        "Whether the page numbers collapse to a \"Page 3 of 20\" summary between the previous and next buttons: on a phone-width screen (auto), when they don't fit the component's own width (container), always, or never. The Docs page is wide, so auto shows the numbers here — open the 'On a phone' story to see it collapse; container collapses in a narrow box on any screen.",
      table: { defaultValue: { summary: "'auto'" } },
    },
    variant: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description:
        "How the page controls look. The current page is always the filled brand colour; this is the treatment of every other control: ghost (no surface at rest, a tint on hover — the quietest), outlined (a brand-coloured border), or filled (a soft brand tint).",
      table: { defaultValue: { summary: "'ghost'" } },
    },
    rounded: {
      control: "boolean",
      description:
        "Makes every page number and arrow round: a circle, or a pill for a page number too wide to be a square. The \"Go to page\" field and its button (showJump) keep their own corners.",
      table: { defaultValue: { summary: "false" } },
    },
    showJump: {
      control: "boolean",
      description:
        "Adds a \"Go to page\" field and button after the row, for a list long enough that stepping or picking from the window is slow. Type a page number and press Enter (or the button); a number outside 1 to pageCount goes to the nearest page, and an empty field does nothing. It stays available in the compact form. A form control, so it is natively disabled while disabled is set.",
      table: { defaultValue: { summary: "false" } },
    },
    announce: {
      control: "boolean",
      description:
        "Announces the new page to screen readers whenever the page changes — \"Page 3 of 20\" (the summary label) — through a visually hidden status region that stays in the page. Set it to false if your own content region already announces the change. (Nothing changes visually; see the 'Announcing a page change' story.)",
      table: { defaultValue: { summary: "true" } },
    },
    align: {
      control: "radio",
      options: ["start", "center", "end"],
      description:
        "Where the controls sit across the width: centred, or flush with the start or end edge (the left or right in left-to-right text, mirrored in right-to-left) — end-aligned is the usual place for the pagination under a table.",
      table: { defaultValue: { summary: "'center'" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Disables every control — while the next page is loading, say. They stay focusable (they are aria-disabled rather than natively disabled), so keyboard focus isn't lost.",
      table: { defaultValue: { summary: "false" } },
    },
    getPageHref: {
      control: false,
      description:
        "Makes each control a real link: given a page number, returns its URL. Use it when each page has its own address — a server-rendered list, or a router — so a link can be opened in a new tab, copied, or followed without JavaScript. Without it, every control is a button.",
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself — accessible names and the compact summary. Any you leave out keep their English default. Keys: navigation, previous, previousText, next, nextText, first, last, page (a function of the page number), summary (a function of the page and the page count), jump, and jumpSubmit. previousText and nextText are the visible words when showLabel is set.",
    },
    formatNumber: {
      control: false,
      description:
        "How a page number is written, for a language or region whose numerals or digit grouping differ from the plain 5 and 1234: given a page number, returns the text to show. Used for the number on each button and, by the default page and summary labels, in the accessible names and the \"Page 3 of 20\" summary, so what a button shows is always contained in its name. For example new Intl.NumberFormat(\"ar-EG\").format shows ٥, and \"de-DE\" shows 1.234. Your own labels.page and labels.summary are given the plain numbers, so write them with the same function. The jump field is the browser's own number field and isn't affected.",
      table: { defaultValue: { summary: "(page) => String(page)" } },
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the nav landmark. Defaults to labels.navigation (\"Pagination\"). Give each one on a page its own name — \"Search results\", \"Comments\" — since a screen reader lists landmarks by name.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this landmark; takes the place of aria-label.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or when a test or router needs a stable anchor.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    pageCount: 20,
    value: 5,
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: false,
    showLabel: false,
    size: "md",
    compact: "auto",
    variant: "ghost",
    rounded: false,
    showJump: false,
    announce: true,
    align: "center",
    disabled: false,
  },
  render: function PlaygroundRender(args) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <div style={containerStyle}>
        <Pagination
          pageCount={args.pageCount}
          value={args.value}
          onValueChange={(page) => updateArgs({ value: page })}
          siblingCount={args.siblingCount}
          boundaryCount={args.boundaryCount}
          showFirstLast={args.showFirstLast}
          showLabel={args.showLabel}
          size={args.size}
          compact={args.compact}
          variant={args.variant}
          rounded={args.rounded}
          showJump={args.showJump}
          announce={args.announce}
          align={args.align}
          disabled={args.disabled}
        />
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. Choosing a page in the canvas updates `value`. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from their defaults.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => paginationPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.sizes } } },
  render: () => (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }} data-testid="sizes">
      {allSizes.map((size) => (
        <div key={size} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <Pagination pageCount={20} defaultValue={5} size={size} compact="never" align="start" aria-label={`Size ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] nav")];
    await expect(rows.length).toBe(5);
    const boxes = rows.map((nav) => nav.querySelector("button")!.getBoundingClientRect());
    // Every control is a square, and each size step is larger than the last.
    for (const [index, box] of boxes.entries()) {
      await expect(Math.abs(box.width - box.height)).toBeLessThan(1);
      if (index > 0) await expect(box.height).toBeGreaterThan(boxes[index - 1]!.height);
    }
  },
};

export const Windows: Story = {
  name: "Where you are in the pages",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.windows } } },
  render: () => (
    // The same 20 pages with the current page at the start, the middle, and the end. The row keeps
    // the same number of slots throughout, so the controls stay put as you move.
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="windows">
      {[1, 4, 5, 10, 16, 17, 20].map((page) => (
        <div key={page} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            value={page}
          </Text>
          <Pagination pageCount={20} defaultValue={page} compact="never" align="start" aria-label={`Page ${page} of 20`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const navs = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=windows] nav")];
    const expected = [
      ["1", "2", "3", "4", "5", "…", "20"],
      ["1", "2", "3", "4", "5", "…", "20"],
      ["1", "…", "4", "5", "6", "…", "20"],
      ["1", "…", "9", "10", "11", "…", "20"],
      ["1", "…", "15", "16", "17", "…", "20"],
      ["1", "…", "16", "17", "18", "19", "20"],
      ["1", "…", "16", "17", "18", "19", "20"],
    ];
    for (const [index, nav] of navs.entries()) {
      // What a reader sees: the page numbers and gaps. The arrows have no text, and the compact summary
      // ("Page 7 of 20") is hidden at this width.
      const shown = [...nav.querySelectorAll("li")]
        .map((item) => item.textContent ?? "")
        .filter((text) => text !== "" && !/^Page \d+ of \d+$/.test(text));
      await expect(shown).toEqual(expected[index]);
      // Always seven slots — the row never changes width as you move through the pages.
      await expect(shown.length).toBe(7);
    }
  },
};

export const SiblingsAndBoundaries: Story = {
  name: "Siblings and boundaries",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.siblings } } },
  render: () => (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {[
        { siblingCount: 0, boundaryCount: 1 },
        { siblingCount: 1, boundaryCount: 1 },
        { siblingCount: 2, boundaryCount: 1 },
        { siblingCount: 1, boundaryCount: 2 },
      ].map((counts) => (
        <div key={`${counts.siblingCount}-${counts.boundaryCount}`} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            siblingCount={counts.siblingCount}, boundaryCount={counts.boundaryCount}
          </Text>
          <Pagination
            pageCount={40}
            defaultValue={20}
            {...counts}
            compact="never"
            align="start"
            aria-label={`Siblings ${counts.siblingCount}, boundaries ${counts.boundaryCount}`}
          />
        </div>
      ))}
    </div>
  ),
};

export const FirstLast: Story = {
  name: "First and last buttons",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.firstLast } } },
  render: () => (
    <div style={containerStyle}>
      <Pagination pageCount={20} defaultValue={10} showFirstLast compact="never" aria-label="With first and last" />
    </div>
  ),
};

const onLinkChange = fn((_page: number, event: { preventDefault: () => void }) => event.preventDefault());

export const Links: Story = {
  name: "As links",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.links } } },
  render: () => (
    // With `getPageHref` every control is a real link, so a page can be opened in a new tab or followed
    // without JavaScript. Here the demo cancels the navigation so the story stays put.
    <div style={containerStyle}>
      <Pagination
        pageCount={20}
        defaultValue={3}
        compact="never"
        getPageHref={(page) => `#/results?page=${page}`}
        onValueChange={onLinkChange}
        aria-label="Search results"
      />
    </div>
  ),
};

// Runs Links's assertions in a real browser without making the visible story animate: Storybook plays a story's
// `play` function whenever it is opened, so a play that changes what the story shows would leave the demo on a
// different state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const LinksInteraction: Story = {
  ...Links,
  name: "As links — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onLinkChange.mockClear();
    // Every control is a link with its own address; the current page is marked.
    await expect(canvas.getByRole("link", { name: "Page 4" })).toHaveAttribute("href", "#/results?page=4");
    await expect(canvas.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "#/results?page=4");
    await expect(canvas.getByRole("link", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.queryByRole("button")).toBeNull();
    // A click reports the page and the event.
    await userEvent.click(canvas.getByRole("link", { name: "Page 5" }));
    await expect(onLinkChange).toHaveBeenCalledTimes(1);
    await expect(onLinkChange.mock.calls[0]?.[0]).toBe(5);
    await expect(canvas.getByRole("link", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
  },
};

export const Disabled: Story = {
  name: "Disabled",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.disabled } } },
  render: () => (
    <div style={containerStyle}>
      <Pagination pageCount={20} defaultValue={5} disabled compact="never" aria-label="Disabled" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Every control is unavailable but still focusable.
    for (const control of canvas.getAllByRole("button")) {
      await expect(control).toHaveAttribute("aria-disabled", "true");
      await expect(control).not.toBeDisabled();
    }
    await userEvent.click(canvas.getByRole("button", { name: "Page 6" }));
    await expect(canvas.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
  },
};

export const Alignment: Story = {
  name: "Alignment",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.align } } },
  render: () => (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="alignment">
      {(["start", "center", "end"] as const).map((align) => (
        <div key={align} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            align=&quot;{align}&quot;
          </Text>
          <div style={{ border: "var(--dbm-border-width-1) solid var(--dbm-border-default)", borderRadius: "var(--dbm-radius-md)", padding: "var(--dbm-space-2)" }}>
            <Pagination pageCount={10} defaultValue={3} align={align} compact="never" aria-label={`Aligned to the ${align}`} />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const boxes = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=alignment] > div > div:last-child")];
    const [start, center, end] = boxes.map((box) => {
      const list = box.querySelector("ul")!.getBoundingClientRect();
      const outer = box.getBoundingClientRect();
      return { fromStart: list.left - outer.left, fromEnd: outer.right - list.right };
    });
    // Flush with the left edge, centred, and flush with the right edge (inside the box's padding).
    await expect(start!.fromStart).toBeLessThan(12);
    await expect(Math.abs(center!.fromStart - center!.fromEnd)).toBeLessThan(2);
    await expect(end!.fromEnd).toBeLessThan(12);
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.variants } } },
  render: () => (
    // Every control but the current page takes the treatment; the current page is always the filled brand colour.
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="variants">
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <Pagination pageCount={20} defaultValue={5} variant={variant} compact="never" align="start" aria-label={`Variant ${variant}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const surface = (name: string, row: number) => {
      const nav = canvasElement.querySelectorAll("[data-testid=variants] nav")[row]!;
      const control = within(nav as HTMLElement).getByRole("button", { name });
      const style = getComputedStyle(control);
      return { background: style.backgroundColor, borderWidth: parseFloat(style.borderTopWidth) };
    };
    const transparent = "rgba(0, 0, 0, 0)";
    // Ghost: no surface. Outlined: a border. Filled: a tint. The current page is filled in all three.
    await expect(surface("Page 6", 0)).toEqual({ background: transparent, borderWidth: 0 });
    await expect(surface("Page 6", 1).borderWidth).toBeGreaterThan(0);
    await expect(surface("Page 6", 1).background).toBe(transparent);
    await expect(surface("Page 6", 2).background).not.toBe(transparent);
    await expect(surface("Page 6", 2).borderWidth).toBe(0);
    for (const row of [0, 1, 2]) await expect(surface("Page 5", row).background).not.toBe(transparent);
    await expect(surface("Page 5", 0).background).not.toBe(surface("Page 6", 2).background);
  },
};

export const Rounded: Story = {
  name: "Rounded",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.rounded } } },
  render: () => (
    // `rounded` makes every page number and arrow a circle (a pill for a number too wide for a square, like 1234).
    // The jump field and its button keep their own corners. The last row is the default, for comparison.
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="rounded">
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            rounded, variant=&quot;{variant}&quot;
          </Text>
          <Pagination pageCount={20} defaultValue={5} rounded variant={variant} showFirstLast compact="never" align="start" aria-label={`Rounded ${variant}`} />
        </div>
      ))}
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          rounded, with a wide page number and the jump field (which keeps its corners)
        </Text>
        <Pagination pageCount={5000} defaultValue={1234} rounded showJump compact="never" align="start" aria-label="Rounded with jump" />
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          default (for comparison)
        </Text>
        <Pagination pageCount={20} defaultValue={5} compact="never" align="start" aria-label="Not rounded" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measures only — nothing changes on screen. How round is a corner, against half the control's height?
    const rounding = (control: Element) => {
      const box = control.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(control).borderTopLeftRadius);
      return { radius, half: box.height / 2, width: box.width, height: box.height };
    };
    const navs = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=rounded] nav")];
    await expect(navs.length).toBe(5);
    // Every control of the four rounded rows is fully round: a corner at least half its height.
    for (const nav of navs.slice(0, 4)) {
      const controls = [...nav.querySelectorAll("ul button")];
      await expect(controls.length).toBeGreaterThan(5);
      for (const control of controls) {
        const { radius, half } = rounding(control);
        await expect(radius).toBeGreaterThanOrEqual(half - 0.5);
      }
    }
    // The jump field and its button are NOT round: they keep their own (rounded-square) corners, well short of half
    // their height. (`Input`'s own wrapper carries the component's `jumpInput` class.)
    const withJump = navs[3]!;
    const field = rounding(withJump.querySelector("[class*=jumpInput]")!);
    const go = rounding(within(withJump).getByRole("button", { name: "Go" }));
    for (const jump of [field, go]) await expect(jump.radius).toBeLessThan(jump.half - 4);
    // A narrow number is a circle, a wide one a pill.
    const narrow = rounding(within(withJump).getByRole("button", { name: "Page 1" }));
    await expect(Math.abs(narrow.width - narrow.height)).toBeLessThan(1);
    const wide = rounding(within(withJump).getByRole("button", { name: "Page 1234" }));
    await expect(wide.width).toBeGreaterThan(wide.height);
    // The default row is rounded-square, well short of half its height.
    const plain = rounding(within(navs[4]!).getByRole("button", { name: "Page 6" }));
    await expect(plain.radius).toBeLessThan(plain.half - 4);
  },
};

// The keyboard focus ring of a rounded control is round too (the repo's rule for a fully round element). Focusing
// leaves a ring on screen, so this runs in a hidden twin rather than in the visible story.
export const RoundedInteraction: Story = {
  ...Rounded,
  name: "Rounded — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector<HTMLElement>("[data-testid=rounded] nav")!;
    await userEvent.tab();
    const focused = document.activeElement as HTMLElement;
    await expect(nav.contains(focused)).toBe(true);
    await expect(getComputedStyle(focused).outlineStyle).toBe("solid");
    const height = focused.getBoundingClientRect().height;
    await expect(parseFloat(getComputedStyle(focused).borderTopLeftRadius)).toBeGreaterThanOrEqual(height / 2 - 0.5);
  },
};

export const Labels: Story = {
  name: "Previous and Next labels",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.labels } } },
  render: () => (
    // `showLabel` writes "Previous" and "Next" beside the arrows — the arrow then "Previous", and "Next" then the arrow,
    // in reading order, so they mirror under right-to-left text. The first and last buttons stay icon-only.
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          showLabel
        </Text>
        <Pagination pageCount={20} defaultValue={5} showLabel compact="never" align="start" aria-label="With labels" />
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          showLabel, outlined and rounded
        </Text>
        <Pagination pageCount={20} defaultValue={5} showLabel variant="outlined" rounded compact="never" align="start" aria-label="Outlined with labels" />
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          showLabel with first and last, small
        </Text>
        <Pagination pageCount={20} defaultValue={5} showLabel showFirstLast size="sm" compact="never" align="start" aria-label="With first and last" />
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          showLabel in the compact form, small — the summary between the labelled buttons
        </Text>
        <Pagination pageCount={20} defaultValue={5} showLabel compact="always" size="sm" align="start" aria-label="Compact with labels" />
      </div>
      <div style={labelledColumn} dir="rtl">
        <Text size="sm" weight="semibold">
          showLabel in right-to-left text — the order mirrors
        </Text>
        <Pagination pageCount={20} defaultValue={5} showLabel compact="never" align="start" aria-label="Right to left with labels" />
      </div>
    </div>
  ),
};

export const Locale: Story = {
  name: "Numbers in your own locale",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.locale } } },
  render: () => {
    // `formatNumber` writes each page number the way a language or region does, through the browser's own `Intl`.
    // The default "Page 5" names use it, so a button's name always contains what it shows; the last row also
    // translates the text, and its own labels are given the plain numbers, so they write them the same way.
    const arabic = new Intl.NumberFormat("ar-EG");
    const german = new Intl.NumberFormat("de-DE");
    return (
      <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        <div style={labelledColumn}>
          <Text size="sm" weight="semibold">
            Arabic-Indic digits (ar-EG)
          </Text>
          <Pagination pageCount={20} defaultValue={5} compact="never" align="start" formatNumber={arabic.format} aria-label="Arabic digits" />
        </div>
        <div style={labelledColumn}>
          <Text size="sm" weight="semibold">
            Digit grouping (de-DE)
          </Text>
          <Pagination pageCount={5000} defaultValue={1234} compact="never" align="start" formatNumber={german.format} aria-label="Grouped digits" />
        </div>
        <div style={labelledColumn} dir="rtl">
          <Text size="sm" weight="semibold">
            Arabic, with the text translated too (right-to-left)
          </Text>
          <Pagination
            pageCount={20}
            defaultValue={5}
            compact="never"
            align="start"
            formatNumber={arabic.format}
            labels={{
              navigation: "التنقل بين الصفحات",
              previous: "الصفحة السابقة",
              next: "الصفحة التالية",
              page: (page) => `الصفحة ${arabic.format(page)}`,
              summary: (page, pageCount) => `الصفحة ${arabic.format(page)} من ${arabic.format(pageCount)}`,
            }}
          />
        </div>
      </div>
    );
  },
};

export const Jump: Story = {
  name: "Jump to a page",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.jump } } },
  render: () => (
    // For a list long enough that stepping, or choosing from the window, is slow. Type a page and press Enter
    // or the button; a number outside the range goes to the nearest page.
    <div style={containerStyle}>
      <Pagination pageCount={500} defaultValue={42} showJump aria-label="A long list" />
    </div>
  ),
};

// Runs Jump's assertions in a real browser without making the visible story animate: Storybook plays a story's
// `play` function whenever it is opened, so a play that changes what the story shows would leave the demo on a
// different state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const JumpInteraction: Story = {
  ...Jump,
  name: "Jump to a page — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText("Go to page");
    const current = () => canvas.getByRole("button", { current: "page" });
    await expect(current()).toHaveAccessibleName("Page 42");
    await userEvent.type(field, "250{Enter}");
    await expect(current()).toHaveAccessibleName("Page 250");
    await expect(field).toHaveValue(null);
    // A number outside the range goes to the nearest page — the browser's own range check must not block it.
    await userEvent.type(field, "9999{Enter}");
    await expect(current()).toHaveAccessibleName("Page 500");
    await userEvent.type(field, "0");
    await userEvent.click(canvas.getByRole("button", { name: "Go" }));
    await expect(current()).toHaveAccessibleName("Page 1");
    // An empty field does nothing.
    await userEvent.click(canvas.getByRole("button", { name: "Go" }));
    await expect(current()).toHaveAccessibleName("Page 1");
  },
};

export const FitContainer: Story = {
  name: "Collapses to fit its container",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.container } } },
  render: () => (
    // `compact="container"` decides by the width the component is *given*, not the screen's: the same row shows its
    // numbers in a wide box and the summary in a narrow one, on the same screen.
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="fit">
      {[
        { label: "18rem wide", width: "18rem" },
        { label: "30rem wide", width: "30rem" },
        { label: "46rem wide", width: "46rem" },
      ].map(({ label, width }) => (
        <div key={width} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            {label}
          </Text>
          <div
            // `resize: horizontal` gives each box a drag handle in its bottom-right corner, so the collapse can be
            // watched by resizing (it needs an `overflow` other than `visible`).
            style={{ border: "var(--dbm-border-width-1) dashed var(--dbm-border-neutral)", maxWidth: "100%", minWidth: "10rem", overflow: "hidden", resize: "horizontal", width }}
            data-testid={`box-${width}`}
          >
            <Pagination pageCount={20} defaultValue={7} compact="container" align="start" aria-label={`In a ${label} box`} />
          </div>
        </div>
      ))}
    </div>
  ),
};

// Runs FitContainer's assertions in a real browser without making the visible story animate: Storybook plays a story's
// `play` function whenever it is opened, so a play that changes what the story shows would leave the demo on a
// different state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const FitContainerInteraction: Story = {
  ...FitContainer,
  name: "Collapses to fit its container — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const box = (width: string) => within(canvasElement.querySelector<HTMLElement>(`[data-testid=box-${width}]`)!);
    // The screen is wide, so `auto` would show the numbers everywhere; only the narrow box collapses.
    await waitFor(() => expect(box("18rem").getByText("Page 7 of 20")).toBeVisible());
    await expect(box("18rem").queryByRole("button", { name: "Page 8" })).toBeNull();
    await expect(box("30rem").getByRole("button", { name: "Page 8" })).toBeVisible();
    await expect(box("46rem").getByRole("button", { name: "Page 8" })).toBeVisible();
    // Resizing the box changes it: widen the narrow one, and it expands; narrow the wide one, and it collapses.
    const narrow = canvasElement.querySelector<HTMLElement>("[data-testid=box-18rem]")!;
    const wide = canvasElement.querySelector<HTMLElement>("[data-testid=box-46rem]")!;
    narrow.style.width = "46rem";
    wide.style.width = "18rem";
    await waitFor(() => expect(box("18rem").getByRole("button", { name: "Page 8" })).toBeVisible());
    await waitFor(() => expect(box("46rem").queryByRole("button", { name: "Page 8" })).toBeNull());
    await expect(box("46rem").getByText("Page 7 of 20")).toBeVisible();
    // Whichever it shows, it never wraps onto a second line.
    for (const box of [narrow, canvasElement.querySelector<HTMLElement>("[data-testid=box-30rem]")!, wide]) {
      const tops = new Set([...box.querySelectorAll("ul > li")].filter((li) => li.getBoundingClientRect().width > 0).map((li) => Math.round(li.getBoundingClientRect().top)));
      await expect(tops.size).toBe(1);
    }
    // Put the boxes back as they were, so the labels above them are true again.
    narrow.style.width = "18rem";
    wide.style.width = "46rem";
    await waitFor(() => expect(box("18rem").getByText("Page 7 of 20")).toBeVisible());
    await waitFor(() => expect(box("46rem").getByRole("button", { name: "Page 8" })).toBeVisible());
  },
};

// Mirrors what the hidden status region says, so the demo can show it: a screen reader hears it but a
// sighted reader can't, and the region is emptied again a second later.
const AnnouncementDemo = () => {
  const [heard, setHeard] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const region = wrapper.current?.querySelector("[role=status]");
    if (!region) return;
    const observer = new MutationObserver(() => {
      if (region.textContent) setHeard(region.textContent);
    });
    observer.observe(region, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={wrapper} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Pagination pageCount={20} defaultValue={5} compact="never" align="start" aria-label="Announcing" />
      <Text size="sm" color="secondary" data-testid="heard">
        Announced to screen readers: {heard || "nothing yet — choose a page"}
      </Text>
    </div>
  );
};

export const Announcing: Story = {
  name: "Announcing a page change",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.announce } } },
  render: () => (
    // By default, choosing a page is announced to screen readers ("Page 6 of 20") through a hidden status region.
    // It's invisible, so this demo mirrors it in the line below.
    <div style={containerStyle}>
      <AnnouncementDemo />
    </div>
  ),
};

// Runs Announcing's assertions in a real browser without making the visible story animate: Storybook plays a story's
// `play` function whenever it is opened, so a play that changes what the story shows would leave the demo on a
// different state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const AnnouncingInteraction: Story = {
  ...Announcing,
  name: "Announcing a page change — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The status region is in the page from the start, and empty.
    const region = canvas.getByRole("status");
    await expect(region).toBeEmptyDOMElement();
    await userEvent.click(canvas.getByRole("button", { name: "Page 6" }));
    await waitFor(() => expect(region).toHaveTextContent("Page 6 of 20"));
    await waitFor(() => expect(canvas.getByTestId("heard")).toHaveTextContent("Page 6 of 20"));
    // It is cleared again afterwards, so it isn't read a second time when browsing.
    await waitFor(() => expect(region).toBeEmptyDOMElement(), { timeout: 3000 });
  },
};

export const Compact: Story = {
  name: "Compact",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.compact } } },
  render: () => (
    // `compact="always"` collapses the row to a summary at every width, for a narrow place like a sidebar.
    // The default, `auto`, does it only below the `sm` breakpoint — see the 'On a phone' story.
    <div style={{ maxWidth: "20rem", marginInline: "auto" }} data-testid="compact">
      <Pagination pageCount={20} defaultValue={7} compact="always" aria-label="Compact" />
    </div>
  ),
};

// Runs Compact's assertions in a real browser without making the visible story animate: Storybook plays a story's
// `play` function whenever it is opened, so a play that changes what the story shows would leave the demo on a
// different state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const CompactInteraction: Story = {
  ...Compact,
  name: "Compact — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The summary shows, and the page numbers are out of the accessibility tree and the tab order.
    await expect(canvas.getByText("Page 7 of 20")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Page 8" })).toBeNull();
    // Previous and next still work.
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(canvas.getByText("Page 8 of 20")).toBeVisible();
  },
};

export const OnAPhone: Story = {
  name: "On a phone — collapses to a summary",
  argTypes: noControls,
  // Opened on its own, this story is shown at a phone's width (and it is in the test run); on the Docs
  // page it sits in the wide page like every other story.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { docs: { source: { code: paginationSnippets.onAPhone } } },
  render: () => (
    // With the default `compact="auto"`, below the `sm` breakpoint the numbers collapse to a "Page 7 of 20"
    // summary between the buttons, since a full row doesn't fit; from `sm` up the numbers are back.
    // Storybook's own wrapper pads every story by space.6; this cancels it and applies a phone's usual
    // 16px gutter instead, so the row gets the 288px a real 320px-wide phone gives it.
    <div
      data-testid="phone"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-6)",
        marginInline: "calc(-1 * var(--dbm-space-6))",
        paddingInline: "var(--dbm-space-4)",
      }}
    >
      <Pagination pageCount={20} defaultValue={7} showFirstLast aria-label="With first and last" />
      <Pagination pageCount={200} defaultValue={7} showJump aria-label="With a jump field" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const canvas = within(canvasElement);
    const [first, long] = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=phone] nav")];
    const inFirst = within(first!);
    const inLong = within(long!);
    // The numbers collapse to a summary, and are gone from the accessibility tree and the tab order.
    await expect(inFirst.getByText("Page 7 of 20")).toBeVisible();
    await expect(inFirst.queryByRole("button", { name: "Page 8" })).toBeNull();
    await expect(inLong.getByText("Page 7 of 200")).toBeVisible();
    // With first and last, all four buttons and the summary fit one line of a 320px phone.
    for (const name of ["First page", "Previous page", "Next page", "Last page"]) {
      await expect(inFirst.getByRole("button", { name })).toBeVisible();
    }
    const oneLine = (nav: HTMLElement) =>
      new Set([...nav.querySelectorAll("ul > li")].filter((li) => li.getBoundingClientRect().width > 0).map((li) => Math.round(li.getBoundingClientRect().top))).size;
    await expect(oneLine(first!)).toBe(1);
    await expect(first!.scrollWidth).toBeLessThanOrEqual(first!.clientWidth);
    // With a three-digit page count the summary is wider, so the jump field (the way to reach a page the
    // summary hides) is offered instead of first and last: the controls are on one line, and the field
    // is on a line of its own below them, inside the screen.
    await expect(oneLine(long!)).toBe(1);
    const jump = canvas.getByLabelText("Go to page");
    await expect(jump).toBeVisible();
    const jumpBox = jump.closest("form")!.getBoundingClientRect();
    await expect(jumpBox.top).toBeGreaterThanOrEqual(long!.querySelector("ul")!.getBoundingClientRect().bottom - 1);
    await expect(jumpBox.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(long!.scrollWidth).toBeLessThanOrEqual(long!.clientWidth);
  },
};

const allInvoices = Array.from({ length: 47 }, (_, index) => ({
  id: `INV-${String(index + 1).padStart(3, "0")}`,
  customer: ["Acme Corp", "Globex", "Initech", "Umbrella", "Hooli"][index % 5]!,
  amount: `$${(120 + index * 13.5).toFixed(2)}`,
}));

const TableFooter = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("5");
  const size = Number(pageSize);
  const pageCount = Math.ceil(allInvoices.length / size);
  const first = (page - 1) * size;
  const visible = allInvoices.slice(first, first + size);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      <Table aria-label="Invoices">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell numeric>Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {visible.map((invoice) => (
            <Table.Row key={invoice.id}>
              <Table.HeaderCell scope="row">{invoice.id}</Table.HeaderCell>
              <Table.Cell>{invoice.customer}</Table.Cell>
              <Table.Cell numeric>{invoice.amount}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)", justifyContent: "space-between" }}>
        <Text size="sm" color="secondary" data-testid="range">
          Showing {first + 1}–{first + visible.length} of {allInvoices.length}
        </Text>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-4)" }}>
          <div style={{ width: "9rem" }}>
            <Select
              aria-label="Rows per page"
              size="sm"
              value={pageSize}
              onValueChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
            >
              <Select.Option value="5">5 per page</Select.Option>
              <Select.Option value="10">10 per page</Select.Option>
              <Select.Option value="25">25 per page</Select.Option>
            </Select>
          </div>
          <Pagination pageCount={pageCount} value={page} onValueChange={setPage} size="sm" aria-label="Invoices" />
        </div>
      </div>
    </div>
  );
};

export const InATableFooter: Story = {
  name: "Composition — a table footer with a page size",
  argTypes: noControls,
  parameters: { docs: { source: { code: paginationSnippets.tableFooter } } },
  render: () => (
    // The classic data-table footer: a range summary, a page-size select, and the pagination. `Pagination`
    // does the page navigation; the page count and the rows shown come from the data.
    <div style={containerStyle} data-testid="footer">
      <TableFooter />
    </div>
  ),
};

// Runs InATableFooter's assertions in a real browser without making the visible story animate: Storybook plays a story's
// `play` function whenever it is opened, so a play that changes what the story shows would leave the demo on a
// different state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const InATableFooterInteraction: Story = {
  ...InATableFooter,
  name: "Composition — a table footer with a page size — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("range")).toHaveTextContent("Showing 1–5 of 47");
    await expect(canvas.getByRole("row", { name: /INV-001/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Page 2" }));
    await expect(canvas.getByTestId("range")).toHaveTextContent("Showing 6–10 of 47");
    await expect(canvas.getByRole("row", { name: /INV-006/ })).toBeInTheDocument();
    await expect(canvas.queryByRole("row", { name: /INV-001/ })).toBeNull();
    // The last page shows what is left.
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await userEvent.click(canvas.getByRole("button", { name: "Page 10" }));
    await expect(canvas.getByTestId("range")).toHaveTextContent("Showing 46–47 of 47");
    await expect(canvas.getByRole("button", { name: "Next page" })).toHaveAttribute("aria-disabled", "true");
  },
};

// Right-to-left text, in a real browser (jsdom can't evaluate `:dir(rtl)`). An RTL row and an LTR row side by
// side: in RTL the previous button sits to the right of the next one, the arrows point the other way, and
// `align="start"` puts the controls against the right edge. Not a demo, so hidden from the sidebar and Docs (`!dev`),
// but still run as a test.
export const RightToLeftInteraction: Story = {
  name: "Right-to-left — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      <div dir="ltr" data-testid="ltr">
        <Pagination pageCount={20} defaultValue={5} compact="never" align="start" aria-label="Left to right" />
      </div>
      <div dir="rtl" data-testid="rtl">
        <Pagination pageCount={20} defaultValue={5} compact="never" align="start" aria-label="Right to left" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const side = (testId: string) => {
      const root = canvasElement.querySelector<HTMLElement>(`[data-testid=${testId}]`)!;
      const control = (name: string) => within(root).getByRole("button", { name });
      return {
        root,
        previous: control("Previous page"),
        next: control("Next page"),
        arrow: (name: string) => control(name).querySelector("svg")!,
      };
    };
    const ltr = side("ltr");
    const rtl = side("rtl");

    // Order follows the reading direction.
    await expect(ltr.previous.getBoundingClientRect().left).toBeLessThan(ltr.next.getBoundingClientRect().left);
    await expect(rtl.previous.getBoundingClientRect().left).toBeGreaterThan(rtl.next.getBoundingClientRect().left);

    // The arrows are mirrored in RTL only.
    await expect(getComputedStyle(ltr.arrow("Previous page")).transform).toBe("none");
    await expect(getComputedStyle(rtl.arrow("Previous page")).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    await expect(getComputedStyle(rtl.arrow("Next page")).transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");

    // `align="start"` is the start edge of the text: the left in LTR, the right in RTL.
    const edges = (root: HTMLElement) => {
      const nav = root.querySelector("nav")!.getBoundingClientRect();
      const list = root.querySelector("ul")!.getBoundingClientRect();
      return { fromLeft: list.left - nav.left, fromRight: nav.right - list.right };
    };
    await expect(edges(ltr.root).fromLeft).toBeLessThan(1);
    await expect(edges(ltr.root).fromRight).toBeGreaterThan(10);
    await expect(edges(rtl.root).fromRight).toBeLessThan(1);
    await expect(edges(rtl.root).fromLeft).toBeGreaterThan(10);
  },
};

function DigitsHost() {
  const [page, setPage] = useState(1);
  return (
    <div data-testid="box" style={{ inlineSize: "1000px" }}>
      <Pagination pageCount={5000} value={page} onValueChange={setPage} compact="container" showJump aria-label="Wide page numbers" />
    </div>
  );
}

// `compact="container"` decides from the row's own width, and that width depends on which pages it shows: a page in the
// thousands is wider than one in the tens. In a box between the two widths the row fits at page 1 and not at page 5000,
// so it has to be measured again when the page changes — collapsing when it stops fitting and expanding when it fits
// again — and it must not take a page number out from under keyboard focus. Not a demo (it drives the box's width and
// the page itself), so hidden from the sidebar and Docs (`!dev`), still run as a test.
export const FitContainerDigitsInteraction: Story = {
  name: "Collapses to fit its container, as the page numbers get wider — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <DigitsHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvasElement.querySelector<HTMLElement>("[data-testid=box]")!;
    const nav = () => canvasElement.querySelector("nav")!;
    const rowWidth = () => nav().querySelector("ul")!.scrollWidth;
    const shown = (selector: string) => {
      const element = nav().querySelector(selector);
      return !!element && getComputedStyle(element).display !== "none";
    };
    const numbersShown = () => shown("[class*=pageItem]");
    const summaryShown = () => shown("[class*=summary]");
    const overflows = () => rowWidth() > nav().clientWidth;
    const current = () => canvas.getByRole("button", { current: "page" });

    // The premise: in a roomy box, the row is wider at page 5000 than at page 1.
    await expect(numbersShown()).toBe(true);
    const narrow = rowWidth();
    await userEvent.click(canvas.getByRole("button", { name: "Page 5000" }));
    await expect(current()).toHaveAccessibleName("Page 5000");
    const wide = rowWidth();
    await expect(wide).toBeGreaterThan(narrow);
    await userEvent.click(canvas.getByRole("button", { name: "Page 1" }));
    await expect(current()).toHaveAccessibleName("Page 1");

    // A box between the two: the row fits at page 1.
    box.style.inlineSize = `${Math.floor((narrow + wide) / 2)}px`;
    await waitFor(() => expect(numbersShown()).toBe(true));
    await expect(overflows()).toBe(false);

    // A jump to page 5000 (focus is in the jump field, not on a number) makes the row too wide: it collapses.
    const field = canvas.getByLabelText("Go to page");
    await userEvent.type(field, "5000{Enter}");
    await waitFor(() => expect(summaryShown()).toBe(true));
    await expect(numbersShown()).toBe(false);
    await expect(canvas.getByText("Page 5000 of 5000", { selector: "[class*=summary] *" })).toBeVisible();

    // And back to page 1, whose row fits: the numbers, hidden while it was collapsed, are measured again and return.
    await userEvent.type(field, "1{Enter}");
    await waitFor(() => expect(numbersShown()).toBe(true));
    await expect(summaryShown()).toBe(false);
    await expect(overflows()).toBe(false);

    // Keyboard focus on a page number holds the collapse back. Tab to page 5000 and press Enter.
    (document.activeElement as HTMLElement).blur();
    for (let i = 0; i < 12 && document.activeElement?.getAttribute("aria-label") !== "Page 5000"; i += 1) {
      await userEvent.tab();
    }
    const focused = document.activeElement as HTMLElement;
    await expect(focused).toHaveAccessibleName("Page 5000");
    await userEvent.keyboard("{Enter}");
    await expect(current()).toHaveAccessibleName("Page 5000");
    // Give a wrongly-eager collapse time to happen.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(document.activeElement).toBe(focused);
    await expect(focused.isConnected).toBe(true);
    await expect(numbersShown()).toBe(true);
    await expect(summaryShown()).toBe(false);

    // Moving focus on — to the next arrow, which stays in the page — lets the collapse happen, with focus kept.
    await userEvent.tab();
    const next = canvas.getByRole("button", { name: "Next page" });
    await expect(next).toHaveFocus();
    await waitFor(() => expect(summaryShown()).toBe(true));
    await expect(numbersShown()).toBe(false);
    await expect(next).toHaveFocus();
    await expect(next).toBeVisible();
  },
};

// Where the words sit, measured in a real browser: on Previous the arrow comes first and the text after it, on Next the
// text first and the arrow after it — and mirrored in right-to-left text. Every button keeps the row's height, is wider
// than tall (it isn't a square any more), and shows its words in full. Not a demo, so hidden from the sidebar and
// Docs (`!dev`), still run as a test.
export const LabelsInteraction: Story = {
  name: "Previous and Next labels — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["ltr", "rtl"] as const).map((direction) => (
        <div key={direction} dir={direction} data-testid={direction}>
          <Pagination pageCount={20} defaultValue={5} showLabel showFirstLast compact="never" align="start" aria-label={direction} />
        </div>
      ))}
      {/* A phone: 375px less a 16px gutter. The compact form with the words is the default there (`auto` collapses
          the numbers below the `sm` breakpoint), and at the default size it has to fit on one line. */}
      <div style={{ inlineSize: 343 }} data-testid="phone">
        <Pagination pageCount={20} defaultValue={5} showLabel compact="always" aria-label="Phone" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const box = (element: Element) => element.getBoundingClientRect();
    for (const direction of ["ltr", "rtl"] as const) {
      const root = canvasElement.querySelector<HTMLElement>(`[data-testid=${direction}]`)!;
      const within_ = within(root);
      const previous = within_.getByRole("button", { name: "Previous page" });
      const next = within_.getByRole("button", { name: "Next page" });
      const height = box(within_.getByRole("button", { name: "Page 5" })).height;
      const parts = (button: HTMLElement) => ({ icon: box(button.querySelector("svg")!), text: box(button.querySelector("span")!) });

      // Reading order: Previous is arrow then words, Next is words then arrow (the arrow trailing).
      const before = parts(previous);
      const after = parts(next);
      if (direction === "ltr") {
        await expect(before.icon.right).toBeLessThanOrEqual(before.text.left + 1);
        await expect(after.text.right).toBeLessThanOrEqual(after.icon.left + 1);
      } else {
        await expect(before.text.right).toBeLessThanOrEqual(before.icon.left + 1);
        await expect(after.icon.right).toBeLessThanOrEqual(after.text.left + 1);
      }

      for (const button of [previous, next]) {
        // The row's height, wider than tall, and the words not clipped.
        await expect(Math.abs(box(button).height - height)).toBeLessThan(1);
        await expect(box(button).width).toBeGreaterThan(height * 1.5);
        await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
      }
      // First and last are still square icon buttons.
      const first = within_.getByRole("button", { name: "First page" });
      await expect(Math.abs(box(first).width - height)).toBeLessThan(1);
    }

    // On a 343px phone, the default size's compact row — "Previous", "Page 5 of 20", "Next" — is one line.
    const phone = canvasElement.querySelector<HTMLElement>("[data-testid=phone]")!;
    const row = [...phone.querySelectorAll("ul > li")].filter((item) => getComputedStyle(item).display !== "none");
    await expect(row).toHaveLength(3);
    await expect(new Set(row.map((item) => Math.round(box(item).top))).size).toBe(1);
    await expect(phone.querySelector("ul")!.scrollWidth).toBeLessThanOrEqual(phone.clientWidth);
  },
};
