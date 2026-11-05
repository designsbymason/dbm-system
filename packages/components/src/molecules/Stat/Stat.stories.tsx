import { CurrencyDollarIcon, TicketIcon, UsersIcon } from "@dbm-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Card } from "../Card";
import { Stat } from "./Stat";
import { statPlaygroundSnippet, statSnippets } from "./Stat.snippets";
import type { StatOrientation, StatSize, StatTone, StatVariant } from "./Stat.types";

// `Stat`'s own root props get hand-written argTypes here (this meta has no
// `component`, so docgen doesn't supply them) — mirroring `EmptyState`'s and
// `Card`'s own approach. `Stat.Icon`/`Label`/`Value`/`Trend`/`Description` each
// get their own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where their argTypes are auto-resolved from real docgen.
interface PlaygroundArgs {
  variant: StatVariant;
  tone: StatTone;
  size: StatSize;
  orientation: StatOrientation;
  trend: boolean;
  announce: boolean;
  fitValue: boolean;
  role: string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-describedby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allVariants: StatVariant[] = ["ghost", "outlined", "filled"];
const allTones: StatTone[] = ["neutral", "brand", "info", "success", "warning", "danger"];
const allSizes: StatSize[] = ["xs", "sm", "md", "lg", "xl"];

const gridStyle = (columns: number): CSSProperties => ({
  display: "grid",
  gap: "var(--dbm-space-4)",
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
});

const demoContainerStyle = { maxWidth: "48rem", marginInline: "auto" } as const;
const labelledColumn: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };

// Every fixed-render story below ignores the Playground's own `args`, so each one
// suppresses every root-prop control it doesn't consume (a story-level `argTypes`
// entry merges over the meta-level one per key) — otherwise the Controls panel
// would show live-looking controls that silently do nothing.
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  variant: { control: false },
  tone: { control: false },
  size: { control: false },
  orientation: { control: false },
  trend: { control: false },
  announce: { control: false },
  fitValue: { control: false },
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
  title: "Molecules/Data Display/Stat",
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description:
        "The surface treatment: ghost (no border or fill — for a container that already draws a boundary, such as a Card), outlined (a solid border, a self-contained stat card), or filled (a subtle fill — plain neutral by default, or tone's own tint when tone is set).",
      table: { defaultValue: { summary: "'ghost'" } },
    },
    tone: {
      control: "select",
      options: ["neutral", "brand", "info", "success", "warning", "danger"],
      description:
        "A colour accent for Stat.Icon and Stat.Label together (and, on outlined, the border, and on filled, the whole stat's own fill). neutral (the default) is uncoloured; brand follows the active Purple/Emerald theme; success, warning, danger, and info are fixed status colours. Decorative reinforcement only. Unrelated to Stat.Trend's own colour, which comes from whether the change is an improvement, not from this.",
      table: { defaultValue: { summary: "'neutral'" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Padding, spacing, and the size of the icon badge and text. xs and sm suit a dense dashboard grid; lg and xl suit a stat that is a card's main content.",
      table: { defaultValue: { summary: "'md'" } },
    },
    orientation: {
      control: "radio",
      options: ["vertical", "horizontal"],
      description:
        "Whether Stat.Icon stacks above Stat.Label (the default) or the two are paired into one row instead, the icon before the label — found and moved together wherever they appear among the other children. Everything else stays stacked either way.",
      table: { defaultValue: { summary: "'vertical'" } },
    },
    trend: {
      control: "boolean",
      description: "Storybook only — not a Stat prop. Shows a demo Stat.Trend inside Stat.Value.",
      table: { disable: true },
    },
    announce: {
      control: "boolean",
      description:
        "Announces the value (and trend) to screen readers whenever their text changes after this stat is already on the page. The very first value shown is never announced. Nothing changes visually.",
      table: { defaultValue: { summary: "false" } },
    },
    fitValue: {
      control: "boolean",
      description:
        "Shrinks Stat.Value's font size, only as far as it takes, so the value (with any Stat.Trend beside it) always fits inside the stat's border, and grows it back as the stat gets wider. Off, the value keeps the full size of its size and overflows a stat that is too narrow for it.",
      table: { defaultValue: { summary: "false" } },
    },
    role: {
      control: false,
      description:
        "The ARIA role. Unset by default: a stat is static content and adds no role. Use announce, rather than a role here, for a value that changes after mount.",
    },
    "aria-label": {
      control: false,
      description: "An accessible name for the stat, for when it acts as a labelled region.",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names this stat (e.g. its own Stat.Label).",
    },
    "aria-describedby": {
      control: false,
      description: "The id of an element that describes this stat (e.g. its own Stat.Description).",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this stat, or when a test or router needs a stable anchor.",
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
    orientation: "vertical",
    trend: true,
    announce: false,
    fitValue: false,
  },
  render: (args) => (
    <div style={demoContainerStyle}>
      <Stat
        variant={args.variant}
        tone={args.tone}
        size={args.size}
        orientation={args.orientation}
        announce={args.announce}
        fitValue={args.fitValue}
      >
        <Stat.Icon icon={UsersIcon} />
        <Stat.Label>Active users</Stat.Label>
        <Stat.Value>
          12,480
          {args.trend && <Stat.Trend value={4.2} />}
        </Stat.Value>
        <Stat.Description>vs. last month</Stat.Description>
      </Stat>
    </div>
  ),
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // The snippet is built from the live controls — only the props that differ from
  // their defaults, around a small real stat — instead of the story's own source,
  // which a reader can't paste.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => statPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Variants: Story = {
  name: "All variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.variants } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {allVariants.map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <Stat variant={variant} size="sm">
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>
              12,480
              <Stat.Trend value={4.2} />
            </Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  name: "All tones",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.tones } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "60rem", marginInline: "auto" }}>
      {allTones.map((tone) => (
        <div key={tone} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            tone=&quot;{tone}&quot;
          </Text>
          <Stat variant="outlined" tone={tone} size="sm">
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>12,480</Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.sizes } } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxWidth: "40rem" }}>
      {allSizes.map((size) => (
        <div key={size} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <Stat variant="outlined" size={size}>
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>
              12,480
              <Stat.Trend value={4.2} />
            </Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const Orientation: Story = {
  name: "Orientation",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.orientation } } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)", maxWidth: "28rem" }}>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          orientation=&quot;vertical&quot; (default)
        </Text>
        <Stat variant="outlined">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Value>
            12,480
            <Stat.Trend value={4.2} />
          </Stat.Value>
          <Stat.Description>vs. last month</Stat.Description>
        </Stat>
      </div>
      <div style={labelledColumn}>
        <Text size="sm" weight="semibold">
          orientation=&quot;horizontal&quot;
        </Text>
        <Stat variant="outlined" orientation="horizontal">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Value>
            12,480
            <Stat.Trend value={4.2} />
          </Stat.Value>
          <Stat.Description>vs. last month</Stat.Description>
        </Stat>
      </div>
    </div>
  ),
};

export const ToneAcrossVariants: Story = {
  name: "Tone across variants",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.toneAcrossVariants } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "48rem" }}>
      {(["ghost", "outlined", "filled"] as StatVariant[]).map((variant) => (
        <div key={variant} style={labelledColumn}>
          <Text size="sm" weight="semibold">
            variant=&quot;{variant}&quot;
          </Text>
          <Stat variant={variant} tone="danger" size="sm" data-testid={`stat-${variant}`}>
            <Stat.Icon icon={TicketIcon} data-testid={`icon-${variant}`} />
            <Stat.Label data-testid={`label-${variant}`}>Open tickets</Stat.Label>
            <Stat.Value>58</Stat.Value>
          </Stat>
        </div>
      ))}
    </div>
  ),
};

export const TrendDirections: Story = {
  name: "Trend — increase, decrease, and no change",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.trendIncrease } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "48rem" }}>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Active users</Stat.Label>
        <Stat.Value>
          12,480
          <Stat.Trend value={4.2} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Churned users</Stat.Label>
        <Stat.Value>
          1,204
          <Stat.Trend value={-2.1} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Sessions</Stat.Label>
        <Stat.Value>
          842
          <Stat.Trend value={0} />
        </Stat.Value>
      </Stat>
    </div>
  ),
};

export const TrendGoodDirection: Story = {
  name: "Trend — goodDirection for a metric where less is better",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.trendGoodDirection } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "32rem" }}>
      <Stat variant="outlined" tone="danger" size="sm">
        <Stat.Icon icon={TicketIcon} />
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>
          58
          <Stat.Trend value={-12} goodDirection="decrease" />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" tone="danger" size="sm">
        <Stat.Icon icon={TicketIcon} />
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>
          74
          <Stat.Trend value={12} goodDirection="decrease" />
        </Stat.Value>
      </Stat>
    </div>
  ),
};

export const PartsOptional: Story = {
  name: "Every part is optional",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.partsOptional } } },
  render: () => (
    <div style={{ ...gridStyle(2), maxWidth: "32rem" }}>
      <Stat variant="outlined" size="sm">
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>58</Stat.Value>
      </Stat>
      <Stat variant="outlined" size="sm">
        <Stat.Icon icon={UsersIcon} />
        <Stat.Value>12,480</Stat.Value>
      </Stat>
    </div>
  ),
};

export const InACard: Story = {
  name: "Inside a Card",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.inCard } } },
  render: () => (
    <div style={{ maxWidth: "20rem" }}>
      <Card variant="outlined">
        <Card.Body>
          <Stat>
            <Stat.Icon icon={UsersIcon} />
            <Stat.Label>Active users</Stat.Label>
            <Stat.Value>
              12,480
              <Stat.Trend value={4.2} />
            </Stat.Value>
            <Stat.Description>vs. last month</Stat.Description>
          </Stat>
        </Card.Body>
      </Card>
    </div>
  ),
};

export const Grid: Story = {
  name: "Several, side by side",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.grid } } },
  render: () => (
    <div style={{ ...gridStyle(3), maxWidth: "48rem" }}>
      <Stat variant="outlined" size="sm">
        <Stat.Icon icon={UsersIcon} />
        <Stat.Label>Active users</Stat.Label>
        <Stat.Value>
          12,480
          <Stat.Trend value={4.2} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" tone="success" size="sm">
        <Stat.Icon icon={CurrencyDollarIcon} />
        <Stat.Label>Revenue</Stat.Label>
        <Stat.Value>
          $84.2K
          <Stat.Trend value={1.8} />
        </Stat.Value>
      </Stat>
      <Stat variant="outlined" tone="danger" size="sm">
        <Stat.Icon icon={TicketIcon} />
        <Stat.Label>Open tickets</Stat.Label>
        <Stat.Value>
          58
          <Stat.Trend value={-12} goodDirection="decrease" />
        </Stat.Value>
      </Stat>
    </div>
  ),
};

export const FitValue: Story = {
  name: "A value that fits its container (fitValue)",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.fitValue } } },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "var(--dbm-space-4)" }}>
      {["9rem", "13rem", "18rem"].map((width) => (
        <div key={width} style={{ inlineSize: width }}>
          <Stat variant="outlined" tone="brand" fitValue>
            <Stat.Label>Balance due</Stat.Label>
            <Stat.Value>$9,851.50</Stat.Value>
          </Stat>
        </div>
      ))}
      {/* A box the reader can drag wider or narrower: the value follows its width. */}
      <div style={{ inlineSize: "13rem", minInlineSize: "9rem", maxInlineSize: "100%", resize: "horizontal", overflow: "hidden", padding: "var(--dbm-space-2)" }}>
        <Stat variant="outlined" tone="brand" fitValue>
          <Stat.Label>Drag the corner</Stat.Label>
          <Stat.Value>
            $9,851.50
            <Stat.Trend value={4.2} />
          </Stat.Value>
        </Stat>
      </div>
    </div>
  ),
};

export const LiveUpdate: Story = {
  name: "A value that updates in place (announce)",
  argTypes: noControls,
  parameters: { docs: { source: { code: statSnippets.announce } } },
  render: function LiveUpdateStory() {
    const [count, setCount] = useState(12480);
    const [change, setChange] = useState(4.2);
    return (
      <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
        <Stat announce data-testid="stat">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Value>
            {count.toLocaleString("en-US")}
            <Stat.Trend value={change} />
          </Stat.Value>
        </Stat>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setCount((current) => current + 236);
            setChange(1.9);
          }}
        >
          Simulate an update
        </Button>
      </div>
    );
  },
};

// --- Hidden interaction tests -------------------------------------------------
// Each one carries assertions that change state or need real timers, so it lives
// in a twin hidden from the sidebar and the Docs page (`!dev`) but still runs as
// a test — a visible story must not end somewhere different from where it
// started (07-storybook-and-documentation-standards.md §5).

export const LiveUpdateInteraction: Story = {
  ...LiveUpdate,
  name: "Live update — the first value is never announced, a later change is",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("status");
    // Real time: `useAnnouncement`'s own fill/clear delay.
    await new Promise((resolve) => setTimeout(resolve, 150));
    // The first value was never announced.
    await expect(region).toHaveTextContent("");
    await userEvent.click(canvas.getByRole("button", { name: "Simulate an update" }));
    await waitFor(() => expect(region).toHaveTextContent(/Increased by \+1\.9/));
  },
};

export const ToneAcrossVariantsInteraction: Story = {
  ...ToneAcrossVariants,
  name: "Tone across variants — real computed colours, not just classes",
  tags: ["!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const colour = (token: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(--dbm-${token})`;
      canvasElement.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    // `Stat.Icon`'s own `data-testid` lands on the badge `<div>` itself (its outermost element),
    // not a wrapper around it — its own computed `color`/`backgroundColor` are what to check.
    const badgeOf = (variant: string) => canvas.getByTestId(`icon-${variant}`);

    // ghost and outlined: the same light badge fill and icon colour — the light danger tokens,
    // never the solid ones filled uses. Both also colour the label to match.
    for (const variant of ["ghost", "outlined"]) {
      const stat = getComputedStyle(canvas.getByTestId(`stat-${variant}`));
      const badge = getComputedStyle(badgeOf(variant));
      const label = getComputedStyle(canvas.getByTestId(`label-${variant}`));
      await expect(badge.backgroundColor).toBe(colour("bg-danger-subtle"));
      await expect(badge.color).toBe(colour("icon-danger"));
      await expect(label.color).toBe(colour("text-danger"));
      // Neither variant tints the whole stat's own background.
      await expect(stat.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    }

    // outlined alone also colours the border — a light, decorative accent, not the plain default.
    const outlinedBorder = getComputedStyle(canvas.getByTestId("stat-outlined")).borderColor;
    await expect(outlinedBorder).toBe(colour("border-danger-subtle"));
    await expect(outlinedBorder).not.toBe(colour("border-default"));

    // filled: the whole stat gets the light tone fill (found missing live once already — this is
    // the regression test for that), and the badge becomes the *solid* fill with an on-tone icon.
    const filledStat = getComputedStyle(canvas.getByTestId("stat-filled"));
    const filledBadge = getComputedStyle(badgeOf("filled"));
    const filledLabel = getComputedStyle(canvas.getByTestId("label-filled"));
    await expect(filledStat.backgroundColor).toBe(colour("bg-danger-subtle"));
    await expect(filledBadge.backgroundColor).toBe(colour("bg-danger"));
    await expect(filledBadge.color).toBe(colour("icon-on-danger"));
    // The label still reads the same as ghost/outlined — tone doesn't change by variant.
    await expect(filledLabel.color).toBe(colour("text-danger"));
  },
};
