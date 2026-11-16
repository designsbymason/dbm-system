import {
  CheckCircleIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  TrayIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import type { CSSProperties } from "react";
import { Button } from "../../atoms/Button";
import { Heading } from "../../atoms/Heading";
import { Text } from "../../atoms/Text";
import { Card } from "../Card";
import { Table } from "../Table";
import { EmptyState } from "./EmptyState";
import { emptyStatePlaygroundSnippet, emptyStateSnippets } from "./EmptyState.snippets";
import type {
  EmptyStateAlign,
  EmptyStateSize,
  EmptyStateTone,
  EmptyStateVariant,
} from "./EmptyState.types";

// `EmptyState`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `Card`'s and `Table`'s
// own approach. `EmptyState.Icon`/`Title`/`Description`/`Actions` each get their
// own Properties table via a hidden docs-only stories file (guidelines/adr/0013),
// where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  variant: EmptyStateVariant;
  tone: EmptyStateTone;
  size: EmptyStateSize;
  align: EmptyStateAlign;
  actions: boolean;
  stackOnMobile: boolean;
  announce: boolean;
  role: string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allVariants: EmptyStateVariant[] = ["ghost", "outlined", "dashed", "filled"];
const allSizes: EmptyStateSize[] = ["xs", "sm", "md", "lg", "xl"];

// A story-layout wrapper — a plain CSS grid, not the `Grid` molecule, so these
// demos don't depend on `Grid`'s own API.
const gridStyle = (columns: number): CSSProperties => ({
  display: "grid",
  gap: "var(--dbm-space-4)",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const demoContainerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;
const labelledColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };

// A small illustration drawn from design tokens, standing in for a real image
// file, so the "With an illustration" story needs no asset.
const DemoIllustration = () => (
  <svg width="160" height="120" viewBox="0 0 160 120" aria-hidden="true">
    <rect x="20" y="30" width="120" height="76" rx="12" fill="var(--dbm-bg-neutral-subtle)" stroke="var(--dbm-border-neutral)" strokeWidth="2" />
    <path d="M20 62h34l8 14h36l8-14h34" fill="none" stroke="var(--dbm-border-neutral)" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="124" cy="28" r="14" fill="var(--dbm-bg-brand-subtle)" stroke="var(--dbm-border-brand)" strokeWidth="2" />
  </svg>
);

// Every fixed-render story below ignores the Playground's own `args`, so each one
// suppresses every root-prop control it doesn't consume (a story-level `argTypes`
// entry merges over the meta-level one per key) — otherwise the Controls panel
// would show live-looking controls that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  align: { control: false },
  actions: { control: false },
  stackOnMobile: { control: false },
  announce: { control: false },
  role: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  "aria-describedby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Components/EmptyState",
  id: "molecules-data-display-emptystate",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "outlined", "dashed", "filled"],
      description:
        "The surface treatment: ghost (no border or fill — for a page, or inside a container that already draws a boundary), outlined (a solid border), dashed (a dashed border — the classic 'nothing here yet' placeholder), or filled (a subtle neutral fill).",
      table: { defaultValue: { summary: "'ghost'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "A colour accent for the icon badge. neutral (the default) is uncoloured; brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours. Decorative reinforcement only — put the meaning in the title and description.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Padding, spacing, and the size of the icon and text. xs and sm suit a table cell or a narrow panel; lg and xl suit an empty state that is the main content of a page.",
      table: { defaultValue: { summary: "'md'" } },
    },
    align: {
      control: "radio",
      options: ["center", "start"],
      description:
        "Whether the content is centred (the usual look) or flush with the inline start edge — the left in left-to-right text, the right in right-to-left — with the text aligned the same way.",
      table: { defaultValue: { summary: "'center'" } },
    },
    actions: {
      control: "boolean",
      description:
        "Storybook only — not an EmptyState prop. Shows a demo EmptyState.Actions row (a primary and a secondary button).",
      table: { disable: true },
    },
    stackOnMobile: {
      control: "boolean",
      description:
        "Storybook only — not an EmptyState prop: it belongs to EmptyState.Actions (see its Properties table), and applies to the demo's actions. Below the sm breakpoint (640px) it stacks them in a full-width column, so it only shows on a phone — pick a phone size in the viewport toolbar, or open the story on its own and narrow the window. Ignored while the actions control is off.",
      table: { disable: true },
    },
    announce: {
      control: "boolean",
      description:
        "Announces the title and description to screen readers when the empty state appears (and again if their text changes) — for one that shows up because of something the user did, such as a search or filter that returns nothing. Renders a visually hidden status region that starts empty and is filled a moment after mounting, then cleared. Nothing changes visually. Don't combine it with role=\"status\".",
      table: { defaultValue: { summary: "false" } },
    },
    role: {
      control: false,
      description:
        "The ARIA role. Unset by default: an empty state is static content and adds no role. To have a screen reader announce an empty state that appears in response to something the user did, use announce rather than a role here.",
    },
    "aria-label": {
      control: false,
      description:
        "An accessible name for the empty state, for when it acts as a labelled region and has no visible title to name it.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this empty state (e.g. its own title).",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this empty state.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this empty state, or when a test or router needs a stable anchor.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    variant: "ghost",
    tone: "neutral",
    size: "md",
    align: "center",
    actions: true,
    stackOnMobile: false,
    announce: false,
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <EmptyState variant={args.variant} tone={args.tone} size={args.size} align={args.align} announce={args.announce}>
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title>No invoices yet</EmptyState.Title>
        <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
        {args.actions && (
          <EmptyState.Actions stackOnMobile={args.stackOnMobile}>
            <Button size={args.size === "xs" ? "xs" : "sm"}>Create invoice</Button>
            <Button size={args.size === "xs" ? "xs" : "sm"} variant="tertiary">
              Import
            </Button>
          </EmptyState.Actions>
        )}
      </EmptyState>
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from
  // their defaults, around a small real empty state — instead of the story's own
  // source, which a reader can't paste.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => emptyStatePlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.variants } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "60rem", marginInline: "auto" }}>
      {allVariants.map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <EmptyState variant={variant} size="sm">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size="sm">Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.tones } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {(
        [
          ["neutral", TrayIcon, "Nothing here yet", "Items you add will show up here."],
          ["brand", RocketLaunchIcon, "Ready to start", "Create your first project to get going."],
          ["info", InfoIcon, "Nothing scheduled", "There are no announcements right now."],
          ["success", CheckCircleIcon, "You're all caught up", "There's nothing waiting for your review."],
          ["warning", WarningIcon, "No source connected", "Connect a data source to see results."],
          ["danger", WarningCircleIcon, "Something went wrong", "The list couldn't be loaded. Try again."],
        ] as const
      ).map(([tone, icon, title, description]) => (
        <div key={tone} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            tone=&quot;{tone}&quot;
          </Text>
          <EmptyState tone={tone} size="sm" variant="outlined">
            <EmptyState.Icon icon={icon} />
            <EmptyState.Title>{title}</EmptyState.Title>
            <EmptyState.Description>{description}</EmptyState.Description>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.sizes } } },
  render: () => (
    <div
      style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}
      data-testid="sizes"
    >
      {allSizes.map((size) => (
        <div key={size} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <EmptyState size={size} variant="outlined">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size={size === "xs" ? "xs" : "sm"}>Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badges = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] > div > div > div:first-child")];
    await expect(badges.length).toBe(5);
    const widths = badges.map((badge) => badge.getBoundingClientRect().width);
    // Each step's icon badge is larger than the last, and round.
    for (const [index, width] of widths.entries()) {
      if (index > 0) await expect(width).toBeGreaterThan(widths[index - 1]!);
      await expect(badges[index]!.getBoundingClientRect().height).toBeCloseTo(width, 0);
    }
    // From the `sm` breakpoint up every size has its full padding (the phone
    // values are asserted in the "On a phone" story).
    if (window.matchMedia("(min-width: 640px)").matches) {
      const roots = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] > div > div:last-child")];
      const paddings = roots.map((root) => parseFloat(getComputedStyle(root).paddingInlineStart));
      await expect(paddings).toEqual([16, 24, 32, 48, 64]);
    }
  },
};

export const Alignment: Story = {
  name: "Alignment",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.align } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "60rem", marginInline: "auto" }} data-testid="alignment">
      {(["center", "start"] as const).map((align) => (
        <div key={align} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            align=&quot;{align}&quot;
          </Text>
          <EmptyState align={align} variant="outlined" size="sm">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size="sm">Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [centred, start] = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=alignment] > div > div:last-child")];
    const centre = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    const title = (root: HTMLElement) => root.querySelector("h3") as HTMLElement;
    // Centred: the title sits on the empty state's own centre line.
    await expect(Math.abs(centre(title(centred!)) - centre(centred!))).toBeLessThan(2);
    // Start: the title begins at the start edge (inside its padding), not the centre.
    const startRect = start!.getBoundingClientRect();
    const titleRect = title(start!).getBoundingClientRect();
    await expect(titleRect.left - startRect.left).toBeLessThan(startRect.width / 4);
  },
};

export const PartsOptional: Story = {
  name: "Every part is optional",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.partsOptional } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "48rem", marginInline: "auto" }}>
      <EmptyState size="sm" variant="outlined">
        <EmptyState.Title>Nothing to show</EmptyState.Title>
      </EmptyState>
      <EmptyState size="sm" variant="outlined">
        <EmptyState.Icon icon={TrayIcon} />
        <EmptyState.Title>No files</EmptyState.Title>
        <EmptyState.Description>Drag a file here to upload it.</EmptyState.Description>
      </EmptyState>
    </div>
  ),
};

export const Illustration: Story = {
  name: "With an illustration",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.illustration } } },
  render: () => (
    // `EmptyState.Media` holds an illustration in place of (or above) the icon. It
    // never grows wider than the empty state or than its size step's cap, so a large
    // image is scaled down keeping its proportions, and a small one keeps its size.
    <div style={{ ...gridStyle(2), maxWidth: "60rem", marginInline: "auto" }} data-testid="illustrations">
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          A small illustration keeps its size
        </Text>
        <EmptyState size="lg" variant="outlined">
          <EmptyState.Media>
            <DemoIllustration />
          </EmptyState.Media>
          <EmptyState.Title>Your inbox is empty</EmptyState.Title>
          <EmptyState.Description>New messages will appear here.</EmptyState.Description>
        </EmptyState>
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          A large image is scaled down
        </Text>
        <EmptyState size="lg" variant="outlined">
          <EmptyState.Media>
            <svg width="1200" height="300" viewBox="0 0 1200 300" aria-hidden="true">
              <rect width="1200" height="300" rx="24" fill="var(--dbm-bg-brand-subtle)" stroke="var(--dbm-border-brand)" strokeWidth="6" />
            </svg>
          </EmptyState.Media>
          <EmptyState.Title>A 1200px image</EmptyState.Title>
          <EmptyState.Description>Scaled to fit, proportions kept.</EmptyState.Description>
        </EmptyState>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [small, large] = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=illustrations] > div > div:last-child")];
    const measure = (root: HTMLElement) => {
      const media = root.firstElementChild as HTMLElement;
      const svg = media.querySelector("svg")!;
      return { root: root.getBoundingClientRect(), media: media.getBoundingClientRect(), svg: svg.getBoundingClientRect() };
    };
    const a = measure(small!);
    const b = measure(large!);
    // The small illustration keeps its own 160px width...
    await expect(Math.round(a.svg.width)).toBe(160);
    // ...and the 1200px one is scaled down to the lg cap (12rem = 192px), never wider
    // than its empty state, with its 4:1 proportions intact.
    await expect(b.svg.width).toBeLessThanOrEqual(192 + 1);
    await expect(b.svg.width).toBeLessThanOrEqual(b.root.width);
    await expect(b.svg.width / b.svg.height).toBeCloseTo(4, 1);
    // Nothing overflows the canvas.
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth);
  },
};

export const SearchNoResults: Story = {
  name: "Search with no results — announced to screen readers",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.searchNoResults } } },
  render: () => (
    // `announce` is for an empty state that appears because of something the user
    // did: a hidden status region is filled a moment after it mounts, so a screen
    // reader is told about it. Nothing changes visually.
    <div style={demoContainerStyle}>
      <EmptyState announce variant="dashed">
        <EmptyState.Icon icon={MagnifyingGlassIcon} />
        <EmptyState.Title>No results for “fjord”</EmptyState.Title>
        <EmptyState.Description>Check the spelling, or try a broader search term.</EmptyState.Description>
        <EmptyState.Actions>
          <Button variant="secondary" size="sm">
            Clear search
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The status region is in the page from the start...
    const status = await canvas.findByRole("status");
    // ...and is filled with the message shortly afterwards.
    await waitFor(() =>
      expect(status).toHaveTextContent("No results for “fjord”. Check the spelling, or try a broader search term."),
    );
    // The icon stays out of the accessibility tree, and the title is a real heading.
    await expect(canvasElement.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByRole("heading", { level: 3 })).toBeInTheDocument();
  },
};

export const OnAPhone: Story = {
  name: "On a phone — smaller padding, stacked actions",
  argTypes: noControls,
  // Opened on its own, this story is shown at a phone's width (and it is in the
  // test run); on the Docs page it sits in the wide page like every other story.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  parameters: { docs: { source: { code: emptyStateSnippets.onAPhone } } },
  render: () => (
    // Below the `sm` breakpoint the two large sizes take a smaller padding, and
    // `stackOnMobile` stacks the actions in a full-width column. From `sm` up both
    // are back to their usual layout — narrow the window to watch it switch.
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }} data-testid="phone">
      {(["lg", "xl"] as const).map((size) => (
        <EmptyState key={size} size={size} variant="outlined">
          <EmptyState.Icon icon={TrayIcon} />
          <EmptyState.Title>No invoices yet</EmptyState.Title>
          <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
          <EmptyState.Actions stackOnMobile>
            <Button>Create invoice</Button>
            <Button variant="tertiary">Import</Button>
          </EmptyState.Actions>
        </EmptyState>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // The story really is at a phone's width (fails loudly if the viewport didn't apply).
    await expect(window.innerWidth).toBeLessThan(640);
    const roots = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=phone] > div")];
    await expect(roots.length).toBe(2);
    const padding = (root: HTMLElement) => parseFloat(getComputedStyle(root).paddingInlineStart);
    // lg and xl step down to space.8 (32px) and space.10 (40px)...
    await expect(padding(roots[0]!)).toBe(32);
    await expect(padding(roots[1]!)).toBe(40);
    for (const root of roots) {
      // ...the actions are a column, each one the full width of the empty state's
      // content box (its width less its padding and 1px border on each side) — not
      // just of the row, which would also be true of a row that shrank to fit...
      const actions = root.lastElementChild as HTMLElement;
      await expect(getComputedStyle(actions).flexDirection).toBe("column");
      const styles = getComputedStyle(root);
      const content =
        root.getBoundingClientRect().width - parseFloat(styles.paddingInlineStart) - parseFloat(styles.paddingInlineEnd) - 2;
      const buttons = [...actions.querySelectorAll("button")];
      await expect(buttons.length).toBe(2);
      for (const button of buttons) {
        await expect(Math.round(button.getBoundingClientRect().width)).toBe(Math.round(content));
      }
      // ...stacked one above the other, and nothing spills out sideways.
      await expect(buttons[0]!.getBoundingClientRect().bottom).toBeLessThanOrEqual(buttons[1]!.getBoundingClientRect().top + 1);
      await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    }
  },
};

export const InCard: Story = {
  name: "Composition — inside a card",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.inCard } } },
  render: () => (
    // A ghost empty state draws no border of its own, so it doesn't double up
    // inside a container that already has one.
    <div style={{ maxWidth: "32rem", marginInline: "auto" }}>
      <Card>
        <Card.Header>
          <Heading level={3} size="md">
            Recent invoices
          </Heading>
        </Card.Header>
        <Card.Body>
          <EmptyState size="sm">
            <EmptyState.Icon icon={TrayIcon} />
            <EmptyState.Title level={4}>No invoices yet</EmptyState.Title>
            <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            <EmptyState.Actions>
              <Button size="sm">Create invoice</Button>
            </EmptyState.Actions>
          </EmptyState>
        </Card.Body>
      </Card>
    </div>
  ),
};

export const InTable: Story = {
  name: "Composition — inside a table",
  argTypes: noControls,
  parameters: { docs: { source: { code: emptyStateSnippets.inTable } } },
  render: () => (
    // `Table.Empty` is the message row of a table with no rows; it takes any
    // content, so a small empty state fits inside it.
    <div style={demoContainerStyle}>
      <Table aria-label="Invoices">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell numeric>Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Empty>
            <EmptyState size="sm">
              <EmptyState.Icon icon={TrayIcon} />
              <EmptyState.Title level={3}>No invoices yet</EmptyState.Title>
              <EmptyState.Description>Invoices you create will show up here.</EmptyState.Description>
            </EmptyState>
          </Table.Empty>
        </Table.Body>
      </Table>
    </div>
  ),
};
